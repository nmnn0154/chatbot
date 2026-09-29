import Swal from 'sweetalert2';

// Base customized SweetAlert instance with app's font and theme styling
const AppSwal = Swal.mixin({
  customClass: {
    popup: 'swal2-app-popup',
    title: 'swal2-app-title',
    htmlContainer: 'swal2-app-text',
    confirmButton: 'swal2-app-btn-confirm',
    cancelButton: 'swal2-app-btn-cancel',
  },
  buttonsStyling: true,
  reverseButtons: true, // เอาปุ่มยกเลิกไว้ฝั่งปลอดภัย ป้องกันเผลอกดผิด
});

/**
 * กล่องยืนยันก่อน "ลบข้อมูล" (ป้องกันกดพลาด)
 * @param {Object} options
 * @param {string} [options.title] - หัวข้อ เช่น "ยืนยันการลบ?"
 * @param {string} [options.text] - รายละเอียด เช่น "ข้อมูลจะถูกลบถาวร"
 * @param {string} [options.confirmText] - ข้อความบนปุ่มลบ (ดีฟอลต์ "ใช่, ลบเลย")
 * @param {string} [options.cancelText] - ข้อความบนปุ่มยกเลิก (ดีฟอลต์ "ยกเลิก")
 * @returns {Promise<boolean>} - คืนค่า true หากกดยืนยัน, false หากกดยกเลิก
 */
export async function confirmDelete({
  title = 'ยืนยันการลบข้อมูล?',
  text = 'ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?',
  confirmText = 'ใช่, ลบเลย',
  cancelText = 'ยกเลิก',
} = {}) {
  const result = await AppSwal.fire({
    title,
    text,
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    confirmButtonColor: '#ef4444', // สีแดงเตือนภัย
    cancelButtonColor: '#64748b',  // สีเทา
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: true, // โฟกัสปุ่มยกเลิกเป็นหลักเพื่อความปลอดภัยสูงสุด
  });

  return result.isConfirmed;
}

/**
 * กล่องยืนยันก่อน "แก้ไข / บันทึก / ดำเนินการที่สำคัญ"
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string} [options.text]
 * @param {string} [options.confirmText]
 * @param {string} [options.cancelText]
 * @param {'question'|'warning'|'info'} [options.icon]
 * @returns {Promise<boolean>}
 */
export async function confirmAction({
  title = 'ยืนยันการทำรายการ?',
  text = 'คุณต้องการดำเนินการต่อใช่หรือไม่?',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  icon = 'question',
} = {}) {
  const result = await AppSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#2563eb', // สีน้ำเงินหลัก
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: false,
  });

  return result.isConfirmed;
}

/**
 * แจ้งเตือน "ทำรายการสำเร็จ"
 * @param {string} title
 * @param {string} [text]
 * @param {number} [timer] - มิลลิวินาที (ดีฟอลต์ 1800ms)
 */
export function showSuccess(title = 'สำเร็จ!', text = '', timer = 1800) {
  return AppSwal.fire({
    icon: 'success',
    title,
    text,
    timer,
    showConfirmButton: false,
    timerProgressBar: true,
  });
}

/**
 * แจ้งเตือน "เกิดข้อผิดพลาด"
 * @param {string} title
 * @param {string} [text]
 */
export function showError(title = 'เกิดข้อผิดพลาด', text = '') {
  return AppSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#2563eb',
    confirmButtonText: 'ตกลง',
  });
}

export default AppSwal;
