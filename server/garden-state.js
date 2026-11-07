'use strict';

// CARE-AND-GROW synced state (2026-11-07): the Garden's plant
// truth rides the lounge room's state — every visitor sees the
// same tomato vines, the same stages, the same tender board.
// The durable records live in garden.js (server store); this
// schema is only the wire mirror, rebuilt from the store on
// every change. Numbers are kept small and rounded by the
// store's plantWire() before they land here.

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class GardenPlantState extends Schema {}
defineTypes(GardenPlantState, {
  plantId: 'string',
  owner: 'string',   // display name of the member this plant keeps company with
  stage: 'number',   // 1..5 (5 growth stages, design §2)
  state: 'string',   // 'thirsty' | 'content' | 'thriving'
  water: 'number',   // 0..1, never below the 0.25 floor for long
  light: 'number',
  company: 'number',
  blooms: 'number',  // lifetime blooms at stage 5 — unlocks the sprig
  careDays: 'number',
});

class GardenState extends Schema {
  constructor() {
    super();
    this.plants = new MapSchema();
    this.beds = new MapSchema();
    this.tenders = ''; // JSON: { bedId: [firstName, ...] } — real tenders only
  }
}
defineTypes(GardenState, {
  plants: { map: GardenPlantState },
  beds: { map: GardenPlantState },
  tenders: 'string',
});

module.exports = { GardenPlantState, GardenState };
