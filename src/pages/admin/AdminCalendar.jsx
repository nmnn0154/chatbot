import { useState, useEffect } from 'react';
import {
  getAllEvents, createEvent, updateEvent, deleteEvent,
  EVENT_CATEGORIES, BORROWER_TYPES,
} from '../../lib/calendarApi';
import {
  CalendarDays, Plus, Edit2, Trash2, X, Check, AlertTriangle, EyeOff,
} from 'lucide-react';

const EMPTY = {
  title: '', description: '', category: 'เปิดรับสมัคร',
  academic_year: '', term: '', borrower_type: 'ทั้งหมด',
  start_date: '', end_date: '', is_published: true,
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setEvents(await getAllEvents());
    } catch (e) {
      showToast('โหลดข้อมูลไม่สำเร็จ: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openAdd() { setForm(EMPTY); setTarget(null); setMode('add'); }
  function openEdit(ev) {
    setForm({
      title: ev.title, description: ev.description || '', category: ev.category,
      academic_year: ev.academic_year || '', term: ev.term || '',
      borrower_type: ev.borrower_type, start_date: ev.start_date || '',
      end_date: ev.end_date || '', is_published: ev.is_published,
    });
    setTarget(ev);
    setMode('edit');
  }

  const setField = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) {
      showToast('กรุณากรอกหัวข้อและวันที่เริ่ม', 'error');
      return;
    }
    if (form.end_date && form.end_date < form.start_date) {
      showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม', 'error');
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim() || null,
      academic_year: form.academic_year.trim() || null,
      term: form.term.trim() || null,
      end_date: form.end_date || null,
    };
    try {
      if (mode === 'add') { await createEvent(payload); showToast('เพิ่มกำหนดการสำเร็จ'); }
      else { await updateEvent(target.id, payload); showToast('บันทึกการแก้ไขสำเร็จ'); }
      setMode(null);
      load();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteEvent(target.id);
      showToast('ลบกำหนดการสำเร็จ');
      setMode(null);
      load();
    } catch (err) {
      showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container animate-fade-in" id="admin-calendar-page">
      <div className="page-header">
        <h1>จัดการปฏิทินการดำเนินงาน</h1>
        <p>กำหนดการเปิด-ปิดรับสมัคร ส่งเอกสาร และทำสัญญา ที่แชทบอทและผู้ใช้จะเห็น</p>
      </div>

      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={openAdd} disabled={loading}>
          <Plus size={18} /> เพิ่มกำหนดการ
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={48} />
          <p>ยังไม่มีกำหนดการในระบบ</p>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={16} /> เพิ่มรายการแรก</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th style={{ width: '110px' }}>หมวด</th>
                <th style={{ width: '90px' }}>ผู้กู้</th>
                <th style={{ width: '170px' }}>ช่วงวันที่</th>
                <th style={{ width: '90px' }}>สถานะ</th>
                <th style={{ width: '90px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{ev.title}</div>
                    {ev.term && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        ภาคเรียนที่ {ev.term}{ev.academic_year ? `/${ev.academic_year}` : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{ev.category}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{ev.borrower_type}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{fmt(ev.start_date)} – {fmt(ev.end_date)}</td>
                  <td>
                    {ev.is_published
                      ? <span style={{ color: 'var(--color-success, #10b981)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>เผยแพร่</span>
                      : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><EyeOff size={12} /> ซ่อน</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(ev)} title="แก้ไข">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setTarget(ev); setMode('delete'); }} title="ลบ" style={{ color: 'var(--color-brand-rose)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(mode === 'add' || mode === 'edit') && (
        <div className="modal-backdrop" onClick={() => !submitting && setMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{mode === 'add' ? 'เพิ่มกำหนดการ' : 'แก้ไขกำหนดการ'}</h2>
              {!submitting && <button className="btn btn-ghost btn-icon" onClick={() => setMode(null)}><X size={20} /></button>}
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">หัวข้อ *</label>
                  <input className="input" value={form.title} onChange={setField('title')} required placeholder="เช่น เปิดระบบยื่นกู้ ภาคเรียนที่ 1/2568 (รายเก่า)" />
                </div>
                <div className="form-group">
                  <label className="form-label">รายละเอียด</label>
                  <textarea className="input" rows={3} value={form.description} onChange={setField('description')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">หมวด</label>
                    <select className="input" value={form.category} onChange={setField('category')}>
                      {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ประเภทผู้กู้</label>
                    <select className="input" value={form.borrower_type} onChange={setField('borrower_type')}>
                      {BORROWER_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ปีการศึกษา</label>
                    <input className="input" value={form.academic_year} onChange={setField('academic_year')} placeholder="2568" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ภาคเรียน</label>
                    <input className="input" value={form.term} onChange={setField('term')} placeholder="1 / 2 / ฤดูร้อน" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันที่เริ่ม *</label>
                    <input type="date" className="input" value={form.start_date} onChange={setField('start_date')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันที่สิ้นสุด</label>
                    <input type="date" className="input" value={form.end_date} onChange={setField('end_date')} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={form.is_published} onChange={setField('is_published')} />
                  เผยแพร่ให้ผู้ใช้และแชทบอทเห็น
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setMode(null)} disabled={submitting}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mode === 'delete' && (
        <div className="modal-backdrop" onClick={() => !submitting && setMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <div className="confirm-icon"><AlertTriangle size={28} /></div>
              <h3>ยืนยันการลบกำหนดการ</h3>
              <p>ต้องการลบ "{target?.title}" หรือไม่? การกระทำนี้ย้อนกลับไม่ได้</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setMode(null)} disabled={submitting}>ยกเลิก</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}><Trash2 size={16} /> ลบ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
