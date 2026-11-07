// The Therapeutics Garden — CARE-AND-GROW (Jay's decisions,
// 2026-11-07; design in ../GARDEN-TAMAGOTCHI-DESIGN.md).
//
// Settled laws, kept in code, not just in docs:
//   - The plant NEVER dies. Needs floor at NEED_FLOOR (0.25) and
//     the worst state is 'thirsty' — it waits, patiently.
//   - Needs PAUSE while the member is away: drift runs only for
//     plants whose owner is currently in the room, and for beds
//     only while the room is occupied at all. No guilt mechanics.
//   - Growth is slow and visit-based: progress is CARE DAYS —
//     distinct UTC days on which the plant received water, light
//     AND company. No grinding.
//   - Community beds credit REAL tendering only (first names on
//     the board are read from stored tender records — nobody is
//     ever invented).
//
// Pure logic + a JSON file store, in the shape of penpal.js:
// durable file first, tmp+rename writes, env override,
// 'memory' for tests. The design's recommended end-state is
// Supabase (Option B — a garden_plants table riding Jay's SQL
// paste; the migration ships beside this file) — this store sits
// behind the same tiny interface (load/save of a plain map) so
// the swap touches one module, never the room or the client.
//
// Known honesty note: Option A (this JSON file) lives on the
// Render instance and RESETS on redeploy/restart. Plants return
// to stage 1 with full needs — alive, patient, and unharmed.
// Option B removes that caveat; it waits on Jay's paste sitting.

'use strict';

const fs = require('fs');
const path = require('path');

const DAY_MS = 24 * 60 * 60 * 1000;
const WATER_HALF_LIFE_MS = 2.5 * DAY_MS;   // water fades in ~2-3 days
const LIGHT_HALF_LIFE_MS = 7 * DAY_MS;     // light fades in ~a week
const COMPANY_HALF_LIFE_MS = 3 * DAY_MS;   // company fades in ~3 days
const NEED_FLOOR = 0.25;                    // the never-die floor
const STAGE_THRESHOLDS = [2, 4, 7, 10];    // careDays -> stages 2,3,4,5
const BED_STAGE_THRESHOLDS = [1, 2, 4, 5]; // community beds: halved-ish
const NAMES_MAX = 40;

function defaultStorePath() {
  return process.env.GARDEN_STORE_PATH || path.join(__dirname, 'garden-store.json');
}

function utcDay(ms) { return new Date(ms).toISOString().slice(0, 10); }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function freshNeeds(now) {
  return { water: 1, light: 1, company: 1, at: now };
}

// The one exponential decay, floored. A need NEVER crosses below
// NEED_FLOOR, however long the gap — that is the never-dies law.
function decayLevel(level, elapsedMs, halfLifeMs) {
  if (!isFinite(level)) level = 1;
  if (!(elapsedMs > 0)) return clamp01(level);
  const v = level * Math.pow(0.5, elapsedMs / halfLifeMs);
  return Math.max(NEED_FLOOR, clamp01(v));
}

// Drift one plant's needs from p.needs.at to `now`.
function driftPlant(p, now) {
  if (!p || !p.needs) return;
  const elapsed = now - (p.needs.at || now);
  if (elapsed <= 0) { p.needs.at = now; return; }
  p.needs.water = decayLevel(p.needs.water, elapsed, WATER_HALF_LIFE_MS);
  p.needs.light = decayLevel(p.needs.light, elapsed, LIGHT_HALF_LIFE_MS);
  p.needs.company = decayLevel(p.needs.company, elapsed, COMPANY_HALF_LIFE_MS);
  p.needs.at = now;
}

function stageForCareDays(careDays, bed) {
  const t = bed ? BED_STAGE_THRESHOLDS : STAGE_THRESHOLDS;
  let stage = 1;
  for (let i = 0; i < t.length; i++) if (careDays >= t[i]) stage = i + 2;
  return stage;
}

// derived state — the client's read of the plant's face:
// thirsty (asking, mostly for water) / content / thriving.
function plantState(needs) {
  if (!needs) return 'content';
  if (needs.water < 0.45) return 'thirsty';
  if (Math.min(needs.water, needs.light, needs.company) >= 0.7) return 'thriving';
  return 'content';
}

// Care bookkeeping: a care day counts when water, light AND
// company were all tended that UTC day. careDays is monotone —
// it only ever grows, one per qualifying day.
function recordCare(p, kind, now) {
  const day = utcDay(now);
  if (!p.care || p.care.day !== day) {
    p.care = { day: day, water: false, light: false, company: false };
  }
  if (kind === 'water' || kind === 'light' || kind === 'company') p.care[kind] = true;
  if (p.care.water && p.care.light && p.care.company && p.lastCareDay !== day) {
    p.lastCareDay = day;
    p.careDays = (p.careDays || 0) + 1;
    if (stageForCareDays(p.careDays, !!p.bed) >= 5) p.blooms = (p.blooms || 0) + 1;
  }
  p.stage = stageForCareDays(p.careDays || 0, !!p.bed);
  return p;
}

