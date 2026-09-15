import { useState, useEffect } from 'react';
import {
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
  resetKnowledgeToDefault,
} from '../../lib/knowledgeApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Coins,
  Percent,
  Smartphone,
  PhoneCall,
  Clock,
  Layers,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'eligibility', label: 'คุณสมบัติผู้กู้' },
  { id: 'documents', label: 'เอกสารที่ต้องใช้' },
  { id: 'process', label: 'ขั้นตอนการกู้ยืม' },
  { id: 'amounts', label: 'วงเงินกู้ยืม' },
  { id: 'repayment', label: 'การชำระหนี้คืน' },
  { id: 'default', label: 'การผิดนัด/ผ่อนปรน' },
  { id: 'app', label: 'แอป กยศ. Connect' },
  { id: 'contact', label: 'ช่องทางติดต่อ' },
  { id: 'general', label: 'ทั่วไป/อื่นๆ' },
];

export default function AdminKnowledge() {
  const { profile } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState(null);

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | 'reset' | null
  const [targetArticle, setTargetArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'eligibility',
    badge: 'คุณสมบัติ',
    summary: '',
    highlight: '',
    promptSuggestion: '',
    detailsText: '',
  });

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    setLoading(true);
    try {
      const data = await getKnowledgeArticles();
      setArticles(data || []);
    } catch (err) {
      console.error('Error loading articles:', err);
      showToast('ไม่สามารถโหลดข้อมูลองค์ความรู้ได้', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const filteredArticles = articles.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchQ =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  function openAddModal() {
    setFormData({
      title: '',
      subtitle: '',
      category: 'eligibility',
      badge: 'คุณสมบัติ',
      summary: '',
      highlight: '',
      promptSuggestion: '',
      detailsText: '',
    });
    setTargetArticle(null);
    setModalMode('add');
  }

  function openEditModal(article) {
    let detailsStr = '';
    if (article.details && Array.isArray(article.details)) {
      detailsStr = article.details
        .map((d) => `### ${d.heading}\n${d.points.map((p) => `- ${p}`).join('\n')}`)
        .join('\n\n');
    } else if (article.steps && Array.isArray(article.steps)) {
      detailsStr = article.steps
        .map((s) => `${s.step}. **${s.title}**: ${s.desc}`)
        .join('\n');
    }

    setFormData({
      title: article.title || '',
      subtitle: article.subtitle || '',
      category: article.category || 'general',
      badge: article.badge || 'ทั่วไป',
      summary: article.summary || '',
      highlight: article.highlight || '',
      promptSuggestion: article.promptSuggestion || '',
      detailsText: detailsStr,
    });
    setTargetArticle(article);
    setModalMode('edit');
  }

  function openDeleteModal(article) {
    setTargetArticle(article);
    setModalMode('delete');
  }

  function openResetModal() {
    setModalMode('reset');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim()) {
      showToast('กรุณากรอกหัวข้อและคำอธิบายสรุป', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Parse detailsText into sections
      const sections = [];
      const lines = formData.detailsText.split('\n');
      let currentSection = { heading: 'รายละเอียด', points: [] };

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          if (currentSection.points.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { heading: trimmed.replace(/^#+\s*/, ''), points: [] };
        } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          const pt = trimmed.replace(/^[-*•]\s*/, '');
          if (pt) currentSection.points.push(pt);
        } else if (trimmed) {
          currentSection.points.push(trimmed);
        }
      });
      if (currentSection.points.length > 0) {
        sections.push(currentSection);
      }

      const articlePayload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        category: formData.category,
        badge: formData.badge.trim() || 'กยศ.',
        summary: formData.summary.trim(),
        highlight: formData.highlight.trim(),
        promptSuggestion: formData.promptSuggestion.trim() || formData.title.trim(),
        details: sections.length > 0 ? sections : [{ heading: 'รายละเอียด', points: [formData.summary] }],
      };

      if (modalMode === 'add') {
        await createKnowledgeArticle(articlePayload);
        showToast('เพิ่มหัวข้อองค์ความรู้เรียบร้อยแล้ว');
      } else if (modalMode === 'edit') {
        await updateKnowledgeArticle(targetArticle.id, articlePayload);
        showToast('บันทึกการแก้ไขเรียบร้อยแล้ว');
      }

      setModalMode(null);
      await loadArticles();
    } catch (err) {
      console.error('Error saving article:', err);
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!targetArticle) return;
    setSubmitting(true);
    try {
      await deleteKnowledgeArticle(targetArticle.id);
      showToast('ลบหัวข้อองค์ความรู้สำเร็จ');
      setModalMode(null);
      await loadArticles();
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetDefault() {
    setSubmitting(true);
    try {
      await resetKnowledgeToDefault();
      showToast('รีเซ็ตเป็นข้อมูลมาตรฐาน 8 หมวดหมู่เรียบร้อย');
      setModalMode(null);
      await loadArticles();
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container animate-fade-in" id="admin-knowledge-page" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Toast Alert ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
          }}
        >
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            <Layers size={14} /> ระบบจัดการเนื้อหา
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
            จัดการองค์ความรู้ กยศ.
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            เพิ่ม ลบ แก้ไขบทความและสาระน่ารู้ กยศ. ที่แสดงผลบนหน้าเว็บไซต์และส่งเข้า AI
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={openResetModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="คืนค่าเป็นข้อมูลเริ่มต้น 8 หมวดหมู่"
          >
            <RotateCcw size={14} /> คืนค่าเริ่มต้น
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={openAddModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> เพิ่มองค์ความรู้ใหม่
          </button>
        </div>
      </div>

      {/* ── Search & Category Filter ── */}
      <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              className="input"
              placeholder="ค้นหาหัวข้อ หรือสรุปสาระสำคัญ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 38, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: 'var(--space-sm)', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: selectedCategory === cat.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Knowledge Articles List ── */}
      {loading ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="spinner"></div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="card empty-state" style={{ padding: 'var(--space-2xl)' }}>
          <BookOpen size={40} style={{ color: 'var(--color-text-muted)' }} />
          <h3>ไม่พบรายการองค์ความรู้</h3>
          <p>ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "เพิ่มองค์ความรู้ใหม่"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {filteredArticles.map((article, idx) => (
            <div
              key={article.id || idx}
              className="card card-glow"
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              {/* Left Details */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', flex: '1 1 340px' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <BookOpen size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                      {article.badge || 'กยศ.'}
                    </span>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                      {article.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
                    {article.subtitle}
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.summary}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => openEditModal(article)}
                  title="แก้ไขข้อมูล"
                  aria-label="แก้ไข"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => openDeleteModal(article)}
                  style={{ color: '#ef4444' }}
                  title="ลบหัวข้อนี้"
                  aria-label="ลบ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, width: '95%', maxHeight: '90vh' }}
          >
            <div className="modal-header">
              <h2>
                {modalMode === 'add' ? 'เพิ่มหัวข้อองค์ความรู้ใหม่' : 'แก้ไของค์ความรู้'}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalMode(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">หัวข้อหลัก *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="เช่น คุณสมบัติผู้กู้ยืมเงิน กยศ."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">หมวดหมู่</label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ป้ายกำกับ (Badge)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="เช่น คุณสมบัติ, เอกสาร, วงเงิน"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">คำอธิบายย่อย (Subtitle)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="เช่น เกณฑ์พื้นฐานของผู้มีสิทธิ์ยื่นกู้ยืมเพื่อการศึกษา"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">สรุปสาระสำคัญ (Summary) *</label>
                  <textarea
                    className="input"
                    rows={2}
                    required
                    placeholder="ข้อความสรุปสั้นๆ ที่แสดงบนการ์ด..."
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    รายละเอียดเนื้อหา (ข้อความหรือข้อย่อย)
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 8 }}>
                      (พิมพ์ขึ้นบรรทัดใหม่ด้วย - หรือ ### เพื่อแบ่งหัวข้อย่อย)
                    </span>
                  </label>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder={`### คุณสมบัติหลัก\n- สัญชาติไทย\n- รายได้ไม่เกิน 360,000 บ./ปี\n\n### เอกสารที่ใช้\n- บัตรประชาชน\n- ทะเบียนบ้าน`}
                    value={formData.detailsText}
                    onChange={(e) => setFormData({ ...formData, detailsText: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ข้อความเน้นย้ำ / หมายเหตุสำคัญ (Highlight)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="เช่น 💡 หมายเหตุ: ตั้งแต่ปี 2567 ยกเลิกผู้ค้ำประกันแล้ว"
                    value={formData.highlight}
                    onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">คำถามแนะนำสำหรับ AI (Prompt Suggestion)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="เช่น ตรวจสอบคุณสมบัติการกู้ยืม กยศ. ปริญญาตรี"
                    value={formData.promptSuggestion}
                    onChange={(e) => setFormData({ ...formData, promptSuggestion: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalMode(null)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {modalMode === 'delete' && targetArticle && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '95%' }}>
            <div className="modal-header">
              <h2 style={{ color: '#ef4444' }}>
                ยืนยันการลบองค์ความรู้
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalMode(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบหัวข้อ <strong>"{targetArticle.title}"</strong> ออกจากระบบ?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalMode(null)}>
                ยกเลิก
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'กำลังลบ...' : 'ลบรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Default Confirmation Modal ── */}
      {modalMode === 'reset' && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, width: '95%' }}>
            <div className="modal-header">
              <h2>
                คืนค่าเป็นข้อมูลเริ่มต้น 8 หมวดหมู่
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalMode(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                การดำเนินการนี้จะโหลดข้อมูลมาตรฐานของ กยศ. ทั้ง 8 หมวดหมู่ (คุณสมบัติ, เอกสาร, ขั้นตอน, วงเงิน, ชำระหนี้ ฯลฯ) ทับข้อมูลปัจจุบัน
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalMode(null)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={handleResetDefault} disabled={submitting}>
                {submitting ? 'กำลังรีเซ็ต...' : 'ยืนยันคืนค่าเริ่มต้น'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
