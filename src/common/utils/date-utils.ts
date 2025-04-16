// src/common/utils/date-utils.ts
export function getVietnamTime(): Date {
  // Múi giờ Việt Nam UTC+7 (7 * 60 phút)
  const vietnamOffset = 7 * 60;

  // Lấy thời gian hiện tại theo UTC
  const now = new Date();

  // Tính toán độ lệch múi giờ hiện tại so với UTC (tính bằng phút)
  const currentOffset = now.getTimezoneOffset();

  // Tính toán tổng số phút cần điều chỉnh
  const totalOffsetMinutes = currentOffset + vietnamOffset;

  // Điều chỉnh thời gian (thêm số phút cần điều chỉnh)
  now.setMinutes(now.getMinutes() + totalOffsetMinutes);

  return now;
}

export function formatToVietnamTime(date: Date): string {
  // Múi giờ Việt Nam UTC+7 (7 * 60 phút)
  const vietnamOffset = 7 * 60;

  // Tính toán độ lệch múi giờ hiện tại so với UTC (tính bằng phút)
  const currentOffset = date.getTimezoneOffset();

  // Tính toán tổng số phút cần điều chỉnh
  const totalOffsetMinutes = currentOffset + vietnamOffset;

  // Tạo bản sao của date để không ảnh hưởng đến tham số gốc
  const adjustedDate = new Date(date);

  // Điều chỉnh thời gian
  adjustedDate.setMinutes(adjustedDate.getMinutes() + totalOffsetMinutes);

  return adjustedDate.toISOString();
}