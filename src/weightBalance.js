const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function calculateWeightBalance(data) {
  const poundsPerGallon = number(data.fuelWeightPerGallon)
  const fuelWeight = number(data.fuelGallons) * poundsPerGallon
  const taxiWeight = -(number(data.taxiGallons) * poundsPerGallon)
  const burnWeight = -(number(data.burnGallons) * poundsPerGallon)

  const loadingRows = [
    ['basicEmpty', number(data.weights.basicEmpty), number(data.arms.basicEmpty)],
    ['pilotFront', number(data.weights.pilotFront), number(data.arms.pilotFront)],
    ['aftPassengers', number(data.weights.aftPassengers), number(data.arms.aftPassengers)],
    ['baggage1', number(data.weights.baggage1), number(data.arms.baggage1)],
    ['baggage2', number(data.weights.baggage2), number(data.arms.baggage2)],
    ['fuel', fuelWeight, number(data.arms.fuel)],
  ].map(([key, weight, arm]) => ({ key, weight, arm, moment: weight * arm }))

  const rampWeight = loadingRows.reduce((sum, row) => sum + row.weight, 0)
  const rampMoment = loadingRows.reduce((sum, row) => sum + row.moment, 0)
  const taxiMoment = taxiWeight * number(data.arms.taxi)
  const takeoffWeight = rampWeight + taxiWeight
  const takeoffMoment = rampMoment + taxiMoment
  const burnMoment = burnWeight * number(data.arms.burn)
  const landingWeight = takeoffWeight + burnWeight
  const landingMoment = takeoffMoment + burnMoment

  return {
    loadingRows,
    fuelWeight,
    taxiWeight,
    taxiMoment,
    rampWeight,
    rampMoment,
    takeoffWeight,
    takeoffMoment,
    takeoffCg: takeoffWeight ? takeoffMoment / takeoffWeight : null,
    burnWeight,
    burnMoment,
    landingWeight,
    landingMoment,
    landingCg: landingWeight ? landingMoment / landingWeight : null,
  }
}
