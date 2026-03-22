import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Layers, DollarSign, Users, TrendingUp, Award, Edit } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from './CourseCatalog';


/* ── shared visual helpers ─────────────────────────────────────────────────── */
function ProgressRing({ percent, size = 64, stroke = 5, color = '#10b981' }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((percent / 100) * circ, circ);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 60 ? '0.65rem' : '0.75rem', fontWeight: 700,
        color: percent === 100 ? color : 'var(--color-text)',
      }}>
        {percent}%
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'var(--color-highlight)' }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-icon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── bar chart for instructor ────────────────────────────────────────────── */
function EnrollmentBar({ value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', minWidth: 24, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/* ── Student Dashboard ────────────────────────────────────────────────────── */
function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [data,      setData]      = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard/')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const totalCourses   = data.length;
  const completed      = data.filter(d => d.percent === 100).length;
  const inProgress     = data.filter(d => d.percent > 0 && d.percent < 100).length;

  const getFirstLesson = courseId => {
    const entry = data.find(d => d.course_id === courseId);
    return entry ? `/courses/${courseId}/learn` : `/courses/${courseId}`;
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>My Learning</h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Welcome back, <strong>{user.username}</strong>! Keep up the great work.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <StatCard icon={BookOpen}    label="Enrolled"    value={totalCourses} />
        <StatCard icon={TrendingUp}  label="In Progress" value={inProgress}   color="#f59e0b" />
        <StatCard icon={Award}       label="Completed"   value={completed}    color="#10b981" />
      </div>

      {isLoading ? <div className="spinner" /> : data.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <BookOpen size={48} color="var(--color-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No enrollments yet</h3>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Start your learning journey!</p>
          <Link to="/courses" className="btn btn-primary" style={{ textDecoration: 'none' }}>Browse Courses</Link>
        </div>
      ) : (
        <div className="courses-grid">
          {data.map(d => {
            const ringColor = d.percent === 100 ? '#10b981' : d.percent > 0 ? '#f59e0b' : '#6366f1';
            return (
              <div key={d.enrollment_id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Thumbnail or gradient banner */}
                {d.thumbnail_url
                  ? <img src={d.thumbnail_url} alt={d.course_title} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: '0.6rem', marginBottom: '1rem' }} />
                  : <div style={{ height: 8, background: `linear-gradient(90deg, ${ringColor}, var(--color-border))`, borderRadius: '4px 4px 0 0', margin: '-1.5rem -1.5rem 1.25rem' }} />
                }

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flex: 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.35rem', color: 'var(--color-text)' }}>{d.course_title}</h3>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.course_description}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      {d.completed_lessons}/{d.lesson_count} lessons done
                    </span>
                  </div>
                  <ProgressRing percent={d.percent} size={64} stroke={5} color={ringColor} />
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 3, margin: '1rem 0', overflow: 'hidden' }}>
                  <div style={{ width: `${d.percent}%`, height: '100%', background: ringColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  {d.percent < 100 ? (
                    <button
                      onClick={() => navigate(`/courses/${d.course_id}/learn/${''}`)}
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}
                    >
                      ▶ Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/courses/${d.course_id}`)}
                      className="btn btn-outline"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                    >
                      ⭐ Leave a Review
                    </button>
                  )}
                </div>
              </div>


            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Instructor Dashboard ─────────────────────────────────────────────────── */
function InstructorDashboard({ user }) {
  const navigate    = useNavigate();
  const [data,      setData]      = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/instructor/analytics/')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const totalStudents  = data.reduce((s, c) => s + c.enrollment_count, 0);
  const avgCompletion  = data.length
    ? Math.round(data.reduce((s, c) => s + c.completion_rate, 0) / data.length)
    : 0;
  const maxEnrollment  = Math.max(1, ...data.map(c => c.enrollment_count));

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Instructor Dashboard</h1>
          <p style={{ color: 'var(--color-muted)' }}>Hello, <strong>{user.username}</strong>! Analytics for your courses.</p>
        </div>
        <button id="create-course-btn" className="btn btn-primary" onClick={() => navigate('/courses/create')}>
          <PlusCircle size={16} /> Create Course
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <StatCard icon={BookOpen}   label="Total Courses"     value={data.length}       />
        <StatCard icon={Users}      label="Total Students"    value={totalStudents}      color="#6366f1" />
        <StatCard icon={TrendingUp} label="Avg Completion"    value={`${avgCompletion}%`} color="#f59e0b" />
      </div>

      {isLoading ? <div className="spinner" /> : data.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <BookOpen size={48} color="var(--color-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No courses yet</h3>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Create your first course to start teaching.</p>
          <button className="btn btn-primary" onClick={() => navigate('/courses/create')}>Create Course</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.map(c => (
            <div key={c.course_id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
              {/* Left */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }} />
                    : <div style={{ width: 52, height: 52, borderRadius: '0.5rem', background: 'var(--color-icon-bg)', flexShrink: 0 }} />
                  }
                  <div>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{c.course_title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{c.lesson_count} lessons</span>
                    {c.avg_rating && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <StarDisplay rating={c.avg_rating} count={c.review_count} size={12} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Enrollment bar */}
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.3rem' }}>
                    <span><Users size={11} style={{ display: 'inline', marginRight: 3 }} />Enrollments</span>
                    <span>{c.enrollment_count} students</span>
                  </div>
                  <EnrollmentBar value={c.enrollment_count} max={maxEnrollment} color="#6366f1" />
                </div>

                {/* Completion bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.3rem' }}>
                    <span><Award size={11} style={{ display: 'inline', marginRight: 3 }} />Completions</span>
                    <span>{c.completed_students} / {c.enrollment_count}</span>
                  </div>
                  <EnrollmentBar value={c.completed_students} max={c.enrollment_count || 1} color="#10b981" />
                </div>
              </div>

              {/* Right — ring + edit */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <ProgressRing percent={c.completion_rate} size={72} stroke={6} color="#10b981" />
                <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textAlign: 'center' }}>completion rate</span>
                <button onClick={() => navigate(`/courses/${c.course_id}/edit`)}
                  className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}>
                  <Edit size={12} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Router ──────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="container">
        {user?.role === 'instructor'
          ? <InstructorDashboard user={user} />
          : <StudentDashboard    user={user} />
        }
      </div>
    </div>
  );
}
