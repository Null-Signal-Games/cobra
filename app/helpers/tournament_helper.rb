# frozen_string_literal: true

module TournamentHelper # rubocop:disable Style/Documentation
  def short_date(tournament)
    return unless tournament.date

    tournament.date.strftime('%-d %b %Y')
  end

  def tournament_json(tournament)
    {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      abr_code: tournament.abr_code,
      private: tournament.private,
      user_id: tournament.user_id,
      tournament_organizer: tournament.user.nrdb_username,
      date: tournament.date,
      time_zone: tournament.time_zone,
      registration_starts: tournament.registration_starts,
      tournament_starts: tournament.tournament_starts,
      organizer_contact: tournament.organizer_contact,
      event_link: tournament.event_link,
      stream_url: tournament.stream_url,
      description: tournament.description,
      additional_prizes_description: tournament.additional_prizes_description,
      official_prize_kit_id: tournament.official_prize_kit_id,
      stage: tournament.stage,
      manual_seed: tournament.manual_seed,
      self_registration: tournament.self_registration,
      nrdb_deck_registration: tournament.nrdb_deck_registration,
      decklist_required: tournament.decklist_required,
      allow_self_reporting: tournament.allow_self_reporting,
      allow_streaming_opt_out: tournament.allow_streaming_opt_out,
      all_players_unlocked: tournament.all_players_unlocked,
      any_player_unlocked: tournament.any_player_unlocked,
      registration_closed: tournament.registration_closed,
      swiss_deck_visibility: tournament.swiss_deck_visibility,
      cut_deck_visibility: tournament.cut_deck_visibility,
      swiss_format: tournament.swiss_format,
      tournament_type_id: tournament.tournament_type_id,
      format_id: tournament.format_id,
      deckbuilding_restriction_id: tournament.deckbuilding_restriction_id,
      card_set_id: tournament.card_set_id,
      created_at: tournament.created_at,
      updated_at: tournament.updated_at
    }
  end

  def tournament_policies_json(tournament)
    {
      update: tournament.user == current_user,
      custom_table_numbering: Flipper.enabled?(:custom_table_numbering, current_user)
    }
  end

  def demo_tournament_json
    {
      tournament: {
        name: '',
        swiss_format: 'single_sided',
        num_players: nil,
        num_first_round_byes: nil,
        assign_ids: false
      },
      csrf_token: form_authenticity_token
    }
  end

  def tournament_settings_json(tournament)
    {
      tournament: tournament_json(tournament).compact,
      options: {
        tournament_types: TournamentType.all.map { |t| { id: t.id, name: t.name } },
        formats: Format.all.map { |f| { id: f.id, name: f.name } },
        card_sets: CardSet.order(date_release: :desc).map { |c| { id: c.id, name: c.name } },
        deckbuilding_restrictions: DeckbuildingRestriction.order(date_start: :desc).map do |d|
          { id: d.id, name: d.name }
        end,
        time_zones: ActiveSupport::TimeZone.all.map { |z| { id: z.name, name: z.to_s } },
        official_prize_kits: OfficialPrizeKit.order(position: :desc).map { |p| { id: p.id, name: p.name } }
      },
      feature_flags: {
        allow_self_reporting: Flipper.enabled?(:allow_self_reporting)
      },
      csrf_token: form_authenticity_token
    }
  end
end
