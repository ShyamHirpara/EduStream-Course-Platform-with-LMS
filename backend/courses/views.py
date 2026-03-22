from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Avg
from django.shortcuts import get_object_or_404

from .models import Course, Lesson, Enrollment, LessonProgress, Assessment, Question, Choice, Review
from .serializers import (
    CourseSerializer, CourseWriteSerializer,
    LessonSerializer, LessonWithContentSerializer,
    LessonInstructorSerializer, LessonWriteSerializer,
    AssessmentSerializer, AssessmentAdminSerializer, AssessmentWriteSerializer,
    EnrollmentSerializer, ReviewSerializer,
)
from .permissions import IsInstructorOrReadOnly, IsCourseOwner


# ── Course ───────────────────────────────────────────────────────────────────
class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstructorOrReadOnly, IsCourseOwner]

    def get_queryset(self):
        return (
            Course.objects
            .annotate(
                lesson_count=Count('lessons', distinct=True),
                review_count=Count('reviews', distinct=True),
                avg_rating=Avg('reviews__rating'),
            )
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CourseWriteSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


# ── Lesson ───────────────────────────────────────────────────────────────────
class LessonViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Lesson.objects.filter(course_id=self.kwargs.get('course_pk'))

    def get_serializer_class(self):
        if self.action in ('create', 'partial_update'):
            return LessonWriteSerializer
        request   = self.request
        course_pk = self.kwargs.get('course_pk')
        if request and request.user.is_authenticated and course_pk:
            is_owner = Course.objects.filter(pk=course_pk, instructor=request.user).exists()
            if is_owner:
                return LessonInstructorSerializer
            is_enrolled = Enrollment.objects.filter(
                student=request.user, course_id=course_pk
            ).exists()
            if is_enrolled:
                return LessonWithContentSerializer
        return LessonSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsCourseOwner()]

    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['course_pk'])
        if course.instructor != self.request.user:
            raise PermissionDenied("You don't own this course.")
        serializer.save(course=course)


