import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { downloadCsv } from '../../lib/csv';
import {
  X,
  FileDown,
  Calendar,
  MessageSquare,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Check,
  Sparkles,
} from 'lucide-react';

const REPORT_TYPES = [
  {
    id: 'detailed_chats',
    title: 'ประวัติการสนทนาฉบับละเอียด',
    subtitle: 'Detailed Chat Logs',
    description: 'บันทึกบทสนทนาทุกรายการ พร้อมคะแนนดาว, ระดับความพึงพอใจ, และสถานะผู้ใช้',
    icon: MessageSquare,
    badge: 'ยอดนิยม',
    badgeColor: '#2563eb',
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    columns: ['ลำดับ', 'รหัสแชท', 'วันที่และเวลา', 'สถานะผู้ใช้', 'คำถามผู้ใช้', 'คำตอบ AI', 'คะแนนดาว', 'ระดับความพึงพอใจ'],
  },
  {
    id: 'daily_kpi',
    title: 'สรุปสถิติ & KPI รายวัน',
    subtitle: 'Daily Usage & KPI Analytics',
    description: 'รวบรวมปริมาณแชท คะแนนเฉลี่ย และสัดส่วนดาว 1-5 ในแต่ละวัน เหมาะสำหรับนำไปทำรายงานผู้บริหาร',
    icon: BarChart3,
    badge: 'รายงานผู้บริหาร',
    badgeColor: '#059669',
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    columns: ['วันที่', 'จำนวนแชททั้งหมด', 'จำนวนที่ประเมิน', 'คะแนนเฉลี่ย', '5 ดาว (ครั้ง)', '4 ดาว (ครั้ง)', '3 ดาว (ครั้ง)', '2 ดาว (ครั้ง)', '1 ดาว (ครั้ง)', 'อัตราความพึงพอใจ (%)'],
  },
  {
    id: 'frequent_questions',
    title: 'จัดอันดับคำถามยอดนิยม',
    subtitle: 'Top Frequent Inquiries',
    description: 'วิเคราะห์คำถามที่นักศึกษาถามบ่อยที่สุด เรียงลำดับตามความถี่ พร้อมคะแนนเฉลี่ยและสัดส่วนร้อยละ',
    icon: HelpCircle,
    badge: 'วิเคราะห์พฤติกรรม',
    badgeColor: '#d97706',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    columns: ['อันดับ', 'ข้อความคำถาม', 'ความถี่ที่ถาม (ครั้ง)', 'สัดส่วน (%)', 'จำนวนที่ประเมิน', 'คะแนนเฉลี่ย', 'ตัวอย่างคำตอบ AI ล่าสุด'],
  },
  {
    id: 'low_rating_audit',
    title: 'บทสนทนาที่ต้องปรับปรุง',
    subtitle: 'Low Rating & Issue Audit',
    description: 'กรองเฉพาะรายการที่ได้ 1-2 ดาว เพื่อให้ทีมงานนำไปปรับปรุง Prompt และฐานความรู้ RAG',
    icon: AlertTriangle,
    badge: 'สำหรับปรับปรุง AI',
    badgeColor: '#dc2626',
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
    columns: ['ลำดับ', 'วันที่และเวลา', 'คำถามที่พบปัญหา', 'คำตอบของ AI', 'คะแนนที่ได้', 'ระดับปัญหา', 'ข้อเสนอแนะการปรับปรุง'],
  },
  {
    id: 'knowledge_faqs',
    title: 'สำรองคลังความรู้และ FAQ',
    subtitle: 'Knowledge Base & FAQ Backup',
    description: 'ส่งออกข้อมูลเอกสาร RAG และคำถาม-คำตอบ FAQ ทั้งหมดในระบบ เพื่อสำรองข้อมูลหรือตรวจทานออฟไลน์',
    icon: BookOpen,
    badge: 'สำรองข้อมูล',
    badgeColor: '#7c3aed',
    iconBg: '#f5f3ff',
    iconColor: '#7c3aed',
    columns: ['ลำดับ', 'ประเภทข้อมูล', 'หมวดหมู่', 'หัวข้อ / คำถาม', 'เนื้อหาคำตอบ / รายละเอียด', 'จำนวนการเปิดดู', 'วันที่อัปเดต'],
  },
];

const DATE_RANGES = [
  { id: '7days', label: '7 วันล่าสุด' },
  { id: '30days', label: '30 วันล่าสุด' },
  { id: 'month', label: 'เดือนปัจจุบัน' },
  { id: '90days', label: '90 วันล่าสุด' },
  { id: 'all', label: 'ทั้งหมด (All Time)' },
  { id: 'custom', label: 'กำหนดเอง...' },
];

