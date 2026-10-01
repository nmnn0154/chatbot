import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedNews } from '../lib/newsApi';
import { Megaphone, Calendar, X, MessageSquare, Maximize2, ExternalLink, ZoomIn } from 'lucide-react';

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    const data = await getPublishedNews();
    setNewsList(data || []);
    setLoading(false);
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>ข่าวสารและประกาศ</h1>
          <p>ข่าวสารล่าสุดเกี่ยวกับการกู้ยืมและกิจกรรมต่างๆ ของ กยศ.</p>
        </div>
        <Link to="/chat" className="btn btn-primary">
          <MessageSquare size={18} />
          กลับไปหน้าแชท
        </Link>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : newsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <Megaphone size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข่าวสารในขณะนี้</p>
          </div>
        ) : (
          <div className="news-grid stagger-children" style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {newsList.map(news => (
              <div
                key={news.id}
                className="card card-glow"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
                onClick={() => setSelectedNews(news)}
              >
                {news.image_url && (
                  <div style={{ width: '100%', height: '220px', overflow: 'hidden', background: 'var(--color-bg-secondary, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={news.image_url}
                      alt=""
                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                )}
                {/* Card Content */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-brand-violet)' }}>
                    <Megaphone size={18} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>ประกาศ กยศ.</span>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                    {news.title}
                  </h3>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {news.content.split('\n').map((line, i) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <Calendar size={14} />
                    {formatDate(news.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing full news */}
      {selectedNews && (
        <div className="modal-backdrop" onClick={() => setSelectedNews(null)}>
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '860px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h2>{selectedNews.title}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedNews(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                <Calendar size={16} />
                ประกาศเมื่อ: {formatDate(selectedNews.created_at)}
              </div>

              {selectedNews.image_url && (
                <div
                  style={{
                    flexShrink: 0,
                    width: '100%',
                    marginBottom: '20px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary, #f8fafc)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      minHeight: '280px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '16px',
                      cursor: 'zoom-in',
                      background: 'rgba(0, 0, 0, 0.02)',
                    }}
                    onClick={() => setZoomImage(selectedNews.image_url)}
                    title="คลิกเพื่อดูภาพขนาดใหญ่เต็มจอ"
                  >
                    <img
                      src={selectedNews.image_url}
                      alt={selectedNews.title}
                      style={{
                        maxWidth: '100%',
                        width: 'auto',
                        height: 'auto',
                        maxHeight: '65vh',
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: '8px 14px',
                      background: 'var(--color-bg-primary)',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <ZoomIn size={14} style={{ color: 'var(--color-primary)' }} /> คลิกที่รูปภาพเพื่อดูภาพขยายขนาดเต็ม
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setZoomImage(selectedNews.image_url)}
                        style={{ padding: '3px 10px', fontSize: 'var(--text-xs)' }}
                      >
                        <Maximize2 size={13} style={{ marginRight: 4 }} /> ดูภาพขนาดเต็ม
                      </button>
                      <a
                        href={selectedNews.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '3px 8px', fontSize: 'var(--text-xs)' }}
                        title="เปิดรูปภาพในแท็บใหม่"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 'var(--text-base)', lineHeight: 1.8, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
                {selectedNews.content}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedNews(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Full Image Modal */}
      {zoomImage && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10002,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setZoomImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '95vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'absolute',
                top: -46,
                right: 0,
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <a
                href={zoomImage}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  color: '#ffffff',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="เปิดภาพในแท็บใหม่"
              >
                <ExternalLink size={18} />
              </a>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#ffffff',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                title="ปิดการดูภาพ"
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={zoomImage}
              alt="ภาพขนาดเต็ม"
              style={{
                maxWidth: '100%',
                maxHeight: '88vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
