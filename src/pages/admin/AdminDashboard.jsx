import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { downloadCsv } from '../../lib/csv';
import {
  BookOpen,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileDown,
  Star,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Megaphone,
  CheckCircle2,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';

/* ─── Modern SVG Bar Chart ──────────────────────────────────── */
function ModernBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <TrendingUp size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>ยังไม่มีข้อมูลการสนทนาในรอบ 7 วันนี้</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const chartH = 150;
  const barW = 32;
  const gap = 16;
  const paddingLeft = 32;
  const paddingBottom = 32;
  const paddingTop = 20;
  const totalW = paddingLeft + data.length * (barW + gap) - gap + 16;

  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '0.5rem 0' }}>
      <svg
        viewBox={`0 0 ${totalW} ${chartH + paddingBottom + paddingTop}`}
        width="100%"
        style={{ minWidth: 360, overflow: 'visible', display: 'block' }}
        aria-label="กราฟแท่งแสดงปริมาณการใช้งานรายวัน"
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const val = Math.round(maxVal * ratio);
          const y = paddingTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                x2={totalW - 8}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={0.8}
                strokeDasharray="4 4"
                opacity={0.7}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="var(--color-text-muted)"
                fontWeight={500}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingLeft + i * (barW + gap);
          const barH = Math.max((d.count / maxVal) * chartH, d.count > 0 ? 6 : 2);
          const y = paddingTop + chartH - barH;

          return (
            <g key={i} className="chart-bar-group" style={{ cursor: 'pointer' }}>
              {/* Background Track */}
              <rect
                x={x}
                y={paddingTop}
                width={barW}
                height={chartH}
                rx={6}
                fill="var(--color-bg-tertiary)"
                opacity={0.4}
              />

              {/* Active Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill="url(#barGradient)"
                style={{ transition: 'all 0.3s ease' }}
              >
                <title>{d.label}: {d.count} ครั้ง</title>
              </rect>

              {/* Value label on top */}
              {d.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#1e3a8a"
                >
                  {d.count}
                </text>
              )}

              {/* Date label at bottom */}
              <text
                x={x + barW / 2}
                y={paddingTop + chartH + 20}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-text-secondary)"
                fontWeight={500}
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={paddingLeft}
          x2={totalW - 8}
          y1={paddingTop + chartH}
          y2={paddingTop + chartH}
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

