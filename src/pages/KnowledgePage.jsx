import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKnowledgeArticles } from '../lib/knowledgeApi';
import {
  BookOpen,
  Search,
  CheckCircle2,
  FileText,
  Clock,
  Coins,
  AlertTriangle,
  Smartphone,
  PhoneCall,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Percent,
  ArrowRight,
  HelpCircle,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';

const CATEGORY_ICONS = {
  eligibility: ShieldCheck,
  documents: FileText,
  process: Clock,
  amounts: Coins,
  repayment: Percent,
  default: AlertTriangle,
  app: Smartphone,
  contact: PhoneCall,
};

/* ─── Data Categories & Content ─────────────────────────────────── */
const KNOWLEDGE_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด', icon: BookOpen },
  { id: 'eligibility', label: 'คุณสมบัติผู้กู้', icon: ShieldCheck },
  { id: 'documents', label: 'เอกสารที่ต้องใช้', icon: FileText },
  { id: 'process', label: 'ขั้นตอนการกู้ยืม', icon: Clock },
  { id: 'amounts', label: 'วงเงินกู้ยืม', icon: Coins },
  { id: 'repayment', label: 'การชำระหนี้คืน', icon: Percent },
  { id: 'default', label: 'การผิดนัด/ผ่อนผัน', icon: AlertTriangle },
  { id: 'app', label: 'แอป กยศ. Connect', icon: Smartphone },
  { id: 'contact', label: 'ช่องทางติดต่อ', icon: PhoneCall },
];

