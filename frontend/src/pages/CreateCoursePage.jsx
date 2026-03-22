import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, ArrowLeft, Upload,
  Video, ImageIcon, DollarSign, FileText,
  GraduationCap, ChevronUp, ChevronDown, CheckCircle,
} from 'lucide-react';
import api from '../api/axios';
import AssessmentEditor from '../components/AssessmentEditor';


/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const freshLesson = () => ({
  _id:       Math.random().toString(36).slice(2),
  title:     '',
  content:   '',
  video:     null,
  videoName: '',
  assessmentQuestions: [],
});

const iconBtnStyle = {
  background:     'var(--color-surface)',
  border:         '1px solid var(--color-border)',
  borderRadius:   '0.35rem',
  padding:        '0.3rem 0.45rem',
  cursor:         'pointer',
  color:          'var(--color-muted)',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  transition:     'all 0.15s',
};

const textareaStyle = (extra = {}) => ({
  background:   'var(--color-surface-2)',
  border:       '1.5px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding:      '0.75rem 1rem',
  color:        'var(--color-text)',
  fontSize:     '0.92rem',
  width:        '100%',
  resize:       'vertical',
  fontFamily:   'inherit',
  lineHeight:   1.65,
  ...extra,
});

/* ─── Lesson Card sub-component ────────────────────────────────────────────── */
function LessonCard({ lesson, index, total, onChange, onVideoChange, onRemove, onMove }) {
  const videoRef = useRef();

  return (
    <div style={{
      background:   'var(--color-surface-2)',
      borderRadius: '0.875rem',
      border:       '1px solid var(--color-border)',
      padding:      '1.35rem',
    }}>
      {/* ── Header row: number + controls ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 800,
          }}>
            {index + 1}
          </div>
          Lesson {index + 1}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button type="button" title="Move up"
            onClick={() => onMove(lesson._id, -1)} disabled={index === 0}
            style={iconBtnStyle}>
            <ChevronUp size={14} />
          </button>
          <button type="button" title="Move down"
            onClick={() => onMove(lesson._id, 1)} disabled={index === total - 1}
            style={iconBtnStyle}>
            <ChevronDown size={14} />
          </button>
          <button type="button" title="Remove lesson"
            onClick={() => onRemove(lesson._id)} disabled={total === 1}
            style={{ ...iconBtnStyle, color: '#ef4444', opacity: total === 1 ? 0.35 : 1 }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Lesson Title ── */}
      <div className="form-group">
        <label htmlFor={`lt-${lesson._id}`}>Lesson Title *</label>
        <input
          id={`lt-${lesson._id}`}
          type="text"
          placeholder="e.g. Introduction to Variables and Data Types"
          value={lesson.title}
          onChange={e => onChange(lesson._id, 'title', e.target.value)}
          required
        />
      </div>

      {/* ── Lesson Content ── */}
      <div className="form-group">
        <label htmlFor={`lc-${lesson._id}`}>
          <FileText size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
          Lesson Content
        </label>
        <textarea
          id={`lc-${lesson._id}`}
          placeholder="Explain the topic, include examples, key concepts, code snippets…"
          value={lesson.content}
          onChange={e => onChange(lesson._id, 'content', e.target.value)}
          rows={5}
          style={textareaStyle({ background: 'var(--color-surface)' })}
        />
      </div>

      {/* ── Video Upload ── */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>
          <Video size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
          Lesson Video <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional · uploaded to Cloudinary)</span>
        </label>
        <input
          type="file"
          accept="video/*"
          ref={videoRef}
          id={`lv-${lesson._id}`}
          onChange={e => onVideoChange(lesson._id, e)}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => videoRef.current.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background:   'var(--color-surface)',
            border:       '1.5px dashed var(--color-border)',
            borderRadius: '0.5rem',
            padding:      '0.7rem 1rem',
            color:        lesson.videoName ? 'var(--color-text)' : 'var(--color-muted)',
            cursor:       'pointer',
            width:        '100%',
            fontSize:     '0.875rem',
            transition:   'border-color 0.2s',
            textAlign:    'left',
            overflow:     'hidden',
          }}
        >
          <Upload size={14} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lesson.videoName || 'Choose video file…'}
          </span>
        </button>
        {lesson.videoName && (
          <p style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={11} /> {lesson.videoName}
          </p>
        )}
      </div>

      <AssessmentEditor
        questions={lesson.assessmentQuestions || []}
        onChange={data => onChange(lesson._id, 'assessmentQuestions', data)}
      />
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function CreateCoursePage() {
  const navigate = useNavigate();
  const thumbRef = useRef();

  const [course, setCourse] = useState({
    title:            '',
    description:      '',
    price:            '0.00',
    thumbnail:        null,
    thumbnailPreview: null,
  });
  const [lessons,    setLessons]    = useState([freshLesson()]);
  const [submitting, setSubmitting] = useState(false);
  const [progress,   setProgress]   = useState('');
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  /* ── Course handlers ─ */
  const handleCourseChange = e => {
    const { name, value } = e.target;
    setCourse(p => ({ ...p, [name]: value }));
  };

  const handleThumbnail = e => {
    const file = e.target.files[0];
    if (!file) return;
    setCourse(p => ({
      ...p,
      thumbnail:        file,
      thumbnailPreview: URL.createObjectURL(file),
    }));
  };

  /* ── Lesson handlers ─ */
  const handleLessonChange = (id, field, value) =>
    setLessons(p => p.map(l => l._id === id ? { ...l, [field]: value } : l));

  const handleLessonVideo = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLessons(p => p.map(l => l._id === id ? { ...l, video: file, videoName: file.name } : l));
  };

  const addLesson    = () => setLessons(p => [...p, freshLesson()]);
  const removeLesson = id  => setLessons(p => p.filter(l => l._id !== id));

  const moveLesson = (id, dir) => setLessons(p => {
    const i    = p.findIndex(l => l._id === id);
    const arr  = [...p];
    const swap = i + dir;
    if (swap < 0 || swap >= arr.length) return p;
    [arr[i], arr[swap]] = [arr[swap], arr[i]];
    return arr;
  });

  /* ── Submit ─ */
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!course.title.trim())                       { setError('Course title is required.');                 return; }
    if (!course.description.trim())                 { setError('Course description is required.');           return; }
    if (lessons.some(l => !l.title.trim()))         { setError('Every lesson must have a title.');           return; }

    setSubmitting(true);
    try {
      /* 1 ── Create the course */
      setProgress('Creating course…');
      const cForm = new FormData();
      cForm.append('title',       course.title);
      cForm.append('description', course.description);
      cForm.append('price',       course.price);
      if (course.thumbnail) cForm.append('thumbnail', course.thumbnail);

      const { data: newCourse } = await api.post('/courses/', cForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      /* 2 ── Create each lesson */
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        setProgress(`Uploading lesson ${i + 1} of ${lessons.length}…`);
        const lForm = new FormData();
        lForm.append('title',   l.title);
        lForm.append('content', l.content);
        lForm.append('order',   i + 1);
        if (l.video) lForm.append('video', l.video);

        const { data: newLesson } = await api.post(`/courses/${newCourse.id}/lessons/`, lForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (Array.isArray(l.assessmentQuestions) && l.assessmentQuestions.length > 0) {
          await api.post(`/courses/${newCourse.id}/lessons/${newLesson.id}/assessment/`, { questions: l.assessmentQuestions });
        }
      }

      setSuccess(true);
      setProgress('');
      setTimeout(() => navigate('/dashboard'), 2200);
    } catch (err) {
      const data = err.response?.data;
      const msg  = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
        : 'Something went wrong. Please try again.';
      setError(msg);
      setProgress('');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ─ */
  if (success) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', maxWidth: 420 }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <CheckCircle size={38} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Course Published!</h2>
          <p style={{ color: 'var(--color-muted)' }}>Redirecting you to your dashboard…</p>
        </div>
      </div>
    );
  }

  /* ── Main form ─ */
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>

        {/* ── Page Header ─────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
            style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Create a New Course</h1>
          <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.95rem' }}>
            Fill in the course details, add lessons, and hit <strong>Publish</strong>.
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ══ Section 1 — Course Details ══════════════ */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div className="icon-circle" style={{ width: 38, height: 38, borderRadius: '10px', margin: 0 }}>
                <GraduationCap size={18} color="var(--color-highlight)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Course Details</h2>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', margin: 0 }}>Basic info about your course</p>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Course Title *</label>
              <input
                id="title" name="title" type="text"
                placeholder="e.g. The Complete Python Bootcamp for Beginners"
                value={course.title}
                onChange={handleCourseChange}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description" name="description"
                placeholder="What will students learn? Who is this course for? What are the prerequisites?"
                value={course.description}
                onChange={handleCourseChange}
                rows={5}
                required
                style={textareaStyle()}
              />
            </div>

            {/* Price + Thumbnail row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* Price */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="price">
                  <DollarSign size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                  Price (USD)
                </label>
                <input
                  id="price" name="price" type="number"
                  min="0" step="0.01" placeholder="0.00"
                  value={course.price}
                  onChange={handleCourseChange}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 2 }}>Set 0.00 for a free course</span>
              </div>

              {/* Thumbnail */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>
                  <ImageIcon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                  Thumbnail Image <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="file" accept="image/*" ref={thumbRef}
                  id="thumbnail-input" onChange={handleThumbnail}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => thumbRef.current.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background:   'var(--color-surface-2)',
                    border:       '1.5px dashed var(--color-border)',
                    borderRadius: '0.5rem',
                    padding:      '0.72rem 1rem',
                    color:        course.thumbnail ? 'var(--color-text)' : 'var(--color-muted)',
                    cursor:       'pointer',
                    width:        '100%',
                    fontSize:     '0.875rem',
                    overflow:     'hidden',
                    textAlign:    'left',
                  }}
                >
                  <Upload size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.thumbnail ? course.thumbnail.name : 'Choose image…'}
                  </span>
                </button>
              </div>
            </div>

            {/* Thumbnail preview */}
            {course.thumbnailPreview && (
              <div style={{ marginTop: '1.25rem', position: 'relative' }}>
                <img
                  src={course.thumbnailPreview}
                  alt="Thumbnail preview"
                  style={{
                    width: '100%', maxHeight: 220,
                    objectFit: 'cover',
                    borderRadius: '0.6rem',
                    border: '1px solid var(--color-border)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCourse(p => ({ ...p, thumbnail: null, thumbnailPreview: null }))}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.55)', border: 'none',
                    borderRadius: '50%', width: 28, height: 28,
                    color: '#fff', cursor: 'pointer', fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Remove thumbnail"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* ══ Section 2 — Lessons ═════════════════════ */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '1.5rem', paddingBottom: '1rem',
              borderBottom: '1px solid var(--color-border)',
              flexWrap: 'wrap', gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div className="icon-circle" style={{ width: 38, height: 38, borderRadius: '10px', margin: 0 }}>
                  <BookOpen size={18} color="var(--color-highlight)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Lessons</h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', margin: 0 }}>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} · drag to reorder
                  </p>
                </div>
              </div>
              <button type="button" onClick={addLesson} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                <Plus size={14} /> Add Lesson
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {lessons.map((lesson, idx) => (
                <LessonCard
                  key={lesson._id}
                  lesson={lesson}
                  index={idx}
                  total={lessons.length}
                  onChange={handleLessonChange}
                  onVideoChange={handleLessonVideo}
                  onRemove={removeLesson}
                  onMove={moveLesson}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addLesson}
              style={{
                marginTop: '1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background:   'transparent',
                border:       '1.5px dashed var(--color-border)',
                borderRadius: '0.75rem',
                padding:      '0.85rem',
                color:        'var(--color-muted)',
                cursor:       'pointer',
                width:        '100%',
                fontSize:     '0.875rem',
                transition:   'all 0.2s',
              }}
            >
              <Plus size={15} /> Add another lesson
            </button>
          </div>

          {/* ══ Progress + Submit ═══════════════════════ */}
          {progress && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="spinner" style={{ width: 16, height: 16, margin: 0, flexShrink: 0 }} />
              {progress}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}
            >
              {submitting ? 'Publishing…' : '🚀 Publish Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
