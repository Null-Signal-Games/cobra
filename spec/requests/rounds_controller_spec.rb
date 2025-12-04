# frozen_string_literal: true

RSpec.describe RoundsController do
  describe 'pairings data' do
    let(:organiser) { create(:user) }
    let(:tournament) { create(:tournament, name: 'My Tournament', user: organiser) }
    let!(:alice) { create(:player, tournament:, name: 'Alice', pronouns: 'she/her') }
    let!(:bob) { create(:player, tournament:, name: 'Bob', pronouns: 'he/him') }
    let!(:charlie) { create(:player, tournament:, name: 'Charlie', pronouns: 'she/her') }

    describe 'during player meeting' do
      it 'displays without logging in' do
        sign_in nil
        get pairings_data_tournament_rounds_path(tournament)

        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq(\
            'policy' => { 'update' => false, 'custom_table_numbering' => false },
            'stages' => [swiss_stage_with_rounds([])],
            'tournament' => {
              'allow_streaming_opt_out' => nil,
              'locked_players' => 0,
              'player_meeting' => true,
              'registration_open' => false,
              'registration_unlocked' => false,
              'self_registration' => false,
              'unlocked_players' => 3
            },
            'warnings' => nil
          )
      end

      it 'displays as player' do
        sign_in alice
        get pairings_data_tournament_rounds_path(tournament)

        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq(
            'policy' => { 'update' => false, 'custom_table_numbering' => false },
            'stages' => [swiss_stage_with_rounds([])],
            'tournament' => {
              'allow_streaming_opt_out' => nil,
              'locked_players' => 0,
              'player_meeting' => true,
              'registration_open' => false,
              'registration_unlocked' => false,
              'self_registration' => false,
              'unlocked_players' => 3
            },
            'warnings' => nil
          )
      end

      it 'displays as organiser' do
        sign_in organiser
        get pairings_data_tournament_rounds_path(tournament)

        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq(
            'policy' => { 'update' => true, 'custom_table_numbering' => false },
            'stages' => [swiss_stage_with_rounds([])],
            'tournament' => {
              'allow_streaming_opt_out' => nil,
              'locked_players' => 0,
              'player_meeting' => true,
              'registration_open' => false,
              'registration_unlocked' => false,
              'self_registration' => false,
              'unlocked_players' => 3
            },
            'warnings' => [nil]
          )
      end
    end

    describe 'during first swiss round before any results' do
      before do
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
      end

      it 'displays without logging in' do
        sign_in nil
        get pairings_data_tournament_rounds_path(tournament)
        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq({
                   'policy' => { 'update' => false, 'custom_table_numbering' => false },
                   'stages' => [swiss_stage_with_rounds(
                     [
                       {
                         'number' => 1,
                         'completed' => false,
                         'length_minutes' => 65,
                         'pairings' => [
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(charlie),
                             'player2' => player_with_no_ids(bob),
                             'policy' => { 'self_report' => false },
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => false,
                             'score1' => nil,
                             'score2' => nil,
                             'score_label' => ' - ', 'two_for_one' => false,
                             'table_label' => 'Table 1', 'table_number' => 1, 'self_reports' => nil },
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(alice),
                             'player2' => bye_player,
                             'policy' => { 'self_report' => false },
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => true,
                             'score1' => 6,
                             'score2' => 0,
                             'score_label' => '6 - 0', 'two_for_one' => false,
                             'table_label' => 'Table 2', 'table_number' => 2, 'self_reports' => nil }
                         ],
                         'pairings_reported' => 1,
                         'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                       }
                     ]
                   )],
                   'tournament' => {
                     'allow_streaming_opt_out' => nil,
                     'locked_players' => 0,
                     'player_meeting' => false,
                     'registration_open' => false,
                     'registration_unlocked' => false,
                     'self_registration' => false,
                     'unlocked_players' => 3
                   },
                   'warnings' => nil
                 })
      end

      it 'displays as organiser' do
        sign_in organiser
        get pairings_data_tournament_rounds_path(tournament)
        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq({
                   'policy' => { 'update' => true, 'custom_table_numbering' => false },
                   'stages' => [swiss_stage_with_rounds(
                     [
                       {
                         'number' => 1,
                         'completed' => false,
                         'length_minutes' => 65,
                         'pairings' => [
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(charlie),
                             'player2' => player_with_no_ids(bob),
                             'policy' => { 'self_report' => false }, # sees player view as a player
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => false,
                             'score1' => nil,
                             'score2' => nil,
                             'score_label' => ' - ', 'two_for_one' => false,
                             'table_label' => 'Table 1', 'table_number' => 1, 'self_reports' => nil },
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(alice),
                             'player2' => bye_player,
                             'policy' => { 'self_report' => false }, # sees player view as a player
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => true,
                             'score1' => 6,
                             'score2' => 0,
                             'score_label' => '6 - 0', 'two_for_one' => false,
                             'table_label' => 'Table 2', 'table_number' => 2, 'self_reports' => nil }
                         ],
                         'pairings_reported' => 1,
                         'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                       }
                     ]
                   )],
                   'tournament' => {
                     'allow_streaming_opt_out' => nil,
                     'locked_players' => 0,
                     'player_meeting' => false,
                     'registration_open' => false,
                     'registration_unlocked' => false,
                     'self_registration' => false,
                     'unlocked_players' => 3
                   },
                   'warnings' => [nil]
                 })
      end
    end

    describe 'during cut before any results' do
      before do
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        tournament.cut_to!(:double_elim, 3)
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
      end

      it 'displays without logging in' do
        sign_in nil
        get pairings_data_tournament_rounds_path(tournament)
        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq({
                   'policy' => { 'update' => false, 'custom_table_numbering' => false },
                   'stages' => [
                     swiss_stage_with_rounds(
                       [
                         {
                           'number' => 1,
                           'completed' => false,
                           'length_minutes' => 65,
                           'pairings' => [
                             { 'intentional_draw' => false,
                               'player1' => player_with_no_ids(charlie),
                               'player2' => player_with_no_ids(bob),
                               'policy' => { 'self_report' => false },
                               'ui_metadata' => { 'row_highlighted' => false },
                               'reported' => false,
                               'score1' => nil,
                               'score2' => nil,
                               'score_label' => ' - ', 'two_for_one' => false,
                               'table_label' => 'Table 1', 'table_number' => 1, 'self_reports' => nil },
                             { 'intentional_draw' => false,
                               'player1' => player_with_no_ids(alice),
                               'player2' => bye_player,
                               'policy' => { 'self_report' => false },
                               'ui_metadata' => { 'row_highlighted' => false },
                               'reported' => true,
                               'score1' => 6,
                               'score2' => 0,
                               'score_label' => '6 - 0', 'two_for_one' => false,
                               'table_label' => 'Table 2', 'table_number' => 2, 'self_reports' => nil }
                           ],
                           'pairings_reported' => 1,
                           'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                         }
                       ]
                     ),
                     cut_stage_with_rounds(
                       [
                         {
                           'number' => 1,
                           'completed' => false,
                           'length_minutes' => 40,
                           'pairings' => [
                             { 'intentional_draw' => false,
                               'player1' => player_with_no_ids(bob),
                               'player2' => player_with_no_ids(charlie),
                               'policy' => { 'self_report' => false },
                               'ui_metadata' => { 'row_highlighted' => false },
                               'reported' => false,
                               'score1' => nil,
                               'score2' => nil,
                               'score_label' => ' - ', 'two_for_one' => false,
                               'table_label' => 'Game 1', 'table_number' => 1, 'self_reports' => nil }
                           ],
                           'pairings_reported' => 0,
                           'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                         }
                       ]
                     )
                   ],
                   'tournament' => {
                     'allow_streaming_opt_out' => nil,
                     'locked_players' => 0,
                     'player_meeting' => false,
                     'registration_open' => false,
                     'registration_unlocked' => false,
                     'self_registration' => false,
                     'unlocked_players' => 3
                   },
                   'warnings' => nil
                 })
      end

      it 'displays bracket info' do
        sign_in nil
        get brackets_tournament_rounds_path(tournament)
        expect(compare_body(response))
          .to eq({
                   'stages' => [
                     swiss_stage_with_rounds(
                       [
                         {
                           'number' => 1,
                           'completed' => false,
                           'length_minutes' => 65,
                           'pairings' => [
                             { 'intentional_draw' => false,
                               'player1' => player_with_no_ids(charlie),
                               'player2' => player_with_no_ids(bob),
                               'policy' => { 'self_report' => false },
                               'ui_metadata' => { 'row_highlighted' => false },
                               'reported' => false,
                               'score1' => nil,
                               'score2' => nil,
                               'score_label' => ' - ', 'two_for_one' => false,
                               'table_label' => 'Table 1', 'table_number' => 1, 'self_reports' => nil },
                             { 'intentional_draw' => false,
                               'player1' => player_with_no_ids(alice),
                               'player2' => bye_player,
                               'policy' => { 'self_report' => false },
                               'ui_metadata' => { 'row_highlighted' => false },
                               'reported' => true,
                               'score1' => 6,
                               'score2' => 0,
                               'score_label' => '6 - 0', 'two_for_one' => false,
                               'table_label' => 'Table 2', 'table_number' => 2, 'self_reports' => nil }
                           ],
                           'pairings_reported' => 1,
                           'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                         }
                       ]
                     ),
                     cut_stage_with_rounds(
                       [
                         {
                           'number' => 1,
                           'completed' => false,
                           'length_minutes' => 40,
                           'pairings' => [
                             { 'intentional_draw' => false,
                               'player1' => player_with_no_ids(bob),
                               'player2' => player_with_no_ids(charlie),
                               'policy' => { 'self_report' => false },
                               'ui_metadata' => { 'row_highlighted' => false },
                               'reported' => false,
                               'score1' => nil,
                               'score2' => nil,
                               'score_label' => ' - ', 'two_for_one' => false,
                               'table_label' => 'Game 1', 'table_number' => 1, 'self_reports' => nil,
                               'round' => 1, 'winner_game' => 2, 'loser_game' => nil, 'bracket_type' => 'upper' }
                           ],
                           'pairings_reported' => 0,
                           'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                         },
                         {
                           'number' => 2,
                           'pairings' => [
                             { 'table_number' => 2, 'round' => 2, 'winner_game' => nil, 'loser_game' => nil,
                               'bracket_type' => 'upper' }
                           ]
                         }
                       ]
                     )
                   ]
                 })
      end
    end

    describe 'during single sided swiss after first round results' do
      before do
        tournament.update(swiss_format: :single_sided)
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        pairings = tournament.stages.last.rounds.last.pairings
        pairings.first.update(side: :player1_is_corp,
                              score1: 3, score1_corp: 3, score1_runner: 0,
                              score2: 0, score2_corp: 0, score2_runner: 0)
      end

      it 'displays without logging in' do
        sign_in nil
        get pairings_data_tournament_rounds_path(tournament)
        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq({
                   'policy' => { 'update' => false, 'custom_table_numbering' => false },
                   'stages' => [swiss_stage_with_rounds(
                     [
                       {
                         'number' => 1,
                         'completed' => false,
                         'length_minutes' => 65,
                         'pairings' => [
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(charlie, side: 'corp', side_label: '(Corp)'),
                             'player2' => player_with_no_ids(bob, side: 'runner', side_label: '(Runner)'),
                             'policy' => { 'self_report' => false },
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => true,
                             'score1' => 3,
                             'score2' => 0,
                             'score_label' => '3 - 0 (C)', 'two_for_one' => false,
                             'table_label' => 'Table 1', 'table_number' => 1, 'self_reports' => nil },
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(alice),
                             'player2' => bye_player,
                             'policy' => { 'self_report' => false },
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => true,
                             'score1' => 6,
                             'score2' => 0,
                             'score_label' => '6 - 0', 'two_for_one' => false,
                             'table_label' => 'Table 2', 'table_number' => 2, 'self_reports' => nil }
                         ],
                         'pairings_reported' => 2,
                         'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                       }
                     ]
                   )],
                   'tournament' => {
                     'allow_streaming_opt_out' => nil,
                     'locked_players' => 0,
                     'player_meeting' => false,
                     'registration_open' => false,
                     'registration_unlocked' => false,
                     'self_registration' => false,
                     'unlocked_players' => 3
                   },
                   'warnings' => nil
                 })
      end
    end

    describe 'during single sided swiss after first round results - player1 is runner' do
      before do
        tournament.update(swiss_format: :single_sided)
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        pairings = tournament.stages.last.rounds.last.pairings
        pairings.first.update(side: :player1_is_runner,
                              score1: 3, score1_corp: 0, score1_runner: 3,
                              score2: 0, score2_corp: 0, score2_runner: 0)
      end

      it 'displays player 1 score on the right (runner) side' do
        sign_in nil
        get pairings_data_tournament_rounds_path(tournament)
        expect(compare_body(response).delete_if { |k, _| k == 'csrf_token' })
          .to eq({
                   'policy' => { 'custom_table_numbering' => false, 'update' => false },
                   'stages' => [swiss_stage_with_rounds(
                     [
                       {
                         'number' => 1,
                         'completed' => false,
                         'length_minutes' => 65,
                         'pairings' => [
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(charlie, side: 'runner', side_label: '(Runner)'),
                             'player2' => player_with_no_ids(bob, side: 'corp', side_label: '(Corp)'),
                             'policy' => { 'self_report' => false },
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => true,
                             'score1' => 3,
                             'score2' => 0,
                             'score_label' => '0 - 3 (R)', 'two_for_one' => false,
                             'table_label' => 'Table 1', 'table_number' => 1, 'self_reports' => nil },
                           { 'intentional_draw' => false,
                             'player1' => player_with_no_ids(alice),
                             'player2' => bye_player,
                             'policy' => { 'self_report' => false },
                             'ui_metadata' => { 'row_highlighted' => false },
                             'reported' => true,
                             'score1' => 6,
                             'score2' => 0,
                             'score_label' => '6 - 0', 'two_for_one' => false,
                             'table_label' => 'Table 2', 'table_number' => 2, 'self_reports' => nil }
                         ],
                         'pairings_reported' => 2,
                         'timer' => { 'paused' => false, 'running' => false, 'started' => false }
                       }
                     ]
                   )],
                   'tournament' => {
                     'allow_streaming_opt_out' => nil,
                     'locked_players' => 0,
                     'player_meeting' => false,
                     'registration_open' => false,
                     'registration_unlocked' => false,
                     'self_registration' => false,
                     'unlocked_players' => 3
                   },
                   'warnings' => nil
                 })
      end
    end
  end

  def compare_body(response)
    body = JSON.parse(response.body)
    body['stages'].each do |stage|
      stage.delete 'id'
      stage['rounds'].each do |round|
        round.delete 'id'
        round['pairings'].each do |pairing|
          pairing.delete 'id'
          pairing['player1']&.delete 'id'
          pairing['player2']&.delete 'id'
        end
      end
    end
    body
  end

  def player_with_no_ids(player, side: nil, side_label: nil)
    {
      'name' => player.name,
      'name_with_pronouns' => player.name_with_pronouns,
      'include_in_stream' => player.include_in_stream,
      'user_id' => nil,
      'corp_id' => { 'faction' => nil, 'name' => nil },
      'runner_id' => { 'faction' => nil, 'name' => nil },
      'side' => side,
      'side_label' => side_label
    }
  end

  def bye_player
    {
      'name' => nil,
      'name_with_pronouns' => '(Bye)',
      'include_in_stream' => nil,
      'user_id' => nil,
      'corp_id' => nil,
      'runner_id' => nil,
      'side' => nil,
      'side_label' => nil
    }
  end

  def swiss_stage_with_rounds(rounds)
    {
      'name' => 'Swiss',
      'format' => 'swiss',
      'is_single_sided' => false,
      'is_elimination' => false,
      'view_decks' => false,
      'rounds' => rounds,
      'player_count' => 3
    }
  end

  def cut_stage_with_rounds(rounds)
    {
      'name' => 'Double Elim',
      'format' => 'double_elim',
      'is_single_sided' => true,
      'is_elimination' => true,
      'view_decks' => false,
      'rounds' => rounds,
      'player_count' => 3
    }
  end
end