const KNOWLEDGE_ITEMS = [
  {
    id: 'eligibility',
    category: 'eligibility',
    title: 'คุณสมบัติผู้กู้ยืมเงิน กยศ.',
    subtitle: 'เกณฑ์พื้นฐานของผู้มีสิทธิ์ยื่นกู้ยืมเพื่อการศึกษา',
    badge: 'คุณสมบัติ',
    summary: 'สัญชาติไทย ขาดแคลนทุนทรัพย์ (รายได้ครอบครัวไม่เกิน 360,000 บ./ปี) ไม่เคยผิดนัดชำระหนี้',
    details: [
      {
        heading: 'เกณฑ์คุณสมบัติหลัก',
        points: [
          'มีสัญชาติไทย โดยกำเนิดหรือแปลงสัญชาติถูกต้องตามกฎหมาย',
          'เป็นผู้ขาดแคลนทุนทรัพย์ (รายได้ของครอบครัวรวมกันไม่เกิน 360,000 บาทต่อปี)',
          'ศึกษาอยู่ในสถานศึกษาที่ร่วมดำเนินงานกับ กยศ. (ม.ปลาย, ปวช., ปวส., ปริญญาตรี)',
          'ไม่เป็นผู้สำเร็จการศึกษาระดับปริญญาตรีในสาขาใดสาขาหนึ่งมาก่อน (กรณีกู้ระดับปริญญาตรี)',
          'มีผลการเรียนสะสม (GPA) ตามเกณฑ์ที่สถานศึกษาและกองทุนกำหนด',
          'มีจิตสาธารณะ / ทำกิจกรรมบำเพ็ญประโยชน์ครบตามชั่วโมงที่กำหนด (36 ชม./ปีการศึกษา)',
          'ไม่เป็นผู้ผิดนัดชำระหนี้เงินกู้ยืม กยศ. หรือ กรอ. มาก่อน เว้นแต่ได้ปรับปรุงโครงสร้างหนี้แล้ว',
        ],
      },
      {
        heading: 'ประเภทของผู้กู้ยืม',
        points: [
          'ผู้กู้ยืมรายใหม่: ไม่เคยขอกู้ยืมเงิน กยศ. มาก่อน',
          'ผู้กู้ยืมรายเก่าเลื่อนชั้นปี: กู้ต่อเนื่องในสถานศึกษาเดิม',
          'ผู้กู้ยืมรายเก่าย้ายสถานศึกษา: เคยได้รับอนุมัติจากที่เดิมและย้ายมาศึกษาที่ มทร.ศรีวิชัย',
          'ผู้กู้ยืมเปลี่ยนระดับการศึกษา: เช่น จาก ปวช. มา ปวส. หรือ ปวส. มา ปริญญาตรี',
        ],
      },
    ],
    highlight: '💡 หมายเหตุ: นักศึกษา มทร.ศรีวิชัย สามารถยื่นกู้ได้ทั้งประเภทขาดแคลนทุนทรัพย์ และประเภทสาขาวิชาที่เป็นความต้องการหลักของประเทศ',
    promptSuggestion: 'ตรวจสอบคุณสมบัติการกู้ยืม กยศ. สำหรับนักศึกษา ป.ตรี',
  },
  {
    id: 'documents',
    category: 'documents',
    title: 'เอกสารประกอบการขอกู้ยืม กยศ.',
    subtitle: 'รายการเอกสารที่ต้องจัดเตรียมทั้งผู้กู้และผู้ปกครอง',
    badge: 'เอกสาร',
    summary: 'สำเนาบัตรประชาชน ทะเบียนบ้าน สลิปเงินเดือน/หนังสือรับรองรายได้ และเอกสารสิทธิ์ทางการศึกษา',
    details: [
      {
        heading: '1. เอกสารส่วนตัวของผู้กู้',
        points: [
          'สำเนาบัตรประจำตัวประชาชนของผู้กู้ (ที่ยังไม่หมดอายุ)',
          'สำเนาทะเบียนบ้านของผู้กู้',
          'ใบแสดงผลการเรียน (Transcript หรือ ปพ.1) ของปีการศึกษาล่าสุด',
          'หลักฐานการเป็นนักศึกษา มทร.ศรีวิชัย (ใบเสร็จลงทะเบียน/หนังสือรับรอง)',
          'สมุดบัญชีธนาคารกรุงไทย หรือ ธ.ก.ส. หรือ ธนาคารอิสลาม (ชื่อผู้กู้เท่านั้น)',
        ],
      },
      {
        heading: '2. เอกสารผู้ปกครอง / ผู้แทนโดยชอบธรรม',
        points: [
          'สำเนาบัตรประชาชน และสำเนาทะเบียนบ้านของ บิดา-มารดา หรือ ผู้ปกครอง',
          'หนังสือรับรองรายได้ครอบครัว (แบบ กยศ.102) หรือ สลิปเงินเดือน/หนังสือรับรองเงินเดือนล่าสุด',
          'สำเนาบัตรข้าราชการ/เจ้าหน้าที่รัฐ ของผู้รับรองรายได้ (กรณีใช้แบบ กยศ.102)',
          'กรณีบิดามารดาหย่าร้าง ให้แนบสำเนาใบสำคัญการหย่า หรือหนังสือรับรองการแยกกันอยู่',
        ],
      },
    ],
    highlight: '📌 ตั้งแต่ปีการศึกษา 2567 กยศ. ได้ยกเลิกข้อกำหนดเรื่อง "ผู้ค้ำประกัน" สำหรับผู้กู้รายใหม่ ทำให้การเตรียมเอกสารสะดวกขึ้นมาก',
    promptSuggestion: 'ขอแบบฟอร์มและเอกสารที่ต้องใช้ในการกู้ กยศ. รายใหม่',
  },
  {
    id: 'process',
    category: 'process',
    title: 'ขั้นตอนการยื่นกู้ยืมเงินในระบบ DSL',
    subtitle: 'กระบวนการ 8 ขั้นตอนตั้งแต่ลงทะเบียนจนถึงรับโอนเงิน',
    badge: 'ขั้นตอน',
    summary: 'ลงทะเบียน DSL > ยื่นคำขอกู้ > สถานศึกษาคัดกรอง > กยศ. อนุมัติ > ทำสัญญา > โอนเงิน',
    steps: [
      { step: '1', title: 'ลงทะเบียนระบบ DSL', desc: 'เข้าเว็บไซต์ www.studentloan.or.th หรือแอป กยศ. Connect เพื่อลงทะเบียนด้วยเลขบัตรประชาชน 13 หลัก' },
      { step: '2', title: 'กรอกข้อมูลคำขอกู้ยืม', desc: 'กรอกข้อมูลประวัติส่วนตัว ครอบครัว รายได้ และแนบไฟล์เอกสารหลักฐานให้ครบถ้วน' },
      { step: '3', title: 'เลือกสถานศึกษาและหลักสูตร', desc: 'เลือก มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย คณะ สาขาวิชา และปีการศึกษาที่ศึกษา' },
      { step: '4', title: 'ส่งคำขอกู้ยืมในระบบ', desc: 'ตรวจสอบความถูกต้องและกดยืนยันส่งคำขอกู้ยืมผ่านระบบออนไลน์' },
      { step: '5', title: 'สถานศึกษาตรวจสอบและสัมภาษณ์', desc: 'เจ้าหน้าที่งานแนะแนว/กยศ. ของมหาวิทยาลัยตรวจสอบหลักฐานและจัดสัมภาษณ์' },
      { step: '6', title: 'กยศ. พิจารณาอนุมัติ', desc: 'กองทุน กยศ. ตรวจสอบและประกาศผลการอนุมัติสิทธิ์ในระบบ DSL' },
      { step: '7', title: 'ลงนามในสัญญากู้ยืมเงิน', desc: 'จัดทำสัญญากู้ยืมเงินและแบบยืนยันเบิกเงินค่าเล่าเรียน/ค่าครองชีพ' },
      { step: '8', title: 'การโอนเงินเข้าบัญชี', desc: 'ค่าเล่าเรียนโอนตรงเข้ามหาวิทยาลัย ส่วนค่าครองชีพโอนเข้าบัญชีผู้กู้ทุกเดือน' },
    ],
    highlight: '⏱️ ระยะเวลาดำเนินการรวม: โดยเฉลี่ยประมาณ 30-45 วันหลังสถานศึกษายืนยันข้อมูลครบถ้วน',
    promptSuggestion: 'ขั้นตอนการกู้ยืมเงิน กยศ. ในระบบ DSL มีอะไรบ้าง',
  },
  {
    id: 'amounts',
    category: 'amounts',
    title: 'วงเงินกู้ยืม กยศ. ประจำปีการศึกษา',
    subtitle: 'อัตราค่าเล่าเรียนและค่าครองชีพสูงสุดแต่ละระดับการศึกษา',
    badge: 'วงเงิน',
    summary: 'ม.ปลาย 26,400 บ. | ปวช./ปวส. 30,000 บ. | ปริญญาตรี สูงสุด 70,000-200,000 บ. + ค่าครองชีพ 36,000 บ./ปี',
    tableData: [
      { level: 'มัธยมปลาย (ม.4-6)', tuition: 'ตามจริง (ไม่เกินเกณฑ์)', allowance: '26,400 บาท/ปี (2,200/ด.)' },
      { level: 'ปวช. (ประกาศนียบัตรวิชาชีพ)', tuition: 'ตามจริงไม่เกิน 35,000 บาท/ปี', allowance: '26,400 บาท/ปี (2,200/ด.)' },
      { level: 'ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)', tuition: 'ตามจริงไม่เกิน 50,000 บาท/ปี', allowance: '30,000 บาท/ปี (2,500/ด.)' },
      { level: 'ปริญญาตรี (กลุ่มมนุษย์/สังคม)', tuition: 'ตามจริงไม่เกิน 60,000 บาท/ปี', allowance: '36,000 บาท/ปี (3,000/ด.)' },
      { level: 'ปริญญาตรี (กลุ่มวิทยาศาสตร์/วิศวะ)', tuition: 'ตามจริงไม่เกิน 70,000-100,000 บาท/ปี', allowance: '36,000 บาท/ปี (3,000/ด.)' },
      { level: 'ปริญญาตรี (กลุ่มแพทย์/สาธารณสุข)', tuition: 'ตามจริงไม่เกิน 200,000 บาท/ปี', allowance: '36,000 บาท/ปี (3,000/ด.)' },
    ],
    highlight: '💰 เงินค่าครองชีพรายเดือน (3,000 บาท/เดือน สำหรับ ป.ตรี) จะโอนเข้าบัญชีผู้กู้โดยตรงทุกวันที่ 15 ของเดือน',
    promptSuggestion: 'วงเงินค่าเล่าเรียนและค่าครองชีพ กยศ. ปริญญาตรี ได้เท่าไหร่',
  },
  {
    id: 'repayment',
    category: 'repayment',
    title: 'การชำระหนี้คืน กยศ. & อัตราดอกเบี้ย',
    subtitle: 'เงื่อนไขระยะเวลาปลอดหนี้ ดอกเบี้ย และการคำนวณเงินงวด',
    badge: 'การชำระหนี้',
    summary: 'ปลอดหนี้ 2 ปีหลังจบ ดอกเบี้ยต่ำ 1% ต่อปี ผ่อนชำระได้นานถึง 15 ปี พร้อมส่วนลดเมื่อปิดบัญชีก่อนกำหนด',
    details: [
      {
        heading: 'เงื่อนไขการชำระหนี้',
        points: [
          'ระยะเวลาปลอดหนี้ (Grace Period): 2 ปี นับจากสำเร็จการศึกษาหรือพ้นสภาพนักศึกษา',
          'อัตราดอกเบี้ยเงินกู้: ร้อยละ 1 ต่อปี (คิดจากเงินต้นคงเหลือ)',
          'ระยะเวลาการผ่อนชำระ: ผ่อนได้สูงสุดไม่เกิน 15 ปี',
          'การคิดยอดชำระ: กองทุนจะคำนวณตารางการผ่อนชำระแบบขั้นบันไดหรือเฉลี่ยรายงวด',
          'วันครบกำหนดชำระ: วันที่ 5 กรกฎาคมของทุกปี (หรือเลือกหักรายเดือนผ่านระบบ)',
        ],
      },
      {
        heading: 'ช่องทางการชำระเงินสะดวก',
        points: [
          'แอปพลิเคชัน กยศ. Connect ผ่านระบบ QR Code (ฟรีค่าธรรมเนียม)',
          'หักผ่านบัญชีเงินเดือนอัตโนมัติ (สำหรับพนักงานบริษัทหรือข้าราชการ)',
          'Mobile Banking ทุกธนาคาร (Krungthai NEXT, SCB EASY, K PLUS ฯลฯ)',
          'เคาน์เตอร์เซอร์วิส 7-Eleven, Lotus\'s และไปรษณีย์ไทย',
        ],
      },
    ],
    highlight: '🎉 สิทธิพิเศษ: ชำระหนี้ปิดบัญชีก่อนกำหนด ได้รับส่วนลดเงินต้นและยกเว้นดอกเบี้ยค้างรับตามเงื่อนไขของกองทุน',
    promptSuggestion: 'เงื่อนไขการชำระหนี้ กยศ. มีดอกเบี้ยและระยะเวลาผ่อนกี่ปี',
  },
  {
    id: 'default',
    category: 'default',
    title: 'การผิดนัดชำระหนี้และมาตรการช่วยเหลือ',
    subtitle: 'ผลกระทบเมื่อขาดชำระ และโครงการปรับโครงสร้างหนี้ กยศ.',
    badge: 'มาตรการผ่อนปรน',
    summary: 'ดอกเบี้ยผิดนัด 0.5% ต่อปี สามารถยื่นขอปรับโครงสร้างหนี้ ขยายเวลาชำระ และลบประวัติเครดิตบูโรได้',
    details: [
      {
        heading: 'กฎหมาย กยศ. ฉบับใหม่ (เพื่อความเป็นธรรม)',
        points: [
          'ลดเบี้ยปรับผิดนัดชำระหนี้เหลือเพียงร้อยละ 0.5 ต่อปี (จากเดิม 7.5% ต่อปี)',
          'เปลี่ยนลำดับการตัดชำระหนี้: ตัดเงินต้นก่อน > ดอกเบี้ย > เบี้ยปรับ',
          'เปิดให้ผู้กู้ทุกกลุ่มเข้ามาทำสัญญา "ปรับโครงสร้างหนี้" ขยายเวลาผ่อนชำระได้สูงสุดถึงอายุ 65 ปี',
          'ผู้ค้ำประกันหลุดพ้นจากความรับผิดเมื่อผู้กู้ทำสัญญาปรับโครงสร้างหนี้',
        ],
      },
      {
        heading: 'วิธีขอปรับโครงสร้างหนี้ / ขอผ่อนผัน',
        points: [
          'ยื่นความประสงค์ผ่านเว็บไซต์ www.studentloan.or.th หรือแอป กยศ. Connect',
          'เข้าร่วมโครงการไกล่เกลี่ยข้อพิพาทก่อนฟ้อง หรือหลังมีคำพิพากษา',
          'กรณีว่างงาน เจ็บป่วย หรือประสบภัยพิบัติ สามารถยื่นขอผ่อนผันการชำระหนี้ได้ชั่วคราว',
        ],
      },
    ],
    highlight: '⚠️ คำแนะนำ: หากมีปัญหาเรื่องการเงิน อย่าปล่อยให้ขาดการติดต่อ ให้รีบติดต่อ กยศ. เพื่อขอปรับโครงสร้างหนี้ทันที',
    promptSuggestion: 'วิธีปรับโครงสร้างหนี้ กยศ. ฉบับใหม่ ต้องทำอย่างไร',
  },
  {
    id: 'app',
    category: 'app',
    title: 'คู่มือการใช้งานแอปพลิเคชัน กยศ. Connect',
    subtitle: 'ศูนย์รวมบริการดิจิทัลของ กยศ. ตรวจสอบยอดหนี้ ชำระเงิน และติดตามสถานะ',
    badge: 'โมบายแอป',
    summary: 'ตรวจยอดหนี้ ดูสถานะเงินโอน สแกน QR ชำระเงิน ขอหนังสือรับรอง และรับแจ้งเตือนแบบเรียลไทม์',
    details: [
      {
        heading: 'ฟังก์ชันเด่นของแอป กยศ. Connect',
        points: [
          'ตรวจสอบยอดหนี้คงเหลือ ยอดที่ต้องชำระในแต่ละปีแบบเรียลไทม์',
          'ตรวจสอบสถานะการโอนเงินค่าครองชีพและค่าเล่าเรียน',
          'สร้าง QR Code ชำระหนี้ผ่าน Mobile Banking ได้ทุกธนาคาร',
          'ขอหนังสือรับรองการชำระหนี้ หรือหนังสือยืนยันยอดหนี้ในรูปแบบ e-Document',
          'รับการแจ้งเตือนกำหนดชำระข่าวสารสิทธิประโยชน์พิเศษ',
        ],
      },
      {
        heading: 'วิธีดาวน์โหลดและลงทะเบียน',
        points: [
          'iOS: ค้นหา "กยศ. Connect" ใน App Store (รองรับ iOS 11.0 ขึ้นไป)',
          'Android: ค้นหา "กยศ. Connect" ใน Google Play Store',
          'Huawei: ดาวน์โหลดได้จาก Huawei AppGallery',
          'ลงทะเบียนด้วยเลขบัตรประชาชน 13 หลัก และยืนยันตัวตนด้วยรหัส OTP',
        ],
      },
    ],
    highlight: '📱 นักศึกษาผู้กู้ทุกคนควรติดตั้งแอป กยศ. Connect เพื่อตรวจสอบสถานะการอนุมัติและเงินโอนเข้าบัญชีได้อย่างแม่นยำ',
    promptSuggestion: 'วิธีใช้งานและสมัครแอป กยศ. Connect',
  },
  {
    id: 'contact',
    category: 'contact',
    title: 'ช่องทางติดต่อและขอรับคำปรึกษา กยศ.',
    subtitle: 'เบอร์โทร เว็บไซต์ และที่ตั้งหน่วยงานประสานงาน กยศ. มทร.ศรีวิชัย',
    badge: 'ติดต่อสอบถาม',
    summary: 'กยศ. Call Center 0-2016-4888 และ งานทุนการศึกษา กองพัฒนานักศึกษา มทร.ศรีวิชัย',
    details: [
      {
        heading: 'สำนักงาน กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) ส่วนกลาง',
        points: [
          'Call Center: 0 2016 4888 (เปิดบริการ จันทร์-ศุกร์ 08.30 - 16.30 น.)',
          'เว็บไซต์หลัก: www.studentloan.or.th',
          'ระบบ DSL: https://wsa.dsl.studentloan.or.th',
          'Facebook Fanpage: กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)',
          'ที่อยู่: เลขที่ 89 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ ชั้น 5-6 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กทม. 10400',
        ],
      },
      {
        heading: 'หน่วยงานประสานงาน กยศ. มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย',
        points: [
          'งานแนะแนวและทุนการศึกษา กองพัฒนานักศึกษา มทร.ศรีวิชัย (สงขลา)',
          'โทรศัพท์: 074-317-100 ต่อ งานทุนการศึกษา กยศ.',
          'จุดบริการนักศึกษา: กองพัฒนานักศึกษา อาคาร 7 ชั้น 1',
          'เว็บไซต์มหาวิทยาลัย: www.rmutsv.ac.th',
        ],
      },
    ],
    highlight: '🏫 นักศึกษาสามารถติดต่อสอบถามข้อสงสัยได้ที่กองพัฒนานักศึกษา มทร.ศรีวิชัย ในวันและเวลาราชการ',
    promptSuggestion: 'เบอร์ติดต่อ กยศ. มทร.ศรีวิชัย และส่วนกลาง',
  },
];

