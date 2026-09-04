import { useState, useEffect, useRef } from 'react';
import { getAllNews, createNews, updateNews, deleteNews, deleteNewsImage } from '../../lib/newsApi';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Megaphone, Calendar, ImagePlus, XCircle } from 'lucide-react';

export default function AdminNews() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_published: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    const data = await getAllNews();
    setNewsList(data || []);
    setLoading(false);
  }

  const handleOpenModal = (news = null) => {
    if (news) {
      setEditingNews(news);
      setFormData({ title: news.title, content: news.content, is_published: news.is_published });
      setImagePreview(news.image_url || null);
    } else {
      setEditingNews(null);
      setFormData({ title: '', content: '', is_published: true });
      setImagePreview(null);
    }
    setImageFile(null);
    setRemoveExistingImage(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
    setFormData({ title: '', content: '', is_published: true });
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setImageFile(file);
    setRemoveExistingImage(false);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหาข่าวสาร');
      return;
    }

    setSaving(true);
    let success;
    if (editingNews) {
      const updates = { ...formData };
      // If user removed image without adding new one
      if (removeExistingImage && !imageFile) {
        // Delete old image from storage
        if (editingNews.image_url) {
          await deleteNewsImage(editingNews.image_url);
        }
        updates.image_url = null;
      }
      success = await updateNews(editingNews.id, updates, imageFile || null, editingNews.image_url);
    } else {
      success = await createNews(formData.title, formData.content, formData.is_published, imageFile || null);
    }

    setSaving(false);
    if (success) {
      handleCloseModal();
      loadNews();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (news) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข่าวสารนี้? ข้อมูลที่ลบจะไม่สามารถกู้คืนได้')) {
      const success = await deleteNews(news.id, news.image_url || null);
      if (success) {
        loadNews();
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const togglePublish = async (news) => {
    const success = await updateNews(news.id, { is_published: !news.is_published });
    if (success) {
      loadNews();
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>จัดการข่าวสาร</h1>
          <p>เพิ่ม แก้ไข หรือลบประกาศแจ้งเตือนสำหรับนักศึกษา</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          เพิ่มข่าวสารใหม่
        </button>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
          </div>
        ) : newsList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Megaphone size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-text-muted)' }}>ยังไม่มีข่าวสารในระบบ</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>รูป</th>
                  <th style={{ width: '40%' }}>หัวข้อข่าว</th>
                  <th>วันที่ประกาศ</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {newsList.map((news) => (
                  <tr key={news.id}>
                    <td>
                      {news.image_url ? (
                        <img
                          src={news.image_url}
                          alt=""
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)'
                        }}>
                          <Megaphone size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {news.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {news.content}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        <Calendar size={14} />
                        {formatDate(news.created_at)}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => togglePublish(news)}
                        className={`badge ${news.is_published ? 'badge-emerald' : 'badge-amber'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="คลิกเพื่อเปลี่ยนสถานะ"
                        aria-pressed={news.is_published}
                        aria-label={news.is_published ? 'ซ่อนข่าวสารนี้' : 'แสดงข่าวสารนี้'}
                      >
                        {news.is_published ? (
                          <><Eye size={12} /> แสดงผล</>
                        ) : (
                          <><EyeOff size={12} /> ซ่อน</>
                        )}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleOpenModal(news)}
                          title="แก้ไข"
                          aria-label="แก้ไขข่าวสาร"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          style={{ color: 'var(--color-brand-rose)', borderColor: 'rgba(225, 29, 72, 0.2)' }}
                          onClick={() => handleDelete(news)}
                          title="ลบ"
                          aria-label="ลบข่าวสาร"
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingNews ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสารใหม่'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="title" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>หัวข้อข่าวสาร</label>
                  <input
                    id="title"
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น กำหนดการยื่นแบบเบิกเงินกู้ยืมภาคเรียนที่ 1/2567"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>รูปภาพประกอบ (ไม่บังคับ)</label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        title="ลบรูปภาพ"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        transition: 'border-color 0.2s, background 0.2s',
                        background: 'var(--color-bg-tertiary)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-brand-indigo)'; e.currentTarget.style.background = 'rgba(30, 58, 138, 0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-tertiary)'; }}
                    >
                      <ImagePlus size={36} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                      <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>คลิกเพื่อเลือกรูปภาพ</p>
                      <p style={{ fontSize: 'var(--text-xs)', margin: '4px 0 0', opacity: 0.7 }}>รองรับ JPG, PNG, WEBP (ไม่เกิน 5MB)</p>
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

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="content" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>เนื้อหารายละเอียด</label>
                  <textarea
                    id="content"
                    className="input"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="พิมพ์รายละเอียดเนื้อหาข่าวที่นี่ (สามารถเว้นบรรทัดได้)"
                    rows={8}
                    required
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input
                    id="is_published"
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="is_published" style={{ fontSize: 'var(--text-sm)' }}>
                    เปิดให้ผู้ใช้เห็นทันที (แสดงผลหน้าข่าวสาร)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <div className="spinner" style={{ width: '18px', height: '18px' }}></div> : <Save size={18} />}
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
