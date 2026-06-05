/**
 * @file src/utils/date.ts
 * @description 纯日期格式化工具函数
 */

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 将 yyyy-MM-dd 格式日期转换为 "M月D日" 格式。
 * @example "2026-06-05" → "6月5日"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`
}

/**
 * 获取某日期是周几。
 * @param dateStr - yyyy-MM-dd 格式的日期字符串
 * @returns 中文星期名，如 "周一"
 */
export function getWeekday(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '--'
  return WEEKDAY_NAMES[date.getDay()]
}

/**
 * 判断某日期是否是今天。
 * @param dateStr - yyyy-MM-dd 格式的日期字符串
 */
export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr === today
}

/**
 * 格式化更新时间（ISO8601 → HH:mm）。
 * @example "2026-06-05T14:30+08:00" → "14:30"
 */
export function formatUpdateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--'
  const match = isoStr.match(/T(\d{2}):(\d{2})/)
  if (!match) return isoStr
  return `${match[1]}:${match[2]}`
}

/**
 * 将 yyyy-MM-dd 格式日期转换为 "M/D" 短格式。
 * @example "2026-06-05" → "6/5"
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`
}

