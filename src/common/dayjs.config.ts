// src/common/dayjs.config.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc as any);
dayjs.extend(timezone as any);

dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

export default dayjs;
