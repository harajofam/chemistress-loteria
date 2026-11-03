'use strict';

// Win-pattern checks for a 5x5 Lotería board.
// Tiles are indexed row-major: index = row * 5 + col (0..24), matching the
// client's renderBoard() order and its `mark { tileIndex }` payloads.

const SIZE = 5;
const TILE_COUNT = SIZE * SIZE;

function lineIndices() {
  const lines = [];
  for (let r = 0; r < SIZE; r++) {
    lines.push({ pattern: `row${r}`, indices: [0, 1, 2, 3, 4].map((c) => r * SIZE + c) });
  }
  for (let c = 0; c < SIZE; c++) {
    lines.push({ pattern: `col${c}`, indices: [0, 1, 2, 3, 4].map((r) => r * SIZE + c) });
  }
  lines.push({ pattern: 'diag', indices: [0, 6, 12, 18, 24] });
  lines.push({ pattern: 'anti-diag', indices: [4, 8, 12, 16, 20] });
  return lines;
}

// A tile only counts toward a win if it is marked AND its card was actually
// called. The room enforces the same rule at mark time; checking again here
// means a win can never be assembled from marks the server would not accept.
// `tiles` is an array of { cardId, marked }; `called` is a Set of card ids.
// Returns { win: boolean, pattern: string|null } — pattern is one of
// 'row0'..'row4', 'col0'..'col4', 'diag', 'anti-diag', 'blackout'.
function checkWin(tiles, called) {
  if (!Array.isArray(tiles) || tiles.length !== TILE_COUNT) {
    return { win: false, pattern: null };
  }
  const live = tiles.map((t) => Boolean(t && t.marked && called.has(t.cardId)));
  if (live.every(Boolean)) {
    return { win: true, pattern: 'blackout' };
  }
  for (const { pattern, indices } of lineIndices()) {
    if (indices.every((i) => live[i])) {
      return { win: true, pattern };
    }
  }
  return { win: false, pattern: null };
}

module.exports = { SIZE, TILE_COUNT, lineIndices, checkWin };
