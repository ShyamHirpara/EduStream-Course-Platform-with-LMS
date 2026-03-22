import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Lock, Play, Edit, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from './CourseCatalog';

export default function CourseDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course,    setCourse]    = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');
  const [enrolled,  setEnrolled]  = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState('');
  const [completedIds,  setCompletedIds]  = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [myReview,      setMyReview]      = useState(null);
  const [reviewForm,    setReviewForm]    = useState({ rating: 0, comment: '' });
  const [hoverStar,     setHoverStar]     = useState(0);
  const [reviewSaving,  setReviewSaving]  = useState(false);
  const [reviewMsg,     setReviewMsg]     = useState('');
  const isOwner = user?.role === 'instructor' && course?.instructor === user?.id;

  useEffect(() => {
    api.get(`/courses/${id}/`).then(({ data }) => setCourse(data))
      .catch(() => setError('Course not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) {
      api.get('/enrollments/').then(({ data }) => {
        setEnrolled(data.some(e => String(e.course) === String(id)));
      }).catch(() => {});
      api.get(`/courses/${id}/progress/`).then(({ data }) => {
        setCompletedIds(data.completed_ids || []);
      }).catch(() => {});
    }
    api.get(`/courses/${id}/reviews/`).then(({ data }) => {
      setReviews(data);
      if (user) {
        const mine = data.find(r => String(r.student) === String(user.id));
        if (mine) { setMyReview(mine); setReviewForm({ rating: mine.rating, comment: mine.comment }); }
      }
    }).catch(() => {});
  }, [id, user]);

  const submitReview = async () => {
    if (!reviewForm.rating) return;
    setReviewSaving(true); setReviewMsg('');
    try {
      if (myReview) {
        const { data } = await api.patch(`/courses/${id}/reviews/${myReview.id}/`, reviewForm);
        setMyReview(data);
        setReviews(p => p.map(r => r.id === data.id ? data : r));
        setReviewMsg('Review updated!');
      } else {
        const { data } = await api.post(`/courses/${id}/reviews/`, reviewForm);
        setMyReview(data);
        setReviews(p => [data, ...p]);
        setReviewMsg('Review submitted!');
      }
    } catch (err) {
      setReviewMsg(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed.');
    } finally { setReviewSaving(false); }
  };

  const deleteReview = async () => {
    if (!myReview) return;
    await api.delete(`/courses/${id}/reviews/${myReview.id}/`);
    setMyReview(null); setReviewForm({ rating: 0, comment: '' });
    setReviews(p => p.filter(r => r.id !== myReview.id));
    setReviewMsg('');
  };

  const handleEnroll = async () => {
    if (!user) return;
    setEnrolling(true);
    setEnrollMsg('');
    try {
      await api.post('/enrollments/', { course: id });
      setEnrolled(true);
      setEnrollMsg('Successfully enrolled! 🎉');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Enrollment failed.';
      setEnrollMsg(msg);
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <div className="page"><div className="spinner" /></div>;
  if (error)     return <div className="page container"><div className="alert alert-error">{error}</div></div>;
  if (!course)   return null;

  return (
    <div className="page">
      <div className="container">
        <Link to="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Back to Catalog
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
          {/* Left – Course Info */}
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{course.title}</h1>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {course.description}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              <span><BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} />{course.lesson_count} lessons</span>
              <span>
                {Number(course.price) === 0
                  ? <span className="badge-free" style={{ fontSize: '0.8rem' }}>FREE</span>
                  : <><span style={{ display: 'inline', marginRight: 2 }}>$</span>{Number(course.price).toFixed(2)}</>}
              </span>
              <span>By <strong style={{ color: 'var(--color-text)' }}>{course.instructor_name}</strong></span>
            </div>

            {/* Lessons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Course Content</h2>
              {isOwner && (
                <button onClick={() => navigate(`/courses/${id}/edit`)} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
                  <Edit size={13} /> Edit Course
                </button>
              )}
            </div>

            {enrolled && course.lessons?.length > 0 && (
              <button
                onClick={() => {
                  const firstUndone = course.lessons.find(l => !completedIds.includes(l.id));
                  const target = firstUndone || course.lessons[0];
                  navigate(`/courses/${id}/learn/${target.id}`);
                }}
                className="btn btn-primary"
                style={{ marginBottom: '1.25rem', width: '100%', justifyContent: 'center', fontSize: '0.95rem' }}
              >
                <Play size={16} />
                {completedIds.length > 0 ? 'Continue Learning' : 'Start Learning'}
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {course.lessons?.length ? course.lessons.map((lesson, i) => {
                const done = completedIds.includes(lesson.id);
                return (
                  <div key={lesson.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', cursor: enrolled ? 'pointer' : 'default', transition: 'background 0.15s' }}
                    onClick={() => enrolled && navigate(`/courses/${id}/learn/${lesson.id}`)}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#10b98120' : 'rgba(99,102,241,0.15)', border: done ? '2px solid #10b981' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, color: done ? '#10b981' : 'var(--color-accent)' }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {lesson.title}
                        {done && <CheckCircle size={13} color="#10b981" />}
                      </div>
                      {enrolled
                        ? <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Play size={11} /> Click to open lesson</span>
                        : <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={12} /> Enroll to access</span>
                      }
                    </div>
                  </div>
                );
              }) : <p style={{ color: 'var(--color-muted)' }}>No lessons yet.</p>}
            </div>
          </div>

          {/* Right – Enrollment Card */}
          <div className="card" style={{ position: 'sticky', top: '90px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {Number(course.price) === 0
                ? <span className="badge-free" style={{ fontSize: '1.4rem', padding: '0.3rem 0.9rem' }}>FREE</span>
                : `$${Number(course.price).toFixed(2)}`}
            </div>

            {enrollMsg && (
              <div className={`alert ${enrolled ? 'alert-success' : 'alert-error'}`}>
                {enrollMsg}
              </div>
            )}

            {!user ? (
              <>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Login to enroll in this course.</p>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>Login to Enroll</Link>
              </>
            ) : enrolled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="btn btn-success" style={{ width: '100%', justifyContent: 'center', cursor: 'default' }}>
                  <CheckCircle size={18} /> Enrolled ✓
                </div>
                <button
                  onClick={() => { const t = course.lessons?.find(l => !completedIds.includes(l.id)) || course.lessons?.[0]; if (t) navigate(`/courses/${id}/learn/${t.id}`); }}
                  className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  Continue Learning
                </button>
              </div>
            ) : (
              <button id="enroll-btn" className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}
                style={{ width: '100%', justifyContent: 'center' }}>
                {enrolling ? 'Enrolling…' : 'Enroll Now'}
              </button>
            )}

            <div style={{ marginTop: '1.25rem', color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.8 }}>
              <div>✓ Full course access</div>
              <div>✓ {course.lesson_count} video lessons</div>
              <div>✓ Certificate of completion</div>
            </div>
          </div>
        </div>

        {/* ══ Reviews Section ══════════════════════════════════════════════ */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Student Reviews</h2>
            {course.avg_rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StarDisplay rating={course.avg_rating} count={course.review_count} size={16} />
              </div>
            )}
          </div>

          {/* Review form (enrolled students only) */}
          {enrolled && user?.role !== 'instructor' && (
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                {myReview ? 'Your Review' : 'Leave a Review'}
              </h3>

              {/* Star picker */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button"
                    onMouseEnter={() => setHoverStar(s)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', fontSize: '1.6rem', color: s <= (hoverStar || reviewForm.rating) ? '#f59e0b' : 'var(--color-border)', transition: 'color 0.1s' }}
                  >
                    ★
                  </button>
                ))}
                {reviewForm.rating > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', alignSelf: 'center', marginLeft: '0.4rem' }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                  </span>
                )}
              </div>

              <textarea
                placeholder="Share what you think about this course… (optional)"
                value={reviewForm.comment}
                onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                rows={3}
                style={{ width: '100%', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--color-text)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.85rem', boxSizing: 'border-box' }}
              />

              {reviewMsg && (
                <div className={`alert ${reviewMsg.includes('!') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '0.75rem' }}>{reviewMsg}</div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={submitReview} disabled={reviewSaving || !reviewForm.rating} className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                  {reviewSaving ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'}
                </button>
                {myReview && (
                  <button onClick={deleteReview} className="btn btn-outline" style={{ fontSize: '0.9rem', color: '#ef4444', borderColor: '#ef4444' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>No reviews yet. Be the first to review this course!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(r => (
                <div key={r.id} className="card" style={{ padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-icon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-accent)', flexShrink: 0 }}>
                        {r.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.student_name}</div>
                        <StarDisplay rating={r.rating} size={12} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
