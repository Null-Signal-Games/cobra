# frozen_string_literal: true

# JSON endpoints for standings and player data downloads.
class PlayersController < ApplicationController # rubocop:disable Metrics/ClassLength
  before_action :set_tournament

  def download_decks
    authorize @tournament, :update?
    render json: @tournament.players
                            .sort_by(&:name)
                            .flat_map { |p| p.decks.sort_by(&:side_id) }
                            .map { |d| d.as_view(current_user) }
  end

  def download_streaming
    authorize @tournament, :update?
    render json: @tournament.players.active
                            .sort_by(&:name)
                            .map { |p|
                              {
                                name: p.name_with_pronouns,
                                include_in_stream: p.include_in_stream?
                              }
                            }
  end

  def standings_data # rubocop:disable Metrics/MethodLength
    authorize @tournament, :show?

    sql = ActiveRecord::Base.sanitize_sql(
      [
        'SELECT * FROM summarized_standings WHERE tournament_id = ? ORDER BY stage_number DESC, position, player_id',
        @tournament.id
      ]
    )
    rows = ActiveRecord::Base.connection.exec_query(sql).to_a

    is_player_meeting = false
    tournament_manual_seed = false
    any_decks_viewable = false

    stages_map = {}
    # Used when players are registered, but before rounds.
    swiss_position = 0
    # Used when a cut is created, but no standings are finalized yet.
    elimination_position = 0
    rows.each do |r|
      is_player_meeting = true if r['is_player_meeting']
      tournament_manual_seed = r['tournament_manual_seed']

      stages_map[r['stage_number']] = {} unless stages_map.key?(r['stage_number'])
      stage = stages_map[r['stage_number']]
      stage[:format] = Stage.formats.invert[r['stage_format']]
      stage[:num_rounds_completed] = r['num_rounds_completed']

      stage[:elimination] = [Stage.formats['single_elim'], Stage.formats['double_elim']].include?(r['stage_format'])

      stage_decks_open =
        if stage[:elimination]
          Tournament.cut_deck_visibilities[:cut_decks_open] == r['cut_deck_visibility']
        else
          Tournament.swiss_deck_visibilities[:swiss_deck_open] == r['swiss_deck_visibility']
        end
      stage_decks_public =
        if stage[:elimination]
          Tournament.cut_deck_visibilities[:cut_decks_public] == r['cut_deck_visibility']
        else
          Tournament.swiss_deck_visibilities[:swiss_decks_public] == r['swiss_deck_visibility']
        end

      stage[:stage_decks_open] = stage_decks_open
      stage[:stage_decks_public] = stage_decks_public

      stage[:num_rounds_completed] = r['num_rounds_completed']

      # this will be set to true if any user in the stage has visible decks, checked in the loop below.
      stage[:any_decks_viewable] = false

      stage[:standings] = [] unless stage.key?(:standings)

      view_player_decks =
        if stage[:stage_decks_open] && current_user
          [r['tournament_user_id'], r['player_user_id']].include?(current_user&.id)
        else
          stage[:stage_decks_public]
        end
      any_decks_viewable = true if view_player_decks

      player = {}
      # Swiss rounds have more detailed player records than elimination rounds
      if stage[:elimination]
        elimination_position += 1
        player = {
          player: nil,
          policy: {
            view_decks: view_player_decks
          },
          position: elimination_position,
          seed: (r['seed'] if r['position'])
        }
        if r['player_name'].present?
          player[:position] = r['position']
          player[:player] = {
            id: r['player_id'],
            active: r['player_active'],
            name_with_pronouns:
              "#{r['player_name']}#{" (#{r['player_pronouns']})" if r['player_pronouns'].present?}",
            corp_id: {
              name: r['corp_id_name'],
              faction: r['corp_id_faction']
            },
            runner_id: {
              name: r['runner_id_name'],
              faction: r['runner_id_faction']
            }
          }
        end
      else
        swiss_position += 1
        player = {
          player: {
            id: r['player_id'],
            active: r['player_active'],
            name_with_pronouns:
              "#{r['player_name']}#{" (#{r['player_pronouns']})" if r['player_pronouns'].present?}",
            corp_id: { name: nil, faction: nil },
            runner_id: { name: nil, faction: nil }
          },
          policy: {
            view_decks: view_player_decks
          },
          position: r['position'] || swiss_position,
          points: r['points'] || 0,
          sos: r['sos'] || 0,
          extended_sos: r['extended_sos'] || 0,
          corp_points: r['corp_points'] || 0,
          runner_points: r['runner_points'] || 0,
          bye_points: r['bye_points'] || 0,
          manual_seed: r['player_manual_seed'],
          side_bias: r['side_bias']
        }
        # Don't show ids before any rounds have been paired.
        if r['num_rounds'].positive?
          player[:player][:corp_id] = {
            name: r['corp_id_name'],
            faction: r['corp_id_faction']
          }
          player[:player][:runner_id] = {
            name: r['runner_id_name'],
            faction: r['runner_id_faction']
          }
        end
      end
      stage[:standings] << player
    end

    # stages = @tournament.stages
    # elimination = stages.select(&:double_elim?).first
    # elimination = stages.select(&:single_elim?).first if elimination.nil?

    stages_array = stages_map.keys.map do |stage_number|
      # stage = @tournament.stages.find_by(number: stage_number)

      {
        format: stages_map[stage_number][:format],
        rounds_complete: stages_map[stage_number][:num_rounds_completed],

        any_decks_viewable:,

        standings: stages_map[stage_number][:standings]
      }
    end

    render json: {
      is_player_meeting:,
      manual_seed: tournament_manual_seed,
      stages: stages_array
    }
  end
end
