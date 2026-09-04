// The published activity configuration: the single source both the player lobby
// and the admin console read.
//
// In production this is what the config service returns for the currently
// published version. Here it is a static file so the two sides cannot drift:
// the admin seeds its live version from it, and the lobby renders from it, so a
// preview in the admin is a preview of the same numbers the player gets.
//
// Ordering matters for the wheel: slot N in this array is the Nth segment of the
// wheel the player sees, clockwise from the top.
export const wheelConfig = {
  version: 3,
  freeSpinsPerDay: 3,
  prizes: [
    { id: 'prize-1', kind: 'coins', amount: 800, probability: 22 },
    { id: 'prize-2', kind: 'gems', amount: 2, probability: 15 },
    { id: 'prize-3', kind: 'coins', amount: 1200, probability: 15 },
    { id: 'prize-4', kind: 'freeSpin', amount: 1, probability: 10 },
    { id: 'prize-5', kind: 'coins', amount: 300, probability: 20 },
    { id: 'prize-6', kind: 'gems', amount: 5, probability: 6 },
    { id: 'prize-7', kind: 'coins', amount: 2000, probability: 8 },
    { id: 'prize-8', kind: 'coins', amount: 500, probability: 4 },
  ],
}

// Which message key renders a prize, given its kind.
export const PRIZE_KEYS = {
  coins: 'events.prizeCoins',
  gems: 'events.prizeGems',
  freeSpin: 'events.prizeFreeSpin',
}
