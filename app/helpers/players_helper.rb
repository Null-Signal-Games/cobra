# frozen_string_literal: true

module PlayersHelper # rubocop:disable Style/Documentation
  # TODO: This and player_hash_json() should be merged
  def player_json(player, side = nil)
    {
      id: player&.id || 0,
      name: player&.name,
      pronouns: player&.pronouns,
      name_with_pronouns: name_with_pronouns(player),
      user_id: player&.user_id,
      corp_id: id(player, 'corp'),
      runner_id: id(player, 'runner'),
      registration_locked: player&.registration_locked?,
      include_in_stream: player&.include_in_stream,
      active: player&.active,
      first_round_bye: player&.first_round_bye,
      manual_seed: player&.manual_seed,
      fixed_table_number: player&.fixed_table_number,
      side:,
      side_label: side.nil? ? nil : "(#{side.to_s.titleize})"
    }
  end

  def player_hash_json(player, side = nil)
    {
      id: player && player['id'],
      name: player && player['name'],
      pronouns: player && player['pronouns'],
      name_with_pronouns: hash_name_with_pronouns(player),
      user_id: player && player['user_id'],
      corp_id: id(player, 'corp'),
      runner_id: id(player, 'runner'),
      registration_locked: player && player['registration_locked?'],
      include_in_stream: player && player['include_in_stream'],
      active: player && player['active'],
      first_round_bye: player && player['first_round_bye'],
      manual_seed: player && player['manual_seed'],
      fixed_table_number: player && player['fixed_table_number'],
      side:,
      side_label: side.nil? ? nil : "(#{side.to_s.titleize})"
    }
  end

  private

  def name_with_pronouns(player)
    return '(Bye)' if player.nil?

    player.pronouns.present? ? "#{player.name} (#{player.pronouns})" : player.name
  end

  def hash_name_with_pronouns(player)
    return '(Bye)' if player.nil?

    player['pronouns'].present? ? "#{player['name']} (#{player['pronouns']})" : player['name']
  end

  def id(player, side)
    return { name: '', faction: '' } if player.nil?

    id = Identity.find_or_initialize_by(name: player["#{side}_identity"])
    {
      name: id.name,
      faction: id.faction
    }
  end
end
