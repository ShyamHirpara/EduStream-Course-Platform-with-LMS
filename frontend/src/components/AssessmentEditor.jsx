import { useState } from 'react';
import { ClipboardList, Trash2, X, Plus, PlusCircle } from 'lucide-react';

const iconBtn = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '0.35rem', padding: '0.3rem 0.45rem', cursor: 'pointer',
  color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};

export default function AssessmentEditor({ questions = [], onChange }) {
  const [open, setOpen] = useState(questions.length > 0);

  const addQ    = () => onChange([...questions, { _key: Math.random(), text: '', choices: [{ _key: Math.random(), text: '', is_correct: false }] }]);
  const removeQ = k => onChange(questions.filter(q => q._key !== k));

  const updateQ  = (k, val)      => onChange(questions.map(q => q._key === k ? { ...q, text: val } : q));
  const addC     = k             => onChange(questions.map(q => q._key === k ? { ...q, choices: [...q.choices, { _key: Math.random(), text: '', is_correct: false }] } : q));
  const removeC  = (qk, ck)      => onChange(questions.map(q => q._key === qk ? { ...q, choices: q.choices.filter(c => c._key !== ck) } : q));
  const updateC  = (qk, ck, val) => onChange(questions.map(q => q._key === qk ? { ...q, choices: q.choices.map(c => c._key === ck ? { ...c, text: val } : c) } : q));
  const setCorr  = (qk, ck)      => onChange(questions.map(q => q._key === qk ? { ...q, choices: q.choices.map(c => ({ ...c, is_correct: c._key === ck })) } : q));

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--color-border)', paddingTop: '1rem' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: 0 }}>
        <ClipboardList size={13} />
        {open ? 'Hide' : 'Add/Edit'} Assessment (optional)
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem' }}>
          {questions.map((q, qi) => (
            <div key={q._key} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.6rem', padding: '0.9rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input value={q.text} onChange={e => updateQ(q._key, e.target.value)}
                  placeholder={`Question ${qi + 1}`}
                  style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem', color: 'var(--color-text)', fontSize: '0.85rem' }} />
                <button type="button" onClick={() => removeQ(q._key)} style={{ ...iconBtn, color: '#ef4444' }}><Trash2 size={13} /></button>
              </div>
              {q.choices.map((c, ci) => (
                <div key={c._key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', paddingLeft: '0.5rem' }}>
                  <input type="radio" name={`correct-${q._key}`} checked={c.is_correct}
                    onChange={() => setCorr(q._key, c._key)}
                    title="Mark as correct" style={{ accentColor: '#10b981', flexShrink: 0 }} />
                  <input value={c.text} onChange={e => updateC(q._key, c._key, e.target.value)}
                    placeholder={`Choice ${ci + 1}`}
                    style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '0.35rem', padding: '0.35rem 0.6rem', color: 'var(--color-text)', fontSize: '0.82rem' }} />
                  <button type="button" onClick={() => removeC(q._key, c._key)} style={{ ...iconBtn, padding: '0.2rem 0.3rem' }}><X size={11} /></button>
                </div>
              ))}
              <button type="button" onClick={() => addC(q._key)}
                style={{ marginTop: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 3, paddingLeft: '0.5rem' }}>
                <Plus size={11} /> Add choice
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={addQ} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
              <PlusCircle size={12} /> Add Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
