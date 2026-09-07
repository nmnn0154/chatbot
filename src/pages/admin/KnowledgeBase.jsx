import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
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
        <h1>จัดการเอกสารฐานความรู้</h1>
        <p>เพิ่มเนื้อหาจากไฟล์ PDF/ข้อความ หรือวางข้อความเอง เพื่อใช้เป็นแหล่งข้อมูลของแชทบอท</p>
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
          เพิ่มเอกสาร
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

/** Extract the text layer from a PDF. Returns '' for scanned / image-only PDFs. */
async function extractTextFromPDF(fileObj) {
  const arrayBuffer = await fileObj.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item) => item.str).join(' ') + '\n';
  }
  return fullText;
}

/**
 * Strip characters Postgres TEXT cannot store. PDF text extraction often yields
 * NUL bytes and other control chars, which PostgREST rejects with
 * "unsupported Unicode escape sequence".
 */
function sanitizeText(text) {
  return String(text || '')
    // NUL and other control chars except tab (\x09), LF (\x0A), CR (\x0D)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    // lone UTF-16 surrogates that can't round-trip through JSON
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

/** Chunk text by paragraphs, grouping up to ~maxLength characters. */
function chunkText(rawText, maxLength = 800) {
  const text = sanitizeText(rawText);
  const paragraphs = text.split(/\n+/);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if (!p.trim()) continue;
    if ((current.length + p.length) > maxLength) {
      if (current) chunks.push(current.trim());
      current = p + ' ';
    } else {
      current += p + ' ';
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Drop obvious OCR-noise lines (watermarks, faint scan artifacts, gibberish)
 * while keeping real Thai paragraphs. Heuristic — the caller must still proofread.
 *
 * @param {string} raw
 * @param {boolean} strict  tighter thresholds (removes more, may drop short headings)
 * @returns {{ text: string, removed: number }}
 */
function cleanOcrText(raw, strict = false) {
  const THAI = /[฀-๿]/g;
  const LATIN = /[A-Za-z]/g;
  const minLen = strict ? 6 : 3;
  const minAvgTok = strict ? 2.8 : 2.3;
  const minThaiShare = strict ? 0.7 : 0.55;
  const thaiFloor = strict ? 12 : 8;

  const kept = [];
  let removed = 0;

  for (let line of String(raw).split(/\r?\n/)) {
    line = line.replace(/\s+/g, ' ').trim();
    if (!line) { kept.push(''); continue; }

    const total = line.replace(/\s/g, '').length;
    const thai = (line.match(THAI) || []).length;
    const latin = (line.match(LATIN) || []).length;
    const tokens = line.split(' ');
    const avgTok = total / tokens.length;
    const meaningful = thai + (line.match(/[0-9๐-๙]/g) || []).length;

    if (
      total <= minLen ||
      (tokens.length >= 4 && avgTok < minAvgTok) ||   // scattered single letters
      (latin >= thai && thai < thaiFloor) ||           // Latin-heavy artifact
      meaningful / total < minThaiShare                // low Thai/digit share
    ) {
      removed++;
      continue;
    }
    kept.push(line);
  }

  return { text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(), removed };
}

/**
 * OCR a scanned/image PDF in the browser (Thai + English).
 * Renders each page to a canvas via pdfjs, then runs Tesseract.
 * Slow and imperfect — the caller must let a human review the result.
 * @param {File} fileObj
 * @param {(msg: string) => void} onProgress
 */
async function ocrPdf(fileObj, onProgress) {
  const arrayBuffer = await fileObj.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  onProgress('กำลังโหลดโมเดล OCR ภาษาไทย (ครั้งแรกใช้เวลาสักครู่)...');
  const worker = await Tesseract.createWorker('tha+eng');
  // 1 = automatic page segmentation with orientation detection — better for
  // single-column official documents than the default.
  await worker.setParameters({ tessedit_pageseg_mode: '1', preserve_interword_spaces: '1' });

  try {
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress(`กำลังอ่านหน้า ${i}/${pdf.numPages} ด้วย OCR...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const { data } = await worker.recognize(canvas);
      fullText += (data.text || '') + '\n\n';
    }
    return fullText;
  } finally {
    await worker.terminate();
  }
}

/* ---- Document Upload Modal Component ---- */
function UploadModal({ userId, onSuccess, onClose }) {
  const [mode, setMode] = useState('file'); // 'file' | 'paste'
  const [file, setFile] = useState(null);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [ocrOffered, setOcrOffered] = useState(false);
  const [ocrRaw, setOcrRaw] = useState('');
  const fileInputRef = useRef(null);

  const TEXT_EXT = /\.(txt|md|markdown|csv)$/i;
  const isTextFile = (f) => f && (f.type.startsWith('text/') || TEXT_EXT.test(f.name));

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setErrorMsg('');
    setOcrOffered(false);
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !isTextFile(selected)) {
      setErrorMsg('รองรับไฟล์ .pdf, .txt หรือ .md เท่านั้น');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  async function processChunks(name, textChunks) {
    if (textChunks.length === 0) {
      throw new Error('ไม่มีเนื้อหาให้ประมวลผล');
    }
    setProgressText(`กำลังสร้างเวกเตอร์และบันทึก (${textChunks.length} ส่วน)...`);
    await uploadDocument(name, userId, textChunks);
    onSuccess();
  }

  const handleFileUpload = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกไฟล์');
      return;
    }
    try {
      setProcessing(true);
      setErrorMsg('');

      let text;
      if (isTextFile(file)) {
        setProgressText('กำลังอ่านไฟล์ข้อความ...');
        text = await file.text();
      } else {
        setProgressText('กำลังอ่านไฟล์ PDF...');
        text = await extractTextFromPDF(file);
      }

      if (!text.trim()) {
        if (!isTextFile(file)) setOcrOffered(true);
        throw new Error(
          'อ่านข้อความจากไฟล์นี้ไม่ได้ (น่าจะเป็น PDF สแกน/รูปภาพ) — ' +
          'กดปุ่ม "อ่านด้วย OCR" ด้านล่าง หรือคัดลอกข้อความไปวางในแท็บ "วางข้อความเอง"'
        );
      }

      setProgressText('กำลังแบ่งส่วนย่อยของเนื้อหา...');
      await processChunks(file.name, chunkText(text));
    } catch (err) {
      console.error('Processing error:', err);
      setErrorMsg(err.message);
      setProcessing(false);
    }
  };

  const runOcr = async () => {
    if (!file) return;
    try {
      setProcessing(true);
      setErrorMsg('');
      const raw = await ocrPdf(file, setProgressText);
      const { text, removed } = cleanOcrText(raw);
      if (!text) throw new Error('OCR อ่านข้อความไม่ได้ — เอกสารอาจเบลอหรือคุณภาพต่ำเกินไป');
      // Land in the paste tab with the OCR result for the admin to proofread.
      setOcrRaw(raw);
      setPasteTitle(file.name.replace(/\.pdf$/i, ''));
      setPasteText(text);
      setMode('paste');
      setOcrOffered(false);
      setProcessing(false);
      setErrorMsg(`อ่านด้วย OCR แล้ว — กรองบรรทัดขยะออก ${removed} บรรทัด กรุณาตรวจแก้ข้อความ (เลข พ.ศ. / ตัวเลขในตาราง) ก่อนกดบันทึก`);
    } catch (err) {
      console.error('OCR error:', err);
      setErrorMsg('OCR ล้มเหลว: ' + err.message);
      setProcessing(false);
    }
  };

  const cleanStricter = () => {
    if (!ocrRaw) return;
    const { text, removed } = cleanOcrText(ocrRaw, true);
    setPasteText(text);
    setErrorMsg(`กรองแบบเข้ม — ตัดบรรทัดออกรวม ${removed} บรรทัด (ถ้าตัดเนื้อหาจริงไปด้วย กดปุ่มด้านล่างเพื่อคืนค่ากรองปกติ)`);
  };

  const cleanNormal = () => {
    if (!ocrRaw) return;
    const { text, removed } = cleanOcrText(ocrRaw, false);
    setPasteText(text);
    setErrorMsg(`กรองปกติ — ตัดบรรทัดออก ${removed} บรรทัด`);
  };

  const handlePasteUpload = async () => {
    const title = pasteTitle.trim();
    const body = pasteText.trim();
    if (!title) { setErrorMsg('กรุณาตั้งชื่อเอกสาร'); return; }
    if (body.length < 20) { setErrorMsg('เนื้อหาสั้นเกินไป'); return; }
    try {
      setProcessing(true);
      setErrorMsg('');
      setProgressText('กำลังแบ่งส่วนย่อยของเนื้อหา...');
      await processChunks(title, chunkText(body));
    } catch (err) {
      console.error('Processing error:', err);
      setErrorMsg(err.message);
      setProcessing(false);
    }
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '0.5rem',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
    background: 'none',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    cursor: 'pointer',
  });

  return (
    <div className="modal-backdrop" onClick={!processing ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>เพิ่มเอกสารฐานความรู้</h2>
          {!processing && (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {processing ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px auto', width: '30px', height: '30px', borderWidth: '3px' }}></div>
              <p style={{ fontWeight: 500 }}>{progressText}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                ขั้นตอนนี้อาจใช้เวลาสักครู่ กรุณาอย่าปิดหน้าจอ
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                <button style={tabStyle(mode === 'file')} onClick={() => { setMode('file'); setErrorMsg(''); }}>
                  อัปโหลดไฟล์
                </button>
                <button style={tabStyle(mode === 'paste')} onClick={() => { setMode('paste'); setErrorMsg(''); }}>
                  วางข้อความเอง
                </button>
              </div>

              {mode === 'file' ? (
                <>
                  <div
                    className="upload-dropzone"
                    tabIndex={0}
                    role="button"
                    aria-label="คลิกเพื่อเลือกไฟล์"
                    style={{
                      border: '2px dashed var(--color-border)',
                      padding: '2rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--color-bg-tertiary)',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <Upload size={32} style={{ marginBottom: '8px', color: 'var(--color-text-muted)' }} />
                    <p style={{ fontWeight: 500, margin: '8px 0' }}>คลิกเพื่อเลือกไฟล์ (.pdf, .txt, .md)</p>
                    {file && <p style={{ color: 'var(--color-primary)' }}>เลือกไฟล์: {file.name}</p>}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    PDF ที่เป็นรูปภาพสแกนจะอ่านข้อความไม่ได้ — กด "อ่านด้วย OCR" หรือใช้แท็บ "วางข้อความเอง"
                  </p>
                  {ocrOffered && file && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={runOcr}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <FileText size={16} />
                      อ่านด้วย OCR (ภาษาไทย · ครั้งแรกโหลดโมเดล ~15MB)
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">ชื่อเอกสาร</label>
                    <input
                      className="input"
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      placeholder="เช่น ระเบียบการกู้ยืม กยศ. ปีการศึกษา 2568"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">เนื้อหา (วางข้อความจากเอกสาร)</label>
                    <textarea
                      className="input"
                      rows={10}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="คัดลอกข้อความจาก PDF / Word แล้ววางที่นี่ ระบบจะแบ่งส่วนและสร้างเวกเตอร์ให้อัตโนมัติ"
                    />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {pasteText.trim().length.toLocaleString()} ตัวอักษร
                    </span>
                  </div>
                  {ocrRaw && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={cleanStricter}>
                        กรองบรรทัดขยะแบบเข้มขึ้น
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={cleanNormal}>
                        กรองปกติ
                      </button>
                    </div>
                  )}
                </>
              )}

              {errorMsg && (
                <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {errorMsg}
                </div>
              )}
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
            onClick={mode === 'file' ? handleFileUpload : handlePasteUpload}
            disabled={processing || (mode === 'file' ? !file : !pasteText.trim())}
          >
            {processing ? 'กำลังดำเนินการ...' : 'ประมวลผลและบันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
