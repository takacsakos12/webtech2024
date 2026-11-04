import { Fighter } from './fighter';
import { MmaEvent } from './mma-event';

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
  result?: FightResult;
  redCorner: Fighter | null;
  blueCorner: Fighter | null;
}

export interface EventWithFights extends MmaEvent {
  fights: Fight[];
}
