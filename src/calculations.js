export const normalizeHeading = (value) => ((Number(value) % 360) + 360) % 360

export function hasFuelFlow(value) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))
}

export function calculateFuelRequired(tripFuel, additionalFuel = 0) {
  return Math.max(0, Number(tripFuel) || 0) + Math.max(0, Number(additionalFuel) || 0)
}

export function calculateLeg(leg, startingFuel = 0) {
  const course = Number(leg.trueCourse) || 0
  const windFrom = Number(leg.windDirection) || 0
  const windSpeed = Math.max(0, Number(leg.windVelocity) || 0)
  const tas = Math.max(0, Number(leg.tas) || Number(leg.cas) || 0)
  const distance = Math.max(0, Number(leg.distance) || 0)
  const variation = Number(leg.variation) || 0
  const deviation = Number(leg.deviation) || 0
  const gphIsProvided = hasFuelFlow(leg.gph)
  const gph = Math.max(0, Number(leg.gph) || 0)

  const relativeWind = (windFrom - course) * Math.PI / 180
  const ratio = tas > 0 ? (windSpeed / tas) * Math.sin(relativeWind) : 0
  const solvable = Math.abs(ratio) <= 1 && tas > 0
  const wca = solvable ? Math.asin(ratio) * 180 / Math.PI : 0
  const trueHeading = normalizeHeading(course + wca)
  const groundSpeed = solvable
    ? tas * Math.cos(wca * Math.PI / 180) - windSpeed * Math.cos(relativeWind)
    : 0
  const safeGs = groundSpeed > 0 ? groundSpeed : 0
  const eteMinutes = safeGs > 0 ? distance / safeGs * 60 : 0
  const fuelUsed = gphIsProvided
    ? eteMinutes / 60 * gph
    : Math.max(0, Number(leg.manualFuelUsed) || 0)

  return {
    ...leg,
    wca,
    trueHeading,
    magneticHeading: normalizeHeading(trueHeading + variation),
    compassHeading: normalizeHeading(trueHeading + variation + deviation),
    groundSpeed: safeGs,
    eteMinutes,
    fuelUsed,
    fuelUsedIsManual: !gphIsProvided,
    fuelRemaining: Math.max(0, Number(startingFuel) - fuelUsed),
    warning: tas > 0 && !solvable ? 'Crosswind exceeds TAS' : safeGs <= 0 && distance > 0 ? 'No positive ground speed' : '',
  }
}

export function clockAfter(time, minutes) {
  if (!time || !Number.isFinite(minutes)) return ''
  const [hours, mins] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return ''
  const total = (hours * 60 + mins + Math.round(minutes)) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function calculateNavlog(legs, startingFuel, departureTime) {
  let fuel = Number(startingFuel) || 0
  let elapsed = 0
  return legs.map((leg) => {
    const result = calculateLeg(leg, fuel)
    fuel = result.fuelRemaining
    elapsed += result.eteMinutes
    return { ...result, eta: clockAfter(departureTime, elapsed) }
  })
}
