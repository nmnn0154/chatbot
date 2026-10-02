import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Search,
  AlertCircle,
  FileCheck,
  MessageSquare,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getPublishedDocuments,
  DOCUMENT_CATEGORIES,
  downloadDocumentFile,
} from '../lib/documentApi';
import { showSuccess } from '../lib/swalHelper';
import DocumentSampleViewer from '../components/DocumentSampleViewer';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const data = await getPublishedDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat =
        selectedCategory === 'ทั้งหมด' || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q) ||
        doc.category?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [documents, selectedCategory, searchQuery]);

  const handleDownload = (e, doc) => {
    e.stopPropagation();
    if (!doc.file_url) return;
    const success = downloadDocumentFile(doc);
    if (success) {
      showSuccess('เริ่มดาวน์โหลดไฟล์แล้ว', doc.title || 'เอกสาร กยศ.', 1500);
      // Optimistically update local download count
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, download_count: (d.download_count || 0) + 1 } : d
        )
      );
    }
  };

  return (
    <div className="page-container animate-fade-in" id="documents-page">
      {/* ── Page Header ── */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
            >
              <FileCheck size={14} /> เอกสารทางการ กยศ.
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              มทร.ศรีวิชัย
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0 }}>
            ตัวอย่างเอกสาร & แบบฟอร์มดาวน์โหลด
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: 'var(--text-sm)' }}>
            ศูนย์รวมตัวอย่างการกรอกเอกสาร ข้อควรระวัง และแบบฟอร์มเปล่าสำหรับนำไปใช้งานจริง
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/knowledge" className="btn btn-secondary" style={{ gap: '6px' }}>
            <BookOpen size={16} />
            <span className="hidden-mobile">องค์ความรู้ กยศ.</span>
          </Link>
          <Link to="/chat" className="btn btn-primary" style={{ gap: '6px' }}>
            <MessageSquare size={16} />
            <span>ถามแชทบอท</span>
          </Link>
        </div>
      </div>

      {/* ── Highlights / Notice Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          color: '#ffffff',
          marginBottom: 'var(--space-xl)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} style={{ color: '#93c5fd' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              ข้อแนะนำก่อนนำเอกสารไปยื่นที่กองพัฒนานักศึกษา อาคาร 7
            </h3>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: '#e0e7ff', margin: 0, lineHeight: 1.6 }}>
            โปรดศึกษา **ตัวอย่างการกรอกเอกสาร** ก่อนพิมพ์ฉบับจริง เพื่อตรวจสอบจุดลงนามผู้มีอำนาจรับรองรายได้
            การใช้ปากกาสีน้ำเงิน และข้อห้ามใช้น้ำยาลบคำผิด เพื่อความรวดเร็วในการตรวจรับเอกสาร
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{documents.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#e0e7ff' }}>แบบฟอร์มพร้อมใช้</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '38px', borderRadius: 'var(--radius-full)' }}
              placeholder="ค้นหาชื่อเอกสาร เช่น กยศ.102, จิตอาสา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px',
                  fontSize: '0.75rem',
                }}
              >
                ล้าง
              </button>
            )}
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            พบแบบฟอร์ม <strong>{filteredDocs.length}</strong> รายการ
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {DOCUMENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  padding: '0.4rem 0.9rem',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Document Grid ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: 'var(--space-3xl) var(--space-xl)',
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FileText size={48} style={{ opacity: 0.4 }} />
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', margin: 0 }}>
            ไม่พบเอกสารที่ค้นหา
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
            ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาเอกสารที่ต้องการ
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ทั้งหมด');
            }}
          >
            แสดงเอกสารทั้งหมด
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="card card-glow"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Top Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {doc.category}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {(() => {
                    const pCount = Array.isArray(doc.preview_images) && doc.preview_images.length > 0
                      ? doc.preview_images.length
                      : (doc.preview_image_url ? 1 : 0);
                    if (pCount > 1) {
                      return (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title={`มีตัวอย่างการกรอก ${pCount} หน้า`}
                        >
                          <ImageIcon size={11} />
                          {pCount} ภาพ
                        </span>
                      );
                    }
                    if (pCount === 1) {
                      return (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: '#ecfdf5',
                            color: '#059669',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="มีรูปภาพตัวอย่างการกรอก"
                        >
                          <ImageIcon size={11} />
                          มีรูป
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {doc.file_url ? (
                    <>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#fee2e2',
                          color: '#b91c1c',
                        }}
                      >
                        {doc.file_type || 'PDF'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {doc.file_size || ''}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-muted)',
                        border: '1px dashed var(--color-border)',
                      }}
                    >
                      เฉพาะตัวอย่าง
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.4,
                }}
              >
                {doc.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '1rem',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {doc.description || 'แบบฟอร์มเอกสารทางการสำหรับการดำเนินงานกองทุน กยศ. มทร.ศรีวิชัย'}
              </p>

              {/* Key guideline preview */}
              <div
                style={{
                  background: 'var(--color-bg-primary)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <AlertCircle size={14} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ปากกาน้ำเงิน • ห้ามใช้น้ำยาลบคำผิด • แนบหลักฐานครบ
                </span>
              </div>

              {/* Bottom metadata & Action buttons */}
              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {doc.file_url ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={12} /> ดาวน์โหลดแล้ว {(doc.download_count || 0).toLocaleString()} ครั้ง
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      ดูแนวทางการกรอก
                    </span>
                  )}
                  <span>มทร.ศรีวิชัย</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: doc.file_url ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn ${doc.file_url ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    onClick={() => setPreviewDoc(doc)}
                    style={{ fontSize: 'var(--text-xs)', gap: '4px', justifyContent: 'center' }}
                  >
                    <Eye size={14} />
                    ดูตัวอย่างการกรอก
                  </button>
                  {doc.file_url && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={(e) => handleDownload(e, doc)}
                      style={{ fontSize: 'var(--text-xs)', gap: '4px', justifyContent: 'center' }}
                    >
                      <Download size={14} />
                      โหลดไฟล์จริง
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Document Sample & Guide Viewer Modal ── */}
      {previewDoc && (
        <DocumentSampleViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
