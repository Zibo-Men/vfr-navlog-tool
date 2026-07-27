import { describe, expect, it } from 'vitest'
import { calculateWeightBalance } from './weightBalance'

describe('calculateWeightBalance', () => {
  it('calculates ramp, takeoff, landing, moments, and CG', () => {
    const result = calculateWeightBalance({
      fuelWeightPerGallon: 6,
      fuelGallons: 30,
      taxiGallons: 1,
      burnGallons: 10,
      weights: {
        basicEmpty: 1600,
        pilotFront: 340,
        aftPassengers: 150,
        baggage1: 20,
        baggage2: 0,
      },
      arms: {
        basicEmpty: 39.5,
        pilotFront: 37,
        aftPassengers: 73,
        baggage1: 95,
        baggage2: 123,
        fuel: 48,
        taxi: 48,
        burn: 48,
      },
    })

    expect(result.fuelWeight).toBe(180)
    expect(result.rampWeight).toBe(2290)
    expect(result.takeoffWeight).toBe(2284)
    expect(result.takeoffMoment).toBe(96982)
    expect(result.takeoffCg).toBeCloseTo(42.461, 3)
    expect(result.landingWeight).toBe(2224)
    expect(result.landingMoment).toBe(94102)
    expect(result.landingCg).toBeCloseTo(42.312, 3)
  })

  it('returns null CG when total weight is zero', () => {
    const result = calculateWeightBalance({
      fuelWeightPerGallon: 6,
      fuelGallons: '',
      taxiGallons: '',
      burnGallons: '',
      weights: {},
      arms: {},
    })

    expect(result.takeoffCg).toBeNull()
    expect(result.landingCg).toBeNull()
  })
})
