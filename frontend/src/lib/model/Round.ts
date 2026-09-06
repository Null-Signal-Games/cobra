import type { Pairing } from "./Pairing";
import type { Player } from "./Player";

export interface Round {
  id: number;
  number: number;
  completed: boolean;
  pairings: Pairing[];
  pairings_reported: number;
  unpaired_players?: Player[];
  length_minutes: number;
  timer: RoundTimer;
}

export interface RoundTimer {
  show: boolean;
  running: boolean;
  paused: boolean;
  started: boolean;
  state: {
    started: boolean;
    paused: boolean;
    finish_time?: string;
    remaining_seconds?: number;
    length_minutes?: number;
  }
}
