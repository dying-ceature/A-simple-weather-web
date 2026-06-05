import { describe, it, expect } from 'vitest'
import {
  formatDate,
  getWeekday,
  isToday,
  formatUpdateTime,
  formatDateShort,
} from '@/utils/date'

describe('formatDate', () => {
  it('converts yyyy-MM-dd to M月D日', () => {
    expect(formatDate('2026-06-05')).toBe('6月5日')
    expect(formatDate('2026-01-01')).toBe('1月1日')
    expect(formatDate('2026-12-31')).toBe('12月31日')
  })

  it('returns -- for null/undefined/empty', () => {
    expect(formatDate(null)).toBe('--')
    expect(formatDate(undefined)).toBe('--')
    expect(formatDate('')).toBe('--')
  })
})

describe('getWeekday', () => {
  it('returns correct Chinese weekday', () => {
    // 2026-06-01 is Monday (周一)
    expect(getWeekday('2026-06-01')).toBe('周一')
    // 2026-06-07 is Sunday (周日)
    expect(getWeekday('2026-06-07')).toBe('周日')
  })

  it('returns -- for invalid input', () => {
    expect(getWeekday(null)).toBe('--')
    expect(getWeekday('invalid')).toBe('--')
  })
})

describe('isToday', () => {
  it('returns true for today', () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(isToday(today)).toBe(true)
  })

  it('returns false for other dates', () => {
    expect(isToday('2020-01-01')).toBe(false)
    expect(isToday(null)).toBe(false)
  })
})

describe('formatUpdateTime', () => {
  it('extracts HH:mm from ISO string', () => {
    expect(formatUpdateTime('2026-06-05T14:30+08:00')).toBe('14:30')
    expect(formatUpdateTime('2026-06-05T09:05+08:00')).toBe('09:05')
  })

  it('returns -- for invalid input', () => {
    expect(formatUpdateTime(null)).toBe('--')
    expect(formatUpdateTime('')).toBe('--')
  })
})

describe('formatDateShort', () => {
  it('converts to M/D format', () => {
    expect(formatDateShort('2026-06-05')).toBe('6/5')
    expect(formatDateShort('2026-12-01')).toBe('12/1')
  })

  it('returns -- for null/undefined', () => {
    expect(formatDateShort(null)).toBe('--')
  })
})

