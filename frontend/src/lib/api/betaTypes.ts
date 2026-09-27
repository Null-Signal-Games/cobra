import { Tournament } from "$lib/model/Tournament";

export interface TournamentData {
  tournament: Tournament,
  csrf_token: string,
}
