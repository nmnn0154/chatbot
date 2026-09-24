import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getFaqs, createFaq, updateFaq, deleteFaq, bulkCreateOrUpdateFaqs } from '../../lib/faqApi';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  FileDown,
  Upload,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function AdminFaq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | null
  const [targetFaq, setTargetFaq] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    setLoading(true);
    try {
      const data = await getFaqs();
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      showToast('ไม่สามารถโหลดข้อมูล FAQ ได้', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openAddModal() {
    setQuestion('');
    setAnswer('');
    setTargetFaq(null);
    setModalMode('add');
  }

  function openEditModal(faq) {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setTargetFaq(faq);
    setModalMode('edit');
  }

  function openDeleteModal(faq) {
    setTargetFaq(faq);
    setModalMode('delete');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      showToast('กรุณากรอกคำถามและคำตอบ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        await createFaq({ question, answer });
        showToast('เพิ่ม FAQ สำเร็จ');
      } else if (modalMode === 'edit') {
        await updateFaq(targetFaq.id, { question, answer });
        showToast('แก้ไขบันทึกสำเร็จ');
      }
      setModalMode(null);
      loadFaqs();
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteFaq(targetFaq.id);
      showToast('ลบ FAQ สำเร็จ');
      setModalMode(null);
      loadFaqs();
    } catch (error) {
      showToast(`เกิดข้อผิดพลาดในการลบ: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'คำถาม': 'คุณสมบัติผู้กู้ กยศ. มีอะไรบ้าง?', 'คำตอบ': 'ต้องเป็นนักศึกษาที่... (เขียนคำตอบที่นี่)' },
      { 'คำถาม': 'ช่องทางการติดต่อ', 'คำตอบ': 'เบอร์โทร 02-xxx-xxxx' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FAQ_Template");
    XLSX.writeFile(wb, "FAQ_Template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const importedFaqs = json.map(row => ({
        question: row['คำถาม'] || row['Question'] || row['question'],
        answer: row['คำตอบ'] || row['Answer'] || row['answer']
      })).filter(item => item.question && item.answer);

      if (importedFaqs.length === 0) {
        showToast('ไม่พบข้อมูล FAQ ในไฟล์ Excel โปรดตรวจสอบชื่อคอลัมน์ "คำถาม" และ "คำตอบ"', 'error');
        setLoading(false);
        return;
      }

      const { insertCount, updateCount } = await bulkCreateOrUpdateFaqs(importedFaqs);
      showToast(`นำเข้าสำเร็จ! เพิ่มใหม่ ${insertCount} รายการ, อัปเดตข้อมูลเดิม ${updateCount} รายการ`);
      await loadFaqs();
    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
      setLoading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="page-container animate-fade-in" id="admin-faq-page">
      <div className="page-header">
        <h1>จัดการคำถามที่พบบ่อย (FAQ)</h1>
        <p>สร้างคำถาม-คำตอบล่วงหน้าเพื่อลดภาระของระบบ AI และให้ข้อมูลผู้ใช้ได้ทันที</p>
      </div>

      <div className="admin-faq-toolbar">
        <div className="admin-faq-search">
          <div className="faq-search-input-wrapper">
            <Search size={16} className="faq-search-icon" style={{ left: '10px' }} />
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาคำถามหรือคำตอบ..."
              style={{ paddingLeft: '34px', height: '38px' }}
            />
          </div>
        </div>

        <div className="admin-faq-actions">
          <button className="btn btn-secondary" onClick={handleDownloadTemplate} disabled={loading}>
            <FileDown size={18} />
            <span>ไฟล์ต้นแบบ</span>
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload size={18} />
            <span>นำเข้า Excel</span>
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
          />
          <button className="btn btn-primary" onClick={openAddModal} disabled={loading}>
            <Plus size={18} />
            <span>เพิ่ม FAQ</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : faqs.length === 0 ? (
        <div className="empty-state">
          <HelpCircle size={48} />
          <p>ยังไม่มีรายการคำถามที่พบบ่อยในระบบ</p>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={16} />
            เพิ่มคำถามแรก
          </button>
        </div>
      ) : (() => {
        const filteredFaqs = faqs.filter(
          (faq) =>
            faq.question?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            faq.answer?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
        const totalPages = Math.ceil(filteredFaqs.length / ITEMS_PER_PAGE) || 1;
        const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
        const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        if (filteredFaqs.length === 0) {
          return (
            <div className="empty-state">
              <HelpCircle size={40} />
              <p>ไม่พบรายการที่ตรงกับ "{searchQuery}"</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
                ล้างคำค้นหา
              </button>
            </div>
          );
        }

        return (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '38%' }}>คำถาม</th>
                    <th style={{ width: '38%' }}>คำตอบ</th>
                    <th>จำนวนครั้งที่ใช้</th>
                    <th style={{ width: '100px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFaqs.map((faq, index) => (
                    <tr key={faq.id}>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {startIndex + index + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{faq.question}</div>
                      </td>
                      <td>
                        <div style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'pre-line',
                          maxHeight: '4.5em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {faq.answer}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand)' }}>
                          <TrendingUp size={16} />
                          <span style={{ fontWeight: 600 }}>{faq.usage_count}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(faq)}
                            title="แก้ไข"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openDeleteModal(faq)}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="faq-pagination-container" style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
                <div className="faq-pagination-info">
                  แสดง <strong>{startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredFaqs.length)}</strong> จาก <strong>{filteredFaqs.length}</strong> รายการ (หน้า {safeCurrentPage} จาก {totalPages})
                </div>

                <div className="faq-pagination-controls">
                  <button
                    type="button"
                    className="faq-pagination-btn"
                    onClick={() => setCurrentPage(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    title="ก่อนหน้า"
                  >
                    <ChevronLeft size={16} />
                    <span className="faq-pagination-nav-text">ก่อนหน้า</span>
                  </button>

                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`faq-pagination-btn ${safeCurrentPage === p ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="faq-pagination-btn"
                    onClick={() => setCurrentPage(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    title="ถัดไป"
                  >
                    <span className="faq-pagination-nav-text">ถัดไป</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Add/Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="modal-backdrop" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'เพิ่ม FAQ ใหม่' : 'แก้ไข FAQ'}</h2>
              {!submitting && (
                <button className="btn btn-ghost btn-icon" onClick={() => setModalMode(null)}>
                  <X size={20} />
                </button>
              )}
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">คำถาม</label>
                  <input
                    type="text"
                    className="input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="เช่น คุณสมบัติผู้กู้ กยศ. มีอะไรบ้าง?"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">คำตอบ</label>
                  <textarea
                    className="input"
                    rows={6}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="พิมพ์คำตอบที่ต้องการแจ้งให้ผู้ใช้ทราบ..."
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>
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

      {/* Delete Model */}
      {modalMode === 'delete' && (
        <div className="modal-backdrop" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <div className="confirm-icon">
                <AlertTriangle size={28} />
              </div>
              <h3>ยืนยันการลบ FAQ</h3>
              <p>คุณต้องการลบคำถาม "{targetFaq?.question}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>
                  ยกเลิก
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                  <Trash2 size={16} /> ลบ FAQ
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
