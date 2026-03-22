import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Lock, PlayCircle, FileText,
  ChevronLeft, ChevronRight, BookOpen, ClipboardList,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function ProgressRing({ percent, size = 48, stroke = 4 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((percent / 100) * circ, circ);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--color-border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#10b981" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.7s ease' }} />
    </svg>
  );
}

/* ── Assessment component ─────────────────────────────────────────────────── */
function AssessmentPanel({ assessment, courseId, lessonId, onPass, isCompleted }) {
  const [answers,  setAnswers]  = useState({});
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  if (!assessment || !assessment.questions?.length) return null;

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(
        `/courses/${courseId}/lessons/${lessonId}/assessment/submit/`,
        { answers }
      );
      setResult(data);
      if (data.passed && onPass) onPass();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      background: 'var(--color-surface-2)', borderRadius: '1rem',
      border: '1px solid var(--color-border)', padding: '1.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <ClipboardList size={20} color="var(--color-highlight)" />
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Lesson Assessment</h3>
      </div>

      {assessment.questions.map((q, qi) => (
        <div key={q.id} style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.92rem' }}>
            Q{qi + 1}. {q.text}
          </p>
          {q.choices.map(c => (
            <label key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
              background: answers[q.id] === c.id ? 'var(--color-icon-bg)' : 'transparent',
              border: answers[q.id] === c.id ? '1.5px solid var(--color-highlight)' : '1.5px solid transparent',
              marginBottom: '0.35rem', fontSize: '0.88rem', transition: 'all 0.15s',
            }}>
              <input type="radio" name={`q-${q.id}`}
                checked={answers[q.id] === c.id}
                onChange={() => setAnswers(p => ({ ...p, [q.id]: c.id }))}
                style={{ accentColor: 'var(--color-highlight)', flexShrink: 0 }}
              />
              {c.text}
            </label>
          ))}
        </div>
      ))}

      {isCompleted ? (
        <div style={{ padding: '0.85rem', background: 'rgba(16,185,129,0.1)', borderRadius: '0.5rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <CheckCircle size={18} /> Assessment Passed
        </div>
      ) : result ? (
        <div className={`alert ${result.passed ? 'alert-success' : 'alert-error'}`}>
          {result.passed ? '🎉' : '📝'} Score: {result.score}/{result.total} —{' '}
          {result.passed ? 'Passed! Well done.' : 'Keep going — review the lesson and retry.'}
          {!result.passed && (
            <button onClick={() => setResult(null)}
              style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
              Retry
            </button>
          )}
        </div>
      ) : (
        <button onClick={submit} disabled={loading || Object.keys(answers).length < assessment.questions.length} className="btn btn-primary"
          style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {loading ? 'Checking…' : 'Submit Answers'}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function LessonViewPage() {
  const { courseId, lessonId } = useParams();
  const navigate               = useNavigate();
  const { user }               = useAuth();

  const [course,        setCourse]        = useState(null);
  const [progress,      setProgress]      = useState({ completed_ids: [] });
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [completing,    setCompleting]    = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [loaded,        setLoaded]        = useState(false);
  const contentRef = useRef();

  /* fetch course + progress */
  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}/`),
      api.get(`/courses/${courseId}/progress/`).catch(() => ({ data: { completed_ids: [] } })),
    ]).then(([{ data: c }, { data: p }]) => {
      setCourse(c);
      setProgress(p);
      setLoaded(true);
    }).catch(() => navigate('/courses'));
  }, [courseId]);

  /* scroll to top on lesson change */
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setJustCompleted(false);
  }, [lessonId]);

  if (!loaded) return <div className="page"><div className="spinner" /></div>;

  const lessons   = course?.lessons || [];
  const lesson    = lessons.find(l => String(l.id) === String(lessonId));

  if (!lesson && lessons.length > 0) {
    const target = lessons.find(l => !progress.completed_ids.includes(l.id)) || lessons[0];
    return <Navigate to={`/courses/${courseId}/learn/${target.id}`} replace />;
  }

  const currentIdx = lessons.findIndex(l => String(l.id) === String(lessonId));
  const prevLesson = lessons[currentIdx - 1];
  const nextLesson = lessons[currentIdx + 1];

  if (!lesson) return (
    <div className="page container">
      <div className="alert alert-error">Lesson not found. <Link to={`/courses/${courseId}`}>Back to course</Link></div>
    </div>
  );

  const isCompleted = progress.completed_ids.includes(lesson.id) || justCompleted;
  const doneCount   = progress.completed_ids.length + (justCompleted && !progress.completed_ids.includes(lesson.id) ? 1 : 0);
  const percent     = lessons.length ? Math.round(doneCount / lessons.length * 100) : 0;

  const markComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/complete/`);
      setProgress(p => ({
        ...p,
        completed_ids: [...new Set([...p.completed_ids, lesson.id])],
        completed: (p.completed || 0) + 1,
      }));
      setJustCompleted(true);
    } catch { /* already completed */ }
    finally { setCompleting(false); }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

      {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
      <aside style={{
        width: sidebarOpen ? 280 : 0,
        minWidth: sidebarOpen ? 280 : 0,
        overflow: 'hidden',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        flexShrink: 0,
      }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <Link to={`/courses/${courseId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <ArrowLeft size={13} /> Back to Course
          </Link>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.3, marginBottom: '0.6rem' }}>
            {course.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ProgressRing percent={percent} size={32} stroke={3} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              {doneCount}/{lessons.length} completed
            </span>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
          {lessons.map((l, i) => {
            const done    = progress.completed_ids.includes(l.id) || (justCompleted && String(l.id) === String(lessonId));
            const active  = String(l.id) === String(lessonId);
            return (
              <button key={l.id}
                onClick={() => navigate(`/courses/${courseId}/learn/${l.id}`)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  width: '100%', padding: '0.7rem 1.25rem', border: 'none', cursor: 'pointer',
                  background: active ? 'var(--color-icon-bg)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-highlight)' : '3px solid transparent',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#10b981' : active ? 'var(--color-icon-bg)' : 'var(--color-surface-2)',
                  border: done ? 'none' : `1.5px solid ${active ? 'var(--color-highlight)' : 'var(--color-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700,
                  color: done ? '#fff' : active ? 'var(--color-highlight)' : 'var(--color-muted)',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.82rem', lineHeight: 1.35,
                  color: active ? 'var(--color-text)' : 'var(--color-muted)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {l.title}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ══ Main Content ═════════════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} ref={contentRef}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)', flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <button onClick={() => setSidebarOpen(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
            <BookOpen size={15} /> {sidebarOpen ? 'Hide' : 'Show'} lessons
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {prevLesson && (
              <button onClick={() => navigate(`/courses/${courseId}/learn/${prevLesson.id}`)}
                className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                <ChevronLeft size={13} /> Prev
              </button>
            )}
            {nextLesson && (
              <button onClick={() => navigate(`/courses/${courseId}/learn/${nextLesson.id}`)}
                className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                Next <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Lesson body */}
        <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>{lesson.title}</h1>

          {/* Video — download protected */}
          {lesson.video_url && (
            <div style={{ marginBottom: '2rem', borderRadius: '0.75rem', overflow: 'hidden', background: '#000', aspectRatio: '16/9', position: 'relative' }}>
              <video
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                src={lesson.video_url}
                onContextMenu={e => e.preventDefault()}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                Your browser does not support video.
              </video>
              {/* Transparent overlay blocks right-click & long-press on mobile */}
              <div
                onContextMenu={e => e.preventDefault()}
                style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
                aria-hidden="true"
              />
            </div>
          )}


          {/* Reading content */}
          {lesson.content && (
            <div style={{
              lineHeight: 1.8, fontSize: '1rem', color: 'var(--color-text)',
              marginBottom: '2.5rem', whiteSpace: 'pre-wrap',
            }}>
              {lesson.content}
            </div>
          )}

          {/* Assessment */}
          {lesson.assessment && (
            <AssessmentPanel
              key={lessonId}
              assessment={lesson.assessment}
              courseId={courseId}
              lessonId={lessonId}
              onPass={markComplete}
              isCompleted={isCompleted}
            />
          )}

          {/* Mark complete */}
          <div style={{
            borderTop: '1px solid var(--color-border)', paddingTop: '2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
          }}>
            {isCompleted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle size={20} /> Lesson Completed!
              </div>
            ) : lesson.assessment ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                Complete the passing assessment to finish lesson
              </div>
            ) : (
              <button
                onClick={markComplete}
                disabled={completing}
                className="btn btn-success"
                style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}
              >
                {completing ? 'Saving…' : '✓ Mark as Completed'}
              </button>
            )}
            {nextLesson && (
              <button
                onClick={() => navigate(`/courses/${courseId}/learn/${nextLesson.id}`)}
                className="btn btn-primary"
                style={{ fontSize: '0.95rem' }}
              >
                Next Lesson <ChevronRight size={16} />
              </button>
            )}
            {!nextLesson && isCompleted && (
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>
                🎓 Course Complete! Congratulations!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
