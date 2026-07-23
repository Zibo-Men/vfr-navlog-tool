<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { calculateNavlog } from './calculations'

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const randomPart = Math.random().toString(36).slice(2, 12)
  return `leg-${Date.now().toString(36)}-${randomPart}`
}

const blankLeg = (overrides = {}) => ({
  id: createId(),
  checkpoint: '', vorIdent: '', vorFrequency: '', trueCourse: 0, altitude: '3500',
  windDirection: 0, windVelocity: 0, temperature: 15, tas: 110,
  variation: 0, deviation: 0, distance: 0, gph: 9, actualGs: '',
  ...overrides,
})

const defaults = {
  title: '',
  aircraft: 'N',
  notes: '',
  departureTime: '09:00',
  startingFuel: 30,
  origin: { checkpoint: 'Departure Airport', vorIdent: '', vorFrequency: '' },
  legs: [
    blankLeg({ checkpoint: 'Lake Checkpoint', trueCourse: 72, altitude: '3500', windDirection: 310, windVelocity: 12, temperature: 18, distance: 22 }),
    blankLeg({ checkpoint: 'Destination Airport', trueCourse: 96, altitude: '3500', windDirection: 310, windVelocity: 12, temperature: 16, distance: 31 }),
  ],
}

const saved = localStorage.getItem('vfr-navlog-v3')
const state = ref(saved ? JSON.parse(saved) : defaults)
const calculated = computed(() => calculateNavlog(state.value.legs, state.value.startingFuel, state.value.departureTime))
const totalDistance = computed(() => calculated.value.reduce((sum, leg) => sum + Number(leg.distance || 0), 0))
const totalMinutes = computed(() => calculated.value.reduce((sum, leg) => sum + leg.eteMinutes, 0))
const totalFuel = computed(() => calculated.value.reduce((sum, leg) => sum + leg.fuelUsed, 0))
const lastFuel = computed(() => calculated.value.at(-1)?.fuelRemaining ?? state.value.startingFuel)
const draggedWaypointIndex = ref(null)
const dragOverWaypointIndex = ref(null)

watch(state, (value) => localStorage.setItem('vfr-navlog-v3', JSON.stringify(value)), { deep: true })
onMounted(() => document.documentElement.lang = 'en')

function addLeg(index = state.value.legs.length - 1) {
  const previous = state.value.legs[index] || {}
  state.value.legs.splice(index + 1, 0, blankLeg({
    altitude: previous.altitude ?? 3500,
    windDirection: previous.windDirection ?? 0,
    windVelocity: previous.windVelocity ?? 0,
    temperature: previous.temperature ?? 15,
    cas: previous.cas ?? 105,
    tas: previous.tas ?? 110,
    variation: previous.variation ?? 0,
    deviation: previous.deviation ?? 0,
    gph: previous.gph ?? 9,
  }))
}

function removeLeg(index) {
  if (state.value.legs.length > 1) state.value.legs.splice(index, 1)
}

function waypointList() {
  return [
    { ...state.value.origin },
    ...state.value.legs.map(({ checkpoint, vorIdent, vorFrequency }) => ({ checkpoint, vorIdent, vorFrequency })),
  ]
}

function moveWaypoint(from, to) {
  if (from === to || from == null || to == null) return
  const waypoints = waypointList()
  const [waypoint] = waypoints.splice(from, 1)
  waypoints.splice(to, 0, waypoint)
  state.value.origin = { ...waypoints[0] }
  state.value.legs.forEach((leg, index) => Object.assign(leg, waypoints[index + 1]))
}

function startWaypointDrag(event, index) {
  draggedWaypointIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(index))
}

function finishWaypointDrop(index) {
  moveWaypoint(draggedWaypointIndex.value, index)
  draggedWaypointIndex.value = null
  dragOverWaypointIndex.value = null
}

function finishWaypointDrag() {
  draggedWaypointIndex.value = null
  dragOverWaypointIndex.value = null
}

function printNavlog() {
  globalThis.print()
}

function waypointIsTwoLines(value) {
  const text = String(value ?? '')
  return text.includes('\n') || text.length > 26
}

function resetNavlog() {
  if (confirm('Reset this navlog to the sample flight?')) state.value = structuredClone(defaults)
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(state.value.title || 'vfr-navlog').replaceAll(' ', '-')}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function importJson(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result)
      if (!Array.isArray(parsed.legs)) throw new Error()
      state.value = parsed
    } catch { alert('That file is not a valid VFR Navlog JSON file.') }
  }
  reader.readAsText(file)
  event.target.value = ''
}

