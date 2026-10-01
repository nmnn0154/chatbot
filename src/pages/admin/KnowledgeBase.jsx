import { useState, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  uploadKnowledgeFileToStorage,
  downloadKnowledgePdf,
  getDocumentChunks,
  printOrSaveKnowledgeAsPdf,
  formatDocFileSize,
} from '../../lib/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  Upload,
  Search,
  Trash2,
  BookOpen,
  X,
  AlertTriangle,
  Check,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  ExternalLink,
  Printer,
  Copy,
  CheckCheck,
  Layers,
} from 'lucide-react';

/* ─── กยศ. Preset Knowledge Data (มทร.ศรีวิชัย สงขลา) ───────────── */
const GSL_PRESETS = [
  {
    id: 'gsl_eligibility',
    title: 'คุณสมบัติผู้กู้ยืมเงิน กยศ. มทร.ศรีวิชัย',
    content: `คุณสมบัติผู้กู้ยืมเงินกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) — มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย (สงขลา)

1. สัญชาติไทย
2. มีคุณสมบัติแบ่งเป็น 2 ลักษณะ:
   - ลักษณะที่ 1 (ขาดแคลนทุนทรัพย์): รายได้ครอบครัวรวมกันไม่เกิน 360,000 บาท/ปี
   - ลักษณะที่ 2 (สาขาวิชาที่เป็นความต้องการหลัก): ไม่จำกัดรายได้ครอบครัว (เช่น วิศวกรรมศาสตร์, เทคโนโลยี, วิทยาศาสตร์)
3. ศึกษาอยู่ในคณะ/สาขาวิชาของ มทร.ศรีวิชัย
4. ไม่เป็นผู้สำเร็จการศึกษาในระดับปริญญาตรีในสาขาใดมาก่อน
5. มีผลการเรียนสะสม (GPA) ตามเกณฑ์ที่มหาวิทยาลัยและกองทุนกำหนด
6. มีประวัติการทำกิจกรรมจิตอาสาบำเพ็ญประโยชน์ครบ 36 ชั่วโมง/ปีการศึกษา
7. ไม่เคยเป็นผู้ผิดนัดชำระหนี้ กยศ. มาก่อน (ยกเว้นได้รับการปรับปรุงโครงสร้างหนี้แล้ว)`,
  },
  {
    id: 'gsl_documents',
    title: 'เอกสารที่ใช้ในการกู้ยืม กยศ. มทร.ศรีวิชัย',
    content: `เอกสารประกอบการขอกู้ยืมเงิน กยศ. มทร.ศรีวิชัย สงขลา

เอกสารส่วนตัวผู้กู้:
1. สำเนาบัตรประจำตัวประชาชนของผู้กู้ (ยังไม่หมดอายุ)
2. สำเนาทะเบียนบ้านของผู้กู้
3. ใบแสดงผลการเรียน (Transcript) หรือ ปพ.1
4. หลักฐานการเป็นนักศึกษา มทร.ศรีวิชัย (ใบเสร็จลงทะเบียนเรียน)
5. สมุดบัญชีเงินฝากธนาคารกรุงไทย, ธ.ก.ส. หรือ ธนาคารอิสลาม (ชื่อผู้กู้เท่านั้น)
6. สมุดบันทึกกิจกรรมจิตอาสาครบ 36 ชั่วโมง (สำหรับผู้กู้รายเก่า)

เอกสารผู้ปกครอง:
1. สำเนาบัตรประชาชน และสำเนาทะเบียนบ้านของ บิดา-มารดา หรือ ผู้ปกครอง
2. หนังสือรับรองรายได้ครอบครัว (แบบ กยศ.102) พร้อมสำเนาบัตรข้าราชการ/เจ้าหน้าที่รัฐผู้รับรอง
3. สลิปเงินเดือนหรือหนังสือรับรองเงินเดือนล่าสุด (กรณีมีรายได้ประจำ)

หมายเหตุ: ตั้งแต่ปีการศึกษา 2567 เป็นต้นมา กยศ. ยกเลิกการใช้ผู้ค้ำประกันสำหรับผู้กู้รายใหม่ทุกราย`,
  },
  {
    id: 'gsl_process',
    title: 'ขั้นตอนการกู้ยืมเงิน กยศ. มทร.ศรีวิชัย (ระบบ DSL)',
    content: `ขั้นตอนการยื่นกู้ยืมเงิน กยศ. ผ่านระบบ DSL — มทร.ศรีวิชัย สงขลา

1. ลงทะเบียนและยื่นคำขอกู้ยืมในระบบ DSL (www.studentloan.or.th) หรือแอป กยศ. Connect
2. เลือกสถานศึกษา "มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย" และเลือกคณะ/สาขาวิชาที่กำลังศึกษา
3. แนบไฟล์เอกสารหลักฐานในระบบ DSL ให้ครบถ้วน
4. พิมพ์แบบคำขอกู้ยืมและเอกสารประกอบ นำส่งที่งานแนะแนวและทุนการศึกษา กองพัฒนานักศึกษา อาคาร 7 ชั้น 1
5. เข้ารับการสัมภาษณ์คัดกรองคุณสมบัติ ณ กองพัฒนานักศึกษา
6. กยศ. และมหาวิทยาลัยประกาศผลการอนุมัติสิทธิ์กู้ยืม
7. จัดทำสัญญากู้ยืมเงินและแบบยืนยันเบิกเงินค่าเล่าเรียน/ค่าครองชีพ
8. การโอนเงิน: ค่าเล่าเรียนโอนตรงเข้ามหาวิทยาลัย ส่วนค่าครองชีพ (3,000 บ./ด.) โอนเข้าบัญชีผู้กู้ทุกวันที่ 15 ของเดือน`,
  },
  {
    id: 'gsl_volunteer',
    title: 'กิจกรรมจิตอาสา 36 ชั่วโมง กยศ. มทร.ศรีวิชัย',
    content: `แนวทางการทำกิจกรรมจิตอาสาเพื่อสังคมและสาธารณประโยชน์ (36 ชม./ปีการศึกษา) — มทร.ศรีวิชัย

1. กิจกรรมภายในมหาวิทยาลัย: กิจกรรมปฐมนิเทศ, วันไหว้ครู, กิจกรรมชมรม, กิจกรรมช่วยเหลืองานคณะ/มหาวิทยาลัย
2. กิจกรรมภายนอกมหาวิทยาลัย: บำเพ็ญประโยชน์ในชุมชน โรงเรียน วัด หรือมูลนิธิต่างๆ ใน จ.สงขลา
3. การบริจาคโลหิต: ร่วมบริจาคโลหิตกับสภากาชาดไทย/ภาคบริการโลหิตที่ 12 สงขลา นับได้ครั้งละ 6 ชั่วโมง
4. กิจกรรม e-Learning: อบรมหลักสูตรออนไลน์ผ่าน SET e-Learning หรือตลาดหลักทรัพย์ฯ นับชั่วโมงได้ตามที่ กยศ. กำหนด
5. การส่งหลักฐาน: บันทึกลงในสมุดจิตอาสา กยศ. มทร.ศรีวิชัย ให้อาจารย์ที่ปรึกษาลงนามรับรอง และนำส่งที่กองพัฒนานักศึกษา อาคาร 7 ชั้น 1`,
  },
  {
    id: 'gsl_amounts',
    title: 'วงเงินกู้ยืม กยศ. ประจำปีการศึกษา มทร.ศรีวิชัย',
    content: `อัตราวงเงินค่าเล่าเรียนและค่าครองชีพ กยศ. แต่ละคณะใน มทร.ศรีวิชัย

ระดับปริญญาตรี (4 ปี):
- คณะวิศวกรรมศาสตร์: ค่าเล่าเรียนตามจริงไม่เกิน 70,000 - 80,000 บาท/ปี
- คณะบริหารธุรกิจ: ค่าเล่าเรียนตามจริงไม่เกิน 60,000 บาท/ปี
- คณะศิลปศาสตร์: ค่าเล่าเรียนตามจริงไม่เกิน 60,000 บาท/ปี
- คณะสถาปัตยกรรมศาสตร์: ค่าเล่าเรียนตามจริงไม่เกิน 70,000 บาท/ปี
- คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี: ค่าเล่าเรียนตามจริงไม่เกิน 70,000 บาท/ปี
- ค่าใช้จ่ายส่วนตัว (ค่าครองชีพ): 36,000 บาท/ปี (โอนเดือนละ 3,000 บาท x 12 เดือน)`,
  },
  {
    id: 'gsl_repayment',
    title: 'การชำระหนี้คืน กยศ. และอัตราดอกเบี้ย',
    content: `เงื่อนไขการชำระหนี้คืนกองทุน กยศ. หลังสำเร็จการศึกษา

1. ระยะเวลาปลอดหนี้: 2 ปี หลังสำเร็จการศึกษาหรือพ้นสภาพนักศึกษา
2. อัตราดอกเบี้ย: ร้อยละ 1 ต่อปี ของเงินต้นคงเหลือ
3. ระยะเวลาผ่อนชำระ: นานสูงสุด 15 ปี (นับจากวันที่ครบกำหนดชำระงวดแรก)
4. กำหนดชำระ: วันที่ 5 กรกฎาคมของทุกปี หรือเลือกหักรายเดือนผ่านระบบ
5. ช่องทางชำระเงิน:
   - แอป กยศ. Connect สแกน QR Code ฟรีค่าธรรมเนียม
   - Mobile Banking ทุกธนาคาร
   - ธนาคารกรุงไทย, ธ.ก.ส., ธนาคารอิสลามแห่งประเทศไทย
   - เคาน์เตอร์เซอร์วิส 7-Eleven, Lotus's`,
  },
  {
    id: 'gsl_law_update',
    title: 'กฎหมาย กยศ. ฉบับปรับปรุงใหม่และมาตรการผ่อนปรน',
    content: `สาระสำคัญของ พ.ร.บ. กยศ. ฉบับใหม่ เพื่อความเป็นธรรมแก่ผู้กู้ยืม

1. ลดเบี้ยปรับผิดนัดชำระหนี้: เหลือเพียงร้อยละ 0.5 ต่อปี (จากเดิม 7.5% ต่อปี)
2. ลำดับการตัดชำระหนี้: ตัดเงินต้นก่อน > ดอกเบี้ย > เบี้ยปรับ
3. ยกเลิกผู้ค้ำประกัน: ผู้กู้รายใหม่ไม่ต้องมีผู้ค้ำประกัน
4. โครงการปรับโครงสร้างหนี้:
   - ขยายเวลาผ่อนชำระได้สูงสุดถึงอายุ 65 ปี
   - พักชำระหนี้และลบประวัติค้างชำระในเครดิตบูโร
   - ปลดภาระผู้ค้ำประกันทันทีเมื่อทำสัญญาปรับโครงสร้างหนี้
   - ยื่นเรื่องผ่านระบบออนไลน์ DSL หรือแอป กยศ. Connect`,
  },
  {
    id: 'gsl_contact_rmutsv',
    title: 'ช่องทางติดต่อ กยศ. มทร.ศรีวิชัย สงขลา และส่วนกลาง',
    content: `ช่องทางการติดต่อและขอรับคำปรึกษา กยศ.

มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย (สงขลา):
- ที่ตั้ง: งานแนะแนวและทุนการศึกษา กองพัฒนานักศึกษา อาคาร 7 ชั้น 1
- ที่อยู่: เลขที่ 1 ถนนราชดำเนินนอก ตำบลบ่อยาง อำเภอเมือง จังหวัดสงขลา 90000
- โทรศัพท์: 074-317-100 ต่อ งานทุนการศึกษา กยศ.
- เวลาทำการ: วันจันทร์ - ศุกร์ เวลา 08.30 - 16.30 น.
- เว็บไซต์: www.rmutsv.ac.th

กองทุนเงินให้กู้ยืมเพื่อการศึกษา (ส่วนกลาง):
- Call Center: 0-2016-4888
- เว็บไซต์หลัก: www.studentloan.or.th
- ระบบ DSL: https://wsa.dsl.studentloan.or.th
- แอปพลิเคชัน: กยศ. Connect (iOS / Android / Huawei)`,
  },
];

