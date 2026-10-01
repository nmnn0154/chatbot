import { useState, useEffect, useRef } from 'react';
import { getAllNews, createNews, updateNews, deleteNews } from '../../lib/newsApi';
import { confirmDelete } from '../../lib/swalHelper';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Megaphone,
  Calendar,
  ImagePlus,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Bold,
  List,
  Phone,
  Info,
  LayoutGrid,
  Maximize2,
} from 'lucide-react';

const NEWS_TEMPLATES = [
  {
    name: '📌 กำหนดการยื่นกู้ยืม',
    badge: 'กำหนดการ',
    title: 'ประกาศกำหนดการยื่นแบบคำขอกู้ยืมเงิน กยศ. ภาคเรียนที่ 1/2568',
    content: `กองพัฒนานักศึกษา มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย ขอแจ้งกำหนดการดำเนินงานกองทุน กยศ.:

📌 กำหนดการสำคัญ:
• บันทึกคำขอกู้ยืมในระบบ DSL: วันที่ 1 เมษายน - 30 มิถุนายน 2568
• ส่งเอกสารหลักฐาน ณ อาคาร 7 ชั้น 1: วันที่ 1 - 20 กรกฎาคม 2568
• ประกาศผลการอนุมัติสิทธิ์: วันที่ 1 สิงหาคม 2568

📝 เอกสารที่ต้องเตรียม:
1. แบบคำขอกู้ยืมเงินที่พิมพ์จากระบบ DSL
2. สำเนาบัตรประชาชนผู้กู้และผู้ปกครอง
3. หนังสือรับรองรายได้ครอบครัว (กยศ.102)

⚠️ หมายเหตุ: กรุณาส่งเอกสารให้ตรงตามกำหนดเวลาเพื่อรักษาสิทธิ์ของตนเอง`,
  },
  {
    name: '📢 ประกาศผลอนุมัติ',
    badge: 'ผลอนุมัติ',
    title: 'ประกาศรายชื่อผู้ผ่านการอนุมัติการกู้ยืมเงิน กยศ. ประจำภาคเรียนที่ ...',
    content: `ตามที่กองพัฒนานักศึกษาได้ดำเนินการตรวจสอบคุณสมบัติของผู้ขอกู้ยืมเงิน กยศ. บัดนี้ได้ดำเนินการเสร็จสิ้นแล้ว:

✨ รายละเอียดการดำเนินการ:
• ตรวจสอบรายชื่อผู้ผ่านการคัดเลือกได้ที่: บอร์ดประชาสัมพันธ์ หรือระบบ DSL
• ขั้นตอนต่อไป: จัดทำแบบยืนยันการเบิกเงินค่าเล่าเรียนและค่าครองชีพ
• กำหนดส่งเอกสาร: ภายในวันที่ ...

📞 สอบถามเพิ่มเติม: งานแนะแนวและทุนการศึกษา โทร. 074-317100 ต่อ ...`,
  },
  {
    name: '🩸 กิจกรรมจิตอาสา',
    badge: 'จิตอาสา',
    title: 'ขอเชิญเข้าร่วมกิจกรรมจิตอาสา กยศ. บันทึกสะสม 6 ชั่วโมง',
    content: `ขอเชิญชวนนักศึกษาผู้กู้ยืมเงิน กยศ. ทุกคณะ ทุกชั้นปี เข้าร่วมกิจกรรมจิตอาสาเพื่อสังคม:

📍 รายละเอียดกิจกรรม:
• วัน/เวลา: วันพุธที่ ... เวลา 09.00 - 15.00 น.
• สถานที่: อาคารอเนกประสงค์ มทร.ศรีวิชัย
• จำนวนชั่วโมงที่ได้รับ: 6 ชั่วโมง / ครั้ง
• การแต่งกาย: ชุดนักศึกษาถูกระเบียบ

📝 ลงทะเบียนเข้าร่วมได้ที่: https://...
*กรุณานำสมุดบันทึกกิจกรรมจิตอาสามาเพื่อประทับตรารับรองในวันงาน*`,
  },
  {
    name: '💳 แจ้งเตือนชำระหนี้',
    badge: 'ชำระหนี้',
    title: 'แจ้งเตือนกำหนดชำระหนี้ กยศ. ประจำปี และสิทธิประโยชน์ชำระตรงเวลา',
    content: `กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) ร่วมกับ มทร.ศรีวิชัย ขอแจ้งเตือนผู้กู้ยืมที่ครบกำหนดชำระหนี้:

💳 ข้อมูลการชำระเงิน:
• ครบกำหนดชำระภายในวันที่ 5 กรกฎาคม ของทุกปี
• ช่องทางการชำระ: แอปพลิเคชัน Krungthai NEXT / กยศ. Connect / เคาน์เตอร์เซอร์วิส
• สิทธิประโยชน์: ผู้กู้ยืมที่ชำระตรงกำหนดจะได้รับส่วนลดและลดภาระเบี้ยปรับเหลือ 0.5% ต่อปี

⚠️ หากผู้กู้ยืมมีปัญหาทางการเงิน สามารถยื่นคำขอปรับโครงสร้างหนี้เพื่อขยายเวลาผ่อนชำระได้`,
  },
];

