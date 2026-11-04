// Kitalált eseményprogram valós harcosokkal.
// Nem hivatalos vagy ellenőrzött nevezési lista.

export const DEMO_FIGHTS = [
  // UFC 334 — eventId: 1
  {
    id: 1,
    eventId: 1,
    redCornerFighterId: 3,
    blueCornerFighterId: 4,
    weightClass: "Nehézsúly",
    scheduledRounds: 5,
    cardOrder: 1,
    isMainEvent: true,
    status: "scheduled" as const,
  },
  {
    id: 2,
    eventId: 1,
    redCornerFighterId: 1,
    blueCornerFighterId: 2,
    weightClass: "Könnyűsúly",
    scheduledRounds: 3,
    cardOrder: 2,
    isMainEvent: false,
    status: "scheduled" as const,
  },

  // ONE – Singapore — eventId: 5
  {
    id: 3,
    eventId: 5,
    redCornerFighterId: 5,
    blueCornerFighterId: 6,
    weightClass: "Könnyűsúly",
    scheduledRounds: 5,
    cardOrder: 1,
    isMainEvent: true,
    status: "scheduled" as const,
  },
  {
    id: 4,
    eventId: 5,
    redCornerFighterId: 7,
    blueCornerFighterId: 8,
    weightClass: "Pehelysúly",
    scheduledRounds: 3,
    cardOrder: 2,
    isMainEvent: false,
    status: "scheduled" as const,
  },
];
