import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
} from '../../lib/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  Upload,
  Search,
  Trash2,
  BookOpen,
  X,
  AlertTriangle,
  Check,
  FileText
} from 'lucide-react';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [searchQuery]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const data = await getDocuments(searchQuery);
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id);
      showToast('ลบเอกสารสำเร็จ');
      setDeleteTarget(null);
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('ไม่สามารถลบเอกสารได้', 'error');
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="page-container animate-fade-in" id="knowledge-base-page">
      <div className="page-header">
        <h1>📚 จัดการเอกสารฐานความรู้ (PDF)</h1>
        <p>อัปโหลดไฟล์ PDF เพื่อใช้เป็นแหล่งข้อมูล (Knowledge Base) สำหรับแชทบอท</p>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="input"
            placeholder="ค้นหาชื่อเอกสาร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Upload size={18} />
          อัปโหลด PDF
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>ไม่พบเอกสารในระบบ</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Upload size={16} />
            อัปโหลดเอกสารใหม่
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ชื่อเอกสาร</th>
                  <th style={{ width: '150px' }}>วันที่อัปโหลด</th>
                  <th style={{ width: '90px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        <FileText size={18} color="var(--color-brand-primary)" />
                        {doc.filename}
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      {formatDate(doc.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setDeleteTarget(doc)}
                          title="ลบ"
                          style={{ color: 'var(--color-brand-rose)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Result Count */}
      {!loading && documents.length > 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          แสดงผลทั้งหมด {documents.length} รายการ
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <UploadModal
          userId={user?.id}
          onSuccess={() => {
            setShowModal(false);
            showToast('อัปโหลดและประมวลผลเอกสารสำเร็จ');
            loadDocuments();
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <div className="confirm-icon">
                <AlertTriangle size={28} />
              </div>
              <h3>ยืนยันการลบเอกสาร</h3>
              <p>คุณต้องการลบ "{deleteTarget.filename}" ใช่หรือไม่? ข้อมูลเวกเตอร์ที่เกี่ยวข้องจะถูกลบทั้งหมด</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  ยกเลิก
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <Trash2 size={16} /> ลบเอกสาร
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

/* ---- Document Upload Modal Component ---- */
function UploadModal({ userId, onSuccess, onClose }) {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setErrorMsg('');
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setErrorMsg('กรุณาเลือกไฟล์ PDF เท่านั้น');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  /**
   * Helper function to extract text from a PDF file
   */
  const extractTextFromPDF = async (fileObj) => {
    const arrayBuffer = await fileObj.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
  };

  /**
   * Helper function to chunk text roughly by characters / paragraphs
   */
  const chunkText = (text, maxLength = 800) => {
    // Basic chunking: split by newlines, then group up to maxLength
    const paragraphs = text.split(/\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if (!p.trim()) continue;
      
      if ((currentChunk.length + p.length) > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = p + ' ';
      } else {
        currentChunk += p + ' ';
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  };

  const handleUploadClick = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกไฟล์ PDF');
      return;
    }

    try {
      setProcessing(true);
      setErrorMsg('');

      setProgressText('กำลังอ่านไฟล์ PDF...');
      const text = await extractTextFromPDF(file);
      
      if (!text.trim()) {
        throw new Error('ไม่พบข้อความในไฟล์ PDF หรือเป็นไฟล์รูปภาพสแกนเพียวๆ');
      }

      setProgressText('กำลังแบ่งส่วนย่อยของเนื้อหา...');
      const textChunks = chunkText(text);

      setProgressText(`กำลังสร้างเวกเตอร์และบันทึก (${textChunks.length} chunks)...`);
      
      await uploadDocument(file.name, userId, textChunks);

      onSuccess();

    } catch (err) {
      console.error('Processing error:', err);
      setErrorMsg(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      if (errorMsg) setProcessing(false); 
      // if successful, it unmounts anyway due to onSuccess triggering onClose
    }
  };

  return (
    <div className="modal-backdrop" onClick={!processing ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>อัปโหลดเอกสาร PDF</h2>
          {!processing && (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {!processing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                className="upload-dropzone"
                style={{
                  border: '2px dashed var(--color-border)',
                  padding: '2rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-bg-alt)'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} style={{ marginBottom: '8px', color: 'var(--color-text-muted)' }} />
                <p style={{ fontWeight: 500, margin: '8px 0' }}>คลิกเพื่อเลือกไฟล์ PDF</p>
                {file && <p style={{ color: 'var(--color-brand-primary)' }}>เลือกไฟล์: {file.name}</p>}
              </div>
              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              
              {errorMsg && (
                <div style={{ color: 'var(--color-brand-rose)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> {errorMsg}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px auto', width: '30px', height: '30px', borderWidth: '3px' }}></div>
              <p style={{ fontWeight: 500 }}>{progressText}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                ขั้นตอนนี้อาจใช้เวลาสักครู่ กรุณาอย่าปิดหน้าจอ
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={processing}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUploadClick}
            disabled={!file || processing}
          >
            {processing ? 'กำลังดำเนินการ...' : 'อัปโหลดและประมวลผล'}
          </button>
        </div>
      </div>
    </div>
  );
}