export default function AdminNews() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [formData, setFormData] = useState({ title: '', content: '', is_published: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [imageFileSize, setImageFileSize] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const contentInputRef = useRef(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    try {
      const data = await getAllNews();
      setNewsList(data || []);
    } catch (err) {
      console.error('Error loading news:', err);
      showToast('ไม่สามารถโหลดข้อมูลข่าวสารได้', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const handleOpenModal = (news = null) => {
    if (news) {
      setEditingNews(news);
      setFormData({ title: news.title, content: news.content, is_published: news.is_published });
      setImagePreview(news.image_url || null);
      setImageFileName(news.image_url ? 'รูปภาพเดิมของข่าวสาร' : '');
      setImageFileSize('');
    } else {
      setEditingNews(null);
      setFormData({ title: '', content: '', is_published: true });
      setImagePreview(null);
      setImageFileName('');
      setImageFileSize('');
    }
    setImageFile(null);
    setRemoveExistingImage(false);
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingNews(null);
    setFormData({ title: '', content: '', is_published: true });
    setImageFile(null);
    setImagePreview(null);
    setImageFileName('');
    setImageFileSize('');
    setRemoveExistingImage(false);
    setActiveTab('edit');
  };

  // Helper to format file size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์ประเภทรูปภาพเท่านั้น (JPG, PNG, WEBP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB', 'error');
      return;
    }
    setImageFile(file);
    setImageFileName(file.name);
    setImageFileSize(formatBytes(file.size));
    setRemoveExistingImage(false);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    showToast('เพิ่มรูปภาพเรียบร้อยแล้ว', 'success');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    processImageFile(file);
  };

  const handleRemoveImage = (e) => {
    if (e) e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setImageFileName('');
    setImageFileSize('');
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('ลบรูปภาพแล้ว', 'info');
  };

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Clipboard paste support (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  // Insert helper text into content
  const insertContentSnippet = (snippet) => {
    const textarea = contentInputRef.current;
    if (!textarea) {
      setFormData((prev) => ({ ...prev, content: prev.content + snippet }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newContent = before + snippet + after;
    setFormData((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  // Apply template
  const applyTemplate = (tpl) => {
    setFormData((prev) => ({
      ...prev,
      title: tpl.title,
      content: tpl.content,
    }));
    showToast(`นำแม่แบบ "${tpl.name}" มาใช้งานเรียบร้อย`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('กรุณากรอกหัวข้อข่าวสาร', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showToast('กรุณากรอกเนื้อหารายละเอียดของข่าวสาร', 'error');
      return;
    }

    setSaving(true);
    try {
      let success;
      if (editingNews) {
        success = await updateNews(
          editingNews.id,
          { ...formData },
          imageFile || null,
          editingNews.image_url || null,
          removeExistingImage && !imageFile,
        );
      } else {
        success = await createNews(formData.title, formData.content, formData.is_published, imageFile || null);
      }

      if (success) {
        showToast(editingNews ? 'อัปเดตข่าวสารเรียบร้อยแล้ว' : 'สร้างข่าวสารใหม่เรียบร้อยแล้ว', 'success');
        handleCloseModal();
        loadNews();
      } else {
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล โปรดลองอีกครั้ง', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด: ' + (err.message || 'โปรดลองอีกครั้ง'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (news) => {
    const isConfirmed = await confirmDelete({
      title: `ลบข่าวสารนี้?`,
      text: `คุณต้องการลบ "${news.title}" ใช่หรือไม่? ข้อมูลที่ลบจะไม่สามารถกู้คืนได้`,
      confirmText: 'ใช่, ลบเลย',
      cancelText: 'ยกเลิก',
    });

    if (isConfirmed) {
      const success = await deleteNews(news.id, news.image_url || null);
      if (success) {
        showToast('ลบข่าวสารเรียบร้อยแล้ว', 'success');
        loadNews();
      } else {
        showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
      }
    }
  };

  const togglePublish = async (news) => {
    const newStatus = !news.is_published;
    const success = await updateNews(news.id, { is_published: newStatus });
    if (success) {
      showToast(newStatus ? 'เปิดแสดงผลข่าวสารแล้ว' : 'ซ่อนข่าวสารเรียบร้อยแล้ว', 'success');
      loadNews();
    } else {
      showToast('ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered news
  const filteredNews = newsList.filter((item) => {
    const matchSearch =
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'published') return matchSearch && item.is_published;
    if (statusFilter === 'draft') return matchSearch && !item.is_published;
    return matchSearch;
  });

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'max(24px, calc(16px + env(safe-area-inset-bottom)))',
            right: 24,
            zIndex: 10000,
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background:
              toast.type === 'error'
                ? '#dc2626'
                : toast.type === 'info'
                ? '#2563eb'
                : '#059669',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            maxWidth: '90vw',
          }}
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={18} />
          ) : toast.type === 'info' ? (
            <Info size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.message}</span>
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
            <Megaphone size={14} /> ข่าวสารและประกาศ กยศ.
          </div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, var(--text-2xl))', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
            จัดการข่าวสารและประกาศ
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            สร้าง แก้ไข หรือซ่อนประกาศสำคัญสำหรับนักศึกษากองทุน กยศ. มทร.ศรีวิชัย
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, padding: '10px 18px' }}
        >
          <Plus size={18} />
          เพิ่มข่าวสารใหม่
        </button>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามหัวข้อ หรือเนื้อหาข่าวสาร..."
            style={{ paddingLeft: '36px', fontSize: 'var(--text-xs)', height: 38 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `ทั้งหมด (${newsList.length})` },
              { id: 'published', label: `🟢 แสดงผล (${newsList.filter((n) => n.is_published).length})` },
              { id: 'draft', label: `🟡 ซ่อนไว้ (${newsList.filter((n) => !n.is_published).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === tab.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                  color: statusFilter === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--color-border)', margin: '0 4px' }} />

          {/* View Mode Toggle */}
          <div style={{ display: 'inline-flex', background: 'var(--color-bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
              title="มุมมองการ์ดภาพใหญ่"
            >
              <LayoutGrid size={14} />
              <span style={{ display: 'inline' }}>การ์ดภาพใหญ่</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
              title="มุมมองรายการละเอียด"
            >
              <List size={14} />
              <span style={{ display: 'inline' }}>รายการละเอียด</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── News List Content ── */}
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Megaphone size={48} style={{ margin: '0 auto 12px', color: 'var(--color-text-muted)', opacity: 0.5 }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              {searchQuery ? 'ไม่พบข่าวสารที่ตรงกับคำค้นหา' : 'ยังไม่มีข่าวสารในระบบ'}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {searchQuery ? 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง' : 'กดปุ่ม "เพิ่มข่าวสารใหม่" เพื่อเริ่มสร้างประกาศสำหรับนักศึกษา'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid View with Large Prominent Images & Typography ── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 'var(--space-lg, 24px)',
            }}
          >
            {filteredNews.map((news) => (
              <div
                key={news.id}
                className="card card-glow"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg, 16px)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-primary)',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Large 16:9 Cover Banner */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    minHeight: '200px',
                    background: 'var(--color-bg-secondary, #f8fafc)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {news.image_url ? (
                    <img
                      src={news.image_url}
                      alt={news.title}
                      onClick={() => setPreviewImageModal(news.image_url)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        cursor: 'zoom-in',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title="คลิกเพื่อดูภาพขนาดใหญ่เต็มจอ"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'var(--color-text-muted)',
                        background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
                      }}
                    >
                      <Megaphone size={40} style={{ opacity: 0.25 }} />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>ไม่มีรูปภาพประกอบ</span>
                    </div>
                  )}

                  {/* Floating Status Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 2,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublish(news);
                      }}
                      className={`badge ${news.is_published ? 'badge-emerald' : 'badge-amber'}`}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        backdropFilter: 'blur(8px)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        borderRadius: 'var(--radius-full)',
                      }}
                      title="คลิกเพื่อสลับสถานะ แสดง/ซ่อน"
                    >
                      {news.is_published ? (
                        <>
                          <Eye size={13} /> แสดงผล
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} /> ซ่อนไว้
                        </>
                      )}
                    </button>
                  </div>

                  {/* Zoom full image button */}
                  {news.image_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewImageModal(news.image_url)}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 'var(--radius-full)',
                        padding: '5px 12px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backdropFilter: 'blur(6px)',
                        zIndex: 2,
                        transition: 'all 0.15s ease',
                      }}
                      title="ดูภาพขนาดใหญ่เต็มจอ"
                    >
                      <Maximize2 size={13} /> ดูภาพเต็ม
                    </button>
                  )}
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: '12px',
                  }}
                >
                  {/* Category & Date */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                      }}
                    >
                      <Megaphone size={14} /> ประกาศ กยศ.
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <Calendar size={13} /> {formatDate(news.created_at)}
                    </span>
                  </div>

                  {/* Large Title */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--color-text-primary)',
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {news.title}
                  </h3>

                  {/* Rich Content Preview */}
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.65,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {news.content}
                  </div>

                  {/* Footer Actions */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => togglePublish(news)}
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {news.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                      {news.is_published ? 'ซ่อน' : 'แสดง'}
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenModal(news)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          padding: '6px 14px',
                          fontSize: 'var(--text-xs)',
                        }}
                      >
                        <Edit2 size={14} /> แก้ไข
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#dc2626',
                          borderColor: 'rgba(220, 38, 38, 0.3)',
                          fontWeight: 600,
                          padding: '6px 12px',
                          fontSize: 'var(--text-xs)',
                        }}
                        onClick={() => handleDelete(news)}
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Detailed List View with Large 16:9 Thumbnails ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filteredNews.map((news) => (
              <div
                key={news.id}
                className="card card-glow"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg, 16px)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-primary)',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Large Thumbnail */}
                <div
                  style={{
                    width: '280px',
                    minWidth: '240px',
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    background: 'var(--color-bg-secondary, #f8fafc)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {news.image_url ? (
                    <img
                      src={news.image_url}
                      alt={news.title}
                      onClick={() => setPreviewImageModal(news.image_url)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        cursor: 'zoom-in',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title="คลิกเพื่อดูภาพขนาดใหญ่"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <Megaphone size={34} style={{ opacity: 0.3 }} />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>ไม่มีภาพประกอบ</span>
                    </div>
                  )}

                  {news.image_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewImageModal(news.image_url)}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 'var(--radius-full)',
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(4px)',
                      }}
                      title="ดูภาพขนาดเต็ม"
                    >
                      <Maximize2 size={12} /> ดูภาพเต็ม
                    </button>
                  )}
                </div>

                {/* Content on Right */}
                <div
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 320px',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => togglePublish(news)}
                        className={`badge ${news.is_published ? 'badge-emerald' : 'badge-amber'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {news.is_published ? (
                          <>
                            <Eye size={13} /> แสดงผล
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} /> ซ่อนไว้
                          </>
                        )}
                      </button>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} /> {formatDate(news.created_at)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenModal(news)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                      >
                        <Edit2 size={14} /> แก้ไข
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                        onClick={() => handleDelete(news)}
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
                    {news.title}
                  </h3>

                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.65,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {news.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen Image Lightbox Modal ── */}
      {previewImageModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              style={{
                position: 'absolute',
                top: -46,
                right: 0,
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                color: '#ffffff',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              title="ปิดการดูภาพ"
            >
              <X size={22} />
            </button>
            <img
              src={previewImageModal}
              alt="ภาพข่าวสารขนาดเต็ม"
              style={{
                maxWidth: '100%',
                maxHeight: '84vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-lg, 16px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Modern Easy-to-Use Form Modal ── */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'max(12px, env(safe-area-inset-top, 12px)) max(12px, env(safe-area-inset-right, 12px)) max(12px, env(safe-area-inset-bottom, 12px)) max(12px, env(safe-area-inset-left, 12px))',
            boxSizing: 'border-box',
          }}
          onClick={handleCloseModal}
        >
          <div
            className="card animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            onPaste={handlePaste}
            style={{
              width: '100%',
              maxWidth: 840,
              maxHeight: 'min(92dvh, 880px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px clamp(14px, 3vw, 24px)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-bg-secondary)',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.125rem)', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                    {editingNews ? 'แก้ไขข่าวสารและประกาศ' : 'เพิ่มข่าวสารและประกาศใหม่'}
                  </h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    กรอกข้อมูลประกาศสำหรับนักศึกษากองทุน กยศ.
                  </p>
                </div>
              </div>

              {/* View Switcher: Edit vs Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', background: 'var(--color-bg-tertiary)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: activeTab === 'edit' ? 'var(--color-primary)' : 'transparent',
                      color: activeTab === 'edit' ? '#ffffff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit2 size={12} /> แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: activeTab === 'preview' ? 'var(--color-primary)' : 'transparent',
                      color: activeTab === 'preview' ? '#ffffff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Eye size={12} /> ดูตัวอย่าง
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseModal}
                  style={{ padding: 6, borderRadius: '50%', color: 'var(--color-text-muted)' }}
                  title="ปิดหน้าต่าง"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  padding: 'clamp(14px, 3vw, 22px)',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                {activeTab === 'edit' ? (
                  <>
                    {/* Quick Presets / Templates */}
                    {!editingNews && (
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 8, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary)' }}>
                          <Sparkles size={14} /> แม่แบบประกาศด่วน (คลิกเพื่อใช้งาน):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {NEWS_TEMPLATES.map((tpl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => applyTemplate(tpl)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 500,
                                background: 'var(--color-bg-primary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {tpl.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Field 1: Title */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label htmlFor="news-title" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          หัวข้อข่าวสาร <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <span style={{ fontSize: '0.7rem', color: formData.title.length > 130 ? '#dc2626' : 'var(--color-text-muted)' }}>
                          {formData.title.length} / 150 ตัวอักษร
                        </span>
                      </div>
                      <input
                        id="news-title"
                        type="text"
                        className="input"
                        value={formData.title}
                        maxLength={150}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="เช่น กำหนดการยื่นแบบเบิกเงินกู้ยืม กยศ. ภาคเรียนที่ 1/2568"
                        style={{ height: 44, fontSize: 'var(--text-base)', fontWeight: 600 }}
                        required
                      />
                    </div>

                    {/* Field 2: Image Upload (Drag & Drop + Paste from clipboard) */}
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                        รูปภาพประกอบ (รองรับลากวางไฟล์ หรือกด Ctrl+V เพื่อวางภาพ)
                      </label>

                      {imagePreview ? (
                        <div
                          style={{
                            position: 'relative',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-secondary)',
                          }}
                        >
                          <img
                            src={imagePreview}
                            alt="ตัวอย่างรูปภาพ"
                            style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                            }}
                          >
                            <span style={{ fontSize: 'var(--text-xs)', color: '#ffffff', fontWeight: 600 }}>
                              {imageFileName || 'รูปภาพประกอบ'} {imageFileSize && `(${imageFileSize})`}
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.7rem', background: '#ffffff', color: '#0f172a' }}
                              >
                                เปลี่ยนรูป
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.7rem', background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
                              >
                                ลบรูป
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          style={{
                            border: isDragging ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.5rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            background: isDragging ? 'var(--color-primary-soft)' : 'var(--color-bg-secondary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ImagePlus size={28} style={{ margin: '0 auto 6px', color: 'var(--color-primary)' }} />
                          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                            คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                            JPG, PNG, WEBP (ไม่เกิน 5MB) · สามารถกด Ctrl+V เพื่อวางภาพได้ทันที
                          </p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {/* Field 3: Content + Quick Formatting Toolbar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label htmlFor="news-content" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          เนื้อหารายละเอียดข่าวสาร <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {formData.content.length} ตัวอักษร
                        </span>
                      </div>

                      {/* Formatting Helper Buttons */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 6px',
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                          borderBottom: 'none',
                          borderTopLeftRadius: 'var(--radius-md)',
                          borderTopRightRadius: 'var(--radius-md)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => insertContentSnippet('**ข้อความตัวหนา**')}
                          title="ตัวหนา"
                          style={{
                            padding: '3px 6px',
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Bold size={11} /> ตัวหนา
                        </button>
                        <button
                          type="button"
                          onClick={() => insertContentSnippet('\n• ')}
                          title="รายการสัญลักษณ์"
                          style={{
                            padding: '3px 6px',
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <List size={11} /> รายการ
                        </button>
                        <button
                          type="button"
                          onClick={() => insertContentSnippet('\n📅 วันที่: ')}
                          title="ใส่วันที่"
                          style={{
                            padding: '3px 6px',
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          📅 วันที่
                        </button>
                        <button
                          type="button"
                          onClick={() => insertContentSnippet('\n⚠️ หมายเหตุ: ')}
                          title="ใส่หมายเหตุ"
                          style={{
                            padding: '3px 6px',
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          ⚠️ หมายเหตุ
                        </button>
                        <button
                          type="button"
                          onClick={() => insertContentSnippet('\n📞 สอบถามเพิ่มเติม: ')}
                          title="ใส่เบอร์ติดต่อ"
                          style={{
                            padding: '3px 6px',
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Phone size={10} /> เบอร์ติดต่อ
                        </button>
                      </div>

                      <textarea
                        ref={contentInputRef}
                        id="news-content"
                        className="input"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="พิมพ์เนื้อหาข่าวสารที่นี่ (ขึ้นบรรทัดใหม่ได้อิสระ)"
                        rows={7}
                        style={{
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          fontSize: 'var(--text-sm)',
                          lineHeight: 1.6,
                          resize: 'vertical',
                        }}
                        required
                      />
                    </div>

                    {/* Field 4: Publishing Toggle Card */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: formData.is_published ? '#ecfdf5' : '#fefce8',
                        border: `1px solid ${formData.is_published ? '#a7f3d0' : '#fef08a'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: formData.is_published ? '#10b981' : '#f59e0b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {formData.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: formData.is_published ? '#065f46' : '#92400e' }}>
                            {formData.is_published ? '🟢 เผยแพร่ทันที (Published)' : '🟡 บันทึกเป็นฉบับร่าง (Draft)'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: formData.is_published ? '#047857' : '#b45309' }}>
                            {formData.is_published
                              ? 'นักศึกษาจะสามารถเห็นข่าวสารนี้ได้ทันทีบนหน้าเว็บไซต์'
                              : 'บันทึกไว้ในระบบเพื่อแก้ไขต่อ ยังไม่แสดงผลให้นักศึกษาเห็น'}
                          </div>
                        </div>
                      </div>

                      {/* Custom iOS-style Switch */}
                      <div
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          background: formData.is_published ? '#10b981' : '#cbd5e1',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: 2,
                            left: formData.is_published ? 22 : 2,
                            transition: 'left 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── Live Preview Tab ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={14} /> ตัวอย่างการแสดงผลบนหน้าข่าวสารของนักศึกษา:
                    </div>

                    <div
                      className="card card-glow"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                      }}
                    >
                      {imagePreview && (
                        <div style={{ width: '100%', minHeight: 220, maxHeight: 380, overflow: 'hidden', background: 'var(--color-bg-secondary, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={imagePreview}
                            alt=""
                            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                          />
                        </div>
                      )}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                          <Megaphone size={16} />
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>ประกาศ กยศ. มทร.ศรีวิชัย</span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: formData.is_published ? '#ecfdf5' : '#fefce8',
                              color: formData.is_published ? '#059669' : '#ca8a04',
                            }}
                          >
                            {formData.is_published ? 'แสดงผล' : 'ฉบับร่าง'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                          {formData.title || '(ยังไม่ได้ระบุหัวข้อข่าวสาร)'}
                        </h3>

                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {formData.content || '(ยังไม่ได้ระบุเนื้อหารายละเอียด)'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                          <Calendar size={12} /> ประกาศเมื่อ: {formatDate(new Date())}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px clamp(14px, 3vw, 24px)',
                  paddingBottom: 'max(14px, calc(10px + env(safe-area-inset-bottom, 0px)))',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap-reverse',
                  gap: '10px',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseModal}
                  disabled={saving}
                  style={{ minHeight: 40, flex: '1 1 80px', justifyContent: 'center' }}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 20px',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    minHeight: 40,
                    flex: '2 1 180px',
                  }}
                >
                  {saving ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }} />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingNews ? 'บันทึกการแก้ไข' : 'บันทึกและเผยแพร่'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
