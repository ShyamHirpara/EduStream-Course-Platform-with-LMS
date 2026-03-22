from rest_framework import serializers
from .models import Course, Lesson, Enrollment, LessonProgress, Assessment, Question, Choice, Review


# ── Choice ──────────────────────────────────────────────────────────────────
class ChoiceSerializer(serializers.ModelSerializer):
    """Student view — hides is_correct."""
    class Meta:
        model  = Choice
        fields = ('id', 'text')


class ChoiceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ('id', 'text', 'is_correct')


# ── Question ─────────────────────────────────────────────────────────────────
class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ('id', 'text', 'order', 'choices')


class QuestionAdminSerializer(serializers.ModelSerializer):
    choices = ChoiceAdminSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ('id', 'text', 'order', 'choices')


# ── Assessment ───────────────────────────────────────────────────────────────
class AssessmentSerializer(serializers.ModelSerializer):
    """Student — no correct answers."""
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model  = Assessment
        fields = ('id', 'questions')


class AssessmentAdminSerializer(serializers.ModelSerializer):
    """Instructor — full detail."""
    questions = QuestionAdminSerializer(many=True, read_only=True)

    class Meta:
        model  = Assessment
        fields = ('id', 'questions')


class AssessmentWriteSerializer(serializers.Serializer):
    """
    Write assessment with nested questions + choices.
    Sends: { questions: [{text, order, choices: [{text, is_correct}]}] }
    """
    questions = serializers.ListField(child=serializers.DictField(), default=list)

    def _build_questions(self, assessment, questions_data):
        for i, q_data in enumerate(questions_data):
            choices_data = q_data.pop('choices', [])
            q = Question.objects.create(
                assessment=assessment,
                text=q_data.get('text', ''),
                order=q_data.get('order', i),
            )
            for c in choices_data:
                Choice.objects.create(
                    question=q,
                    text=c.get('text', ''),
                    is_correct=c.get('is_correct', False),
                )

    def save(self, **kwargs):
        lesson = self.context['lesson']
        assessment, _ = Assessment.objects.get_or_create(lesson=lesson)
        assessment.questions.all().delete()
        self._build_questions(assessment, self.validated_data.get('questions', []))
        return assessment


# ── Lesson ───────────────────────────────────────────────────────────────────
class LessonSerializer(serializers.ModelSerializer):
    """Public — title + order only."""
    class Meta:
        model  = Lesson
        fields = ('id', 'title', 'order')


class LessonWithContentSerializer(serializers.ModelSerializer):
    """Enrolled student — full content, assessment without answers, completion flag."""
    video_url    = serializers.SerializerMethodField()
    assessment   = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    def get_video_url(self, obj):
        return obj.video.url if obj.video else None

    def get_assessment(self, obj):
        try:
            return AssessmentSerializer(obj.assessment).data
        except Assessment.DoesNotExist:
            return None

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return LessonProgress.objects.filter(
                student=request.user, lesson=obj
            ).exists()
        return False

    class Meta:
        model  = Lesson
        fields = ('id', 'title', 'content', 'order', 'video_url', 'assessment', 'is_completed')


class LessonInstructorSerializer(serializers.ModelSerializer):
    """Course owner — full content + correct answers."""
    video_url  = serializers.SerializerMethodField()
    assessment = serializers.SerializerMethodField()

    def get_video_url(self, obj):
        return obj.video.url if obj.video else None

    def get_assessment(self, obj):
        try:
            return AssessmentAdminSerializer(obj.assessment).data
        except Assessment.DoesNotExist:
            return None

    class Meta:
        model  = Lesson
        fields = ('id', 'title', 'content', 'order', 'video_url', 'assessment')


class LessonWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Lesson
        fields = ('id', 'title', 'content', 'order', 'video')


# ── Course ───────────────────────────────────────────────────────────────────
class CourseSerializer(serializers.ModelSerializer):
    lesson_count    = serializers.IntegerField(read_only=True)
    review_count    = serializers.IntegerField(read_only=True)
    avg_rating      = serializers.FloatField(read_only=True)
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)
    thumbnail_url   = serializers.SerializerMethodField()
    lessons         = serializers.SerializerMethodField()

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None

    def get_lessons(self, obj):
        request    = self.context.get('request')
        lessons_qs = obj.lessons.all()
        ctx        = {'request': request}

        if request and request.user.is_authenticated:
            is_owner = (
                request.user.role == 'instructor'
                and obj.instructor_id == request.user.id
            )
            if is_owner:
                return LessonInstructorSerializer(lessons_qs, many=True, context=ctx).data

            is_enrolled = Enrollment.objects.filter(
                student=request.user, course=obj
            ).exists()
            if is_enrolled:
                return LessonWithContentSerializer(lessons_qs, many=True, context=ctx).data

        return LessonSerializer(lessons_qs, many=True).data

    class Meta:
        model  = Course
        fields = (
            'id', 'title', 'description',
            'instructor', 'instructor_name',
            'price', 'created_at',
            'lesson_count', 'lessons', 'thumbnail_url',
            'avg_rating', 'review_count',
        )


class CourseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Course
        fields = ('id', 'title', 'description', 'price', 'thumbnail')
        read_only_fields = ('id',)


# ── Enrollment ───────────────────────────────────────────────────────────────
class EnrollmentSerializer(serializers.ModelSerializer):
    course_title       = serializers.CharField(source='course.title',       read_only=True)
    course_description = serializers.CharField(source='course.description', read_only=True)
    thumbnail_url      = serializers.SerializerMethodField()

    def get_thumbnail_url(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None

    class Meta:
        model  = Enrollment
        fields = (
            'id', 'course', 'course_title', 'course_description',
            'thumbnail_url', 'date_enrolled',
        )
        read_only_fields = ('student', 'date_enrolled')


# ── Review ────────────────────────────────────────────────────────────────────
class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model  = Review
        fields = ('id', 'student', 'student_name', 'rating', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'student', 'student_name', 'created_at', 'updated_at')

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

