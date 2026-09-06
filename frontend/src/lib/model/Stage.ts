import { type Round } from "./Round";

export interface Stage {
  id: number;
  name: string;
  format: string;
  is_single_sided: boolean;
  is_elimination: boolean;
  view_decks: boolean;
  rounds: Round[];
}
