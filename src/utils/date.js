/**
 * @file src/utils/date.js
 * @description 日期与星期格式化工具函数
 */

const WEEKDAY_NAMES = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
]

/**
 * 将 yyyy-MM-dd 格式日期转换为 "M月D日" 展示格式
 * @param {string} dateStr - 日期字符串，格式 yyyy-MM-dd
 * @returns {string} 格式化后的中文日期，如 "6月1日"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  return `${month}月${day}日`
}

/**
 * 根据 yyyy-MM-dd 格式日期返回对应星期几
 * @param {string} dateStr - 日期字符串，格式 yyyy-MM-dd
 * @returns {string} 中文星期，如 "星期一"
 */
export function getWeekday(dateStr) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '--'
  return WEEKDAY_NAMES[date.getDay()]
}

/**
 * 判断给定日期是否为今天
 * @param {string} dateStr - 日期字符串，格式 yyyy-MM-dd
 * @returns {boolean}
 */
export function isToday(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return dateStr === `${y}-${m}-${d}`
}

/**
 * 格式化 ISO 时间字符串为 HH:mm
 * @param {string} isoString - ISO 时间字符串
 * @returns {string} 格式化后的时间，如 "14:30"
 */
export function formatUpdateTime(isoString) {
  if (!isoString) return '--'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '--'
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return '--'
  }
}

/**
 * 将 yyyy-MM-dd 格式日期转为短格式供 ECharts 横轴使用
 * @param {string} dateStr - 日期字符串
 * @returns {string} 如 "6/1"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`
}
