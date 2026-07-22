import { useState, useEffect } from 'react';
import { getFaqs, incrementFaqUsage } from '../lib/faqApi';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    setLoading(true);
    try {
      const data = await getFaqs();
      setFaqs(data || []);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Increment usage count in the background
      incrementFaqUsage(id);
    }
  };

  return (
    <div className="page-container animate-fade-in" id="faq-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>❓ คำถามที่พบบ่อย (FAQ)</h1>
          <p>รวมคำถามและคำตอบเบื้องต้น คุณสามารถหาคำตอบได้ทันทีที่นี่</p>
        </div>
        <Link to="/chat" className="btn btn-primary">
          <MessageSquare size={18} />
          กลับไปหน้าแชท
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : faqs.length === 0 ? (
        <div className="empty-state">
          <HelpCircle size={48} />
          <p>ยังไม่มีข้อมูลคำถามที่พบบ่อยในขณะนี้</p>
        </div>
      ) : (
        <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`card card-glow ${expandedId === faq.id ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                padding: 'var(--space-lg)',
                border: expandedId === faq.id ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => toggleExpand(faq.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: expandedId === faq.id ? 'var(--color-brand)' : 'var(--color-text-primary)' }}>
                  {faq.question}
                </h3>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  {expandedId === faq.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>

              {expandedId === faq.id && (
                <div
                  className="animate-fade-in"
                  style={{
                    marginTop: 'var(--space-md)',
                    paddingTop: 'var(--space-md)',
                    borderTop: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
