# frozen_string_literal: true

# Beta::RoundsController, as called by the SvelteKit frontend (frontend/src/lib/api/beta.ts).
RSpec.describe 'Beta::RoundsController' do
  let(:tournament) { create(:tournament, player_count: 4) }
  let(:round) { tournament.current_stage.pair_new_round! }

  describe 'POST create' do
    def organizer_only_request
      json_post beta_tournament_rounds_path(tournament)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'pairs a new round when signed in as the tournament organizer' do
      sign_in tournament.user

      expect { organizer_only_request }.to change(Round, :count).by(1)
      expect(response).to have_http_status(:ok)
      expect(Round.last.pairings.count).to eq(2)
    end
  end

  describe 'PATCH repair' do
    let(:round) { create(:round, tournament:, stage: tournament.current_stage) }

    def organizer_only_request
      json_patch repair_beta_tournament_round_path(tournament, round)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 're-pairs the round when signed in as the tournament organizer' do
      sign_in tournament.user

      expect { organizer_only_request }.to change(round.pairings, :count).from(0).to(2)
      expect(round.reload.unpaired_players).to be_empty
    end
  end

  describe 'PATCH complete' do
    def organizer_only_request(completed: true)
      json_patch complete_beta_tournament_round_path(tournament, round), completed:
    end

    it_behaves_like 'a tournament organizer only endpoint'

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'completes the round' do
        organizer_only_request

        expect(response).to have_http_status(:ok)
        expect(round.reload.completed?).to be(true)
      end

      it 'reopens a completed round' do
        round.update!(completed: true)

        organizer_only_request(completed: false)

        expect(round.reload.completed?).to be(false)
      end

      it 'pauses a running round timer' do
        travel_to Time.zone.local(2022, 8, 29, 15, 0)
        round.timer.start!
        travel_to Time.zone.local(2022, 8, 29, 15, 30)

        organizer_only_request

        expect(round.reload.timer.state).to have_attributes(paused: true, remaining_seconds: 35 * 60)
      end
    end
  end

  describe 'DELETE destroy' do
    before { round }

    def organizer_only_request
      json_delete beta_tournament_round_path(tournament, round)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'deletes the round when signed in as the tournament organizer' do
      sign_in tournament.user

      expect { organizer_only_request }.to change(Round, :count).by(-1)
    end
  end

  describe 'PATCH update' do
    def organizer_only_request
      json_patch beta_tournament_round_path(tournament, round), round: { weight: 0.8 }
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'updates the SOS weighting when signed in as the tournament organizer' do
      sign_in tournament.user

      organizer_only_request

      expect(round.reload.weight).to eq(0.8)
    end
  end

  describe 'PATCH update_timer' do
    def organizer_only_request(operation: 'start', length_minutes: 40)
      json_patch update_timer_beta_tournament_round_path(tournament, round), operation:, length_minutes:
    end

    it_behaves_like 'a tournament organizer only endpoint'

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'starts the timer with the given round length' do
        organizer_only_request

        round.reload
        expect(round.length_minutes).to eq(40)
        expect(round.timer.running?).to be(true)
      end

      it 'pauses the timer' do
        organizer_only_request
        organizer_only_request(operation: 'stop')

        expect(round.reload.timer.paused?).to be(true)
      end

      it 'resets the timer' do
        organizer_only_request
        organizer_only_request(operation: 'reset')

        expect(round.reload.timer.started?).to be(false)
      end
    end
  end

  describe 'GET round_data' do
    def organizer_only_request
      json_get round_data_beta_tournament_round_path(tournament, round)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'returns the round with its unpaired players' do
      round
      unpaired = create(:player, tournament:, name: 'Late Arrival')
      sign_in tournament.user

      organizer_only_request

      expect(response).to have_http_status(:ok)
      expect(json_body['round']['id']).to eq(round.id)
      expect(json_body['round']['pairings'].size).to eq(2)
      expect(json_body['round']['unpaired_players'].pluck('id')).to eq([unpaired.id])
    end
  end

  describe 'GET pairings_data' do
    def fetch_pairings_data
      json_get pairings_data_beta_tournament_rounds_path(tournament)
    end

    def rounds_in_response
      json_body['stages'].flat_map { |s| s['rounds'] }
    end

    def pairings_by_id
      rounds_in_response.flat_map { |r| r['pairings'] }.index_by { |p| p['id'] }
    end

    it 'can be read by a signed out user' do
      round

      fetch_pairings_data

      expect(response).to have_http_status(:ok)
      expect(rounds_in_response.pluck('id')).to eq([round.id])
    end

    it 'is rejected for a signed out user when the tournament is private' do
      tournament.update!(private: true)

      fetch_pairings_data

      expect(response).to have_http_status(:unauthorized)
    end

    it 'lists every round' do
      round.update!(completed: true)
      second_round = tournament.current_stage.pair_new_round!
      sign_in tournament.user

      fetch_pairings_data

      expect(rounds_in_response.pluck('number', 'id')).to eq([[1, round.id], [2, second_round.id]])
    end

    describe 'table count warning' do
      let(:tournament) { create(:tournament) }
      let(:warning) { 'There are not enough tables to cover all players' }

      before do
        create_list(:player, 17, tournament:)
        tournament.players.first(2).each { |p| p.update!(first_round_bye: true) }
      end

      it 'warns the tournament organizer when custom tables are short' do
        tournament.current_stage.table_ranges.create!(first_table: 101, last_table: 106)
        sign_in tournament.user

        fetch_pairings_data

        expect(json_body['warnings']).to contain_exactly(a_string_starting_with(warning))
      end

      it 'does not count players with first-round byes' do
        # 17 players - 2 byes = 15, so 7 tables are enough.
        tournament.current_stage.table_ranges.create!(first_table: 101, last_table: 107)
        sign_in tournament.user

        fetch_pairings_data

        expect(json_body['warnings']).to eq([])
      end

      it 'sends the tournament organizer an empty list when there is nothing to warn about' do
        sign_in tournament.user

        fetch_pairings_data

        expect(json_body['warnings']).to eq([])
      end

      it 'also warns the tournament organizer in round_data' do
        tournament.current_stage.table_ranges.create!(first_table: 101, last_table: 106)
        round = tournament.current_stage.pair_new_round!
        sign_in tournament.user

        json_get round_data_beta_tournament_round_path(tournament, round)

        expect(json_body['warnings']).to contain_exactly(a_string_starting_with(warning))
      end

      it 'does not warn players' do
        tournament.current_stage.table_ranges.create!(first_table: 101, last_table: 106)
        sign_in create(:user)

        fetch_pairings_data

        expect(json_body['warnings']).to be_nil
      end
    end

    describe 'score labels' do
      # Score labels are "-" only when no score has been entered (nil scores). A real 0-0 score,
      # whether entered by the tournament organizer or self-reported, is shown as "0 - 0".
      let(:tournament) { create(:tournament) }
      let(:round) { tournament.new_round! }
      let(:player1) { create(:player, tournament:) }
      let(:player2) { create(:player, tournament:) }
      let(:player3) { create(:player, tournament:) }
      let(:player4) { create(:player, tournament:) }

      before { sign_in tournament.user }

      it 'labels a 0-0 score as "0 - 0" and an unreported pairing as "-"' do
        scored_zero = create(:pairing, round:, player1:, player2:, table_number: 1,
                                       score1: 0, score1_corp: 0, score1_runner: 0,
                                       score2: 0, score2_corp: 0, score2_runner: 0)
        unreported = create(:pairing, round:, player1: player3, player2: player4, table_number: 2)
        SelfReport.create!(pairing: unreported, report_player_id: tournament.user_id,
                           score1: 0, score1_corp: 0, score1_runner: 0,
                           score2: 0, score2_corp: 0, score2_runner: 0)

        fetch_pairings_data

        expect(pairings_by_id[scored_zero.id]['score_label']).to eq('0 - 0')
        expect(pairings_by_id[unreported.id]['score_label']).to eq('-')
      end

      context 'with single-sided swiss' do
        let(:tournament) { create(:tournament, :single_sided) }

        it 'shows the winning side with player 1 as corp' do
          pairing = create(:pairing, :player1_corp, round:, player1:, player2:, score1_corp: 3)

          fetch_pairings_data

          expect(pairings_by_id[pairing.id]['score_label']).to eq('3 - 0 (C)')
        end

        it "shows player 1's score on the right when player 1 is runner" do
          pairing = create(:pairing, :player1_runner, round:, player1:, player2:, score1_runner: 3)

          fetch_pairings_data

          expect(pairings_by_id[pairing.id]['score_label']).to eq('0 - 3 (R)')
        end
      end
    end
  end
end
