# frozen_string_literal: true

require 'graph_matching'

class SummarizedPairings # rubocop:disable Style/Documentation
  def self.for_user_in_tournament(user_id, tournament_id)
    sql = ActiveRecord::Base.sanitize_sql(
      [
        'SELECT * FROM summarized_pairings WHERE tournament_id = ? AND ' \
        '(player1_user_id = ? OR player2_user_id = ?) ' \
        'ORDER BY stage_number, round_number',
        tournament_id, user_id, user_id
      ]
    )
    rows = ActiveRecord::Base.connection.exec_query(sql).to_a

    corp_id = { name: nil, faction: nil }
    runner_id = { name: nil, faction: nil }
    pairings = []

    rows.each do |row|
      current_num, opponent_num = row['player1_user_id'] == user_id ? %w[1 2] : %w[2 1]
      current_prefix = "player#{current_num}_"
      opponent_prefix = "player#{opponent_num}_"

      # Current player's identities
      corp_id = { name: row["#{current_prefix}corp_identity"], faction: row["#{current_prefix}corp_faction"] }
      runner_id = { name: row["#{current_prefix}runner_identity"], faction: row["#{current_prefix}runner_faction"] }

      # Flip side if player2
      side = row['side']
      side = (side == 1 ? 2 : 1) if current_num == '2' && side

      # Build opponent name with pronouns
      opponent_name = row["#{opponent_prefix}name"]
      opponent_pronouns = row["#{opponent_prefix}pronouns"]
      opponent_name_with_pronouns =
        opponent_pronouns.present? ? "#{opponent_name} (#{opponent_pronouns})" : opponent_name

      pairings << {
        stage_id: row['stage_id'],
        stage_number: row['stage_number'],
        format: Stage.formats.invert[row['stage_format']],
        round_number: row['round_number'],
        round_completed: row['round_completed'],
        pairing_id: row['pairing_id'],
        table_number: row['table_number'],
        side: side,
        opponent: {
          user_id: row["#{opponent_prefix}user_id"],
          name: opponent_name,
          pronouns: opponent_pronouns,
          name_with_pronouns: opponent_name_with_pronouns,
          corp_identity: row["#{opponent_prefix}corp_identity"],
          corp_faction: row["#{opponent_prefix}corp_faction"],
          runner_identity: row["#{opponent_prefix}runner_identity"],
          runner_faction: row["#{opponent_prefix}runner_faction"]
        },
        player_score: row["score#{current_num}"],
        opponent_score: row["score#{opponent_num}"],
        player_score_corp: row["score#{current_num}_corp"],
        player_score_runner: row["score#{current_num}_runner"],
        opponent_score_corp: row["score#{opponent_num}_corp"],
        opponent_score_runner: row["score#{opponent_num}_runner"],
        intentional_draw: row['intentional_draw'],
        two_for_one: row['two_for_one']
      }
    end

    output = {
      tournament_id: tournament_id,
      user_id: user_id
    }
    unless rows.empty?
      output[:identities] = {
        corp: corp_id,
        runner: runner_id
      }
      output[:pairings] = pairings
    end
    output
  end
end