/* ─── Preset Import Modal ────────────────────────────────────── */
function PresetModal({ userId, existingDocuments = [], onSuccess, onClose }) {
  const [selected, setSelected] = useState({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');

  const checkIsImported = (presetTitle) => {
    if (!existingDocuments || existingDocuments.length === 0) return false;
    const clean = (str) => (str || '').trim().toLowerCase();
    const target = clean(presetTitle);
    return existingDocuments.some((doc) => {
      const docName = clean(doc.filename || doc.title);
      return docName === target || docName.includes(target) || target.includes(docName);
    });
  };

  const importedCount = GSL_PRESETS.filter((p) => checkIsImported(p.title)).length;
  const unimportedCount = GSL_PRESETS.length - importedCount;

  const toggleSelect = (id) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () => {
    const all = {};
    GSL_PRESETS.forEach((p) => { all[p.id] = true; });
    setSelected(all);
  };

  const selectOnlyUnimported = () => {
    const sel = {};
    GSL_PRESETS.forEach((p) => {
      if (!checkIsImported(p.title)) {
        sel[p.id] = true;
      }
    });
    setSelected(sel);
  };

  const clearSelection = () => {
    setSelected({});
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  function chunkPreset(text, maxLen = 800) {
    const paragraphs = text.split(/\n+/);
    const chunks = [];
    let cur = '';
    for (const p of paragraphs) {
      if (!p.trim()) continue;
      if ((cur.length + p.length) > maxLen) {
        if (cur) chunks.push(cur.trim());
        cur = p + ' ';
      } else {
        cur += p + ' ';
      }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.length ? chunks : [text.trim()];
  }

  async function handleImport() {
    const toImport = GSL_PRESETS.filter((p) => selected[p.id]);
    if (toImport.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 หัวข้อ');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      for (let i = 0; i < toImport.length; i++) {
        const preset = toImport[i];
        setProgress(`กำลังนำเข้า (${i + 1}/${toImport.length}): ${preset.title}...`);
        const chunks = chunkPreset(preset.content);
        await uploadDocument(preset.title, userId, chunks);
      }
      onSuccess();
    } catch (err) {
      console.error('Preset import error:', err);
      setError('เกิดข้อผิดพลาด: ' + err.message);
      setProcessing(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={!processing ? onClose : undefined}>
      <div className="modal" style={{ maxWidth: 620, width: '95%', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: 'var(--text-lg)' }}>
            <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
            นำเข้าองค์ความรู้ กยศ. พรีเซ็ต
          </h2>
          {!processing && (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {processing ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{progress}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 8 }}>
                ระบบกำลังสร้างเวกเตอร์และบันทึกลงฐานข้อมูล... กรุณารอสักครู่
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Status Summary Banner */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: importedCount === GSL_PRESETS.length ? '#ecfdf5' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${importedCount === GSL_PRESETS.length ? '#a7f3d0' : 'var(--color-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                  <span style={{ fontWeight: 700, color: importedCount === GSL_PRESETS.length ? '#047857' : 'var(--color-text-primary)' }}>
                    📊 สถานะ: นำเข้าสู่ระบบแล้ว {importedCount} จากทั้งหมด {GSL_PRESETS.length} หัวข้อ
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {unimportedCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={selectOnlyUnimported}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', height: 'auto' }}
                    >
                      เลือกเฉพาะที่ยังไม่นำเข้า ({unimportedCount})
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={selectAll}
                    style={{ fontSize: '0.7rem', padding: '2px 8px', height: 'auto' }}
                  >
                    เลือกทั้งหมด
                  </button>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={clearSelection}
                      style={{ fontSize: '0.7rem', padding: '2px 8px', height: 'auto', color: 'var(--color-text-muted)' }}
                    >
                      ล้างการเลือก
                    </button>
                  )}
                </div>
              </div>

              {/* Presets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {GSL_PRESETS.map((preset) => {
                  const isImported = checkIsImported(preset.title);
                  const isSelected = !!selected[preset.id];

                  return (
                    <div
                      key={preset.id}
                      style={{
                        border: `1.5px solid ${
                          isSelected
                            ? 'var(--color-primary)'
                            : isImported
                            ? '#a7f3d0'
                            : 'var(--color-border)'
                        }`,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: isSelected
                          ? 'var(--color-primary-soft)'
                          : isImported
                          ? '#f0fdf4'
                          : 'var(--color-bg-secondary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.625rem 0.875rem',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleSelect(preset.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(preset.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: 'var(--color-primary)',
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                            {preset.title}
                          </span>

                          {/* Imported status badge */}
                          {isImported ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              <Check size={12} strokeWidth={3} /> นำเข้าข้อมูลแล้ว
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              ยังไม่ได้นำเข้า
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(expanded === preset.id ? null : preset.id);
                          }}
                          title="ดูตัวอย่างเนื้อหา"
                          style={{ flexShrink: 0 }}
                        >
                          {expanded === preset.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {expanded === preset.id && (
                        <div
                          style={{
                            padding: '0.75rem 0.875rem',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.7,
                            borderTop: '1px solid var(--color-border)',
                            background: '#ffffff',
                            maxHeight: 180,
                            overflowY: 'auto',
                          }}
                        >
                          {preset.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
            </div>
          )}
        </div>

        {!processing && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={selectedCount === 0}
            >
              <Sparkles size={16} />
              {selectedCount > 0 ? `นำเข้าที่เลือก (${selectedCount} หัวข้อ)` : 'เลือกหัวข้อเพื่อนำเข้า'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pdf' | 'text'
  const [showModal, setShowModal] = useState(false);
  const [showPreset, setShowPreset] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [searchQuery]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const data = await getDocuments(searchQuery);
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const stats = useMemo(() => {
    const total = documents.length;
    const pdfs = documents.filter(
      (d) => d.file_type === 'PDF' || d.filename?.toLowerCase().endsWith('.pdf') || !!d.file_url
    ).length;
    const texts = total - pdfs;
    return { total, pdfs, texts };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const isPdf = doc.file_type === 'PDF' || doc.filename?.toLowerCase().endsWith('.pdf') || !!doc.file_url;
      if (filterType === 'pdf' && !isPdf) return false;
      if (filterType === 'text' && isPdf) return false;
      return true;
    });
  }, [documents, filterType]);

  async function handleDownloadDoc(doc, e) {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(doc.id);
      await downloadKnowledgePdf(doc);
      showToast('กำลังดาวน์โหลดเอกสาร...');
    } catch (error) {
      console.error('Download error:', error);
      showToast('ไม่สามารถดาวน์โหลดเอกสารได้', 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id, deleteTarget.file_url);
      showToast('ลบเอกสารสำเร็จ');
      if (viewingDoc?.id === deleteTarget.id) {
        setViewingDoc(null);
      }
      setDeleteTarget(null);
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('ไม่สามารถลบเอกสารได้', 'error');
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="page-container animate-fade-in" id="knowledge-base-page">
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1>จัดการเอกสารฐานความรู้ AI</h1>
        <p>เพิ่มเนื้อหาจากไฟล์ PDF/ข้อความ หรือวางข้อความ เพื่อใช้เป็นแหล่งข้อมูล RAG ของแชทบอท สามารถเปิดดูและดาวน์โหลดไฟล์ต้นฉบับได้</p>
      </div>

      {/* ── Overview Stats Cards ── */}
      <div className="kb-stats-grid">
        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="kb-stat-val">{stats.total}</div>
            <div className="kb-stat-label">เอกสารฐานความรู้ทั้งหมด</div>
          </div>
        </div>

        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: '#fee2e2', color: '#be123c' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="kb-stat-val">{stats.pdfs}</div>
            <div className="kb-stat-label">ไฟล์ PDF ต้นฉบับ (เปิดดู/ดาวน์โหลด)</div>
          </div>
        </div>

        <div className="kb-stat-card">
          <div className="kb-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div className="kb-stat-val">{stats.texts}</div>
            <div className="kb-stat-label">พรีเซ็ต & ข้อความเวกเตอร์ AI</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Responsive Filter Bar ── */}
      <div className="kb-toolbar-container">
        <div className="kb-toolbar">
          <div className="search-input-wrapper kb-search-box">
            <Search size={18} />
            <input
              type="text"
              className="input"
              placeholder="ค้นหาชื่อเอกสาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="kb-actions-group">
            <button className="btn btn-secondary" onClick={() => setShowPreset(true)}>
              <Sparkles size={16} />
              นำเข้าองค์ความรู้ กยศ.
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Upload size={16} />
              เพิ่มเอกสาร
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="kb-filter-pills">
          <button
            type="button"
            className={`kb-filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            ทั้งหมด ({stats.total})
          </button>
          <button
            type="button"
            className={`kb-filter-pill ${filterType === 'pdf' ? 'active' : ''}`}
            onClick={() => setFilterType('pdf')}
          >
            เฉพาะไฟล์ PDF ({stats.pdfs})
          </button>
          <button
            type="button"
            className={`kb-filter-pill ${filterType === 'text' ? 'active' : ''}`}
            onClick={() => setFilterType('text')}
          >
            เฉพาะข้อความ / พรีเซ็ต ({stats.texts})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>{documents.length === 0 ? 'ไม่พบเอกสารในระบบ' : 'ไม่พบเอกสารตามเงื่อนไขที่เลือก'}</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Upload size={16} />
            อัปโหลดเอกสารใหม่
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ชื่อเอกสาร</th>
                  <th style={{ width: '130px' }}>รูปแบบ</th>
                  <th className="kb-table-col-date" style={{ width: '130px' }}>วันที่อัปโหลด</th>
                  <th style={{ width: '125px', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const isPdf = doc.file_type === 'PDF' || doc.filename?.toLowerCase().endsWith('.pdf');
                  const hasFile = !!doc.file_url;
                  return (
                    <tr
                      key={doc.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingDoc(doc)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              background: isPdf ? '#fee2e2' : '#e0f2fe',
                              color: isPdf ? '#b91c1c' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            <FileText size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="kb-doc-title">
                              {doc.filename}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{hasFile ? 'มีไฟล์ต้นฉบับ' : 'เนื้อหาพรีเซ็ต/ข้อความ'}</span>
                              <span>• {formatDate(doc.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '12px',
                              background: isPdf ? '#fee2e2' : '#e0f2fe',
                              color: isPdf ? '#b91c1c' : '#0284c7',
                              border: `1px solid ${isPdf ? '#fca5a5' : '#bae6fd'}`,
                            }}
                          >
                            {isPdf ? 'PDF' : 'TEXT'}
                          </span>
                          {doc.file_size && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              {doc.file_size}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="kb-table-col-date" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(doc.created_at)}
                      </td>
                      <td>
                        <div
                          style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="kb-table-action-btn view"
                            onClick={() => setViewingDoc(doc)}
                            title="ดูเอกสาร / ตรวจสอบเนื้อหา AI"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="kb-table-action-btn download"
                            onClick={(e) => handleDownloadDoc(doc, e)}
                            title="ดาวน์โหลด PDF"
                            disabled={downloadingId === doc.id}
                          >
                            {downloadingId === doc.id ? (
                              <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
                            ) : (
                              <Download size={15} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="kb-table-action-btn delete"
                            onClick={() => setDeleteTarget(doc)}
                            title="ลบเอกสาร"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Result Count */}
      {!loading && documents.length > 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          แสดงผลทั้งหมด {documents.length} รายการ
        </div>
      )}

      {/* Document View & Download Modal */}
      {viewingDoc && (
        <DocumentViewModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onDownload={(d) => handleDownloadDoc(d)}
        />
      )}

      {/* Upload Modal */}
      {showModal && (
        <UploadModal
          userId={user?.id}
          onSuccess={() => {
            setShowModal(false);
            showToast('อัปโหลดและประมวลผลเอกสารสำเร็จ');
            loadDocuments();
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Preset Import Modal */}
      {showPreset && (
        <PresetModal
          userId={user?.id}
          existingDocuments={documents}
          onSuccess={() => {
            setShowPreset(false);
            showToast('นำเข้าองค์ความรู้ กยศ. สำเร็จ!');
            loadDocuments();
          }}
          onClose={() => setShowPreset(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog">
              <div className="confirm-icon">
                <AlertTriangle size={28} />
              </div>
              <h3>ยืนยันการลบเอกสาร</h3>
              <p>คุณต้องการลบ "{deleteTarget.filename}" ใช่หรือไม่? ข้อมูลเวกเตอร์ที่เกี่ยวข้องจะถูกลบทั้งหมด</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  ยกเลิก
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <Trash2 size={16} /> ลบเอกสาร
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

/** Extract the text layer from a PDF. Returns '' for scanned / image-only PDFs. */
async function extractTextFromPDF(fileObj) {
  const arrayBuffer = await fileObj.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item) => item.str).join(' ') + '\n';
  }
  return fullText;
}

/**
 * Strip characters Postgres TEXT cannot store. PDF text extraction often yields
 * NUL bytes and other control chars, which PostgREST rejects with
 * "unsupported Unicode escape sequence".
 */
function sanitizeText(text) {
  return String(text || '')
    // NUL and other control chars except tab (\x09), LF (\x0A), CR (\x0D)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    // lone UTF-16 surrogates that can't round-trip through JSON
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

/** Chunk text by paragraphs, grouping up to ~maxLength characters. */
function chunkText(rawText, maxLength = 800) {
  const text = sanitizeText(rawText);
  const paragraphs = text.split(/\n+/);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if (!p.trim()) continue;
    if ((current.length + p.length) > maxLength) {
      if (current) chunks.push(current.trim());
      current = p + ' ';
    } else {
      current += p + ' ';
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Drop obvious OCR-noise lines (watermarks, faint scan artifacts, gibberish)
 * while keeping real Thai paragraphs. Heuristic — the caller must still proofread.
 *
 * @param {string} raw
 * @param {boolean} strict  tighter thresholds (removes more, may drop short headings)
 * @returns {{ text: string, removed: number }}
 */
function cleanOcrText(raw, strict = false) {
  const THAI = /[฀-๿]/g;
  const LATIN = /[A-Za-z]/g;
  const minLen = strict ? 6 : 3;
  const minAvgTok = strict ? 2.8 : 2.3;
  const minThaiShare = strict ? 0.7 : 0.55;
  const thaiFloor = strict ? 12 : 8;

  const kept = [];
  let removed = 0;

  for (let line of String(raw).split(/\r?\n/)) {
    line = line.replace(/\s+/g, ' ').trim();
    if (!line) { kept.push(''); continue; }

    const total = line.replace(/\s/g, '').length;
    const thai = (line.match(THAI) || []).length;
    const latin = (line.match(LATIN) || []).length;
    const tokens = line.split(' ');
    const avgTok = total / tokens.length;
    const meaningful = thai + (line.match(/[0-9๐-๙]/g) || []).length;

    if (
      total <= minLen ||
      (tokens.length >= 4 && avgTok < minAvgTok) ||   // scattered single letters
      (latin >= thai && thai < thaiFloor) ||           // Latin-heavy artifact
      meaningful / total < minThaiShare                // low Thai/digit share
    ) {
      removed++;
      continue;
    }
    kept.push(line);
  }

  return { text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(), removed };
}

/**
 * OCR a scanned/image PDF in the browser (Thai + English).
 * Renders each page to a canvas via pdfjs, then runs Tesseract.
 * Slow and imperfect — the caller must let a human review the result.
 * @param {File} fileObj
 * @param {(msg: string) => void} onProgress
 */
async function ocrPdf(fileObj, onProgress) {
  const arrayBuffer = await fileObj.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  onProgress('กำลังโหลดโมเดล OCR ภาษาไทย (ครั้งแรกใช้เวลาสักครู่)...');
  const worker = await Tesseract.createWorker('tha+eng');
  // 1 = automatic page segmentation with orientation detection — better for
  // single-column official documents than the default.
  await worker.setParameters({ tessedit_pageseg_mode: '1', preserve_interword_spaces: '1' });

  try {
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress(`กำลังอ่านหน้า ${i}/${pdf.numPages} ด้วย OCR...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const { data } = await worker.recognize(canvas);
      fullText += (data.text || '') + '\n\n';
    }
    return fullText;
  } finally {
    await worker.terminate();
  }
}

/* ---- Document Upload Modal Component ---- */
function UploadModal({ userId, onSuccess, onClose }) {
  const [mode, setMode] = useState('file'); // 'file' | 'paste'
  const [file, setFile] = useState(null);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [ocrOffered, setOcrOffered] = useState(false);
  const [ocrRaw, setOcrRaw] = useState('');
  const fileInputRef = useRef(null);

  const TEXT_EXT = /\.(txt|md|markdown|csv)$/i;
  const isTextFile = (f) => f && (f.type.startsWith('text/') || TEXT_EXT.test(f.name));

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setErrorMsg('');
    setOcrOffered(false);
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !isTextFile(selected)) {
      setErrorMsg('รองรับไฟล์ .pdf, .txt หรือ .md เท่านั้น');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  async function processChunks(name, textChunks, meta = {}) {
    if (textChunks.length === 0) {
      throw new Error('ไม่มีเนื้อหาให้ประมวลผล');
    }
    setProgressText(`กำลังสร้างเวกเตอร์และบันทึก (${textChunks.length} ส่วน)...`);
    await uploadDocument(name, userId, textChunks, meta);
    onSuccess();
  }

  const handleFileUpload = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกไฟล์');
      return;
    }
    try {
      setProcessing(true);
      setErrorMsg('');

      let fileMeta = null;
      if (!isTextFile(file)) {
        setProgressText('กำลังอัปโหลดไฟล์ PDF ต้นฉบับขึ้นระบบคลาวด์...');
        try {
          fileMeta = await uploadKnowledgeFileToStorage(file);
        } catch (storageErr) {
          console.warn('Storage upload error (continuing with text extraction):', storageErr);
        }
      }

      let text;
      if (isTextFile(file)) {
        setProgressText('กำลังอ่านไฟล์ข้อความ...');
        text = await file.text();
        fileMeta = {
          fileType: (file.name.split('.').pop() || 'TXT').toUpperCase(),
          fileSize: formatDocFileSize(file.size),
        };
      } else {
        setProgressText('กำลังอ่านเนื้อหาไฟล์ PDF...');
        text = await extractTextFromPDF(file);
      }

      if (!text.trim()) {
        if (!isTextFile(file)) setOcrOffered(true);
        throw new Error(
          'อ่านข้อความจากไฟล์นี้ไม่ได้ (น่าจะเป็น PDF สแกน/รูปภาพ) — ' +
          'กดปุ่ม "อ่านด้วย OCR" ด้านล่าง หรือคัดลอกข้อความไปวางในแท็บ "วางข้อความเอง"'
        );
      }

      setProgressText('กำลังแบ่งส่วนย่อยของเนื้อหา...');
      await processChunks(file.name, chunkText(text), fileMeta || {});
    } catch (err) {
      console.error('Processing error:', err);
      const message = err?.message || (typeof err === 'string' ? err : 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
      setErrorMsg(message);
      setProcessing(false);
    }
  };

  const runOcr = async () => {
    if (!file) return;
    try {
      setProcessing(true);
      setErrorMsg('');
      const raw = await ocrPdf(file, setProgressText);
      const { text, removed } = cleanOcrText(raw);
      if (!text) throw new Error('OCR อ่านข้อความไม่ได้ — เอกสารอาจเบลอหรือคุณภาพต่ำเกินไป');
      // Land in the paste tab with the OCR result for the admin to proofread.
      setOcrRaw(raw);
      setPasteTitle(file.name.replace(/\.pdf$/i, ''));
      setPasteText(text);
      setMode('paste');
      setOcrOffered(false);
      setProcessing(false);
      setErrorMsg(`อ่านด้วย OCR แล้ว — กรองบรรทัดขยะออก ${removed} บรรทัด กรุณาตรวจแก้ข้อความ (เลข พ.ศ. / ตัวเลขในตาราง) ก่อนกดบันทึก`);
    } catch (err) {
      console.error('OCR error:', err);
      setErrorMsg('OCR ล้มเหลว: ' + err.message);
      setProcessing(false);
    }
  };

  const cleanStricter = () => {
    if (!ocrRaw) return;
    const { text, removed } = cleanOcrText(ocrRaw, true);
    setPasteText(text);
    setErrorMsg(`กรองแบบเข้ม — ตัดบรรทัดออกรวม ${removed} บรรทัด (ถ้าตัดเนื้อหาจริงไปด้วย กดปุ่มด้านล่างเพื่อคืนค่ากรองปกติ)`);
  };

  const cleanNormal = () => {
    if (!ocrRaw) return;
    const { text, removed } = cleanOcrText(ocrRaw, false);
    setPasteText(text);
    setErrorMsg(`กรองปกติ — ตัดบรรทัดออก ${removed} บรรทัด`);
  };

  const handlePasteUpload = async () => {
    const title = pasteTitle.trim();
    const body = pasteText.trim();
    if (!title) { setErrorMsg('กรุณาตั้งชื่อเอกสาร'); return; }
    if (body.length < 20) { setErrorMsg('เนื้อหาสั้นเกินไป'); return; }
    try {
      setProcessing(true);
      setErrorMsg('');
      setProgressText('กำลังแบ่งส่วนย่อยของเนื้อหา...');
      await processChunks(title, chunkText(body), {
        fileType: 'TEXT',
        fileSize: `${body.length.toLocaleString()} ตัวอักษร`,
      });
    } catch (err) {
      console.error('Processing error:', err);
      setErrorMsg(err.message);
      setProcessing(false);
    }
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '0.5rem',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
    background: 'none',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    cursor: 'pointer',
  });

  return (
    <div className="modal-backdrop" onClick={!processing ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>เพิ่มเอกสารฐานความรู้</h2>
          {!processing && (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {processing ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px auto', width: '30px', height: '30px', borderWidth: '3px' }}></div>
              <p style={{ fontWeight: 500 }}>{progressText}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                ขั้นตอนนี้อาจใช้เวลาสักครู่ กรุณาอย่าปิดหน้าจอ
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                <button style={tabStyle(mode === 'file')} onClick={() => { setMode('file'); setErrorMsg(''); }}>
                  อัปโหลดไฟล์
                </button>
                <button style={tabStyle(mode === 'paste')} onClick={() => { setMode('paste'); setErrorMsg(''); }}>
                  วางข้อความเอง
                </button>
              </div>

              {mode === 'file' ? (
                <>
                  <div
                    className="upload-dropzone"
                    tabIndex={0}
                    role="button"
                    aria-label="คลิกเพื่อเลือกไฟล์"
                    style={{
                      border: '2px dashed var(--color-border)',
                      padding: '2rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--color-bg-tertiary)',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <Upload size={32} style={{ marginBottom: '8px', color: 'var(--color-text-muted)' }} />
                    <p style={{ fontWeight: 500, margin: '8px 0' }}>คลิกเพื่อเลือกไฟล์ (.pdf, .txt, .md)</p>
                    {file && <p style={{ color: 'var(--color-primary)' }}>เลือกไฟล์: {file.name}</p>}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    PDF ที่เป็นรูปภาพสแกนจะอ่านข้อความไม่ได้ — กด "อ่านด้วย OCR" หรือใช้แท็บ "วางข้อความเอง"
                  </p>
                  {ocrOffered && file && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={runOcr}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <FileText size={16} />
                      อ่านด้วย OCR (ภาษาไทย · ครั้งแรกโหลดโมเดล ~15MB)
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">ชื่อเอกสาร</label>
                    <input
                      className="input"
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      placeholder="เช่น ระเบียบการกู้ยืม กยศ. ปีการศึกษา 2568"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">เนื้อหา (วางข้อความจากเอกสาร)</label>
                    <textarea
                      className="input"
                      rows={10}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="คัดลอกข้อความจาก PDF / Word แล้ววางที่นี่ ระบบจะแบ่งส่วนและสร้างเวกเตอร์ให้อัตโนมัติ"
                    />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {pasteText.trim().length.toLocaleString()} ตัวอักษร
                    </span>
                  </div>
                  {ocrRaw && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={cleanStricter}>
                        กรองบรรทัดขยะแบบเข้มขึ้น
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={cleanNormal}>
                        กรองปกติ
                      </button>
                    </div>
                  )}
                </>
              )}

              {errorMsg && (
                <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={processing}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={mode === 'file' ? handleFileUpload : handlePasteUpload}
            disabled={processing || (mode === 'file' ? !file : !pasteText.trim())}
          >
            {processing ? 'กำลังดำเนินการ...' : 'ประมวลผลและบันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Document View & PDF Viewer Modal Component ---- */
function DocumentViewModal({ doc, onClose, onDownload }) {
  const [activeTab, setActiveTab] = useState(doc.file_url ? 'pdf' : 'chunks');
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchChunk, setSearchChunk] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const isPdf = doc.file_type === 'PDF' || doc.filename?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    let mounted = true;
    async function loadChunks() {
      setLoadingChunks(true);
      try {
        const data = await getDocumentChunks(doc.id);
        if (mounted) setChunks(data || []);
      } catch (e) {
        console.error('Failed to load chunks:', e);
      } finally {
        if (mounted) setLoadingChunks(false);
      }
    }
    loadChunks();
    return () => {
      mounted = false;
    };
  }, [doc.id]);

  const allText = chunks.map((c) => c.content).join('\n\n');

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      await onDownload(doc);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    printOrSaveKnowledgeAsPdf(doc, chunks);
  };

  const filteredChunks = chunks.filter((c) =>
    !searchChunk ? true : c.content.toLowerCase().includes(searchChunk.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal kb-view-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ alignItems: 'flex-start', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0, paddingRight: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isPdf ? '#fee2e2' : '#e0f2fe',
                  color: isPdf ? '#b91c1c' : '#0284c7',
                  border: `1px solid ${isPdf ? '#fca5a5' : '#bae6fd'}`,
                }}
              >
                {isPdf ? 'PDF' : 'TEXT'}
              </span>
              {doc.file_size && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {doc.file_size}
                </span>
              )}
              {chunks.length > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Layers size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                  {chunks.length} ส่วนเวกเตอร์ AI
                </span>
              )}
            </div>
            <h2
              style={{
                fontSize: 'var(--text-lg)',
                margin: 0,
                color: 'var(--color-text-primary)',
                wordBreak: 'break-word',
              }}
            >
              {doc.filename}
            </h2>
          </div>

          <div className="kb-modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {doc.file_url && (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="เปิดในแท็บใหม่"
                style={{ fontSize: '0.75rem', padding: '6px 10px', height: 'auto' }}
              >
                <ExternalLink size={14} />
                <span>เปิดแท็บใหม่</span>
              </a>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadClick}
              disabled={isDownloading}
              style={{ fontSize: '0.75rem', padding: '6px 12px', height: 'auto' }}
            >
              {isDownloading ? (
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <Download size={14} />
              )}
              <span>ดาวน์โหลด PDF</span>
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="ปิด">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        {doc.file_url && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '0 1.25rem',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              overflowX: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              style={{
                padding: '10px 14px',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                border: 'none',
                borderBottom: `2px solid ${activeTab === 'pdf' ? 'var(--color-primary)' : 'transparent'}`,
                background: 'none',
                color: activeTab === 'pdf' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={16} />
              ดูไฟล์ PDF ต้นฉบับ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chunks')}
              style={{
                padding: '10px 14px',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                border: 'none',
                borderBottom: `2px solid ${activeTab === 'chunks' ? 'var(--color-primary)' : 'transparent'}`,
                background: 'none',
                color: activeTab === 'chunks' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={16} />
              เนื้อหาเวกเตอร์ AI ({chunks.length})
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {activeTab === 'pdf' && doc.file_url ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="kb-pdf-container">
                <iframe
                  src={`${doc.file_url}#toolbar=1&navpanes=0`}
                  title={doc.filename}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', display: 'block' }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  padding: '2px 4px',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <span>💡 หากโปรแกรมเบราว์เซอร์ไม่แสดงตัวอย่าง PDF ให้กดปุ่ม "เปิดแท็บใหม่" หรือ "ดาวน์โหลด PDF"</span>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  เปิดเต็มหน้าจอ ↗
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Chunks control bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px', minWidth: '180px' }}>
                  <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    className="input"
                    placeholder="ค้นหาข้อความในส่วนข้อมูล AI..."
                    value={searchChunk}
                    onChange={(e) => setSearchChunk(e.target.value)}
                    style={{ height: '32px', fontSize: 'var(--text-xs)', padding: '0 8px' }}
                  />
                  {searchChunk && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSearchChunk('')}
                      style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyAll}
                    style={{ fontSize: '0.75rem', gap: '4px' }}
                    title="คัดลอกข้อความทั้งหมด"
                  >
                    {copied ? <CheckCheck size={14} color="#059669" /> : <Copy size={14} />}
                    {copied ? 'คัดลอกแล้ว!' : 'คัดลอกทั้งหมด'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePrint}
                    style={{ fontSize: '0.75rem', gap: '4px' }}
                    title="เปิดหน้าต่างพิมพ์และบันทึกเป็น PDF"
                  >
                    <Printer size={14} />
                    พิมพ์ / บันทึก PDF
                  </button>
                </div>
              </div>

              {/* Chunks List */}
              {loadingChunks ? (
                <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28, borderWidth: 3 }} />
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>กำลังโหลดส่วนข้อมูล AI...</p>
                </div>
              ) : chunks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  <BookOpen size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>ไม่พบส่วนเนื้อหาเวกเตอร์ในเอกสารนี้</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>แสดง {filteredChunks.length} จาก {chunks.length} ส่วน</span>
                    <span>รวมประมาณ {allText.length.toLocaleString()} ตัวอักษร</span>
                  </div>

                  {filteredChunks.map((chunk, idx) => (
                    <div
                      key={chunk.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: '#ffffff',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px dashed var(--color-border)',
                          paddingBottom: '6px',
                          fontSize: '0.75rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          ส่วนที่ {idx + 1}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {(chunk.content || '').length} ตัวอักษร
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          maxHeight: '220px',
                          overflowY: 'auto',
                        }}
                      >
                        {chunk.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '0.875rem 1.25rem' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            ฐานข้อมูล AI มทร.ศรีวิชัย (สงขลา)
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
