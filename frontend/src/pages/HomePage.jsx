import { Link } from 'react-router-dom';
import { BookOpen, Users, Zap, ArrowRight } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Expert-Led Courses',  desc: 'Learn from industry professionals with real-world experience.' },
  { icon: Users,    title: 'Student Community',   desc: 'Connect, collaborate, and grow alongside thousands of learners.' },
  { icon: Zap,      title: 'Learn at Your Pace',  desc: 'Access content any time, from any device, on your schedule.' },
];

const stats = [
  ['3+',    'Courses'],
  ['5+',    'Lessons'],
  ['2',     'Instructors'],
  ['100%',  'Online'],
];

export default function HomePage() {
  return (
    <div className="page">
      {/* ── Hero ──────────────────── */}
      <section className="hero container">
        <h1>Unlock Your Potential<br />with EduStream</h1>
        <p>
          A modern learning platform where world-class instructors share their
          knowledge and students build careers they love.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/courses" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            Browse Courses <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Stats bar ─────────────── */}
      <section style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1.75rem 0',
        marginBottom: '3rem',
      }}>
        <div className="container" style={{
          display: 'flex', justifyContent: 'space-around',
          flexWrap: 'wrap', gap: '1.5rem', textAlign: 'center',
        }}>
          {stats.map(([n, label]) => (
            <div key={label}>
              <div className="stat-number">{n}</div>
              <div style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────── */}
      <section className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem' }}>
          Why EduStream?
        </h2>
        <div className="courses-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ textAlign: 'center' }}>
              {/* Uses .icon-circle which picks theme-aware bg color */}
              <div className="icon-circle">
                <Icon size={26} color="var(--color-highlight)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