# ── Enrollment ───────────────────────────────────────────────────────────────
class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class   = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user).select_related('course')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def create(self, request, *args, **kwargs):
        if request.user.role == 'instructor':
            return Response(
                {'detail': 'Instructors cannot enroll in courses.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        course_id = request.data.get('course')
        if Enrollment.objects.filter(student=request.user, course_id=course_id).exists():
            return Response(
                {'detail': 'You are already enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='instructor_courses')
    def instructor_courses(self, request):
        courses = (
            Course.objects.filter(instructor=request.user)
            .annotate(
                lesson_count=Count('lessons', distinct=True),
                review_count=Count('reviews', distinct=True),
                avg_rating=Avg('reviews__rating'),
            )
            .order_by('-created_at')
        )
        return Response(
            CourseSerializer(courses, many=True, context={'request': request}).data
        )


# ── Reviews ──────────────────────────────────────────────────────────────────
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class  = ReviewSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Review.objects.filter(
            course_id=self.kwargs.get('course_pk')
        ).select_related('student').order_by('-created_at')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        course_pk = self.kwargs['course_pk']
        user      = self.request.user
        if user.role == 'instructor':
            raise PermissionDenied("Instructors cannot review courses.")
        if not Enrollment.objects.filter(student=user, course_id=course_pk).exists():
            raise PermissionDenied("You must be enrolled to review this course.")
        if Review.objects.filter(student=user, course_id=course_pk).exists():
            raise ValidationError("You have already reviewed this course.")
        serializer.save(student=user, course_id=course_pk)

    def perform_update(self, serializer):
        if serializer.instance.student != self.request.user:
            raise PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if instance.student != self.request.user:
            raise PermissionDenied()
        instance.delete()


# ── Lesson Progress ──────────────────────────────────────────────────────────
class LessonCompleteView(APIView):
    """POST → mark complete · DELETE → unmark."""
    permission_classes = [permissions.IsAuthenticated]

    def _assert_enrolled(self, user, course_pk):
        if not Enrollment.objects.filter(student=user, course_id=course_pk).exists():
            raise PermissionDenied("You must be enrolled in this course.")

    def post(self, request, course_pk, pk):
        self._assert_enrolled(request.user, course_pk)
        lesson = get_object_or_404(Lesson, pk=pk, course_id=course_pk)
        _, created = LessonProgress.objects.get_or_create(student=request.user, lesson=lesson)
        return Response({'completed': True, 'created': created})

    def delete(self, request, course_pk, pk):
        self._assert_enrolled(request.user, course_pk)
        LessonProgress.objects.filter(student=request.user, lesson_id=pk).delete()
        return Response({'completed': False})


class CourseProgressView(APIView):
    """GET → completed lesson IDs + percent for a course."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        total         = Lesson.objects.filter(course_id=pk).count()
        completed_ids = list(
            LessonProgress.objects.filter(
                student=request.user, lesson__course_id=pk
            ).values_list('lesson_id', flat=True)
        )
        return Response({
            'total':         total,
            'completed':     len(completed_ids),
            'completed_ids': completed_ids,
            'percent':       round(len(completed_ids) / total * 100) if total else 0,
        })


# ── Assessment ───────────────────────────────────────────────────────────────
class AssessmentView(APIView):
    """GET (anyone), POST/DELETE (course owner only)."""

    def _is_owner(self, request, course_pk):
        return (
            request.user.is_authenticated
            and Course.objects.filter(pk=course_pk, instructor=request.user).exists()
        )

    def get(self, request, course_pk, pk):
        lesson = get_object_or_404(Lesson, pk=pk, course_id=course_pk)
        try:
            a = lesson.assessment
        except Assessment.DoesNotExist:
            return Response(None)
        if self._is_owner(request, course_pk):
            return Response(AssessmentAdminSerializer(a).data)
        return Response(AssessmentSerializer(a).data)

    def post(self, request, course_pk, pk):
        if not self._is_owner(request, course_pk):
            raise PermissionDenied()
        lesson = get_object_or_404(Lesson, pk=pk, course_id=course_pk)
        serializer = AssessmentWriteSerializer(
            data=request.data, context={'lesson': lesson}
        )
        serializer.is_valid(raise_exception=True)
        assessment = serializer.save()
        return Response(AssessmentAdminSerializer(assessment).data, status=status.HTTP_201_CREATED)

    def delete(self, request, course_pk, pk):
        if not self._is_owner(request, course_pk):
            raise PermissionDenied()
        lesson = get_object_or_404(Lesson, pk=pk, course_id=course_pk)
        Assessment.objects.filter(lesson=lesson).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssessmentSubmitView(APIView):
    """POST answers → {score, total, passed}."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_pk, pk):
        lesson     = get_object_or_404(Lesson, pk=pk, course_id=course_pk)
        assessment = get_object_or_404(Assessment, lesson=lesson)
        answers    = request.data.get('answers', {})   # {str(question_id): choice_id}
        score = 0
        total = assessment.questions.count()
        for q in assessment.questions.prefetch_related('choices'):
            chosen_id = answers.get(str(q.id))
            if chosen_id and q.choices.filter(id=chosen_id, is_correct=True).exists():
                score += 1
        passed = total > 0 and score >= (total * 0.6)
        return Response({'score': score, 'total': total, 'passed': passed})


# ── Dashboards ───────────────────────────────────────────────────────────────
class StudentDashboardView(APIView):
    """Enrolled courses + per-course progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        enrollments = (
            Enrollment.objects.filter(student=request.user)
            .select_related('course')
            .order_by('-date_enrolled')
        )
        result = []
        for e in enrollments:
            total     = e.course.lessons.count()
            completed = LessonProgress.objects.filter(
                student=request.user, lesson__course=e.course
            ).count()
            result.append({
                'enrollment_id':      e.id,
                'date_enrolled':      e.date_enrolled,
                'course_id':          e.course_id,
                'course_title':       e.course.title,
                'course_description': e.course.description,
                'thumbnail_url':      e.course.thumbnail.url if e.course.thumbnail else None,
                'lesson_count':       total,
                'completed_lessons':  completed,
                'percent':            round(completed / total * 100) if total else 0,
            })
        return Response(result)


class InstructorAnalyticsView(APIView):
    """Per-course enrollment count + completion rate."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'instructor':
            return Response({'detail': 'Instructor access only.'}, status=403)
        courses = (
            Course.objects.filter(instructor=request.user)
            .annotate(
                enrollment_count=Count('enrollments', distinct=True),
                lesson_count=Count('lessons', distinct=True),
                avg_rating=Avg('reviews__rating'),
                review_count=Count('reviews', distinct=True),
            )
        )
        result = []
        for c in courses:
            n_lessons = c.lesson_count
            completed_students = 0
            if n_lessons > 0:
                completed_students = (
                    LessonProgress.objects
                    .filter(lesson__course=c)
                    .values('student')
                    .annotate(cnt=Count('id'))
                    .filter(cnt=n_lessons)
                    .count()
                )
            result.append({
                'course_id':          c.id,
                'course_title':       c.title,
                'thumbnail_url':      c.thumbnail.url if c.thumbnail else None,
                'lesson_count':       n_lessons,
                'enrollment_count':   c.enrollment_count,
                'completed_students': completed_students,
                'avg_rating':         round(c.avg_rating, 1) if c.avg_rating else None,
                'review_count':       c.review_count,
                'completion_rate':    (
                    round(completed_students / c.enrollment_count * 100)
                    if c.enrollment_count else 0
                ),
            })
        return Response(result)
