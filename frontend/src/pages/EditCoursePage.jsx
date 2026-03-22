import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, ArrowLeft, Upload,
  Video, ImageIcon, DollarSign, FileText,
  GraduationCap, ChevronUp, ChevronDown, CheckCircle,
} from 'lucide-react';
import api from '../api/axios';
import AssessmentEditor from '../components/AssessmentEditor';

const TA = (extra = {}) => ({
  background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)',
  borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--color-text)',
  fontSize: '0.92rem', width: '100%', resize: 'vertical', fontFamily: 'inherit',
  lineHeight: 1.65, ...extra,
});


/* ── Lesson card ─────────────────────────────────────────────────────────── */
const iconBtn = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '0.35rem', padding: '0.3rem 0.45rem', cursor: 'pointer',
  color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};

function LessonCard({ lesson, index, total, courseId, onChange, onVideoChange, onRemove, onMove }) {
  const videoRef = useRef();
  const hasId    = Boolean(lesson.id);
  return (
    <div style={{ background: 'var(--color-surface-2)', borderRadius: '0.875rem', border: '1px solid var(--color-border)', padding: '1.35rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-accent)' }}>
          Lesson {index + 1} {hasId && <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 400 }}>(existing)</span>}
        </span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button type="button" onClick={() => onMove(lesson._key, -1)} disabled={index === 0} style={iconBtn}><ChevronUp size={14} /></button>
          <button type="button" onClick={() => onMove(lesson._key, 1)} disabled={index === total - 1} style={iconBtn}><ChevronDown size={14} /></button>
          <button type="button" onClick={() => onRemove(lesson._key)} disabled={total === 1} style={{ ...iconBtn, color: '#ef4444' }}><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="form-group">
        <label>Lesson Title *</label>
        <input type="text" placeholder="e.g. Introduction to Variables"
          value={lesson.title} onChange={e => onChange(lesson._key, 'title', e.target.value)} required />
      </div>

      <div className="form-group">
        <label><FileText size={12} style={{ display: 'inline', marginRight: 3 }} /> Content</label>
        <textarea placeholder="Lesson text content…" value={lesson.content}
          onChange={e => onChange(lesson._key, 'content', e.target.value)} rows={4} style={TA({ background: 'var(--color-surface)' })} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label><Video size={12} style={{ display: 'inline', marginRight: 3 }} />
          Video <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional — replace by uploading new)</span>
        </label>
        <input type="file" accept="video/*" ref={videoRef} onChange={e => onVideoChange(lesson._key, e)} style={{ display: 'none' }} />
        <button type="button" onClick={() => videoRef.current.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)', borderRadius: '0.5rem', padding: '0.7rem 1rem', color: 'var(--color-muted)', cursor: 'pointer', width: '100%', fontSize: '0.875rem', textAlign: 'left' }}>
          <Upload size={14} />
          {lesson.videoName || (lesson.video_url ? '📹 Has video (upload to replace)' : 'Choose video…')}
        </button>
      </div>

      <AssessmentEditor
        questions={lesson.assessmentQuestions || []}
        onChange={data => onChange(lesson._key, 'assessmentQuestions', data)}
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function EditCoursePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const thumbRef = useRef();

  const [course,    setCourse]    = useState({ title: '', description: '', price: '0.00', thumbnail: null, thumbnailPreview: null });
  const [lessons,   setLessons]   = useState([]);
  const [deleted,   setDeleted]   = useState([]);   // lesson IDs to DELETE
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [progress,  setProgress]  = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  /* prefill */
  useEffect(() => {
    api.get(`/courses/${id}/`).then(({ data }) => {
      setCourse({ title: data.title, description: data.description, price: String(data.price), thumbnail: null, thumbnailPreview: data.thumbnail_url });
      setLessons((data.lessons || []).map(l => ({
        _key: Math.random(), id: l.id, title: l.title, content: l.content || '',
        video: null, videoName: '', video_url: l.video_url || '', order: l.order,
        assessmentQuestions: l.assessment?.questions?.map(q => ({
          _key: Math.random(), text: q.text,
          choices: q.choices.map(c => ({ _key: Math.random(), text: c.text, is_correct: c.is_correct }))
        })) || [],
      })));
    }).finally(() => setLoading(false));
  }, [id]);

  const handleCourse  = e => setCourse(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleThumb   = e => { const f = e.target.files[0]; if (f) setCourse(p => ({ ...p, thumbnail: f, thumbnailPreview: URL.createObjectURL(f) })); };
  const handleLesson  = (k, field, val) => setLessons(p => p.map(l => l._key === k ? { ...l, [field]: val } : l));
  const handleVideo   = (k, e) => { const f = e.target.files[0]; if (f) setLessons(p => p.map(l => l._key === k ? { ...l, video: f, videoName: f.name } : l)); };
  const addLesson     = () => setLessons(p => [...p, { _key: Math.random(), id: null, title: '', content: '', video: null, videoName: '', video_url: '' }]);
  const removeLesson  = k => { const l = lessons.find(l => l._key === k); if (l?.id) setDeleted(p => [...p, l.id]); setLessons(p => p.filter(l => l._key !== k)); };
  const moveLesson    = (k, d) => setLessons(p => { const i = p.findIndex(l => l._key === k); const a = [...p]; const s = i + d; if (s < 0 || s >= a.length) return p; [a[i], a[s]] = [a[s], a[i]]; return a; });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      /* 1. patch course */
      setProgress('Updating course…');
      const cf = new FormData();
      cf.append('title', course.title); cf.append('description', course.description); cf.append('price', course.price);
      if (course.thumbnail) cf.append('thumbnail', course.thumbnail);
      await api.patch(`/courses/${id}/`, cf, { headers: { 'Content-Type': 'multipart/form-data' } });

      /* 2. delete removed lessons */
      for (const lid of deleted) {
        await api.delete(`/courses/${id}/lessons/${lid}/`);
      }

      /* 3. create / update lessons */
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i]; setProgress(`Saving lesson ${i + 1}/${lessons.length}…`);
        const lf = new FormData();
        lf.append('title', l.title); lf.append('content', l.content); lf.append('order', i + 1);
        if (l.video) lf.append('video', l.video);
        let savedLessonId = l.id;
        if (l.id) {
          await api.patch(`/courses/${id}/lessons/${l.id}/`, lf, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          const res = await api.post(`/courses/${id}/lessons/`, lf, { headers: { 'Content-Type': 'multipart/form-data' } });
          savedLessonId = res.data.id;
        }

        if (Array.isArray(l.assessmentQuestions)) {
          await api.post(`/courses/${id}/lessons/${savedLessonId}/assessment/`, { questions: l.assessmentQuestions });
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ') : 'Update failed.');
    } finally { setSubmitting(false); setProgress(''); }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (success) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 400 }}>
        <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
        <h2>Course Updated!</h2><p style={{ color: 'var(--color-muted)' }}>Redirecting…</p>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: '2rem' }}>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Edit Course</h1>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>Update your course content and lessons.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Course details card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div className="icon-circle" style={{ width: 38, height: 38, borderRadius: 10, margin: 0 }}><GraduationCap size={18} color="var(--color-highlight)" /></div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Course Details</h2>
            </div>
            <div className="form-group">
              <label>Course Title *</label>
              <input name="title" value={course.title} onChange={handleCourse} required />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={course.description} onChange={handleCourse} rows={4} required style={TA()} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><DollarSign size={12} style={{ display: 'inline', marginRight: 3 }} /> Price (USD)</label>
                <input name="price" type="number" min="0" step="0.01" value={course.price} onChange={handleCourse} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><ImageIcon size={12} style={{ display: 'inline', marginRight: 3 }} /> Thumbnail</label>
                <input type="file" accept="image/*" ref={thumbRef} onChange={handleThumb} style={{ display: 'none' }} />
                <button type="button" onClick={() => thumbRef.current.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-2)', border: '1.5px dashed var(--color-border)', borderRadius: '0.5rem', padding: '0.72rem 1rem', color: 'var(--color-muted)', cursor: 'pointer', width: '100%', fontSize: '0.875rem' }}>
                  <Upload size={14} /> {course.thumbnail ? course.thumbnail.name : 'Replace thumbnail…'}
                </button>
              </div>
            </div>
            {course.thumbnailPreview && (
              <img src={course.thumbnailPreview} alt="preview" style={{ marginTop: '1rem', width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: '0.6rem', border: '1px solid var(--color-border)' }} />
            )}
          </div>

          {/* Lessons card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div className="icon-circle" style={{ width: 38, height: 38, borderRadius: 10, margin: 0 }}><BookOpen size={18} color="var(--color-highlight)" /></div>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Lessons ({lessons.length})</h2>
              </div>
              <button type="button" onClick={addLesson} className="btn btn-outline" style={{ fontSize: '0.85rem' }}><Plus size={14} /> Add Lesson</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {lessons.map((l, i) => (
                <LessonCard key={l._key} lesson={l} index={i} total={lessons.length}
                  courseId={id} onChange={handleLesson} onVideoChange={handleVideo}
                  onRemove={removeLesson} onMove={moveLesson} />
              ))}
            </div>
          </div>

          {progress && <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />{progress}</div>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-outline" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}>
              {submitting ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
