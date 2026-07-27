import { describe, expect, it } from 'vitest'
import { calculateFuelRequired, calculateLeg, calculateNavlog, hasFuelFlow, normalizeHeading } from './calculations'

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

  it('uses a fixed POH fuel value when GPH is blank', () => {
    const result = calculateLeg({
      trueCourse: 0,
      tas: 120,
      distance: 60,
      gph: '',
      manualFuelUsed: 2.4,
    }, 20)

    expect(result.eteMinutes).toBeCloseTo(30)
    expect(result.fuelUsed).toBeCloseTo(2.4)
    expect(result.fuelRemaining).toBeCloseTo(17.6)
    expect(result.fuelUsedIsManual).toBe(true)
  })

  it('treats zero as an entered GPH value instead of switching to manual fuel', () => {
    expect(hasFuelFlow(0)).toBe(true)
    expect(hasFuelFlow('')).toBe(false)
    expect(calculateLeg({ tas: 100, distance: 50, gph: 0, manualFuelUsed: 3 }, 20).fuelUsed).toBe(0)
  })

  it('adds arrival fuel to trip fuel for total fuel required', () => {
    expect(calculateFuelRequired(12.5, 6.2)).toBeCloseTo(18.7)
  })
})
