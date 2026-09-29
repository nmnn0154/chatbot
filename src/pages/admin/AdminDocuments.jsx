import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  X,
  Check,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  FileUp,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  DOCUMENT_CATEGORIES,
  downloadDocumentFile,
} from '../../lib/documentApi';
import { confirmDelete, showSuccess, showError } from '../../lib/swalHelper';
import DocumentSampleViewer from '../../components/DocumentSampleViewer';

const ITEMS_PER_PAGE = 8;

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด'); // 'ทั้งหมด' | 'published' | 'draft'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | null
  const [targetDoc, setTargetDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('แบบฟอร์มขอกู้ยืม');
  const [description, setDescription] = useState('');
  const [guideNotes, setGuideNotes] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // File Upload State
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState('');
  const [docFileSize, setDocFileSize] = useState('');
  const [removeDocFile, setRemoveDocFile] = useState(false);

  // Preview Images Upload State
  const [existingPreviewImages, setExistingPreviewImages] = useState([]);
  const [newPreviewFiles, setNewPreviewFiles] = useState([]); // [{ id, file, previewUrl, name, size }]

  const docFileInputRef = useRef(null);
  const previewImageInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const data = await getAllDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('ไม่สามารถโหลดข้อมูลเอกสารได้', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Stats
  const stats = useMemo(() => {
    const total = documents.length;
    const published = documents.filter((d) => d.is_published !== false).length;
    const draft = total - published;
    const totalDownloads = documents.reduce((sum, d) => sum + (d.download_count || 0), 0);
    return { total, published, draft, totalDownloads };
  }, [documents]);

  // Filtered docs
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const matchCat = categoryFilter === 'ทั้งหมด' || d.category === categoryFilter;
      const matchStatus =
        statusFilter === 'ทั้งหมด' ||
        (statusFilter === 'published' && d.is_published !== false) ||
        (statusFilter === 'draft' && d.is_published === false);
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q);
      return matchCat && matchStatus && matchQuery;
    });
  }, [documents, categoryFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Open Add Modal
  function handleOpenAdd() {
    setTitle('');
    setCategory('แบบฟอร์มขอกู้ยืม');
    setDescription('');
    setGuideNotes(`📌 ข้อควรระวังและวิธีปฏิบัติในการกรอก:
1. ใช้ปากกาสีน้ำเงินเท่านั้นในการกรอกและลงนาม
2. ห้ามใช้น้ำยาลบคำผิดโดยเด็ดขาด
3. แนบหลักฐานประกอบพร้อมลงลายมือชื่อรับรองสำเนาถูกต้องทุกแผ่น`);
    setIsPublished(true);
    setSortOrder(documents.length + 1);
    setDocFile(null);
    setDocFileName('');
    setDocFileSize('');
    setRemoveDocFile(false);
    setExistingPreviewImages([]);
    setNewPreviewFiles([]);
    setTargetDoc(null);
    setModalMode('add');
  }

  // Open Edit Modal
  function handleOpenEdit(doc) {
    setTargetDoc(doc);
    setTitle(doc.title || '');
    setCategory(doc.category || 'แบบฟอร์มขอกู้ยืม');
    setDescription(doc.description || '');
    setGuideNotes(doc.guide_notes || '');
    setIsPublished(doc.is_published !== false);
    setSortOrder(doc.sort_order || 0);
    setDocFile(null);
    setDocFileName(doc.file_name || '');
    setDocFileSize(doc.file_size || '');
    setRemoveDocFile(false);

    let initialImages = [];
    if (Array.isArray(doc.preview_images) && doc.preview_images.length > 0) {
      initialImages = [...doc.preview_images].filter(Boolean);
    } else if (doc.preview_image_url) {
      initialImages = [doc.preview_image_url];
    }
    setExistingPreviewImages(initialImages);
    setNewPreviewFiles([]);
    setModalMode('edit');
  }

  // Open Delete Modal with SweetAlert2
  async function handleOpenDelete(doc) {
    const isConfirmed = await confirmDelete({
      title: 'ลบเอกสารและแบบฟอร์มนี้?',
      text: `คุณต้องการลบ "${doc.title}" ออกจากระบบใช่หรือไม่? ข้อมูลและไฟล์ที่เกี่ยวข้องจะถูกลบถาวร`,
      confirmText: 'ใช่, ลบเลย',
      cancelText: 'ยกเลิก',
    });

    if (isConfirmed) {
      setSubmitting(true);
      try {
        const allImgs = Array.isArray(doc.preview_images) && doc.preview_images.length > 0
          ? doc.preview_images
          : (doc.preview_image_url ? [doc.preview_image_url] : null);
        await deleteDocument(doc.id, doc.file_url, allImgs);
        showSuccess('ลบเอกสารเรียบร้อยแล้ว');
        await loadDocuments();
      } catch (err) {
        console.error('Delete document error:', err);
        showError('เกิดข้อผิดพลาดในการลบเอกสาร');
      } finally {
        setSubmitting(false);
      }
    }
  }

  // File change handlers
  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFile(file);
    setDocFileName(file.name);
    setDocFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setRemoveDocFile(false);
  };

  const handlePreviewImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
    }));

    setNewPreviewFiles((prev) => [...prev, ...newItems]);
    if (previewImageInputRef.current) {
      previewImageInputRef.current.value = '';
    }
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setExistingPreviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleRemoveNewFile = (idToRemove) => {
    setNewPreviewFiles((prev) => {
      const found = prev.find((x) => x.id === idToRemove);
      if (found && found.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((x) => x.id !== idToRemove);
    });
  };

  // Save (Create or Update)
  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) {
      showToast('กรุณากรอกชื่อเอกสาร', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const filesToUpload = newPreviewFiles.map((item) => item.file);

      if (modalMode === 'add') {
        await createDocument(
          {
            title,
            category,
            description,
            guide_notes: guideNotes,
            is_published: isPublished,
            sort_order: Number(sortOrder) || 0,
            file_name: docFileName,
            file_size: docFileSize,
            preview_images: existingPreviewImages,
          },
          docFile,
          filesToUpload
        );
        showToast('เพิ่มเอกสารและแบบฟอร์มสำเร็จ');
      } else if (modalMode === 'edit') {
        await updateDocument(
          targetDoc.id,
          {
            title,
            category,
            description,
            guide_notes: guideNotes,
            is_published: isPublished,
            sort_order: Number(sortOrder) || 0,
          },
          docFile,
          filesToUpload,
          existingPreviewImages,
          removeDocFile
        );
        showToast('แก้ไขข้อมูลเอกสารสำเร็จ');
      }

      setModalMode(null);
      await loadDocuments();
    } catch (err) {
      console.error('Save document error:', err);
      showToast(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถบันทึกได้'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Delete
  async function handleDelete() {
    if (!targetDoc) return;
    setSubmitting(true);
    try {
      const allImgs = Array.isArray(targetDoc.preview_images) && targetDoc.preview_images.length > 0
        ? targetDoc.preview_images
        : (targetDoc.preview_image_url ? [targetDoc.preview_image_url] : null);
      await deleteDocument(targetDoc.id, targetDoc.file_url, allImgs);
      showToast('ลบเอกสารเรียบร้อยแล้ว');
      setModalMode(null);
      setTargetDoc(null);
      await loadDocuments();
    } catch (err) {
      console.error('Delete document error:', err);
      showToast('เกิดข้อผิดพลาดในการลบเอกสาร', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle publish
  async function handleTogglePublish(doc) {
    try {
      const newStatus = !doc.is_published;
      await updateDocument(doc.id, { is_published: newStatus });
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_published: newStatus } : d))
      );
      showToast(newStatus ? 'เผยแพร่เอกสารแล้ว' : 'ซ่อนเอกสารแล้ว');
    } catch {
      showToast('ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
  }

  return (
    <div className="page-container animate-fade-in" id="admin-documents-page">
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
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
            >
              ระบบจัดการสำหรับแอดมิน
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0 }}>
            จัดการตัวอย่างเอกสาร & แบบฟอร์ม
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: 'var(--text-sm)' }}>
            เพิ่ม แก้ไข ลบ ตัวอย่างเอกสารการกรอก และไฟล์แบบฟอร์มที่เปิดให้นักศึกษาดาวน์โหลด
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ gap: '6px' }}
        >
          <Plus size={18} />
          <span>เพิ่มเอกสารใหม่</span>
        </button>
      </div>

      {/* ── Stats Overview ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div className="card card-glow" style={{ padding: '1.25rem', borderLeft: '4px solid #1e3a8a' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            เอกสารทั้งหมด
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {stats.total} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>รายการ</span>
          </div>
        </div>

        <div className="card card-glow" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            เผยแพร่แล้ว
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {stats.published} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>รายการ</span>
          </div>
        </div>

        <div className="card card-glow" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            ฉบับร่าง / ซ่อนอยู่
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            {stats.draft} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>รายการ</span>
          </div>
        </div>

        <div className="card card-glow" style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            ยอดดาวน์โหลดสะสม
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
            {stats.totalDownloads.toLocaleString()} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>ครั้ง</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filters ── */}
      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          gap: 'var(--space-md)',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-lg)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
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
            style={{ paddingLeft: '38px', borderRadius: 'var(--radius-md)' }}
            placeholder="ค้นหาเอกสาร..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Category filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                หมวด: {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div style={{ minWidth: '150px' }}>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
            <option value="published">เผยแพร่แล้ว</option>
            <option value="draft">ฉบับร่าง (ซ่อน)</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          แสดง {paginatedDocs.length} จาก {filteredDocs.length} รายการ
        </div>
      </div>

      {/* ── Table Content ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3>ไม่พบข้อมูลเอกสาร</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            ลองเปลี่ยนเงื่อนไขค้นหา หรือกดปุ่ม "เพิ่มเอกสารใหม่"
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th>ชื่อเอกสารและหมวดหมู่</th>
                  <th style={{ width: '180px' }}>ไฟล์เอกสารจริง</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>ดาวน์โหลด</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>สถานะ</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc, idx) => (
                  <tr key={doc.id}>
                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                      {startIndex + idx + 1}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary-soft)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <FileText size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {doc.category}
                            </span>
                            {(() => {
                              const pCount = Array.isArray(doc.preview_images) && doc.preview_images.length > 0
                                ? doc.preview_images.length
                                : (doc.preview_image_url ? 1 : 0);
                              if (pCount > 0) {
                                return (
                                  <span
                                    style={{
                                      fontSize: '0.65rem',
                                      padding: '1px 6px',
                                      borderRadius: 'var(--radius-full)',
                                      background: '#ecfdf5',
                                      color: '#059669',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                    title={`มีรูปภาพตัวอย่าง ${pCount} ภาพ`}
                                  >
                                    <ImageIcon size={10} />
                                    ตัวอย่าง {pCount} ภาพ
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                            {doc.title}
                          </div>
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--color-text-muted)',
                              marginTop: '2px',
                              maxWidth: '480px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.description || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {doc.file_name || 'เอกสารเปล่า (.PDF)'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {doc.file_type || 'PDF'} • {doc.file_size || '250 KB'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => downloadDocumentFile(doc)}
                          style={{
                            padding: '2px 4px',
                            justifyContent: 'flex-start',
                            fontSize: '0.7rem',
                            color: 'var(--color-primary)',
                            gap: '4px',
                          }}
                        >
                          <Download size={12} /> ทดสอบโหลด
                        </button>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-primary-soft)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {(doc.download_count || 0).toLocaleString()}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(doc)}
                        className={`badge ${doc.is_published !== false ? 'badge-emerald' : 'badge-amber'}`}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 600,
                          fontSize: 'var(--text-xs)',
                        }}
                        title="คลิกเพื่อสลับสถานะ"
                      >
                        {doc.is_published !== false ? 'เผยแพร่' : 'แบบร่าง'}
                      </button>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setPreviewDoc(doc)}
                          title="ดูตัวอย่างเอกสาร"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleOpenEdit(doc)}
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleOpenDelete(doc)}
                          title="ลบเอกสาร"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'var(--space-md)',
                paddingTop: 'var(--space-md)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                หน้า {safeCurrentPage} จาก {totalPages}
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronLeft size={16} /> ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${safeCurrentPage === p ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCurrentPage(p)}
                    style={{ minWidth: '32px' }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  ถัดไป <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="modal-backdrop" onClick={() => !submitting && setModalMode(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '92%' }}
          >
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'เพิ่มเอกสาร & แบบฟอร์มใหม่' : 'แก้ไขข้อมูลเอกสาร'}</h2>
              {!submitting && (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setModalMode(null)}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Title */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    ชื่อเอกสาร <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น แบบหนังสือรับรองรายได้ครอบครัว (กยศ.102)"
                    required
                  />
                </div>

                {/* Category & Sort Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>หมวดหมู่</label>
                    <select
                      className="input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {DOCUMENT_CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>ลำดับแสดงผล</label>
                    <input
                      type="number"
                      className="input"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      min={0}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    คำอธิบายและวัตถุประสงค์ของเอกสาร
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ระบุว่าเอกสารนี้ใช้สำหรับใคร ในขั้นตอนใด..."
                  />
                </div>

                {/* Guide notes */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    คำแนะนำ & จุดที่ต้องระวังในการกรอก (แสดงในหน้าตัวอย่าง)
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={guideNotes}
                    onChange={(e) => setGuideNotes(e.target.value)}
                    placeholder="ระบุข้อควรระวัง เช่น ปากกาสีน้ำเงิน, ห้ามใช้น้ำยาลบคำผิด, บุคคลที่ต้องลงนาม..."
                  />
                </div>

                {/* File Attachment (Real Document for Download) */}
                <div
                  style={{
                    padding: '1rem',
                    background: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-border)',
                  }}
                >
                  <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <FileUp size={16} /> ไฟล์เอกสารจริงสำหรับให้นักศึกษาดาวน์โหลด (.PDF / .DOCX)
                  </label>

                  <input
                    type="file"
                    ref={docFileInputRef}
                    onChange={handleDocFileChange}
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                  />

                  {docFileName ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileCheck size={18} style={{ color: '#059669', flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {docFileName} ({docFileSize || 'แนบแล้ว'})
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => docFileInputRef.current?.click()}
                        >
                          เปลี่ยนไฟล์
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => {
                            setDocFile(null);
                            setDocFileName('');
                            setDocFileSize('');
                            setRemoveDocFile(true);
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => docFileInputRef.current?.click()}
                      style={{ width: '100%', justifyContent: 'center', gap: '6px', padding: '0.75rem' }}
                    >
                      <Upload size={16} /> คลิกเพื่อเลือกไฟล์เอกสาร (.PDF หรือ .DOCX)
                    </button>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    * หากไม่ได้แนบไฟล์ ระบบจะสร้างแบบฟอร์มทางการมาตรฐานให้อัตโนมัติเมื่อนักศึกษากดดาวน์โหลด
                  </div>
                </div>

                {/* Multiple Preview Images Upload & Gallery */}
                <div
                  style={{
                    padding: '1rem',
                    background: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <label
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        margin: 0,
                      }}
                    >
                      <ImageIcon size={16} />
                      รูปภาพตัวอย่างการกรอกเอกสาร (อัปโหลดได้หลายภาพ)
                      {(existingPreviewImages.length + newPreviewFiles.length > 0) && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                          }}
                        >
                          {existingPreviewImages.length + newPreviewFiles.length} ภาพ
                        </span>
                      )}
                    </label>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => previewImageInputRef.current?.click()}
                        style={{ fontSize: 'var(--text-xs)', gap: '4px' }}
                      >
                        <Upload size={14} /> เพิ่มรูปภาพ...
                      </button>
                      {(existingPreviewImages.length + newPreviewFiles.length > 0) && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}
                          onClick={() => {
                            newPreviewFiles.forEach((item) => {
                              if (item.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
                            });
                            setExistingPreviewImages([]);
                            setNewPreviewFiles([]);
                          }}
                        >
                          ลบทั้งหมด
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={previewImageInputRef}
                    onChange={handlePreviewImagesChange}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />

                  {/* Thumbnail Gallery Grid */}
                  {(existingPreviewImages.length + newPreviewFiles.length > 0) ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '10px',
                        marginTop: '10px',
                      }}
                    >
                      {/* Existing Images */}
                      {existingPreviewImages.map((url, idx) => (
                        <div
                          key={`existing-${idx}`}
                          style={{
                            position: 'relative',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%', paddingTop: '115%', background: '#f8fafc' }}>
                            <img
                              src={url}
                              alt={`ตัวอย่าง ${idx + 1}`}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                background: idx === 0 ? 'rgba(30, 58, 138, 0.9)' : 'rgba(0, 0, 0, 0.65)',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {idx === 0 ? 'ภาพหลัก #1' : `ภาพที่ ${idx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: '#ffffff',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }}
                              title="ลบรูปนี้"
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <div style={{ padding: '4px 6px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ภาพที่บันทึกแล้ว
                          </div>
                        </div>
                      ))}

                      {/* Staged New Uploads */}
                      {newPreviewFiles.map((item, idx) => {
                        const totalIdx = existingPreviewImages.length + idx;
                        return (
                          <div
                            key={item.id}
                            style={{
                              position: 'relative',
                              background: '#ffffff',
                              borderRadius: '8px',
                              border: '2px solid #3b82f6',
                              overflow: 'hidden',
                              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <div style={{ position: 'relative', width: '100%', paddingTop: '115%', background: '#eff6ff' }}>
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  left: '4px',
                                  background: totalIdx === 0 ? 'rgba(30, 58, 138, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                                  color: '#ffffff',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {totalIdx === 0 ? 'ภาพหลัก #1' : `ภาพที่ ${totalIdx + 1}`}
                              </span>
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  padding: '0 4px',
                                  borderRadius: '3px',
                                }}
                              >
                                ใหม่
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveNewFile(item.id)}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#ffffff',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                                title="ยกเลิกรูปนี้"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            <div style={{ padding: '4px 6px', fontSize: '0.65rem', color: '#1e40af', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add more button card */}
                      <button
                        type="button"
                        onClick={() => previewImageInputRef.current?.click()}
                        style={{
                          minHeight: '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#f8fafc',
                          border: '2px dashed var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Plus size={22} />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>เพิ่มรูปภาพอีก</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => previewImageInputRef.current?.click()}
                      style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        background: '#ffffff',
                        border: '2px dashed var(--color-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 8px', opacity: 0.8 }} />
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        คลิกเพื่อเลือกรูปตัวอย่างการกรอก (เลือกได้หลายไฟล์พร้อมกัน)
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        รองรับ JPG, PNG, WEBP — เช่น ภาพหน้าที่ 1, ภาพหน้าที่ 2 หรือตัวอย่างการลงนาม
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    * รูปแรกจะถูกใช้เป็นภาพหน้าปกหลัก นักศึกษาจะสามารถกดเลื่อนดูภาพทั้งหมดได้ในหน้าแสดงตัวอย่าง
                  </div>
                </div>

                {/* Published checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="is_published_checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_published_checkbox" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' }}>
                    เปิดเผยแพร่ทันที (แสดงให้นักศึกษาเห็นและดาวน์โหลดได้)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalMode(null)}
                  disabled={submitting}
                >
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
      {modalMode === 'delete' && (
        <div className="modal-backdrop" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="confirm-dialog" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div
                className="confirm-icon"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                ยืนยันการลบเอกสาร
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 1.5rem' }}>
                คุณต้องการลบเอกสาร <strong>"{targetDoc?.title}"</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalMode(null)}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{ gap: '6px' }}
                >
                  <Trash2 size={16} /> ลบเอกสารนี้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sample Preview Modal ── */}
      {previewDoc && (
        <DocumentSampleViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ── Toast Notifications ── */}
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
