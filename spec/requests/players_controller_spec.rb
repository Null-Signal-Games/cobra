# frozen_string_literal: true

RSpec.describe PlayersController do
  describe 'standings data' do
    let(:organiser) { create(:user) }
    let(:tournament) { create(:tournament, name: 'My Tournament', user: organiser) }
    let!(:alice) { create(:player, tournament:, name: 'Alice', pronouns: 'she/her') }

    before do
      create(:player, tournament:, name: 'Bob', pronouns: 'he/him')
      create(:player, tournament:, name: 'Charlie', pronouns: 'she/her')
    end

    describe 'during player meeting' do
      it 'displays without logging in' do
        sign_in nil
        get standings_data_api_classic_tournament_players_path(tournament)

        expect(compare_body(response))
          .to eq(
            'is_player_meeting' => true,
            'manual_seed' => false,
            'stages' => [
              { 'format' => 'swiss',
                'any_decks_viewable' => false,
                'rounds_complete' => 0,
                'standings' => [
                  standing_with_no_score(1, player_with_hidden_ids('Alice (she/her)')),
                  standing_with_no_score(2, player_with_hidden_ids('Bob (he/him)')),
                  standing_with_no_score(3, player_with_hidden_ids('Charlie (she/her)'))
                ] }
            ]
          )
      end

      it 'displays as player' do
        sign_in alice
        get standings_data_api_classic_tournament_players_path(tournament)

        expect(compare_body(response))
          .to eq(
            'is_player_meeting' => true,
            'manual_seed' => false,
            'stages' => [
              { 'format' => 'swiss',
                'any_decks_viewable' => false,
                'rounds_complete' => 0,
                'standings' => [
                  standing_with_no_score(1, player_with_hidden_ids('Alice (she/her)')),
                  standing_with_no_score(2, player_with_hidden_ids('Bob (he/him)')),
                  standing_with_no_score(3, player_with_hidden_ids('Charlie (she/her)'))
                ] }
            ]
          )
      end

      it 'displays as organiser' do
        sign_in organiser
        get standings_data_api_classic_tournament_players_path(tournament)

        expect(compare_body(response))
          .to eq(
            'is_player_meeting' => true,
            'manual_seed' => false,
            'stages' => [
              { 'format' => 'swiss',
                'any_decks_viewable' => false,
                'rounds_complete' => 0,
                'standings' => [
                  standing_with_no_score(1, player_with_hidden_ids('Alice (she/her)')),
                  standing_with_no_score(2, player_with_hidden_ids('Bob (he/him)')),
                  standing_with_no_score(3, player_with_hidden_ids('Charlie (she/her)'))
                ] }
            ]
          )
      end
    end

    describe 'after first swiss round' do
      before do
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        round = tournament.current_stage.rounds.last
        round.pairings.each do |pairing|
          pairing.update!(score1: 6, score2: 0)
        end
        round.update!(completed: true)
      end

      it 'displays without logging in' do
        sign_in nil
        get standings_data_api_classic_tournament_players_path(tournament)

        expect(compare_body(response))
          .to eq(
            'is_player_meeting' => false,
            'manual_seed' => false,
            'stages' => [
              { 'format' => 'swiss',
                'any_decks_viewable' => false,
                'rounds_complete' => 1,
                'standings' => [
                  standing_with_custom_score(1, points: 6, sos: '0.0', extended_sos: '6.0',
                                                player: player_with_no_ids('Charlie (she/her)')),
                  standing_with_custom_score(2, points: 6, bye_points: 6, sos: '0.0', extended_sos: '0.0',
                                                player: player_with_no_ids('Alice (she/her)')),
                  standing_with_custom_score(3, points: 0, sos: '6.0', extended_sos: '0.0',
                                                player: player_with_no_ids('Bob (he/him)'))
                ] }
            ]
          )
      end
    end

    describe 'at start of cut' do
      before do
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        round = tournament.current_stage.rounds.last
        round.pairings.each do |pairing|
          pairing.update!(score1: 6, score2: 0)
        end
        round.update!(completed: true)
        tournament.cut_to!(:single_elim, 3)
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
      end

      it 'displays without logging in' do
        sign_in nil
        get standings_data_api_classic_tournament_players_path(tournament)

        expect(compare_body(response))
          .to eq(
            'is_player_meeting' => false,
            'manual_seed' => false,
            'stages' => [
              { 'format' => 'single_elim',
                'any_decks_viewable' => false,
                'rounds_complete' => 0,
                'standings' => [
                  standing_at_cut_position(1, player: nil, seed: nil),
                  standing_at_cut_position(2, player: nil, seed: nil),
                  standing_at_cut_position(3, player: nil, seed: nil)
                ] },
              { 'format' => 'swiss',
                'any_decks_viewable' => false,
                'rounds_complete' => 1,
                'standings' => [
                  standing_with_custom_score(1, points: 6, sos: '0.0', extended_sos: '6.0',
                                                player: player_with_no_ids('Charlie (she/her)')),
                  standing_with_custom_score(2, points: 6, bye_points: 6, sos: '0.0', extended_sos: '0.0',
                                                player: player_with_no_ids('Alice (she/her)')),
                  standing_with_custom_score(3, points: 0, sos: '6.0', extended_sos: '0.0',
                                                player: player_with_no_ids('Bob (he/him)'))
                ] }
            ]
          )
      end
    end

    describe 'after first round of cut' do
      before do
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        swiss_round = tournament.current_stage.rounds.last
        swiss_round.pairings.each do |pairing|
          pairing.update!(score1: 6, score2: 0)
        end
        swiss_round.update!(completed: true)
        tournament.cut_to!(:single_elim, 3)
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
        cut_round = tournament.current_stage.rounds.last
        cut_round.pairings.each do |pairing|
          pairing.update!(score1: 3, score2: 0)
        end
        cut_round.update!(completed: true)
      end

      it 'displays without logging in' do
        sign_in nil
        get standings_data_api_classic_tournament_players_path(tournament)

        expect(compare_body(response))
          .to eq(
            'is_player_meeting' => false,
            'manual_seed' => false,
            'stages' => [
              { 'format' => 'single_elim',
                'any_decks_viewable' => false,
                'rounds_complete' => 1,
                'standings' => [
                  standing_at_cut_position(1, player: nil, seed: nil),
                  standing_at_cut_position(2, player: nil, seed: nil),
                  standing_at_cut_position(3, seed: 3,
                                              player: player_with_no_ids('Bob (he/him)'))
                ] },
              { 'format' => 'swiss',
                'any_decks_viewable' => false,
                'rounds_complete' => 1,
                'standings' => [
                  standing_with_custom_score(1, points: 6, sos: '0.0', extended_sos: '6.0',
                                                player: player_with_no_ids('Charlie (she/her)')),
                  standing_with_custom_score(2, points: 6, bye_points: 6, sos: '0.0', extended_sos: '0.0',
                                                player: player_with_no_ids('Alice (she/her)')),
                  standing_with_custom_score(3, points: 0, sos: '6.0', extended_sos: '0.0',
                                                player: player_with_no_ids('Bob (he/him)'))
                ] }
            ]
          )
      end
    end
  end

  def compare_body(response)
    body = JSON.parse(response.body)
    body['stages'].each do |stage|
      stage['standings'].each do |standing|
        standing['player']&.delete 'id'
      end
    end
    body
  end

  def standing_with_no_score(position, player)
    {
      'position' => position,
      'player' => player,
      'policy' => { 'view_decks' => false },
      'points' => 0,
      'sos' => 0,
      'extended_sos' => 0,
      'bye_points' => 0,
      'corp_points' => 0,
      'runner_points' => 0,
      'manual_seed' => nil,
      'side_bias' => nil
    }
  end

  def standing_with_custom_score(position, points:, sos:, extended_sos:, player:, bye_points: 0) # rubocop:disable Metrics/ParameterLists
    {
      'position' => position,
      'player' => player,
      'policy' => { 'view_decks' => false },
      'points' => points,
      'sos' => sos,
      'extended_sos' => extended_sos,
      'bye_points' => bye_points,
      'corp_points' => 0,
      'runner_points' => 0,
      'manual_seed' => nil,
      'side_bias' => nil
    }
  end

  def standing_at_cut_position(position, seed:, player:)
    {
      'position' => position,
      'player' => player,
      'policy' => { 'view_decks' => false },
      'seed' => seed
    }
  end

  def player_with_hidden_ids(name_with_pronouns)
    {
      'name_with_pronouns' => name_with_pronouns,
      'corp_id' => { 'faction' => nil, 'name' => nil },
      'runner_id' => { 'faction' => nil, 'name' => nil },
      'active' => true
    }
  end

  def player_with_no_ids(name_with_pronouns)
    {
      'name_with_pronouns' => name_with_pronouns,
      'corp_id' => { 'faction' => nil, 'name' => nil },
      'runner_id' => { 'faction' => nil, 'name' => nil },
      'active' => true
    }
  end
end
