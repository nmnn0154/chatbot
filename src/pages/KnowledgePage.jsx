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
  Calendar,
  HelpCircle,
  ArrowRight,
  Bookmark,
} from 'lucide-react';

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
    badgeColor: 'blue',
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
    badgeColor: 'purple',
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
    badgeColor: 'green',
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
    badgeColor: 'amber',
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
    badgeColor: 'green',
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
    badgeColor: 'amber',
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
    badgeColor: 'blue',
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
    badgeColor: 'purple',
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
        (item.details && item.details.some(d => d.points && d.points.some(p => p.toLowerCase().includes(q))));
      return matchCategory && matchQuery;
    });
  }, [articles, selectedCategory, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAskAI = (prompt) => {
    navigate(`/chat?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="page-container animate-fade-in" id="gsl-knowledge-page" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Hero Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl) var(--space-xl)',
          marginBottom: 'var(--space-lg)',
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            <GraduationCap size={16} /> ศูนย์รวมองค์ความรู้ กยศ. · มทร.ศรีวิชัย
          </div>
          <h1 style={{ color: '#ffffff', fontSize: 'var(--text-3xl)', fontWeight: 800, margin: '0 0 var(--space-xs)', lineHeight: 1.2 }}>
            องค์ความรู้และคู่มือ กยศ.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--text-base)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            รวบรวมข้อมูลสำคัญทุกขั้นตอน ตั้งแต่เกณฑ์คุณสมบัติ เอกสาร การยื่นกู้ผ่าน DSL อัตราวงเงิน ไปจนถึงการชำระหนี้และระเบียบใหม่ล่าสุด
          </p>

          {/* Quick Highlight Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✨ ดอกเบี้ยต่ำ 1% ต่อปี
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🛡️ ยกเลิกผู้ค้ำประกัน
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⏳ ปลอดหนี้ 2 ปีแรก
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📱 ผ่อนปรนด้วยแอป Connect
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', background: 'var(--color-bg-secondary)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              className="input"
              placeholder="ค้นหาเรื่องที่คุณสนใจ เช่น เอกสาร, วงเงิน, ดอกเบี้ย, แอป..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 38, width: '100%' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingTop: 'var(--space-sm)',
            scrollbarWidth: 'none',
          }}
        >
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                  color: isSelected ? 'var(--color-text-on-accent)' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Knowledge Cards List ── */}
      {filteredItems.length === 0 ? (
        <div className="card empty-state" style={{ padding: 'var(--space-2xl)' }}>
          <HelpCircle size={40} style={{ color: 'var(--color-text-muted)' }} />
          <h3>ไม่พบข้อมูลที่ค้นหา "{searchQuery}"</h3>
          <p>ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่ "ทั้งหมด"</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="card card-glow"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: isExpanded ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Card Header (Clickable) */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-md)',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 'var(--radius-md)',
                        background: isExpanded ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                        color: isExpanded ? 'var(--color-text-on-accent)' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        transition: 'all 0.2s',
                      }}
                    >
                      <BookOpen size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-primary-soft)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {item.badge}
                        </span>
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                          {item.title}
                        </h2>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                        {item.subtitle}
                      </p>
                      {!isExpanded && (
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                      {isExpanded ? 'ย่อเนื้อหา' : 'ดูรายละเอียด'}
                    </span>
                    <div
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>

                {/* Card Body (Expanded) */}
                {isExpanded && (
                  <div className="animate-fade-in" style={{ padding: 'var(--space-lg)', borderTop: '1px solid var(--color-border)' }}>
                    {/* Summary Callout */}
                    <div
                      style={{
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'var(--color-bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--color-primary)',
                        marginBottom: 'var(--space-md)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {item.summary}
                    </div>

                    {/* Step by Step Flow (if present) */}
                    {item.steps && (
                      <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--color-text-primary)' }}>
                          🗺️ แผนผังขั้นตอนการดำเนินงาน
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-sm)' }}>
                          {item.steps.map((st) => (
                            <div
                              key={st.step}
                              style={{
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--color-bg-primary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                position: 'relative',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    fontSize: 'var(--text-xs)',
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
                              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 32 }}>
                                {st.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Table Data (if present) */}
                    {item.tableData && (
                      <div style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto' }}>
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                          📊 ตารางอัตราวงเงินกู้ยืมแต่ละระดับ
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
                                <td><span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{row.tuition}</span></td>
                                <td><span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{row.allowance}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Details Sections */}
                    {item.details && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {item.details.map((section, sIdx) => (
                          <div key={sIdx}>
                            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}>
                              {section.heading}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {section.points.map((pt, pIdx) => (
                                <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                  <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 3 }} />
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
                          padding: 'var(--space-sm) var(--space-md)',
                          background: 'var(--color-primary-soft)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {item.highlight}
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div
                      style={{
                        marginTop: 'var(--space-md)',
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
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Sparkles size={16} /> ถาม AI เกี่ยวกับเรื่องนี้
                      </button>

                      <a
                        href="https://www.studentloan.or.th"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
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

      {/* ── Quick Footer Help Banner ── */}
      <div
        className="card"
        style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          background: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              มีคำถามเฉพาะทางเกี่ยวกับ กยศ. หรือไม่?
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              ระบบ AI อัจฉริยะพร้อมตอบคำถามเกี่ยวกับทุนกู้ยืม กยศ. มทร.ศรีวิชัย ตลอด 24 ชั่วโมง
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/chat')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          เริ่มแชทกับ AI <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
