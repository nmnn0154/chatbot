import { useState, useMemo } from 'react';
import {
  X,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { downloadDocumentFile } from '../lib/documentApi';

export default function DocumentSampleViewer({ document: doc, onClose }) {
  const [activeTab, setActiveTab] = useState('sample'); // 'sample' | 'guide'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const previewImages = useMemo(() => {
    if (!doc) return [];
    if (Array.isArray(doc.preview_images) && doc.preview_images.length > 0) {
      return doc.preview_images.filter(Boolean);
    }
    if (doc.preview_image_url) {
      return [doc.preview_image_url];
    }
    return [];
  }, [doc]);

  if (!doc) return null;

  const handleDownload = () => {
    if (!doc?.file_url) return;
    downloadDocumentFile(doc);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 'var(--z-modal)' }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {doc.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {doc.file_url 
                    ? `${doc.file_type || 'PDF'} • ${doc.file_size || ''}`
                    : 'เฉพาะตัวอย่างการกรอก (ไม่มีไฟล์ดาวน์โหลด)'}
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  margin: '2px 0 0',
                  color: 'var(--color-text-primary)',
                }}
              >
                {doc.title}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="พิมพ์ตัวอย่างเอกสาร"
            >
              <Printer size={16} />
              <span className="hidden-mobile">พิมพ์</span>
            </button>
            {doc.file_url && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDownload}
                style={{ gap: '6px' }}
              >
                <Download size={16} />
                <span>ดาวน์โหลดเอกสารจริง</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            padding: '0.5rem 1.5rem',
            background: 'var(--color-bg-tertiary)',
            borderBottom: '1px solid var(--color-border)',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'sample' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('sample')}
            style={{ borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}
          >
            <Sparkles size={14} />
            ตัวอย่างการกรอกเอกสาร
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'guide' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('guide')}
            style={{ borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}
          >
            <AlertCircle size={14} />
            ข้อแนะนำ & จุดที่ต้องระวัง
          </button>
        </div>

        {/* Modal Body / Viewer */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: '#e2e8f0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {activeTab === 'sample' ? (
            <div style={{ width: '100%', maxWidth: '820px' }}>
              {previewImages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Gallery Navigation Bar (when multiple images exist) */}
                  {previewImages.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))}
                          disabled={currentImageIndex === 0}
                          style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                        >
                          <ChevronLeft size={16} /> ก่อนหน้า
                        </button>

                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '0 6px', color: 'var(--color-text-primary)' }}>
                          หน้า {currentImageIndex + 1} / {previewImages.length}
                        </span>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCurrentImageIndex((prev) => Math.min(previewImages.length - 1, prev + 1))}
                          disabled={currentImageIndex === previewImages.length - 1}
                          style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                        >
                          ถัดไป <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Quick Page Jump Pills */}
                      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                        {previewImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              border: currentImageIndex === idx ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                              background: currentImageIndex === idx ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                              color: currentImageIndex === idx ? '#ffffff' : 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            หน้า {idx + 1}
                          </button>
                        ))}
                      </div>

                      {/* View original full resolution */}
                      <a
                        href={previewImages[currentImageIndex]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 'var(--text-xs)', gap: '4px', textDecoration: 'none' }}
                        title="เปิดรูปภาพขนาดเต็มในแท็บใหม่"
                      >
                        <ExternalLink size={14} /> เปิดรูปขนาดเต็ม
                      </a>
                    </div>
                  )}

                  {/* Active Preview Image Display */}
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      textAlign: 'center',
                      minHeight: '400px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={previewImages[currentImageIndex]}
                      alt={`${doc.title} - ภาพที่ ${currentImageIndex + 1}`}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: '75vh',
                        borderRadius: '4px',
                        objectFit: 'contain',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    />
                  </div>

                  {/* Thumbnail Strip (when multiple images exist) */}
                  {previewImages.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        padding: '0.5rem',
                        background: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, paddingLeft: '4px', whiteSpace: 'nowrap' }}>
                        คลิกเพื่อดูหน้า:
                      </span>
                      {previewImages.map((url, idx) => {
                        const isCurrent = currentImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            style={{
                              border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              padding: 0,
                              background: '#f8fafc',
                              cursor: 'pointer',
                              transform: isCurrent ? 'scale(1.05)' : 'none',
                              boxShadow: isCurrent ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                              position: 'relative',
                            }}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              style={{ width: '56px', height: '70px', objectFit: 'cover', display: 'block' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: isCurrent ? 'var(--color-primary)' : 'rgba(0,0,0,0.6)',
                                color: '#ffffff',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                padding: '1px 0',
                              }}
                            >
                              หน้า {idx + 1}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <SampleDocumentPaper doc={doc} />
              )}
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                maxWidth: '780px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--color-warning-bg)',
                    color: 'var(--color-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                    คำแนะนำและข้อปฏิบัติสำคัญ
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                    ปฏิบัติตามคำแนะนำเพื่อป้องกันการถูกปฏิเสธหรือส่งเอกสารแก้ไขใหม่
                  </p>
                </div>
              </div>

              {/* Guide Content */}
              <div
                style={{
                  background: 'var(--color-bg-primary)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  lineHeight: '1.8',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {doc.guide_notes || 'ไม่มีข้อแนะนำเพิ่มเติมสำหรับเอกสารนี้'}
              </div>

              {/* Golden rules checklist */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
                  กฎเหล็ก 4 ข้อที่ห้ามลืม:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #2563eb' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> ปากกาสีน้ำเงินเท่านั้น
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      ห้ามใช้ปากกาดำหรือดินสอในการลงนาม
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #dc2626' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> ห้ามใช้น้ำยาลบคำผิด
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      ห้ามใช้น้ำยาลบหรือเทปลบคำผิดเด็ดขาด
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #059669' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> ลายเซ็นต้องเหมือนกัน
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      ลายเซ็นผู้กู้และผู้ปกครองต้องตรงกันทุกหน้า
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #d97706' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> สำเนาถูกต้อง
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      เอกสารแนบทุกแผ่นต้องเซ็นรับรองสำเนา
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--color-bg-secondary)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {doc.file_url
              ? '💡 ดาวน์โหลดแบบฟอร์มฉบับเต็มเพื่อนำไปพิมพ์และกรอกส่งกองพัฒนานักศึกษา อาคาร 7'
              : '📌 รายการนี้สำหรับดูตัวอย่างการกรอกและคำแนะนำเท่านั้น (ไม่มีไฟล์แบบฟอร์มสำหรับดาวน์โหลด)'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ปิด
            </button>
            {doc.file_url && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
                style={{ gap: '6px' }}
              >
                <Download size={16} />
                ดาวน์โหลดเอกสารจริง ({doc.file_size || ''})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Realistic Simulated Paper Document with interactive annotated callouts!
 */
function SampleDocumentPaper({ doc }) {
  const is102 = doc.sample_preview_type === 'form_102' || doc.id?.includes('102') || doc.title?.includes('102');
  const is103 = doc.sample_preview_type === 'form_103' || doc.id?.includes('103') || doc.title?.includes('103');
  const isVolunteer = doc.sample_preview_type === 'form_volunteer' || doc.category === 'จิตอาสา' || doc.title?.includes('จิตอาสา');

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        padding: '2.5rem 3rem',
        color: '#1e293b',
        fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
        lineHeight: 1.6,
        position: 'relative',
        fontSize: '0.85rem',
        border: '1px solid #cbd5e1',
      }}
    >
      {/* Sample Stamp watermark */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-25deg)',
          fontSize: '3.5rem',
          fontWeight: 900,
          color: 'rgba(239, 68, 68, 0.12)',
          border: '5px dashed rgba(239, 68, 68, 0.25)',
          padding: '0.5rem 2rem',
          borderRadius: '12px',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '6px',
        }}
      >
        ตัวอย่างการกรอก
      </div>

      {/* Official Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #334155', paddingBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '1px' }}>
          กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)
        </div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
          {doc.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#47546b' }}>
          มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย • งานแนะแนวและทุนการศึกษา
        </div>
      </div>

      {/* Simulated Form Body */}
      {is102 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', fontSize: '0.8rem' }}>
            เขียนที่: <span style={{ color: '#1d4ed8', fontWeight: 600, marginLeft: 4 }}>มทร.ศรีวิชัย สงขลา</span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            ข้าพเจ้า (ผู้รับรองรายได้):{' '}
            <span style={{ background: '#fef08a', padding: '2px 8px', borderRadius: 4, color: '#854d0e', fontWeight: 600 }}>
              นายสมชาย ใจดี
            </span>{' '}
            ตำแหน่ง:{' '}
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>ผู้ใหญ่บ้าน หมู่ที่ 3 / ข้าราชการระดับชำนาญการ</span>
          </div>

          <div style={{ marginBottom: '1rem', background: '#eff6ff', padding: '0.75rem', borderRadius: 6, border: '1px dashed #3b82f6' }}>
            <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700 }}>
              💡 จุดสำคัญ 1: ผู้รับรองต้องเป็นข้าราชการ C5 ขึ้นไป หรือ กำนัน/ผู้ใหญ่บ้าน
            </span>
            <div style={{ marginTop: '4px' }}>
              ขอรับรองว่า บิดา/มารดา/ผู้ปกครอง ของผู้ขอกู้ยืมเงิน มีรายได้รวมต่อปีประมาณ:{' '}
              <span style={{ background: '#fef08a', padding: '2px 8px', borderRadius: 4, color: '#854d0e', fontWeight: 700 }}>
                180,000 บาท / ปี
              </span>{' '}
              (ไม่เกิน 360,000 บาท/ปี)
            </div>
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: 1, padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fafafa' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                ตัวอย่างลายมือชื่อผู้กู้ยืม
              </div>
              <div style={{ color: '#1d4ed8', fontStyle: 'italic', fontSize: '1.1rem', margin: '8px 0' }}>
                สมศรี มีสุข
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>( นางสาวสมศรี มีสุข )</div>
              <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: 4 }}>✓ ใช้ปากกาน้ำเงินเท่านั้น</div>
            </div>

            <div style={{ flex: 1, padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fafafa' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                ตัวอย่างลายมือชื่อผู้รับรองรายได้
              </div>
              <div style={{ color: '#1d4ed8', fontStyle: 'italic', fontSize: '1.1rem', margin: '8px 0' }}>
                สมชาย ใจดี
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>( นายสมชาย ใจดี )</div>
              <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: 4 }}>
                ⚠️ แนบสำเนาบัตรข้าราชการ/เจ้าหน้าที่รัฐ
              </div>
            </div>
          </div>
        </div>
      ) : isVolunteer ? (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            ชื่อ-สกุล นักศึกษา:{' '}
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>นายกิตติคุณ มุ่งมั่น</span> รหัสนักศึกษา:{' '}
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>6710210001</span> สาขาวิชา:{' '}
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>วิศวกรรมคอมพิวเตอร์</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>วดป. ที่จัด</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>ชื่อโครงการ / กิจกรรมจิตอาสา</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>สถานที่</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>จำนวน ชม.</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>ลายเซ็นผู้รับรอง</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>15 มิ.ย. 68</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>โครงการบริจาคโลหิต กาชาด มทร.ศรีวิชัย</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>อาคาร 7</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>6 ชม.</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#1d4ed8' }}>สมพร (พยาบาล)</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>22 มิ.ย. 68</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>บำเพ็ญประโยชน์ ทำความสะอาดวัดแหลมทราย</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>วัดแหลมทราย สงขลา</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>6 ชม.</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#1d4ed8' }}>พระครูปลัดฯ</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: 6, border: '1px dashed #d97706', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#92400e' }}>📌 หมายเหตุ:</span> นักศึกษาต้องสะสมชั่วโมงรวมให้ครบอย่างน้อย 36 ชั่วโมงต่อปีการศึกษา และแนบภาพถ่ายกิจกรรมด้านหลัง
          </div>
        </div>
      ) : is103 ? (
        <div>
          <div style={{ marginBottom: '1rem', background: '#eff6ff', padding: '0.75rem', borderRadius: 6, border: '1px dashed #3b82f6', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#1e40af' }}>💡 จุดสำคัญ:</span> บิดา มารดา หรือผู้ปกครองต้องเป็นผู้ลงลายมือชื่อด้วยตนเอง ห้ามเซ็นแทน
          </div>

          <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: 6, background: '#fafafa', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
              ส่วนที่ 1: ข้อมูลผู้ให้ความยินยอมเปิดเผยข้อมูล
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div>ชื่อ-สกุล: <span style={{ color: '#1d4ed8', fontWeight: 600 }}>นายสมศักดิ์ มีสุข (บิดา)</span></div>
              <div>เลขบัตรประชาชน: <span style={{ color: '#1d4ed8', fontWeight: 600 }}>3-9098-00123-45-6</span></div>
              <div>เบอร์โทรศัพท์: <span style={{ color: '#1d4ed8', fontWeight: 600 }}>089-111-2233</span></div>
              <div>ความสัมพันธ์: <span style={{ color: '#1d4ed8', fontWeight: 600 }}>บิดาโดยชอบด้วยกฎหมาย</span></div>
            </div>
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: 1, padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fafafa' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                ลายมือชื่อผู้ให้ความยินยอม (บิดา/มารดา)
              </div>
              <div style={{ color: '#1d4ed8', fontStyle: 'italic', fontSize: '1.1rem', margin: '8px 0' }}>
                สมศักดิ์ มีสุข
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>( นายสมศักดิ์ มีสุข )</div>
              <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: 4 }}>✓ แนบสำเนาบัตรประชาชนพร้อมเซ็นสำเนาถูกต้อง</div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '1rem', color: '#334155' }}>
            {doc.description || 'แบบฟอร์มอย่างเป็นทางการสำหรับการดำเนินงานกองทุนเงินให้กู้ยืมเพื่อการศึกษา มทร.ศรีวิชัย'}
          </p>

          <div style={{ border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 8, background: '#fafafa', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '8px', fontSize: '0.9rem' }}>
              📌 แนวทางและคำแนะนำในการกรอกเอกสาร
            </div>
            <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {doc.guide_notes || 'กรุณาตรวจสอบรายละเอียดและข้อควรระวังในการกรอกตามระเบียบของกองทุน กยศ. มทร.ศรีวิชัย'}
            </div>
          </div>
        </div>
      )}

      {/* Footer stamp */}
      <div
        style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem',
          color: '#94a3b8',
        }}
      >
        <span>รหัสเอกสาร: RMUTSV-SLF-{doc.id?.slice(0, 8)}</span>
        <span>กองพัฒนานักศึกษา มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย</span>
      </div>
    </div>
  );
}