export default function ExportCenterModal({ isOpen, onClose, initialReport = 'detailed_chats' }) {
  const [selectedReport, setSelectedReport] = useState(initialReport);
  const [dateRange, setDateRange] = useState('30days');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | 'rated' | 'low' | 'high'
  const [exporting, setExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen && initialReport) {
      setSelectedReport(initialReport);
      setStatusMessage(null);
    }
  }, [isOpen, initialReport]);

  if (!isOpen) return null;

  // Helper to compute date boundaries
  function getDateBoundaries() {
    if (selectedReport === 'knowledge_faqs') {
      return { start: null, end: null };
    }

    const now = new Date();
    let start = null;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateRange === '7days') {
      start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === '30days') {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (dateRange === '90days') {
      start = new Date();
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === 'custom') {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
    } else if (dateRange === 'all') {
      start = null;
    }

    return { start, end };
  }

  // Format satisfaction level text
  function getRatingLabel(rating) {
    if (!rating) return 'ยังไม่ได้รับการประเมิน';
    const num = Number(rating);
    switch (num) {
      case 5: return '⭐⭐⭐⭐⭐ (พึงพอใจมากที่สุด)';
      case 4: return '⭐⭐⭐⭐ (พึงพอใจมาก)';
      case 3: return '⭐⭐⭐ (ปานกลาง)';
      case 2: return '⭐⭐ (น้อย / ควรปรับปรุง)';
      case 1: return '⭐ (น้อยที่สุด / ปรับปรุงด่วน)';
      default: return `${num} ดาว`;
    }
  }

  // Main Export Handler
  async function handleExport() {
    setExporting(true);
    setStatusMessage(null);

    try {
      const { start, end } = getDateBoundaries();
      const dateTag = new Date().toISOString().slice(0, 10);

      // ─────────────────────────────────────────────────────────────
      // 1. Detailed Chat Histories
      // ─────────────────────────────────────────────────────────────
      if (selectedReport === 'detailed_chats') {
        let query = supabase
          .from('chat_histories')
          .select('id, user_id, user_message, bot_response, rating, created_at')
          .order('created_at', { ascending: false });

        if (start) query = query.gte('created_at', start.toISOString());
        if (end) query = query.lte('created_at', end.toISOString());

        if (ratingFilter === 'rated') {
          query = query.not('rating', 'is', null);
        } else if (ratingFilter === 'low') {
          query = query.lte('rating', 2);
        } else if (ratingFilter === 'high') {
          query = query.gte('rating', 4);
        }

        const { data, error } = await query.limit(10000);
        if (error) throw error;

        if (!data || data.length === 0) {
          setStatusMessage({ type: 'warning', text: 'ไม่พบข้อมูลบทสนทนาในช่วงเวลาและเงื่อนไขที่เลือก' });
          setExporting(false);
          return;
        }

        const rows = data.map((c, idx) => ({
          'ลำดับ': idx + 1,
          'รหัสแชท (ID)': c.id,
          'วันที่และเวลา': new Date(c.created_at).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          'ประเภทผู้ใช้': c.user_id ? 'นักศึกษา/ผู้ลงชื่อเข้าใช้' : 'บุคคลทั่วไป (Anonymous)',
          'คำถามผู้ใช้': c.user_message || '',
          'คำตอบจาก AI': c.bot_response || '',
          'คะแนนดาว': c.rating ?? '',
          'ระดับความพึงพอใจ': getRatingLabel(c.rating),
        }));

        downloadCsv(`chat_histories_detailed_${dateTag}`, rows);
        setStatusMessage({ type: 'success', text: `ส่งออกสำเร็จเรียบร้อย (${rows.length.toLocaleString()} รายการ)` });
      }

      // ─────────────────────────────────────────────────────────────
      // 2. Daily Analytics & KPI Summary
      // ─────────────────────────────────────────────────────────────
      else if (selectedReport === 'daily_kpi') {
        let query = supabase
          .from('chat_histories')
          .select('rating, created_at')
          .order('created_at', { ascending: true });

        if (start) query = query.gte('created_at', start.toISOString());
        if (end) query = query.lte('created_at', end.toISOString());

        const { data, error } = await query.limit(20000);
        if (error) throw error;

        if (!data || data.length === 0) {
          setStatusMessage({ type: 'warning', text: 'ไม่พบข้อมูลสถิติในช่วงเวลาที่เลือก' });
          setExporting(false);
          return;
        }

        const dailyMap = {};
        data.forEach((row) => {
          const dayKey = new Date(row.created_at).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });

          if (!dailyMap[dayKey]) {
            dailyMap[dayKey] = {
              date: dayKey,
              totalChats: 0,
              totalRated: 0,
              ratingSum: 0,
              stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
          }

          dailyMap[dayKey].totalChats++;
          if (row.rating && row.rating >= 1 && row.rating <= 5) {
            dailyMap[dayKey].totalRated++;
            dailyMap[dayKey].ratingSum += row.rating;
            dailyMap[dayKey].stars[row.rating]++;
          }
        });

        const rows = Object.values(dailyMap).map((d) => {
          const avg = d.totalRated > 0 ? (d.ratingSum / d.totalRated).toFixed(2) : '—';
          const positivePct = d.totalRated > 0
            ? `${(((d.stars[4] + d.stars[5]) / d.totalRated) * 100).toFixed(1)}%`
            : '—';

          return {
            'วันที่': d.date,
            'จำนวนแชททั้งหมด (ครั้ง)': d.totalChats,
            'จำนวนที่มีการประเมิน': d.totalRated,
            'คะแนนเฉลี่ย (เต็ม 5)': avg,
            '5 ดาว (ครั้ง)': d.stars[5],
            '4 ดาว (ครั้ง)': d.stars[4],
            '3 ดาว (ครั้ง)': d.stars[3],
            '2 ดาว (ครั้ง)': d.stars[2],
            '1 ดาว (ครั้ง)': d.stars[1],
            'อัตราความพึงพอใจ 4-5 ดาว (%)': positivePct,
          };
        });

        downloadCsv(`daily_analytics_kpi_${dateTag}`, rows);
        setStatusMessage({ type: 'success', text: `ส่งออกรายงานสถิติรายวันสำเร็จ (${rows.length.toLocaleString()} วัน)` });
      }

      // ─────────────────────────────────────────────────────────────
      // 3. Top Frequent Inquiries Report
      // ─────────────────────────────────────────────────────────────
      else if (selectedReport === 'frequent_questions') {
        let query = supabase
          .from('chat_histories')
          .select('user_message, bot_response, rating, created_at')
          .order('created_at', { ascending: false });

        if (start) query = query.gte('created_at', start.toISOString());
        if (end) query = query.lte('created_at', end.toISOString());

        const { data, error } = await query.limit(10000);
        if (error) throw error;

        if (!data || data.length === 0) {
          setStatusMessage({ type: 'warning', text: 'ไม่พบข้อมูลคำถามในช่วงเวลาที่เลือก' });
          setExporting(false);
          return;
        }

        const totalChats = data.length;
        const freqMap = {};

        data.forEach((chat) => {
          if (!chat.user_message) return;
          const q = chat.user_message.trim();
          if (!q) return;

          if (!freqMap[q]) {
            freqMap[q] = {
              question: q,
              count: 0,
              latestAnswer: chat.bot_response || '',
              ratingSum: 0,
              ratedCount: 0,
            };
          }
          freqMap[q].count++;
          if (chat.rating) {
            freqMap[q].ratingSum += chat.rating;
            freqMap[q].ratedCount++;
          }
        });

        const sorted = Object.values(freqMap).sort((a, b) => b.count - a.count);

        const rows = sorted.map((item, idx) => ({
          'อันดับ': idx + 1,
          'ข้อความคำถาม': item.question,
          'ความถี่ที่สอบถาม (ครั้ง)': item.count,
          'สัดส่วนของคำถามทั้งหมด (%)': `${((item.count / totalChats) * 100).toFixed(2)}%`,
          'จำนวนครั้งที่มีการประเมิน': item.ratedCount,
          'คะแนนเฉลี่ย': item.ratedCount > 0 ? (item.ratingSum / item.ratedCount).toFixed(2) : '—',
          'ตัวอย่างคำตอบล่าสุดของ AI': item.latestAnswer,
        }));

        downloadCsv(`top_frequent_questions_${dateTag}`, rows);
        setStatusMessage({ type: 'success', text: `ส่งออกรายงานคำถามยอดนิยมสำเร็จ (${rows.length.toLocaleString()} คำถาม)` });
      }

      // ─────────────────────────────────────────────────────────────
      // 4. Low Rating & Issue Audit
      // ─────────────────────────────────────────────────────────────
      else if (selectedReport === 'low_rating_audit') {
        let query = supabase
          .from('chat_histories')
          .select('id, user_message, bot_response, rating, created_at')
          .lte('rating', 2)
          .order('created_at', { ascending: false });

        if (start) query = query.gte('created_at', start.toISOString());
        if (end) query = query.lte('created_at', end.toISOString());

        const { data, error } = await query.limit(5000);
        if (error) throw error;

        if (!data || data.length === 0) {
          setStatusMessage({ type: 'warning', text: 'ไม่พบรายการแชทที่ได้คะแนน 1-2 ดาวในช่วงเวลาที่เลือก (ระบบทำงานได้ดีมาก!)' });
          setExporting(false);
          return;
        }

        const rows = data.map((item, idx) => ({
          'ลำดับ': idx + 1,
          'วันที่และเวลา': new Date(item.created_at).toLocaleString('th-TH'),
          'คำถามที่พบปัญหา': item.user_message || '',
          'คำตอบของ AI': item.bot_response || '',
          'คะแนนที่ได้รับ (ดาว)': item.rating,
          'ระดับปัญหา': item.rating === 1 ? 'ด่วนที่สุด (1 ดาว - ผู้ใช้ไม่พอใจ)' : 'ควรตรวจสอบ (2 ดาว)',
          'ข้อเสนอแนะการปรับปรุง': 'แนะนำให้ตรวจสอบคำตอบและเพิ่มข้อมูลลงในคู่มือ RAG หรือคลัง FAQ',
        }));

        downloadCsv(`low_rating_issues_audit_${dateTag}`, rows);
        setStatusMessage({ type: 'success', text: `ส่งออกรายการที่ต้องปรับปรุงสำเร็จ (${rows.length.toLocaleString()} รายการ)` });
      }

      // ─────────────────────────────────────────────────────────────
      // 5. Knowledge Base & FAQ Backup
      // ─────────────────────────────────────────────────────────────
      else if (selectedReport === 'knowledge_faqs') {
        const [kbRes, faqRes] = await Promise.all([
          supabase.from('knowledge_base').select('*').order('created_at', { ascending: false }),
          supabase.from('faqs').select('*').order('created_at', { ascending: false }),
        ]);

        const kbData = kbRes.data || [];
        const faqData = faqRes.data || [];

        const rows = [];
        let seq = 1;

        kbData.forEach((k) => {
          rows.push({
            'ลำดับ': seq++,
            'ประเภทข้อมูล': 'เอกสารฐานความรู้ (Knowledge Base RAG)',
            'หมวดหมู่': k.category || 'ทั่วไป',
            'หัวข้อ / คำถาม': k.topic || k.question || '',
            'เนื้อหาคำตอบ / รายละเอียด': k.answer || '',
            'จำนวนการเปิดดู (ครั้ง)': '—',
            'วันที่อัปเดตล่าสุด': k.updated_at
              ? new Date(k.updated_at).toLocaleString('th-TH')
              : k.created_at
              ? new Date(k.created_at).toLocaleString('th-TH')
              : '',
          });
        });

        faqData.forEach((f) => {
          rows.push({
            'ลำดับ': seq++,
            'ประเภทข้อมูล': 'คำถามที่พบบ่อย (FAQ)',
            'หมวดหมู่': f.category || 'FAQ ทั่วไป',
            'หัวข้อ / คำถาม': f.question || '',
            'เนื้อหาคำตอบ / รายละเอียด': f.answer || '',
            'จำนวนการเปิดดู (ครั้ง)': f.usage_count ?? 0,
            'วันที่อัปเดตล่าสุด': f.created_at ? new Date(f.created_at).toLocaleString('th-TH') : '',
          });
        });

        if (rows.length === 0) {
          setStatusMessage({ type: 'warning', text: 'ไม่พบข้อมูลฐานความรู้หรือ FAQ ในระบบ' });
          setExporting(false);
          return;
        }

        downloadCsv(`knowledge_and_faqs_backup_${dateTag}`, rows);
        setStatusMessage({ type: 'success', text: `ส่งออกข้อมูลสำรองฐานความรู้และ FAQ สำเร็จ (${rows.length.toLocaleString()} รายการ)` });
      }
    } catch (err) {
      console.error('Export CSV Error:', err);
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการดึงข้อมูลเพื่อส่งออก: ' + (err.message || 'โปรดลองใหม่อีกครั้ง') });
    } finally {
      setExporting(false);
    }
  }

  const currentReportObj = REPORT_TYPES.find((r) => r.id === selectedReport) || REPORT_TYPES[0];

  return (
    <div
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
      onClick={(e) => {
        if (e.target === e.currentTarget && !exporting) onClose();
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: 'min(92dvh, 800px)',
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
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '14px clamp(14px, 3vw, 24px)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'var(--color-bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'var(--color-primary-soft, #eff6ff)',
                color: 'var(--color-primary, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileDown size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.125rem)', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                ศูนย์ส่งออกรายงานระบบ (Export Center)
              </h2>
              <p style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>
                ส่งออกข้อมูลเป็น CSV พร้อม UTF-8 BOM (เปิดใน Excel ได้ทันที)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={exporting}
            className="btn btn-ghost"
            style={{ padding: '8px', minWidth: 38, minHeight: 38, borderRadius: '50%', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
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
          {/* Status Message (Toast inside modal) */}
          {statusMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                background:
                  statusMessage.type === 'success'
                    ? '#ecfdf5'
                    : statusMessage.type === 'warning'
                    ? '#fefce8'
                    : '#fef2f2',
                color:
                  statusMessage.type === 'success'
                    ? '#059669'
                    : statusMessage.type === 'warning'
                    ? '#ca8a04'
                    : '#dc2626',
                border: `1px solid ${
                  statusMessage.type === 'success'
                    ? '#a7f3d0'
                    : statusMessage.type === 'warning'
                    ? '#fef08a'
                    : '#fecaca'
                }`,
              }}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : statusMessage.type === 'warning' ? (
                <AlertTriangle size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Choose Report Type */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
              1. เลือกประเภทรายงานที่ต้องการส่งออก
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {REPORT_TYPES.map((rep) => {
                const Icon = rep.icon;
                const isSelected = selectedReport === rep.id;

                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedReport(rep.id);
                      setStatusMessage(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isSelected ? 'var(--color-primary-soft, #eff6ff)' : 'var(--color-bg-primary)',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: rep.iconBg,
                        color: rep.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                          {rep.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          ({rep.subtitle})
                        </span>
                        {rep.badge && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: rep.badgeColor + '18',
                              color: rep.badgeColor,
                            }}
                          >
                            {rep.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                        {rep.description}
                      </p>
                    </div>

                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                        background: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    >
                      {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Date Range Filter (Not applicable for knowledge base backup) */}
          {selectedReport !== 'knowledge_faqs' && (
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                2. เลือกช่วงเวลาของข้อมูล (Date Range)
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 10 }}>
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setDateRange(r.id);
                      setStatusMessage(null);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full, 9999px)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: dateRange === r.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: dateRange === r.id ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                      color: dateRange === r.id ? '#ffffff' : 'var(--color-text-primary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Inputs */}
              {dateRange === 'custom' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <Calendar size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                      ตั้งแต่วันที่:
                    </span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="input"
                      style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', flex: 1, minWidth: 0, width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                      ถึงวันที่:
                    </span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="input"
                      style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', flex: 1, minWidth: 0, width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Additional Rating Filter for Detailed Chats */}
          {selectedReport === 'detailed_chats' && (
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                3. กรองตามคะแนนประเมิน (Rating Filter)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { id: 'all', label: 'ทั้งหมด (ทุกระดับการประเมิน)' },
                  { id: 'rated', label: '⭐ มีการประเมินเท่านั้น' },
                  { id: 'low', label: '⚠️ คะแนนต่ำ (1-2 ดาว)' },
                  { id: 'high', label: '✨ คะแนนสูง (4-5 ดาว)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRatingFilter(opt.id);
                      setStatusMessage(null);
                    }}
                    style={{
                      padding: '6px 14px',
                      minHeight: 34,
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: ratingFilter === opt.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: ratingFilter === opt.id ? 'var(--color-primary-soft)' : 'var(--color-bg-primary)',
                      color: ratingFilter === opt.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview Box of Columns to be exported */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-secondary)',
              border: '1px dashed var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                คอลัมน์ที่จะได้รับในไฟล์ CSV:
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {currentReportObj.columns.map((col, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--color-bg-tertiary, #f1f5f9)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {col}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
              💡 ตัวช่วยเข้ารหัสภาษาไทย UTF-8 BOM จะถูกแนบไปกับไฟล์อัตโนมัติ ทำให้สระภาษาไทยไม่ตกหล่นเมื่อเปิดด้วย Excel
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
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
            onClick={onClose}
            disabled={exporting}
            style={{ fontSize: 'var(--text-sm)', minHeight: 42, flex: '1 1 100px', justifyContent: 'center' }}
          >
            ยกเลิก
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              minHeight: 42,
              flex: '2 1 200px',
            }}
          >
            <FileDown size={16} />
            {exporting ? 'กำลังรวบรวมข้อมูล...' : 'ดาวน์โหลดรายงาน CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