/* ─── Modern Donut Chart with Progress Bars ─────────────────── */
function ModernDonutChart({ data, avgRating }) {
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#0ea5e9', '#10b981'];
  const LABELS = ['1 ดาว', '2 ดาว', '3 ดาว', '4 ดาว', '5 ดาว'];

  const total = data ? data.reduce((s, v) => s + v, 0) : 0;

  if (!total) {
    return (
      <div className="empty-state" style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Star size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>ยังไม่มีข้อมูลคะแนนประเมิน</p>
      </div>
    );
  }

  const cx = 75, cy = 75, r = 56, innerR = 38;
  let startAngle = -Math.PI / 2;

  const slices = data.map((v, i) => {
    const angle = (v / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      'Z',
    ].join(' ');
    const slice = { path, color: COLORS[i], label: LABELS[i], value: v, pct: Math.round((v / total) * 100) };
    startAngle = endAngle;
    return slice;
  }).filter(s => s.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem', flexWrap: 'wrap' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 150 150" width={140} height={140} style={{ overflow: 'visible' }}>
            {slices.map((s, i) => (
              <path
                key={i}
                d={s.path}
                fill={s.color}
                stroke="var(--color-bg-secondary)"
                strokeWidth={2}
                style={{ transition: 'opacity 0.2s', opacity: 0.95 }}
              >
                <title>{s.label}: {s.value} ครั้ง ({s.pct}%)</title>
              </path>
            ))}
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {avgRating || '—'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              คะแนนเฉลี่ย
            </div>
          </div>
        </div>

        {/* Rating Bars (5 down to 1) */}
        <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[4, 3, 2, 1, 0].map((starIdx) => {
            const count = data[starIdx] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={starIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                <span style={{ width: 44, color: 'var(--color-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {starIdx + 1} <Star size={11} fill="var(--color-warning)" color="var(--color-warning)" />
                </span>
                <div style={{ flex: 1, height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: COLORS[starIdx],
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ width: 34, textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard Component ────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalKB: 0,
    totalChats: 0,
    totalUsers: 0,
    todayChats: 0,
    avgRating: 0,
    weeklyChats: 0,
  });
  const [frequentQuestions, setFrequentQuestions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [ratingDist, setRatingDist] = useState([0, 0, 0, 0, 0]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setRefreshing(true);

      /* --- Counts --- */
      const [
        { count: kbCount },
        { count: chatCount },
        { count: userCount },
      ] = await Promise.all([
        supabase.from('knowledge_base').select('*', { count: 'exact', head: true }),
        supabase.from('chat_histories').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      /* --- Today's chat count --- */
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('chat_histories')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      /* --- 7-Day Chart Data --- */
      const days7ago = new Date();
      days7ago.setDate(days7ago.getDate() - 6);
      days7ago.setHours(0, 0, 0, 0);

      const { data: weekData } = await supabase
        .from('chat_histories')
        .select('created_at')
        .gte('created_at', days7ago.toISOString())
        .order('created_at', { ascending: true });

      const buckets = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
        const isoKey = d.toISOString().slice(0, 10);
        buckets[isoKey] = { label, count: 0 };
      }

      (weekData || []).forEach((row) => {
        const isoKey = new Date(row.created_at).toISOString().slice(0, 10);
        if (buckets[isoKey]) buckets[isoKey].count++;
      });
      const chartArr = Object.values(buckets);
      const weeklyTotal = chartArr.reduce((s, b) => s + b.count, 0);

      /* --- History for top queries & ratings --- */
      const { data: historyData } = await supabase
        .from('chat_histories')
        .select('user_message, bot_response, rating, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      const freq = {};
      let totalRatingSum = 0;
      let totalRatedMessages = 0;
      const dist = [0, 0, 0, 0, 0];

      if (historyData) {
        historyData.forEach((chat) => {
          if (chat.rating) {
            totalRatingSum += chat.rating;
            totalRatedMessages++;
            const idx = Math.round(chat.rating) - 1;
            if (idx >= 0 && idx < 5) dist[idx]++;
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

      const overallAvgRating = totalRatedMessages > 0
        ? (totalRatingSum / totalRatedMessages).toFixed(1)
        : 0;

      const topQuestions = Object.keys(freq)
        .map((msg, index) => {
          const item = freq[msg];
          const avgQ = item.ratedCount > 0 ? (item.ratingSum / item.ratedCount).toFixed(1) : null;
          return {
            id: index,
            user_message: msg,
            count: item.count,
            bot_response: item.latest_answer,
            avgRating: avgQ,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      /* --- Recent Activity --- */
      const { data: recentData } = await supabase
        .from('chat_histories')
        .select('user_message, rating, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      setStats({
        totalKB: kbCount || 0,
        totalChats: chatCount || 0,
        totalUsers: userCount || 0,
        todayChats: todayCount || 0,
        avgRating: overallAvgRating,
        weeklyChats: weeklyTotal,
      });
      setFrequentQuestions(topQuestions);
      setChartData(chartArr);
      setRatingDist(dist);
      setRecentActivity(recentData || []);
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function exportChatHistoriesCsv() {
    const { data } = await supabase
      .from('chat_histories')
      .select('created_at, user_message, bot_response, rating')
      .order('created_at', { ascending: false })
      .limit(5000);

    downloadCsv('chat_histories', (data || []).map((c) => ({
      วันที่: new Date(c.created_at).toLocaleString('th-TH'),
      คำถามผู้ใช้: c.user_message,
      คำตอบบอท: c.bot_response,
      คะแนนดาว: c.rating ?? '',
    })));
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" id="admin-dashboard" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header & Action Bar ── */}
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
            <ShieldCheck size={14} /> ผู้ดูแลระบบส่วนกลาง
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
            แดชบอร์ดภาพรวมระบบ
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            สถิติการใช้งาน AI Chatbot และข้อมูลทุนกู้ยืม กยศ. มทร.ศรีวิชัย
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={loadDashboardData}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={exportChatHistoriesCsv}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileDown size={14} /> ส่งออกรายงาน CSV
          </button>
        </div>
      </div>

      {/* ── Row 1: KPI Statistics Grid (3x2) ── */}
      <div className="admin-kpi-grid">
        {/* Card 1: Users */}
        <div
          className="card card-glow"
          style={{
            padding: 'var(--space-md)',
            borderTop: '3px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {stats.totalUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              ผู้ใช้งานทั้งหมด
            </div>
          </div>
        </div>

        {/* Card 2: Total Chats */}
        <div
          className="card card-glow"
          style={{
            padding: 'var(--space-md)',
            borderTop: '3px solid #0284c7',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {stats.totalChats.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              จำนวนแชทสะสม
            </div>
          </div>
        </div>

        {/* Card 3: Today Chats */}
        <div
          className="card card-glow"
          style={{
            padding: 'var(--space-md)',
            borderTop: '3px solid #d97706',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {stats.todayChats.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              การสนทนาวันนี้
            </div>
          </div>
        </div>

        {/* Card 4: Knowledge Base Docs */}
        <div
          className="card card-glow"
          style={{
            padding: 'var(--space-md)',
            borderTop: '3px solid #1e3a8a',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {stats.totalKB.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              เอกสารฐานความรู้
            </div>
          </div>
        </div>

        {/* Card 5: Average Rating */}
        <div
          className="card card-glow"
          style={{
            padding: 'var(--space-md)',
            borderTop: '3px solid #eab308',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#fefce8',
              color: '#ca8a04',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Star size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {stats.avgRating > 0 ? `${stats.avgRating} ★` : '—'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              คะแนนความพึงพอใจ
            </div>
          </div>
        </div>

        {/* Card 6: 7-Day Total */}
        <div
          className="card card-glow"
          style={{
            padding: 'var(--space-md)',
            borderTop: '3px solid #7c3aed',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {stats.weeklyChats.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              แชทรวม 7 วันล่าสุด
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Analytics & Visual Charts ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        {/* Left Chart: Weekly Chat Volume */}
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  ปริมาณการสนทนาย้อนหลัง 7 วัน
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  สถิติการใช้งานจำแนกตามรายวัน
                </span>
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-soft)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
              รวม {stats.weeklyChats} ครั้ง
            </div>
          </div>

          <ModernBarChart data={chartData} />
        </div>

        {/* Right Chart: Satisfaction Rating Breakdown */}
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: '#fefce8', color: '#ca8a04' }}>
                <Star size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  สัดส่วนคะแนนความพึงพอใจ
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  การประเมินคำตอบของ AI จากผู้ใช้
                </span>
              </div>
            </div>
          </div>

          <ModernDonutChart data={ratingDist} avgRating={stats.avgRating} />
        </div>
      </div>

      {/* ── Row 3: Frequent Queries & Quick Navigation ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        {/* Frequent Questions Box */}
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7' }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                คำถามที่ผู้ใช้ถามบ่อยที่สุด
              </h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                จัดอันดับตามความถี่การสอบถาม
              </span>
            </div>
          </div>

          {frequentQuestions.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <TrendingUp size={28} style={{ color: 'var(--color-text-muted)', marginBottom: 6 }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>ยังไม่มีข้อมูลคำถามที่ถูกถามซ้ำ</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {frequentQuestions.map((q, rank) => (
                <div
                  key={q.id}
                  onClick={() => toggleExpand(q.id)}
                  style={{
                    padding: '10px 14px',
                    background: expandedId === q.id ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: expandedId === q.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: '#fff',
                          background: rank === 0 ? '#1e3a8a' : rank === 1 ? '#0284c7' : '#64748b',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {rank + 1}
                      </span>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-primary)',
                          fontWeight: expandedId === q.id ? 700 : 500,
                          margin: 0,
                          flex: 1,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: expandedId === q.id ? 'unset' : 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {q.user_message}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {q.avgRating && (
                        <span style={{ fontSize: '0.7rem', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          ★ {q.avgRating}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', background: 'var(--color-primary-soft)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        {q.count} ครั้ง
                      </span>
                      {expandedId === q.id ? (
                        <ChevronUp size={14} color="var(--color-text-muted)" />
                      ) : (
                        <ChevronDown size={14} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </div>

                  {expandedId === q.id && (
                    <div
                      className="animate-fade-in"
                      style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      <strong style={{ color: 'var(--color-text-primary)' }}>💡 ตัวอย่างคำตอบจาก AI:</strong>
                      <div style={{ marginTop: 4, padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        {q.bot_response || '(ไม่มีคำตอบบันทึก)'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Management Navigation Cards */}
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: '#f3e8ff', color: '#7e22ce' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                เมนูการจัดการระบบ
              </h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                เข้าสู่หน้าบริหารจัดการเนื้อหาและบริการ
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <Link
              to="/admin/knowledge"
              className="card card-glow"
              style={{
                padding: 'var(--space-md)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-primary)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  จัดการองค์ความรู้
                </h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  เพิ่ม/แก้ไขคู่มือ กยศ.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/knowledge-base"
              className="card card-glow"
              style={{
                padding: 'var(--space-md)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-primary)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  ฐานข้อมูล AI
                </h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  อัปโหลด PDF/เวกเตอร์
                </p>
              </div>
            </Link>

            <Link
              to="/admin/faqs"
              className="card card-glow"
              style={{
                padding: 'var(--space-md)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-primary)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  จัดการ FAQ
                </h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  แก้ไขคำถามที่พบบ่อย
                </p>
              </div>
            </Link>

            <Link
              to="/admin/news"
              className="card card-glow"
              style={{
                padding: 'var(--space-md)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-primary)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  จัดการข่าวสาร
                </h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  โพสต์ประกาศทุน กยศ.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent Activity Stream ── */}
      {recentActivity.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  บันทึกการสนทนาล่าสุด
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  รายการคำถามที่นักศึกษาเข้ามาสนทนากับระบบ
                </span>
              </div>
            </div>
            <Link to="/chat" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)' }}>
              ทดสอบแชท <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>คำถามจากผู้ใช้</th>
                  <th style={{ width: 120, textAlign: 'center' }}>คะแนนประเมิน</th>
                  <th style={{ width: 140, textAlign: 'right' }}>เวลา</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: 450, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          {row.user_message || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.rating ? (
                        <span style={{ color: '#ca8a04', fontWeight: 700, fontSize: 'var(--text-xs)', background: '#fefce8', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          {'★'.repeat(row.rating)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {new Date(row.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
