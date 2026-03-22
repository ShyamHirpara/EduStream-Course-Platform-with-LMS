import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Layers, Star } from 'lucide-react';
import api from '../api/axios';

/* ── reusable star display ────────────────────────────────────────────────── */
export function StarDisplay({ rating, count, size = 13 }) {
  if (!rating) return null;
  const rounded = Math.round(rating * 2) / 2;   // nearest 0.5
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = i < Math.floor(rounded)   ? '#f59e0b'
                   : i < rounded               ? 'url(#half)'
                   :                             'var(--color-border)';
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="none">
            <defs>
              <linearGradient id="half"><stop offset="50%" stopColor="#f59e0b" /><stop offset="50%" stopColor="var(--color-border)" /></linearGradient>
            </defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
      <span style={{ fontSize: size - 2, color: 'var(--color-muted)', marginLeft: 3 }}>
        {Number(rating).toFixed(1)}{count != null ? ` (${count})` : ''}
      </span>
    </span>
  );
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses/')
      .then(({ data }) => { setCourses(data); setFiltered(data); })
      .catch(() => setError('Failed to load courses. Is the backend running?'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(courses.filter(c =>
      c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ));
  }, [query, courses]);

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Course Catalog</h1>
          <p style={{ color: 'var(--color-muted)' }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '2rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input
            id="course-search"
            type="text"
            placeholder="Search courses…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem', background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'var(--color-text)' }}
          />
        </div>

        {isLoading && <div className="spinner" />}
        {error && <div className="alert alert-error">{error}</div>}

        {!isLoading && !error && (
          <div className="courses-grid">
            {filtered.map(course => (
              <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                  {/* Thumbnail or gradient bar */}
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '0.9rem' }} />
                    : <div className="card-top-bar" />
                  }

                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                    {course.title}
                  </h3>

                  {/* Star rating */}
                  {course.avg_rating && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <StarDisplay rating={course.avg_rating} count={course.review_count} />
                    </div>
                  )}

                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </p>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={13} /> {course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                      {Number(course.price) === 0
                        ? <span className="badge-free">FREE</span>
                        : <>${Number(course.price).toFixed(2)}</>}
                    </span>
                  </div>

                  <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                    <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {course.instructor_name}
                  </div>
                </div>
              </Link>
            ))}

            {filtered.length === 0 && (
              <p style={{ color: 'var(--color-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem 0' }}>
                No courses match "{query}".
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



