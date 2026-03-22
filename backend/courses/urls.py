from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CourseViewSet, LessonViewSet, EnrollmentViewSet,
    LessonCompleteView, CourseProgressView,
    AssessmentView, AssessmentSubmitView,
    StudentDashboardView, InstructorAnalyticsView,
    ReviewViewSet,
)

router = DefaultRouter()
router.register(r'courses',     CourseViewSet,     basename='course')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = router.urls + [
    # ── Lesson CRUD (nested) ─────────────────────────────────────────────────
    path(
        'courses/<int:course_pk>/lessons/',
        LessonViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='course-lesson-list',
    ),
    path(
        'courses/<int:course_pk>/lessons/<int:pk>/',
        LessonViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='course-lesson-detail',
    ),
    # ── Progress ─────────────────────────────────────────────────────────────
    path(
        'courses/<int:course_pk>/lessons/<int:pk>/complete/',
        LessonCompleteView.as_view(),
        name='lesson-complete',
    ),
    path(
        'courses/<int:pk>/progress/',
        CourseProgressView.as_view(),
        name='course-progress',
    ),
    # ── Assessment ───────────────────────────────────────────────────────────
    path(
        'courses/<int:course_pk>/lessons/<int:pk>/assessment/',
        AssessmentView.as_view(),
        name='lesson-assessment',
    ),
    path(
        'courses/<int:course_pk>/lessons/<int:pk>/assessment/submit/',
        AssessmentSubmitView.as_view(),
        name='assessment-submit',
    ),
    # ── Dashboards ───────────────────────────────────────────────────────────
    path('student/dashboard/',    StudentDashboardView.as_view(),    name='student-dashboard'),
    path('instructor/analytics/', InstructorAnalyticsView.as_view(), name='instructor-analytics'),
    # ── Reviews ───────────────────────────────────────────────────────────────
    path(
        'courses/<int:course_pk>/reviews/',
        ReviewViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='course-review-list',
    ),
    path(
        'courses/<int:course_pk>/reviews/<int:pk>/',
        ReviewViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='course-review-detail',
    ),
]