// One tend action. watering sets water to full; light and
// company are visit-shaped (a real member standing here now) so
// they refill substantially but want a return visit.
function tendPlant(p, kind, now) {
  if (!p) return false;
  driftPlant(p, now);
  if (kind === 'water') p.needs.water = 1;
  else if (kind === 'light') p.needs.light = Math.max(p.needs.light, 0.9);
  else if (kind === 'company') p.needs.company = Math.max(p.needs.company, 0.9);
  else return false;
  recordCare(p, kind, now);
  return true;
}

function newPlantRecord(plantId, ownerName, now) {
  return {
    plantId: plantId,
    owner: String(ownerName || '').slice(0, NAMES_MAX),
    kind: 'tomato',
    stage: 1,
    needs: freshNeeds(now),
    careDays: 0,
    blooms: 0,
    care: null,
    lastCareDay: null,
    createdAt: now
  };
}

function newBedRecord(bedId, now) {
  return {
    plantId: bedId,
    owner: '',
    kind: 'tomato',
    bed: true,
    stage: 1,
    needs: freshNeeds(now),
    careDays: 0,
    blooms: 0,
    care: null,
    lastCareDay: null,
    tenders: [], // real records only: { name, at } — first name shown
    createdAt: now
  };
}

// The wire shape: what clients render. Needs rounded so the
// synced state stays small; the record stays server-side truth.
function plantWire(p) {
  if (!p) return null;
  return {
    plantId: p.plantId,
    owner: p.owner || '',
    stage: p.stage || 1,
    state: plantState(p.needs),
    water: Math.round((p.needs ? p.needs.water : 1) * 100) / 100,
    light: Math.round((p.needs ? p.needs.light : 1) * 100) / 100,
    company: Math.round((p.needs ? p.needs.company : 1) * 100) / 100,
    blooms: p.blooms || 0,
    careDays: p.careDays || 0
  };
}

function bedTenderNames(bed, limit) {
  const names = [];
  const seen = new Set();
  const tenders = (bed && bed.tenders) || [];
  for (let i = tenders.length - 1; i >= 0 && names.length < (limit || 6); i--) {
    const first = String(tenders[i].name || '').trim().split(/\s+/)[0].slice(0, NAMES_MAX);
    if (first && !seen.has(first)) { seen.add(first); names.push(first); }
  }
  return names;
}

class GardenStore {
  constructor(storePath) {
    this.path = storePath === 'memory' ? null : (storePath || defaultStorePath());
    this.data = { plants: {}, beds: {} };
    if (this.path) {
      try {
        const raw = JSON.parse(fs.readFileSync(this.path, 'utf8'));
        if (raw && typeof raw === 'object') {
          if (raw.plants && typeof raw.plants === 'object') this.data.plants = raw.plants;
          if (raw.beds && typeof raw.beds === 'object') this.data.beds = raw.beds;
        }
      } catch (e) { /* first run: no file yet */ }
    }
  }

  save() {
    if (!this.path) return;
    const tmp = this.path + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data));
    fs.renameSync(tmp, this.path);
  }

  plant(plantId) { return this.data.plants[plantId] || null; }

  ensurePlant(plantId, ownerName, now) {
    let p = this.data.plants[plantId];
    if (!p) {
      p = newPlantRecord(plantId, ownerName, now);
      this.data.plants[plantId] = p;
      this.save();
    }
    return p;
  }

  bed(bedId) { return this.data.beds[bedId] || null; }

  ensureBed(bedId, now) {
    let b = this.data.beds[bedId];
    if (!b) {
      b = newBedRecord(bedId, now);
      this.data.beds[bedId] = b;
      this.save();
    }
    return b;
  }

  tendBed(bedId, kind, tenderName, now) {
    const b = this.ensureBed(bedId, now);
    if (!tendPlant(b, kind, now)) return false;
    const name = String(tenderName || '').trim().slice(0, NAMES_MAX);
    if (name) {
      b.tenders.push({ name: name, at: now });
      if (b.tenders.length > 200) b.tenders = b.tenders.slice(-200);
    }
    this.save();
    return true;
  }

  tend(plantId, kind, now) {
    const p = this.data.plants[plantId];
    if (!p) return false;
    if (!tendPlant(p, kind, now)) return false;
    this.save();
    return true;
  }

  // Drift: plants of PRESENT owners only; beds while ANYONE is
  // present. This is the away-pause law, enforced here.
  driftAll(presentPlantIds, anyPresent, now) {
    let changed = false;
    for (const id of presentPlantIds || []) {
      const p = this.data.plants[id];
      if (p) { driftPlant(p, now); changed = true; }
    }
    if (anyPresent) {
      for (const id of Object.keys(this.data.beds)) {
        driftPlant(this.data.beds[id], now); changed = true;
      }
    }
    if (changed) this.save();
  }
}

module.exports = {
  GardenStore: GardenStore,
  DAY_MS: DAY_MS,
  NEED_FLOOR: NEED_FLOOR,
  STAGE_THRESHOLDS: STAGE_THRESHOLDS,
  BED_STAGE_THRESHOLDS: BED_STAGE_THRESHOLDS,
  decayLevel: decayLevel,
  driftPlant: driftPlant,
  stageForCareDays: stageForCareDays,
  plantState: plantState,
  tendPlant: tendPlant,
  recordCare: recordCare,
  newPlantRecord: newPlantRecord,
  newBedRecord: newBedRecord,
  plantWire: plantWire,
  bedTenderNames: bedTenderNames,
  utcDay: utcDay
};
