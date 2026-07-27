<script setup>
import { computed, ref, watch } from 'vue'
import { calculateWeightBalance } from './weightBalance'

const STORAGE_KEY = 'vfr-weight-balance-v1'
const defaultState = {
  aircraft: '',
  fuelWeightPerGallon: 6,
  fuelGallons: '',
  taxiGallons: 1,
  burnGallons: '',
  weights: {
    basicEmpty: '',
    pilotFront: '',
    aftPassengers: '',
    baggage1: '',
    baggage2: '',
  },
  arms: {
    basicEmpty: '',
    pilotFront: 37,
    aftPassengers: 73,
    baggage1: 95,
    baggage2: 123,
    fuel: 48,
    taxi: 48,
    burn: 48,
  },
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return structuredClone(defaultState)
    return {
      ...structuredClone(defaultState),
      ...saved,
      weights: { ...defaultState.weights, ...saved.weights },
      arms: { ...defaultState.arms, ...saved.arms },
    }
  } catch {
    return structuredClone(defaultState)
  }
}

const state = ref(loadState())
const result = computed(() => calculateWeightBalance(state.value))
const momentFor = (key) => result.value.loadingRows.find((row) => row.key === key)?.moment ?? 0
const hasValue = (value) => value !== '' && value !== null && value !== undefined
const fmt = (value, digits = 1) => value === null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(digits)
const showMoment = (weightValue, moment) => hasValue(weightValue) ? fmt(moment) : '—'

watch(state, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })

function clearFlightData() {
  if (!confirm('Clear the current loading values? Your saved ARM defaults will be kept.')) return
  state.value.aircraft = ''
  state.value.fuelGallons = ''
  state.value.taxiGallons = 1
  state.value.burnGallons = ''
  Object.keys(state.value.weights).forEach((key) => { state.value.weights[key] = '' })
}

function resetArms() {
  if (!confirm('Restore the example ARM values?')) return
  state.value.arms = structuredClone(defaultState.arms)
  state.value.fuelWeightPerGallon = defaultState.fuelWeightPerGallon
}

function printWorksheet() {
  globalThis.print()
}
</script>

