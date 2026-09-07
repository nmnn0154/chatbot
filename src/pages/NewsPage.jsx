import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedNews } from '../lib/newsApi';
import { Megaphone, Calendar, X, MessageSquare } from 'lucide-react';

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);

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
                  <div style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', background: 'var(--color-bg-tertiary)' }}>
                    <img
                      src={news.image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{selectedNews.title}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedNews(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                <Calendar size={16} />
                ประกาศเมื่อ: {formatDate(selectedNews.created_at)}
              </div>

              {selectedNews.image_url && (
                <div style={{ marginBottom: '20px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <img
                    src={selectedNews.image_url}
                    alt={selectedNews.title}
                    style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
                  />
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
    </div>
  );
}
