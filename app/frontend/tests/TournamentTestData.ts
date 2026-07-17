import type { IdentityNames } from "../identities/Identity";
import { Tournament } from "../tournaments/TournamentSettings";

export const MockTournament = new Tournament({
  id: 1,
  name: "Mock Tournament",
  slug: "ABC1",
  user_id: 1,
  tournament_organizer: "Alice",
  date: "2026-04-21",
  registration_starts: "2026-04-21T10:00:00",
  tournament_starts: "2026-04-21T11:00:00",
  description: "This is a test tournament.",
  official_prize_kit_id: 1,
  official_prize_kit_name: "2026 Test Tournament Kit",
  self_registration: true,
  all_players_unlocked: true,
  any_player_unlocked: true,
  allow_streaming_opt_out: true,
  swiss_format: "single_sided",
  registration_closed: false,
  active_player_count: 17,
  dropped_player_count: 1,
});

export const MockIdentityNames: IdentityNames = {
  corp: [
    {
      label: "A Teia: IP Recovery",
      value: "A Teia: IP Recovery",
    },
    {
      label: "BANGUN: When Disaster Strikes",
      value: "BANGUN: When Disaster Strikes",
    },
  ],
  runner: [
    {
      label: "Arissana Rocha Nahu: Street Artist",
      value: "Arissana Rocha Nahu: Street Artist",
    },
    {
      label: "Barry “Baz” Wong: Tri-Maf Veteran",
      value: "Barry “Baz” Wong: Tri-Maf Veteran",
    },
  ],
};
