import type { IdentityInfo, PlayerInfo, TournamentInfo } from "$lib/api/v1ApiTypes";
import type { IdentityName, IdentityNames } from "$lib/model/Identity";
import { Player } from "$lib/model/Player";
import type { Tournament } from "$lib/model/Tournament";

export class V1Adapter {
    adaptTournament(t : TournamentInfo) : Tournament {
      const id = Number.parseInt(t.id, 10);

      if (Number.isNaN(id)) {
        throw new Error(`Invalid tournament id: ${t.id}`);
      }

      return {
        abr_code: t.attributes.abr_code,
        active_player_count: t.attributes.active_player_count,
        additional_prizes_description: t.attributes.additional_prizes_description,
        all_players_unlocked: t.attributes.all_players_unlocked,
        allow_self_reporting: t.attributes.allow_self_reporting,
        allow_streaming_opt_out: t.attributes.allow_streaming_opt_out,
        any_player_unlocked: t.attributes.any_player_unlocked,
        card_set_id: t.attributes.card_set_id,
        created_at: t.attributes.created_at,
        cut_deck_visibility: t.attributes.cut_deck_visibility,
        date: t.attributes.date,
        deckbuilding_restriction_id: t.attributes.deckbuilding_restriction_id,
        deckbuilding_restriction_name: t.attributes.deckbuilding_restriction_name,
        decklist_required: t.attributes.decklist_required,
        description: t.attributes.description,
        dropped_player_count: t.attributes.dropped_player_count,
        event_link: t.attributes.event_link,
        format_id: t.attributes.format_id,
        format_name: t.attributes.format_name,
        has_elimination_stage: t.attributes.has_elimination_stage,
        id,
        manual_seed: t.attributes.manual_seed,
        name: t.attributes.name,
        nrdb_deck_registration: t.attributes.nrdb_deck_registration,
        official_prize_kit_id: t.attributes.official_prize_kit_id,
        official_prize_kit_name: t.attributes.official_prize_kit_name,
        organizer_contact: t.attributes.organizer_contact,
        private: t.attributes.private,
        registration_closed: t.attributes.registration_closed,
        registration_starts: t.attributes.registration_starts,
        self_registration: t.attributes.self_registration,
        slug: t.attributes.slug,
        stage: t.attributes.stage,
        stream_url: t.attributes.stream_url,
        swiss_deck_visibility: t.attributes.swiss_deck_visibility,
        swiss_format: t.attributes.swiss_format,
        time_zone: t.attributes.time_zone,
        tournament_organizer: t.attributes.tournament_organizer,
        tournament_starts: t.attributes.tournament_starts,
        tournament_type_id: t.attributes.tournament_type_id,
        updated_at: t.attributes.updated_at,
        user_id: t.attributes.user_id,
      }
    }

    adaptIdentityNames(identities: IdentityInfo[]): IdentityNames {
      const corp: IdentityName[] = [];
      const runner: IdentityName[] = [];

      for (const item of identities) {
        const entry: IdentityName = {
          label: item.attributes.autocomplete,
          value: item.attributes.name,
        };
        if (item.attributes.side === "corp") {
          corp.push(entry);
        } else if (item.attributes.side === "runner") {
          runner.push(entry);
        }
      }

      corp.sort((a, b) => a.label.localeCompare(b.label));
      runner.sort((a, b) => a.label.localeCompare(b.label));

      return { corp, runner };
    }

    adaptPlayer(p: PlayerInfo, included: IdentityInfo[] = []): Player {
      const id = Number.parseInt(p.id, 10);

      if (Number.isNaN(id)) {
        throw new Error(`Invalid player id: ${p.id}`);
      }

      const player = new Player();
      player.id = id;
      player.name = p.attributes.name;
      player.pronouns = p.attributes.pronouns ?? "";
      player.name_with_pronouns = player.pronouns ? `${player.name} (${player.pronouns})` : player.name;
      player.user_id = p.attributes.user_id;
      player.active = p.attributes.active;
      player.fixed_table_number = p.attributes.fixed_table_number ?? null;
      player.include_in_stream = p.attributes.include_in_stream ?? false;
      player.first_round_bye = p.attributes.first_round_bye ?? false;
      player.manual_seed = p.attributes.manual_seed ?? null;
      player.registration_locked = p.attributes.registration_locked ?? false;

      if (included.length > 0) {
        if (p.attributes.corp_identity_id) {
          const corp = included.find((item) => item.id === String(p.attributes.corp_identity_id));
          if (corp) {
            player.corp_id.name = corp.attributes.name;
            player.corp_id.faction = corp.attributes.faction ?? null;
          }
        }
        if (p.attributes.runner_identity_id) {
          const runner = included.find((item) => item.id === String(p.attributes.runner_identity_id));
          if (runner) {
            player.runner_id.name = runner.attributes.name;
            player.runner_id.faction = runner.attributes.faction ?? null;
          }
        }
      }

      return player;
    }
}

export const v1Adapter = new V1Adapter();