<template>
  <div class="app-shell wb-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Return to VFR Navlog">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path d="M16 5.5 18.6 13l7.9 3-7.9 3L16 26.5 13.4 19l-7.9-3 7.9-3L16 5.5Z"/>
            <circle cx="16" cy="16" r="2.2"/>
          </svg>
        </span>
        <span>VFR NAVLOG</span>
      </a>
      <nav class="toolbar" aria-label="Weight and balance actions">
        <a class="button ghost" href="#top">← Navlog</a>
        <button class="button ghost" @click="clearFlightData">Clear loading</button>
        <button class="button primary" @click="printWorksheet">Print / PDF</button>
      </nav>
    </header>

    <main class="wb-main">
      <section class="hero wb-hero">
        <div>
          <p class="eyebrow">Aircraft loading worksheet</p>
          <h1>Weight &amp; Balance</h1>
          <p class="subtitle">Enter the loading once—the worksheet recalculates every moment and CG instantly.</p>
        </div>
        <div class="status-pill"><span></span> ARM values saved locally</div>
      </section>

      <section class="wb-meta-card">
        <label>
          <span>Aircraft / Tail number</span>
          <input v-model="state.aircraft" placeholder="N12345">
        </label>
        <label>
          <span>Fuel weight</span>
          <div class="unit-input"><input v-model.number="state.fuelWeightPerGallon" type="text" inputmode="decimal"><em>lb / gal</em></div>
        </label>
        <div class="wb-arm-help">
          <strong>Set your aircraft’s ARM values directly in the table.</strong>
          <span>They are remembered on this device and prefilled next time.</span>
        </div>
        <button class="button secondary" @click="resetArms">Reset ARM defaults</button>
      </section>

      <section class="wb-summary" aria-label="Weight and balance summary">
        <article>
          <span>Ramp weight</span>
          <strong>{{ fmt(result.rampWeight, 0) }}</strong>
          <em>LB</em>
        </article>
        <article>
          <span>Takeoff weight</span>
          <strong>{{ fmt(result.takeoffWeight, 0) }}</strong>
          <em>LB</em>
        </article>
        <article>
          <span>Takeoff CG</span>
          <strong>{{ fmt(result.takeoffCg, 2) }}</strong>
          <em>IN</em>
        </article>
        <article>
          <span>Landing weight</span>
          <strong>{{ fmt(result.landingWeight, 0) }}</strong>
          <em>LB</em>
        </article>
        <article>
          <span>Landing CG</span>
          <strong>{{ fmt(result.landingCg, 2) }}</strong>
          <em>IN</em>
        </article>
      </section>

      <section class="workspace wb-workspace">
        <div class="section-heading">
          <div><p class="eyebrow">Live calculation</p><h2>W&amp;B data</h2></div>
          <p class="wb-saved-note">Tan cells are inputs · Blue cells calculate automatically</p>
        </div>
        <div class="table-wrap">
          <table class="wb-table">
            <thead>
              <tr><th>W &amp; B Data</th><th>Weight <small>lb</small></th><th>Arm <small>in</small></th><th>Moment <small>lb·in</small></th></tr>
            </thead>
            <tbody>
              <tr>
                <th>Basic empty weight</th>
                <td><input v-model.number="state.weights.basicEmpty" inputmode="decimal" aria-label="Basic empty weight"></td>
                <td><input v-model.number="state.arms.basicEmpty" inputmode="decimal" aria-label="Basic empty weight arm"></td>
                <td class="wb-calculated">{{ showMoment(state.weights.basicEmpty, momentFor('basicEmpty')) }}</td>
              </tr>
              <tr>
                <th>Pilot / Front passenger</th>
                <td><input v-model.number="state.weights.pilotFront" inputmode="decimal" aria-label="Pilot and front passenger weight"></td>
                <td><input v-model.number="state.arms.pilotFront" inputmode="decimal" aria-label="Pilot and front passenger arm"></td>
                <td class="wb-calculated">{{ showMoment(state.weights.pilotFront, momentFor('pilotFront')) }}</td>
              </tr>
              <tr>
                <th>Aft passengers</th>
                <td><input v-model.number="state.weights.aftPassengers" inputmode="decimal" aria-label="Aft passengers weight"></td>
                <td><input v-model.number="state.arms.aftPassengers" inputmode="decimal" aria-label="Aft passengers arm"></td>
                <td class="wb-calculated">{{ showMoment(state.weights.aftPassengers, momentFor('aftPassengers')) }}</td>
              </tr>
              <tr>
                <th>Baggage area 1</th>
                <td><input v-model.number="state.weights.baggage1" inputmode="decimal" aria-label="Baggage area 1 weight"></td>
                <td><input v-model.number="state.arms.baggage1" inputmode="decimal" aria-label="Baggage area 1 arm"></td>
                <td class="wb-calculated">{{ showMoment(state.weights.baggage1, momentFor('baggage1')) }}</td>
              </tr>
              <tr>
                <th>Baggage area 2</th>
                <td><input v-model.number="state.weights.baggage2" inputmode="decimal" aria-label="Baggage area 2 weight"></td>
                <td><input v-model.number="state.arms.baggage2" inputmode="decimal" aria-label="Baggage area 2 arm"></td>
                <td class="wb-calculated">{{ showMoment(state.weights.baggage2, momentFor('baggage2')) }}</td>
              </tr>
              <tr>
                <th><label>Fuel <span><input v-model.number="state.fuelGallons" inputmode="decimal" aria-label="Usable fuel gallons"> gal usable</span></label></th>
                <td class="wb-calculated">{{ hasValue(state.fuelGallons) ? fmt(result.fuelWeight) : '—' }}</td>
                <td><input v-model.number="state.arms.fuel" inputmode="decimal" aria-label="Fuel arm"></td>
                <td class="wb-calculated">{{ showMoment(state.fuelGallons, momentFor('fuel')) }}</td>
              </tr>
              <tr class="wb-total-row">
                <th>Ramp weight</th>
                <td class="wb-calculated">{{ fmt(result.rampWeight) }}</td>
                <td></td>
                <td class="wb-calculated">{{ fmt(result.rampMoment) }}</td>
              </tr>
              <tr>
                <th><label>Start, taxi &amp; runup <span><input v-model.number="state.taxiGallons" inputmode="decimal" aria-label="Taxi fuel gallons"> gal</span></label></th>
                <td class="wb-deduction">{{ fmt(result.taxiWeight) }}</td>
                <td><input v-model.number="state.arms.taxi" inputmode="decimal" aria-label="Taxi fuel arm"></td>
                <td class="wb-deduction">{{ fmt(result.taxiMoment) }}</td>
              </tr>
              <tr class="wb-major-row">
                <th>Takeoff weight</th>
                <td class="wb-calculated">{{ fmt(result.takeoffWeight) }}</td>
                <td></td>
                <td class="wb-calculated">{{ fmt(result.takeoffMoment) }}</td>
              </tr>
              <tr class="wb-cg-row">
                <th>Takeoff CG</th>
                <td colspan="3" class="wb-cg-value">{{ fmt(result.takeoffCg, 2) }} <small>in</small></td>
              </tr>
              <tr>
                <th><label>Estimated fuel burn <span><input v-model.number="state.burnGallons" inputmode="decimal" aria-label="Estimated fuel burn gallons"> gal</span></label></th>
                <td class="wb-deduction">{{ hasValue(state.burnGallons) ? fmt(result.burnWeight) : '—' }}</td>
                <td><input v-model.number="state.arms.burn" inputmode="decimal" aria-label="Estimated fuel burn arm"></td>
                <td class="wb-deduction">{{ hasValue(state.burnGallons) ? fmt(result.burnMoment) : '—' }}</td>
              </tr>
              <tr class="wb-major-row">
                <th>Landing weight</th>
                <td class="wb-calculated">{{ fmt(result.landingWeight) }}</td>
                <td></td>
                <td class="wb-calculated">{{ fmt(result.landingMoment) }}</td>
              </tr>
              <tr class="wb-cg-row">
                <th>Landing CG</th>
                <td colspan="3" class="wb-cg-value">{{ fmt(result.landingCg, 2) }} <small>in</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="formula-note wb-formula">
        <div>
          <p class="eyebrow">Calculation chain</p>
          <h2>Weight × Arm = Moment</h2>
          <p><strong>Total Moment ÷ Total Weight = CG.</strong> Taxi and estimated fuel burn are subtracted automatically. Fuel weight uses the lb/gal setting above.</p>
          <p>Confirm ARM values, weight limits, and the approved CG envelope against the current aircraft POH/AFM before flight.</p>
        </div>
      </section>
    </main>

    <footer>VFR NAVLOG · Local planning aid · Not a substitute for approved aircraft data or pilot judgment</footer>
  </div>
</template>
