import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getFaqs } from '../../lib/faqApi';
import {
  BookOpen,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalKB: 0,
    totalChats: 0,
    totalUsers: 0,
    todayChats: 0,
    avgRating: 0,
  });
  const [frequentQuestions, setFrequentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get knowledge base count
      const { count: kbCount } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });

      // Get total chat count
      const { count: chatCount } = await supabase
        .from('chat_histories')
        .select('*', { count: 'exact', head: true });

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get today's chat count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('chat_histories')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get messages and ratings for frequency analysis inside Insights
      const { data: historyData } = await supabase
        .from('chat_histories')
        .select('user_message, bot_response, rating')
        .order('created_at', { ascending: false })
        .limit(500);

      const freq = {};
      let totalRatingSum = 0;
      let totalRatedMessages = 0;

      if (historyData) {
        historyData.forEach(chat => {
          if (chat.rating) {
            totalRatingSum += chat.rating;
            totalRatedMessages++;
          }
          if (chat.user_message) {
            const msg = chat.user_message.trim();
            if (msg) {
              if (!freq[msg]) {
                 freq[msg] = { count: 0, latest_answer: chat.bot_response, ratingSum: 0, ratedCount: 0 };
              }
              freq[msg].count += 1;
              if (chat.rating) {
                freq[msg].ratingSum += chat.rating;
                freq[msg].ratedCount += 1;
              }
            }
          }
        });
      }
      
      const overallAvgRating = totalRatedMessages > 0 ? (totalRatingSum / totalRatedMessages).toFixed(1) : 0;

      const topQuestions = Object.keys(freq)
        .map((msg, index) => {
            const item = freq[msg];
            const avgQ = item.ratedCount > 0 ? (item.ratingSum / item.ratedCount).toFixed(1) : null;
            return { 
              id: index, 
              user_message: msg, 
              count: item.count, 
              bot_response: item.latest_answer,
              avgRating: avgQ
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalKB: kbCount || 0,
        totalChats: chatCount || 0,
        totalUsers: userCount || 0,
        todayChats: todayCount || 0,
        avgRating: overallAvgRating,
      });

      setFrequentQuestions(topQuestions);
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" id="admin-dashboard">
      <div className="page-header">
        <h1>แดชบอร์ดผู้ดูแลระบบ</h1>
        <p>ภาพรวมระบบ กยศ. Chatbot — มทร.ศรีวิชัย</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger-children">
        <div className="card card-glow stat-card">
          <div className="stat-icon stat-icon-indigo">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalKB}</h3>
            <p>ฐานความรู้ทั้งหมด</p>
          </div>
        </div>

        <div className="card card-glow stat-card">
          <div className="stat-icon stat-icon-cyan">
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalChats}</h3>
            <p>แชททั้งหมด</p>
          </div>
        </div>

        <div className="card card-glow stat-card">
          <div className="stat-icon stat-icon-emerald">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>ผู้ใช้ทั้งหมด</p>
          </div>
        </div>

        <div className="card card-glow stat-card">
          <div className="stat-icon stat-icon-amber">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.todayChats}</h3>
            <p>แชทวันนี้</p>
          </div>
        </div>

        <div className="card card-glow stat-card">
          <div className="stat-icon stat-icon-emerald" style={{ color: 'var(--color-warning)' }}>
            <span style={{ fontSize: '1.5rem' }}>★</span>
          </div>
          <div className="stat-content">
            <h3>{stats.avgRating > 0 ? stats.avgRating : '-'}</h3>
            <p>คะแนนความพึงพอใจ</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
        {/* Frequent Questions */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>🔍 Insights: คำถามที่ผู้ใช้งานแชทเข้ามาบ่อย</h2>
          </div>

          {frequentQuestions.length === 0 ? (
            <div className="empty-state">
              <TrendingUp size={32} />
              <p>ยังไม่มีข้อมูลคำถามจากผู้ใช้</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {frequentQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => toggleExpand(q.id)}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--color-bg-hover)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: expandedId === q.id ? '1px solid var(--color-brand)' : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: expandedId === q.id ? 600 : 400, flex: 1, paddingRight: 'var(--space-md)' }}>
                      "{q.user_message}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {q.avgRating && (
                        <div style={{ background: 'var(--color-bg-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-warning)' }}>
                          ★ {q.avgRating}
                        </div>
                      )}
                      <div style={{ background: 'var(--color-bg-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand)' }}>
                        ถาม {q.count} ครั้ง
                      </div>
                      {expandedId === q.id ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                    </div>
                  </div>
                  {expandedId === q.id && (
                     <div className="animate-fade-in" style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                       <strong>คำตอบจาก AI:</strong><br />
                       {q.bot_response || '(ไม่มีคำตอบ)'}
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card" style={{ flex: 1 }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
            ⚡ การจัดการ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <Link
              to="/admin/knowledge-base"
              className="card card-glow"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', textDecoration: 'none', cursor: 'pointer' }}
            >
              <div className="stat-icon stat-icon-indigo">
                <BookOpen size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  จัดการฐานความรู้
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  เพิ่ม แก้ไข ลบข้อมูล FAQ
                </p>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--color-text-muted)' }} />
            </Link>

            <Link
              to="/admin/faqs"
              className="card card-glow"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', textDecoration: 'none', cursor: 'pointer' }}
            >
              <div className="stat-icon stat-icon-cyan">
                <HelpCircle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  จัดการ FAQ
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  ควบคุมคำถาม-คำตอบพื้นฐาน
                </p>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--color-text-muted)' }} />
            </Link>

            <Link
              to="/chat"
              className="card card-glow"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', textDecoration: 'none', cursor: 'pointer' }}
            >
              <div className="stat-icon stat-icon-emerald">
                <MessageSquare size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ทดสอบแชทบอท
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  ทดลองสนทนากับ AI
                </p>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--color-text-muted)' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
