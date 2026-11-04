import type { Fighter } from './fighter';
import type { MmaEvent } from './mma-event';

export interface FightResult {
  outcome: 'win' | 'draw' | 'no-contest';
  winnerId?: number;
  method: string;
  round: number;
  time: string;
}

export interface Fight {
  id: number;
  eventId: number;

  redCornerFighterId: number;
  blueCornerFighterId: number;

  weightClass: string;
  scheduledRounds: number;
  cardOrder: number;

  isMainEvent: boolean;
  isTitleFight: boolean;

  status: 'scheduled' | 'completed' | 'cancelled';
  result?: FightResult | null;

  redCorner: Fighter | null;
  blueCorner: Fighter | null;
}

// Eseményadatlap: esemény a hozzá tartozó meccsekkel.
export interface EventWithFights extends MmaEvent {
  fights: Fight[];
}

// Meccsadatlap: meccs a hozzá tartozó eseménnyel.
export interface FightDetails extends Fight {
  event: MmaEvent | null;
}