const fmt = (value, digits = 0) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—'
const angle = (value) => `${String(Math.round(((value % 360) + 360) % 360)).padStart(3, '0')}°`
const signed = (value) => `${value >= 0 ? '+' : ''}${Number(value).toFixed(1)}°`
const duration = (minutes) => `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="VFR Navlog home">
        <span class="brand-mark">✦</span>
        <span>VFR NAVLOG</span>
      </a>
      <nav class="toolbar" aria-label="Navlog actions">
        <button class="button ghost" @click="resetNavlog">New</button>
        <label class="button ghost file-button">Open<input type="file" accept=".json" @change="importJson"></label>
        <button class="button ghost" @click="exportJson">Save JSON</button>
        <button class="button primary" @click="printNavlog">Print / PDF</button>
      </nav>
    </header>

    <main id="top">
      <section class="hero">
        <div>
          <p class="eyebrow">Flight planning workspace</p>
          <input v-model="state.title" class="title-input" aria-label="Navlog title" placeholder="Enter flight title…">
          <p class="subtitle">Build each leg. Check the wind. Fly the plan.</p>
        </div>
        <div class="status-pill"><span></span> Saved locally</div>
      </section>

      <section class="flight-card">
        <label><span>Aircraft / Tail number</span><input v-model="state.aircraft" placeholder="N12345"></label>
        <label><span>Planned departure</span><input v-model="state.departureTime" type="time"></label>
        <label><span>Starting fuel</span><div class="unit-input"><input v-model.number="state.startingFuel" type="text" inputmode="decimal"><em>gal</em></div></label>
        <label class="notes-field"><span>Notes</span><textarea v-model="state.notes" rows="3" placeholder="Route, frequencies, remarks…"></textarea></label>
        <div v-if="state.notes.trim()" class="print-notes"><span>Notes</span><p>{{ state.notes.trim() }}</p></div>
      </section>

      <section class="summary-grid" aria-label="Flight totals">
        <article><span>Total distance</span><strong>{{ fmt(totalDistance) }}</strong><em>NM</em></article>
        <article><span>Estimated enroute</span><strong>{{ duration(totalMinutes) }}</strong><em>H:MM</em></article>
        <article><span>Fuel required</span><strong>{{ fmt(totalFuel, 1) }}</strong><em>GAL</em></article>
        <article :class="{ warning: lastFuel < 3 }"><span>Fuel remaining</span><strong>{{ fmt(lastFuel, 1) }}</strong><em>GAL</em></article>
      </section>

      <section class="workspace" :class="{ 'print-page-break': state.legs.length >= 15 && state.legs.length <= 17 }">
        <div class="section-heading">
          <div><p class="eyebrow">Route details</p><h2>Flight legs</h2></div>
          <button class="button secondary" @click="addLeg()">＋ Add leg</button>
        </div>

        <div class="table-wrap">
          <table class="navlog-table">
            <colgroup>
              <col class="col-waypoint"><col class="col-leg"><col class="col-course"><col class="col-altitude">
              <col class="col-small"><col class="col-small"><col class="col-small"><col class="col-small">
              <col class="col-heading"><col class="col-heading"><col class="col-heading"><col class="col-heading"><col class="col-heading"><col class="col-ch">
              <col class="col-path"><col class="col-path"><col class="col-time"><col class="col-time"><col class="col-actual">
              <col class="col-fuel"><col class="col-fuel"><col class="col-fuel"><col class="col-actions">
            </colgroup>
            <thead>
              <tr class="group-row">
                <th rowspan="2">Waypoint<br><small>Leg starts here</small></th><th rowspan="2">Leg<br><small>To next waypoint</small></th><th rowspan="2">Course<br><small>True</small></th>
                <th rowspan="2">Altitude<br><small>ft / notes</small></th><th colspan="3">Environment</th><th rowspan="2">TAS<br><small>kt</small></th>
                <th colspan="6">Heading — fly CH</th><th colspan="2">Path</th><th colspan="3">Time</th><th colspan="3">Fuel</th><th rowspan="2" class="actions-col"></th>
              </tr>
              <tr>
                <th>Wind<br><small>from °</small></th><th>Wind<br><small>kt</small></th><th>Temp<br><small>°C</small></th>
                <th>WCA</th><th>TH</th><th>Var.<br><small>E+ / W−</small></th>
                <th>MH</th><th>Dev.<br><small>E+ / W−</small></th><th class="ch-heading">CH<br><small>Fly this</small></th><th>Dist.<br><small>NM</small></th><th>GS<br><small>kt</small></th>
                <th>ETE</th><th>ETA</th><th>Actual</th><th>GPH</th><th>Used</th><th>Rem.</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(leg, index) in calculated" :key="leg.id">
                <tr class="leg-data-row"
                  :class="{ 'waypoint-dragging': draggedWaypointIndex === index, 'waypoint-drop-target': dragOverWaypointIndex === index && draggedWaypointIndex !== index }"
                  @dragenter.prevent="dragOverWaypointIndex = index" @dragover.prevent @drop.prevent="finishWaypointDrop(index)">
                <td class="waypoint-cell">
                  <button class="waypoint-drag" draggable="true" title="Drag to reorder this waypoint"
                    @dragstart.stop="startWaypointDrag($event, index)" @dragend="finishWaypointDrag">⠿</button>
                  <template v-if="index === 0">
                    <textarea v-model="state.origin.checkpoint" rows="2" maxlength="80" :class="{ multiline: waypointIsTwoLines(state.origin.checkpoint) }" placeholder="Starting waypoint"></textarea>
                    <div class="vor-fields"><input v-model="state.origin.vorIdent" placeholder="VOR ident"><input v-model="state.origin.vorFrequency" placeholder="Freq."></div>
                  </template>
                  <template v-else>
                    <textarea v-model="state.legs[index - 1].checkpoint" rows="2" maxlength="80" :class="{ multiline: waypointIsTwoLines(state.legs[index - 1].checkpoint) }" :placeholder="`Waypoint ${index}`"></textarea>
                    <div class="vor-fields"><input v-model="state.legs[index - 1].vorIdent" placeholder="VOR ident"><input v-model="state.legs[index - 1].vorFrequency" placeholder="Freq."></div>
                  </template>
                </td>
                <td class="leg-cell">
                  <strong>{{ index === 0 ? state.origin.checkpoint || 'Start' : state.legs[index - 1].checkpoint || `Waypoint ${index}` }}</strong>
                  <span>→</span>
                  <strong>{{ state.legs[index].checkpoint || `Waypoint ${index + 1}` }}</strong>
                </td>
                <td><input v-model.number="state.legs[index].trueCourse" type="text" inputmode="decimal"></td>
                <td><input v-model="state.legs[index].altitude" type="text"></td>
                <td><input v-model.number="state.legs[index].windDirection" type="text" inputmode="decimal"></td>
                <td><input v-model.number="state.legs[index].windVelocity" type="text" inputmode="decimal"></td>
                <td><input v-model.number="state.legs[index].temperature" type="text" inputmode="decimal"></td>
                <td><input v-model.number="state.legs[index].tas" type="text" inputmode="decimal"></td>
                <td class="computed" :title="leg.warning">{{ signed(leg.wca) }}</td><td class="computed">{{ angle(leg.trueHeading) }}</td>
                <td><input v-model.number="state.legs[index].variation" type="text" inputmode="decimal"></td><td class="computed">{{ angle(leg.magneticHeading) }}</td>
                <td><input v-model.number="state.legs[index].deviation" type="text" inputmode="decimal"></td><td class="computed ch-cell">{{ angle(leg.compassHeading) }}</td><td><input v-model.number="state.legs[index].distance" type="text" inputmode="decimal"></td>
                <td class="computed">{{ fmt(leg.groundSpeed) }}</td><td class="computed">{{ duration(leg.eteMinutes) }}</td><td class="computed">{{ leg.eta || '—' }}</td>
                <td class="actual-cell"><span aria-label="Blank space for handwritten actual time"></span></td>
                <td><input v-model.number="state.legs[index].gph" type="text" inputmode="decimal"></td><td class="computed">{{ fmt(leg.fuelUsed, 1) }}</td><td class="computed">{{ fmt(leg.fuelRemaining, 1) }}</td>
                <td class="row-actions"><button title="Insert leg after" @click="addLeg(index)">＋</button><button title="Remove leg" @click="removeLeg(index)">×</button></td>
              </tr>
              </template>
              <tr class="final-waypoint-row"
                :class="{ 'waypoint-dragging': draggedWaypointIndex === state.legs.length, 'waypoint-drop-target': dragOverWaypointIndex === state.legs.length && draggedWaypointIndex !== state.legs.length }"
                @dragenter.prevent="dragOverWaypointIndex = state.legs.length" @dragover.prevent @drop.prevent="finishWaypointDrop(state.legs.length)">
                <td class="waypoint-cell">
                  <button class="waypoint-drag" draggable="true" title="Drag to reorder this waypoint"
                    @dragstart.stop="startWaypointDrag($event, state.legs.length)" @dragend="finishWaypointDrag">⠿</button>
                  <textarea v-model="state.legs[state.legs.length - 1].checkpoint" rows="2" maxlength="80" :class="{ multiline: waypointIsTwoLines(state.legs[state.legs.length - 1].checkpoint) }" placeholder="Final waypoint"></textarea>
                  <div class="vor-fields"><input v-model="state.legs[state.legs.length - 1].vorIdent" placeholder="VOR ident"><input v-model="state.legs[state.legs.length - 1].vorFrequency" placeholder="Freq."></div>
                </td>
                <td class="arrival-cell">ARRIVAL</td>
                <td colspan="21"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-hint">Drag a waypoint using its ⠿ handle; the highlighted row shows the drop position. The Leg column displays the exact waypoint-to-waypoint segment.</p>
      </section>

      <section class="formula-note">
        <div class="compass">N<span>↗</span></div>
        <div><p class="eyebrow">Calculation chain</p><h2>From course to compass</h2>
          <p><strong>True Course + WCA = True Heading</strong> → add magnetic variation → Magnetic Heading → add compass deviation → Compass Heading.</p>
          <p>Wind triangle calculations treat the entered wind direction as the direction the wind is <em>from</em>. Always verify performance and weather data against current approved sources before flight.</p>
        </div>
      </section>
    </main>

    <footer>VFR NAVLOG · Local planning aid · Not a substitute for official flight planning or pilot judgment</footer>
  </div>
</template>
