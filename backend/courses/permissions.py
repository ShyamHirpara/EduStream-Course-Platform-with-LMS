from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsInstructorOrReadOnly(BasePermission):
    """
    Read access:  anyone (anonymous or authenticated).
    Write access: authenticated users with role == 'instructor' only.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'instructor'
        )


class IsCourseOwner(BasePermission):
    """
    Object-level permission.
    Works for both Course objects and Lesson objects:
      - Course  → obj.instructor must equal request.user
      - Lesson  → obj.course.instructor must equal request.user
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # Normalise: get the Course regardless of whether obj is Course or Lesson
        course = obj if hasattr(obj, 'instructor') else obj.course
        return course.instructor == request.user