export default function KnowledgePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState('eligibility');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'accordion'
  const [readingArticle, setReadingArticle] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getKnowledgeArticles();
        setArticles(data || []);
      } catch (e) {
        console.error('Error fetching knowledge articles:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    window.addEventListener('knowledgeArticlesUpdated', loadData);
    return () => window.removeEventListener('knowledgeArticlesUpdated', loadData);
  }, []);

  const filteredItems = useMemo(() => {
    const list = articles.length > 0 ? articles : KNOWLEDGE_ITEMS;
    return list.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        (item.details && item.details.some((d) => d.points && d.points.some((p) => p.toLowerCase().includes(q)))) ||
        (item.steps && item.steps.some((s) => s.title?.toLowerCase().includes(q) || s.desc?.toLowerCase().includes(q)));
      return matchCategory && matchQuery;
    });
  }, [articles, selectedCategory, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAskAI = (prompt) => {
    navigate(`/chat?q=${encodeURIComponent(prompt)}`);
  };

  const ModalIcon = readingArticle ? (CATEGORY_ICONS[readingArticle.category] || BookOpen) : null;

  return (
    <div className="page-container animate-fade-in" id="gsl-knowledge-page" style={{ maxWidth: 1140, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ── Dignified Unified Hero Header ── */}
      <div
        style={{
          background: 'var(--color-primary, #1e3a8a)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl, 12px)',
          padding: 'clamp(24px, 4vw, 36px) clamp(20px, 3.5vw, 32px)',
          marginBottom: 'var(--space-lg)',
          boxShadow: '0 4px 16px rgba(30, 58, 138, 0.14)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ maxWidth: 840 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.14)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.3px',
              marginBottom: 'var(--space-sm)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <GraduationCap size={15} /> กองพัฒนานักศึกษา มทร.ศรีวิชัย · ศูนย์ข้อมูล กยศ.
          </div>

          <h1
            style={{
              color: '#ffffff',
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 800,
              margin: '0 0 var(--space-xs)',
              lineHeight: 1.3,
            }}
          >
            องค์ความรู้และคู่มือ กยศ.
          </h1>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
              margin: '0 0 var(--space-lg)',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            รวมระเบียบและแนวทางกู้ยืมเพื่อการศึกษาฉบับสมบูรณ์ — ตรวจสอบคุณสมบัติ เอกสารที่ต้องใช้ ขั้นตอนระบบ DSL อัตราวงเงิน และการชำระหนี้คืน ครบจบในที่เดียว
          </p>

          {/* Integrated Clean Search Bar */}
          <div
            style={{
              position: 'relative',
              maxWidth: 620,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
              borderRadius: 'var(--radius-md, 8px)',
              overflow: 'hidden',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-primary, #1e3a8a)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาหัวข้อที่ต้องการ เช่น คุณสมบัติ, เอกสาร, กรอ., กยศ...."
              style={{
                width: '100%',
                height: 48,
                paddingLeft: 44,
                paddingRight: searchQuery ? 40 : 16,
                fontSize: 'var(--text-sm)',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                background: '#ffffff',
                color: 'var(--color-text-primary, #1a2434)',
                outline: 'none',
                fontWeight: 500,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #6b7688)',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="ล้างคำค้นหา"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category Filter Bar & View Mode Toggle ── */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: 'var(--space-lg)',
          background: 'var(--color-bg-secondary, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg, 10px)',
        }}
      >
        {/* Category Filter Pills (Wrap to show all categories cleanly on desktop) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            flex: '1 1 auto',
          }}
        >
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = (articles.length > 0 ? articles : KNOWLEDGE_ITEMS).filter((item) =>
              cat.id === 'all' ? true : item.category === cat.id
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md, 6px)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                  color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.22)' : 'var(--color-bg-tertiary)',
                    color: isSelected ? '#ffffff' : 'var(--color-text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle Buttons */}
        <div style={{ display: 'inline-flex', background: 'var(--color-bg-primary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flexShrink: 0, marginLeft: 'auto' }}>
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
            title="มุมมองการ์ดความรู้"
          >
            <LayoutGrid size={13} />
            <span>การ์ดความรู้</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('accordion')}
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
              background: viewMode === 'accordion' ? 'var(--color-primary)' : 'transparent',
              color: viewMode === 'accordion' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
            title="มุมมองรายการย่อ-ขยาย"
          >
            <List size={13} />
            <span>รายการย่อขยาย</span>
          </button>
        </div>
      </div>

      {/* ── Knowledge Content ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <HelpCircle size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.5, margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            ไม่พบข้อมูลที่ค้นหา "{searchQuery}"
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 6 }}>
            ลองค้นหาด้วยคำสำคัญอื่น หรือกดเลือกหมวดหมู่ "ทั้งหมด"
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            style={{ marginTop: 'var(--space-md)', padding: '6px 16px' }}
          >
            ล้างคำค้นหาและตัวกรอง
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Unified Clean Cards Grid View ── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-md, 16px)',
          }}
        >
          {filteredItems.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || BookOpen;

            return (
              <div
                key={item.id}
                className="card"
                onClick={() => setReadingArticle(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg, 10px)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-secondary, #ffffff)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #1e3a8a)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 58, 138, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }}
              >
                {/* Card Top: Icon & Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'var(--color-primary-soft, #eef2fb)',
                      color: 'var(--color-primary, #1e3a8a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(30, 58, 138, 0.12)',
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary-soft, #eef2fb)',
                      color: 'var(--color-primary, #1e3a8a)',
                      border: '1px solid rgba(30, 58, 138, 0.15)',
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Card Title & Subtitle */}
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 4px',
                    lineHeight: 1.4,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 12px',
                    fontWeight: 500,
                  }}
                >
                  {item.subtitle}
                </p>

                {/* Summary Teaser Box */}
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'var(--color-bg-primary, #f4f5f7)',
                    borderRadius: 'var(--radius-md, 6px)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                    borderLeft: '3px solid var(--color-primary, #1e3a8a)',
                    marginBottom: '14px',
                  }}
                >
                  {item.summary}
                </div>

                {/* Key Points Preview Snippet */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1 }}>
                  {item.steps ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-primary, #1e3a8a)', fontWeight: 600 }}>
                      <Clock size={15} />
                      <span>มีขั้นตอนดำเนินงาน 8 ขั้นตอนในระบบ DSL</span>
                    </div>
                  ) : item.tableData ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-primary, #1e3a8a)', fontWeight: 600 }}>
                      <Coins size={15} />
                      <span>มีตารางแสดงอัตราค่าเล่าเรียนและค่าครองชีพแยกตามระดับ</span>
                    </div>
                  ) : item.details?.[0]?.points ? (
                    item.details[0].points.slice(0, 2).map((point, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '0.82rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.45,
                        }}
                      >
                        <CheckCircle2 size={14} style={{ color: 'var(--color-primary, #1e3a8a)', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {point}
                        </span>
                      </div>
                    ))
                  ) : null}
                </div>

                {/* Card Footer: Action Buttons */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--color-primary, #1e3a8a)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    อ่านคู่มือฉบับเต็ม <ChevronRight size={14} />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAI(item.promptSuggestion);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                    }}
                    title="ถาม AI เกี่ยวกับเรื่องนี้"
                  >
                    <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
                    ถาม AI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Modern Accordion View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const Icon = CATEGORY_ICONS[item.category] || BookOpen;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'border-color 0.15s ease',
                  borderRadius: 'var(--radius-lg, 10px)',
                  background: 'var(--color-bg-secondary, #ffffff)',
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--color-primary-soft, #eef2fb)' : 'var(--color-bg-secondary, #ffffff)',
                    userSelect: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-md, 8px)',
                        background: isExpanded ? 'var(--color-primary, #1e3a8a)' : 'var(--color-primary-soft, #eef2fb)',
                        color: isExpanded ? '#ffffff' : 'var(--color-primary, #1e3a8a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(30, 58, 138, 0.12)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: isExpanded ? 'rgba(30, 58, 138, 0.12)' : 'var(--color-primary-soft, #eef2fb)',
                            color: 'var(--color-primary, #1e3a8a)',
                            border: '1px solid rgba(30, 58, 138, 0.12)',
                          }}
                        >
                          {item.badge}
                        </span>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                          {item.title}
                        </h2>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                        {item.subtitle}
                      </p>
                      {!isExpanded && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary, #1e3a8a)', fontWeight: 600 }}>
                      {isExpanded ? 'ย่อเนื้อหา' : 'ดูรายละเอียด'}
                    </span>
                    <div
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                        color: 'var(--color-primary, #1e3a8a)',
                      }}
                    >
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="animate-fade-in" style={{ padding: '20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary, #ffffff)' }}>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'var(--color-bg-primary, #f4f5f7)',
                        borderRadius: 'var(--radius-md, 6px)',
                        borderLeft: '3px solid var(--color-primary, #1e3a8a)',
                        marginBottom: 'var(--space-md)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {item.summary}
                    </div>

                    {/* Step Visualizer */}
                    {item.steps && (
                      <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={16} style={{ color: 'var(--color-primary, #1e3a8a)' }} /> แผนผังขั้นตอนการดำเนินงานในระบบ DSL
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                          {item.steps.map((st) => (
                            <div
                              key={st.step}
                              style={{
                                padding: '12px 14px',
                                background: 'var(--color-bg-primary, #f4f5f7)',
                                borderRadius: 'var(--radius-md, 6px)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: 'var(--color-primary, #1e3a8a)',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {st.step}
                                </span>
                                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{st.title}</strong>
                              </div>
                              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 30, lineHeight: 1.5 }}>
                                {st.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Table Data */}
                    {item.tableData && (
                      <div style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto' }}>
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Coins size={16} style={{ color: 'var(--color-primary, #1e3a8a)' }} /> ตารางอัตราวงเงินค่าเล่าเรียนและค่าครองชีพ
                        </h4>
                        <table className="table" style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                          <thead>
                            <tr>
                              <th>ระดับการศึกษา</th>
                              <th>ค่าเล่าเรียนสูงสุด</th>
                              <th>ค่าครองชีพส่วนตัว</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.tableData.map((row, idx) => (
                              <tr key={idx}>
                                <td><strong>{row.level}</strong></td>
                                <td><span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{row.tuition}</span></td>
                                <td><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{row.allowance}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Details Sections */}
                    {item.details && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {item.details.map((section, sIdx) => (
                          <div key={sIdx} style={{ background: 'var(--color-bg-primary, #f4f5f7)', padding: '14px 16px', borderRadius: 'var(--radius-md, 6px)', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                              {section.heading}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {section.points.map((pt, pIdx) => (
                                <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                  <CheckCircle2 size={15} style={{ color: 'var(--color-primary, #1e3a8a)', flexShrink: 0, marginTop: 3 }} />
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Highlight Box */}
                    {item.highlight && (
                      <div
                        style={{
                          marginTop: 'var(--space-md)',
                          padding: '12px 14px',
                          background: 'var(--color-primary-soft, #eef2fb)',
                          borderRadius: 'var(--radius-md, 6px)',
                          border: '1px solid rgba(30, 58, 138, 0.15)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-primary, #1e3a8a)',
                          fontWeight: 600,
                        }}
                      >
                        {item.highlight}
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div
                      style={{
                        marginTop: 'var(--space-lg)',
                        paddingTop: 'var(--space-md)',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--space-sm)',
                      }}
                    >
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAskAI(item.promptSuggestion);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                      >
                        <Sparkles size={15} /> ถาม AI เกี่ยวกับเรื่องนี้
                      </button>

                      <a
                        href="https://www.studentloan.or.th"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)' }}
                      >
                        <ExternalLink size={14} /> เว็บไซต์ กยศ. ทางการ
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Interactive Comprehensive Reading Modal ── */}
      {readingArticle && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
          }}
          onClick={() => setReadingArticle(null)}
        >
          <div
            className="card animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 820,
              maxHeight: 'min(92dvh, 880px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-bg-secondary, #ffffff)',
              borderRadius: 'var(--radius-xl, 12px)',
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-bg-secondary, #ffffff)',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--color-primary-soft, #eef2fb)',
                    color: 'var(--color-primary, #1e3a8a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(30, 58, 138, 0.12)',
                  }}
                >
                  <ModalIcon size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary-soft, #eef2fb)',
                        color: 'var(--color-primary, #1e3a8a)',
                        border: '1px solid rgba(30, 58, 138, 0.12)',
                      }}
                    >
                      {readingArticle.badge}
                    </span>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                      {readingArticle.title}
                    </h2>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {readingArticle.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setReadingArticle(null)}
                style={{ padding: 6, borderRadius: '50%', color: 'var(--color-text-muted)' }}
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Summary Callout */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--color-primary-soft, #eef2fb)',
                  borderRadius: 'var(--radius-md, 6px)',
                  borderLeft: '4px solid var(--color-primary, #1e3a8a)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {readingArticle.summary}
              </div>

              {/* Step Visualizer */}
              {readingArticle.steps && (
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: 'var(--color-primary, #1e3a8a)' }} /> แผนผังขั้นตอนการดำเนินงานในระบบ DSL
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                    {readingArticle.steps.map((st) => (
                      <div
                        key={st.step}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--color-bg-primary, #f4f5f7)',
                          borderRadius: 'var(--radius-md, 6px)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--color-primary, #1e3a8a)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {st.step}
                          </span>
                          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{st.title}</strong>
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 30, lineHeight: 1.5 }}>
                          {st.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Data */}
              {readingArticle.tableData && (
                <div style={{ overflowX: 'auto' }}>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={16} style={{ color: 'var(--color-primary, #1e3a8a)' }} /> ตารางอัตราวงเงินกู้ยืมและค่าครองชีพ
                  </h4>
                  <table className="table" style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>ระดับการศึกษา</th>
                        <th>ค่าเล่าเรียนสูงสุด</th>
                        <th>ค่าครองชีพส่วนตัว</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readingArticle.tableData.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.level}</strong></td>
                          <td><span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{row.tuition}</span></td>
                          <td><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{row.allowance}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Details Sections */}
              {readingArticle.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {readingArticle.details.map((section, sIdx) => (
                    <div key={sIdx} style={{ background: 'var(--color-bg-primary, #f4f5f7)', padding: '14px 16px', borderRadius: 'var(--radius-md, 6px)', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                        {section.heading}
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {section.points.map((pt, pIdx) => (
                          <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            <CheckCircle2 size={15} style={{ color: 'var(--color-primary, #1e3a8a)', flexShrink: 0, marginTop: 3 }} />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Highlight Box */}
              {readingArticle.highlight && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--color-primary-soft, #eef2fb)',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: '1px solid rgba(30, 58, 138, 0.15)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-primary, #1e3a8a)',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {readingArticle.highlight}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'var(--color-bg-primary, #f4f5f7)',
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const prompt = readingArticle.promptSuggestion;
                  setReadingArticle(null);
                  handleAskAI(prompt);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <Sparkles size={15} /> ถาม AI เกี่ยวกับเรื่องนี้
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href="https://www.studentloan.or.th"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)' }}
                >
                  <ExternalLink size={14} /> เว็บ กยศ. ทางการ
                </a>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setReadingArticle(null)}
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Footer AI Helper Banner ── */}
      <div
        className="card"
        style={{
          marginTop: 'var(--space-2xl, 36px)',
          padding: '20px 24px',
          background: 'var(--color-primary-soft, #eef2fb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          borderRadius: 'var(--radius-lg, 10px)',
          border: '1px solid rgba(30, 58, 138, 0.15)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md, 8px)',
              background: '#ffffff',
              color: 'var(--color-primary, #1e3a8a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(30, 58, 138, 0.12)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              มีข้อสงสัยเฉพาะทางเกี่ยวกับสิทธิ์และกองทุน กยศ. หรือไม่?
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              ระบบ AI อัจฉริยะพร้อมตอบคำถาม แนะนำเอกสาร และขั้นตอนการกู้ยืมของ มทร.ศรีวิชัย ตลอด 24 ชั่วโมง
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/chat')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            padding: '8px 18px',
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-md, 6px)',
          }}
        >
          เริ่มคุยกับ AI Chatbot <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
