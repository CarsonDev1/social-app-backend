// src/common/utils/date-time.util.ts
export const getVietnamDateTime = (): Date => {
  // Tạo datetime hiện tại
  const now = new Date();

  // Chỉnh múi giờ cho Việt Nam (UTC+7)
  const vietnamOffset = 7 * 60; // 7 giờ đổi sang phút
  const utcOffset = now.getTimezoneOffset(); // Lấy offset của máy chủ (phút)

  // Điều chỉnh múi giờ (thêm offset của máy chủ + offset của Việt Nam)
  now.setMinutes(now.getMinutes() + utcOffset + vietnamOffset);

  return now;
};

export const formatVietnamDateTime = (date: Date): string => {
  const vietnamDate = new Date(date);

  // Điều chỉnh múi giờ cho Việt Nam
  const vietnamOffset = 7 * 60; // 7 giờ đổi sang phút
  const utcOffset = vietnamDate.getTimezoneOffset(); // Lấy offset của máy chủ (phút)

  // Điều chỉnh múi giờ
  vietnamDate.setMinutes(vietnamDate.getMinutes() + utcOffset + vietnamOffset);

  return vietnamDate.toISOString();
};