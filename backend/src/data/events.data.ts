export interface MmaEvent {
  id: number;
  name: string;
  date: string;
  location: string;
  organization: string;
}

export const DEMO_EVENTS: MmaEvent[] = [
  {
    id: 1,
    name: 'UFC 334',
    date: '2026-11-15',
    location: 'New York, NY',
    organization: 'UFC',
  },
  {
    id: 2,
    name: 'UFC 335',
    date: '2026-12-13',
    location: 'Las Vegas, NV',
    organization: 'UFC',
  },
  {
    id: 3,
    name: 'UFC 336',
    date: '2027-01-31',
    location: 'Toronto, ON',
    organization: 'UFC',
  },
  {
    id: 4,
    name: 'ONE – Bangkok',
    date: '2026-10-30',
    location: 'Bangkok, Thaiföld',
    organization: 'ONE',
  },
  {
    id: 5,
    name: 'ONE – Singapore',
    date: '2026-11-15',
    location: 'Szingapúr',
    organization: 'ONE',
  },
  {
    id: 6,
    name: 'ONE – Tokyo',
    date: '2026-12-05',
    location: 'Tokió, Japán',
    organization: 'ONE',
  },
  {
    id: 7,
    name: 'ONE – Bangkok Fight Night',
    date: '2027-01-22',
    location: 'Bangkok, Thaiföld',
    organization: 'ONE',
  },
  {
    id: 8,
    name: 'PFL – New York',
    date: '2026-11-20',
    location: 'New York, NY',
    organization: 'PFL',
  },
  {
    id: 9,
    name: 'PFL – Las Vegas',
    date: '2026-12-18',
    location: 'Las Vegas, NV',
    organization: 'PFL',
  },
  {
    id: 10,
    name: 'PFL – Dubai',
    date: '2027-01-15',
    location: 'Dubaj, Egyesült Arab Emírségek',
    organization: 'PFL',
  },
];
