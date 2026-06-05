import { describe, it, expect } from 'vitest'
import { getWeatherIconUrl } from '@/api/weather'

describe('getWeatherIconUrl', () => {
  it('returns correct CDN URL for icon code', () => {
    expect(getWeatherIconUrl('100')).toBe('https://icons.qweather.com/assets/icons/100.svg')
    expect(getWeatherIconUrl('305')).toBe('https://icons.qweather.com/assets/icons/305.svg')
  })
})
