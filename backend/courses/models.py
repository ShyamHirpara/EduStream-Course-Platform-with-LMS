from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField
import helpers

# Initialise Cloudinary SDK using credentials from .env
helpers.cloudinary_init()


class Course(models.Model):
    title       = models.CharField(max_length=200)
    description = models.TextField()
    instructor  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses',
    )
    price     = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    thumbnail = CloudinaryField('image', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Lesson(models.Model):
    title   = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    order   = models.PositiveIntegerField(default=0)
    video   = CloudinaryField('video', resource_type='video', blank=True, null=True)
    course  = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='lessons'
    )

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} – {self.title}"


class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='enrollments'
    )
    date_enrolled = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} → {self.course.title}"


class LessonProgress(models.Model):
    """Tracks which lessons a student has completed."""
    student      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_progresses',
    )
    lesson       = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name='progresses'
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f"{self.student.username} ✓ {self.lesson.title}"


class Assessment(models.Model):
    """Optional quiz attached to a single lesson."""
    lesson = models.OneToOneField(
        Lesson, on_delete=models.CASCADE, related_name='assessment'
    )

    def __str__(self):
        return f"Assessment: {self.lesson.title}"


class Question(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name='questions'
    )
    text  = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text[:80]


class Choice(models.Model):
    question   = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name='choices'
    )
    text       = models.CharField(max_length=300)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{'✓' if self.is_correct else '✗'} {self.text}"


class Review(models.Model):
    """Star rating + comment left by an enrolled student."""
    student    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    course     = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='reviews'
    )
    rating     = models.PositiveSmallIntegerField()   # 1 – 5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} → {self.course.title} ({self.rating}★)"


