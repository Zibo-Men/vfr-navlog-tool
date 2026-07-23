import { describe, expect, it } from 'vitest'
import { calculateLeg, calculateNavlog, normalizeHeading } from './calculations'

describe('VFR navlog calculations', () => {
  it('normalizes headings', () => {
    expect(normalizeHeading(365)).toBe(5)
    expect(normalizeHeading(-10)).toBe(350)
  })

  it('calculates calm-wind leg values', () => {
    const result = calculateLeg({ trueCourse: 90, tas: 100, distance: 50, gph: 10 }, 20)
    expect(result.wca).toBeCloseTo(0)
    expect(result.groundSpeed).toBeCloseTo(100)
    expect(result.eteMinutes).toBeCloseTo(30)
    expect(result.fuelRemaining).toBeCloseTo(15)
  })

  it('applies east-positive variation and deviation', () => {
    const result = calculateLeg({ trueCourse: 355, tas: 100, variation: 10, deviation: -2 }, 20)
    expect(result.magneticHeading).toBeCloseTo(5)
    expect(result.compassHeading).toBeCloseTo(3)
  })

  it('carries fuel and ETA through all legs', () => {
    const results = calculateNavlog([
      { trueCourse: 0, tas: 120, distance: 60, gph: 12 },
      { trueCourse: 0, tas: 120, distance: 60, gph: 12 },
    ], 30, '10:00')
    expect(results[1].fuelRemaining).toBeCloseTo(18)
    expect(results[1].eta).toBe('11:00')
  })
})
