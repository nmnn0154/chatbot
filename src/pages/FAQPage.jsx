import { useState, useEffect, useMemo, useRef } from 'react';
import { getFaqs, incrementFaqUsage } from '../lib/faqApi';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const listTopRef = useRef(null);

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

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase().trim();
    return faqs.filter(
      (f) =>
        f.question?.toLowerCase().includes(query) ||
        f.answer?.toLowerCase().includes(query)
    );
  }, [faqs, searchQuery]);

  const totalPages = Math.ceil(filteredFaqs.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredFaqs.length);

  const paginatedFaqs = useMemo(() => {
    return filteredFaqs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFaqs, startIndex]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedId(null);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
    setExpandedId(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      incrementFaqUsage(id);
    }
  };

  // Generate page numbers array with ellipsis if many pages
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (safeCurrentPage > 3) {
      pages.push('...');
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="page-container animate-fade-in" id="faq-page" ref={listTopRef}>
      <div className="faq-header-wrapper">
        <div className="faq-header-info">
          <h1>คำถามที่พบบ่อย (FAQ)</h1>
          <p>รวมคำถามและคำตอบเบื้องต้น คุณสามารถหาคำตอบได้ทันทีที่นี่ (แสดงครั้งละ 10 คำถาม)</p>
        </div>
        <div className="faq-header-actions">
          <Link to="/chat" className="btn btn-primary">
            <MessageSquare size={18} />
            <span>กลับไปหน้าแชท</span>
          </Link>
        </div>
      </div>

      {/* Search Bar & Summary */}
      <div className="faq-search-wrapper">
        <div className="faq-search-box">
          <div className="faq-search-input-wrapper">
            <Search size={18} className="faq-search-icon" />
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ค้นหาคำถามหรือคำสำคัญ..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="faq-search-clear-btn"
                title="ล้างการค้นหา"
                aria-label="ล้างการค้นหา"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {!loading && filteredFaqs.length > 0 && (
          <div className="faq-count-badge">
            <Layers size={16} style={{ color: 'var(--color-brand)' }} />
            <span>
              แสดง <strong>{startIndex + 1} - {endIndex}</strong> จากทั้งหมด <strong>{filteredFaqs.length}</strong> คำถาม
              {totalPages > 1 && <span> (หน้า {safeCurrentPage} จาก {totalPages})</span>}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="empty-state">
          <HelpCircle size={48} />
          <p>{searchQuery ? 'ไม่พบคำถามที่ตรงกับคำค้นหาของคุณ' : 'ยังไม่มีข้อมูลคำถามที่พบบ่อยในขณะนี้'}</p>
          {searchQuery && (
            <button className="btn btn-secondary btn-sm" onClick={clearSearch} style={{ marginTop: 'var(--space-sm)' }}>
              ล้างคำค้นหา
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {paginatedFaqs.map((faq, index) => {
              const itemNumber = startIndex + index + 1;
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id || index}
                  className={`faq-item-card card-glow ${isExpanded ? 'active' : ''}`}
                  onClick={() => toggleExpand(faq.id)}
                >
                  <div className="faq-item-question-row">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                      <span
                        className="faq-item-number"
                        style={{
                          backgroundColor: isExpanded ? 'var(--color-brand)' : 'var(--color-bg-tertiary)',
                          color: isExpanded ? '#ffffff' : 'var(--color-text-secondary)',
                        }}
                      >
                        {itemNumber}
                      </span>
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          lineHeight: 1.5,
                          color: isExpanded ? 'var(--color-brand)' : 'var(--color-text-primary)',
                          margin: 0,
                        }}
                      >
                        {faq.question}
                      </h3>
                    </div>
                    <div style={{ color: isExpanded ? 'var(--color-brand)' : 'var(--color-text-muted)', flexShrink: 0, marginTop: '2px' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="faq-item-answer animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="faq-pagination-container">
              <div className="faq-pagination-info">
                หน้า <strong>{safeCurrentPage}</strong> จากทั้งหมด <strong>{totalPages}</strong> หน้า (คำถามที่ {startIndex + 1} - {endIndex})
              </div>

              <div className="faq-pagination-controls">
                <button
                  type="button"
                  className="faq-pagination-btn"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft size={16} />
                  <span className="faq-pagination-nav-text">ก่อนหน้า</span>
                </button>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '30px',
                          height: '36px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`faq-pagination-btn ${safeCurrentPage === p ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="faq-pagination-btn"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  title="หน้าถัดไป"
                >
                  <span className="faq-pagination-nav-text">ถัดไป</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
