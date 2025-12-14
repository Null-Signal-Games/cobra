# frozen_string_literal: true

RSpec.describe PairingsController do
  let(:organiser) { create(:user) }
  let!(:alice_nrdb) { create(:user) }
  let!(:bob_nrdb) { create(:user) }
  let!(:charlie_nrdb) { create(:user) }

  describe 'pairings data' do
    describe 'reporting' do
      let(:tournament) { create(:tournament, user: organiser) }
      let(:stage) { tournament.current_stage }
      let(:round) { create(:round, tournament:, stage:) }
      let(:pairing) { round.pairings.last }

      before do
        sign_in organiser
        tournament.players << create(:player)
        tournament.players << create(:player)
        round.pair!
      end

      describe 'when player 1 is corp' do
        it 'stores score when player 1 wins' do
          post report_tournament_round_pairing_path(tournament, round, pairing), params: create_pairing_params(side: :player1_is_corp)

          pairing.reload

          aggregate_failures do
            expect(pairing.score1).to eq(3)
            expect(pairing.score1_corp).to eq(3)
            expect(pairing.score1_runner).to eq(0)
            expect(pairing.score2).to eq(0)
            expect(pairing.score2_corp).to eq(0)
            expect(pairing.score2_runner).to eq(0)
          end
        end

        it 'stores score when player 2 wins' do
          post report_tournament_round_pairing_path(tournament, round, pairing), params: create_pairing_params({ side: :player1_is_corp, score1: 0, score1_corp: 0, score2: 3, score2_runner: 3 })
          
          pairing.reload
          
          aggregate_failures do
            expect(pairing.score1).to eq(0)
            expect(pairing.score1_corp).to eq(0)
            expect(pairing.score1_runner).to eq(0)
            expect(pairing.score2).to eq(3)
            expect(pairing.score2_corp).to eq(0)
            expect(pairing.score2_runner).to eq(3)
          end
        end
      end

      describe 'when player 1 is runner' do
        it 'stores score when player 1 player wins' do
          post report_tournament_round_pairing_path(tournament, round, pairing), params: create_pairing_params({ side: :player1_is_runner, score1: 3, score1_runner: 3, score1_corp: 0 })
          
          pairing.reload
          
          aggregate_failures do
            expect(pairing.score1).to eq(3)
            expect(pairing.score1_corp).to eq(0)
            expect(pairing.score1_runner).to eq(3)
            expect(pairing.score2).to eq(0)
            expect(pairing.score2_corp).to eq(0)
            expect(pairing.score2_runner).to eq(0)
          end
        end

        it 'stores score when player 2 wins' do
          post report_tournament_round_pairing_path(tournament, round, pairing), params: create_pairing_params({ side: :player1_is_runner, score1: 0, score1_corp: 0, score2: 3, score2_corp: 3 })
          
          pairing.reload
          
          aggregate_failures do
            expect(pairing.score1).to eq(0)
            expect(pairing.score1_corp).to eq(0)
            expect(pairing.score1_runner).to eq(0)
            expect(pairing.score2).to eq(3)
            expect(pairing.score2_corp).to eq(3)
            expect(pairing.score2_runner).to eq(0)
          end
        end
      end
    end

    describe 'when self reporting is disabled' do
      let(:tournament) { create(:tournament, name: 'SR Disabled', user: organiser, allow_self_reporting: false) }

      let!(:bob) do
        create(:player, tournament:, name: 'Bob', pronouns: 'he/him',
                        user_id: bob_nrdb.id)
      end

      before do
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
      end

      it 'return unauthorized when not logged in' do
        sign_in nil

        post self_report_tournament_round_pairing_path(tournament,
                                                       tournament.rounds[0],
                                                       tournament.rounds[0].pairings[0]),
             params: {}, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it 'return unauthorized when logged in' do
        sign_in bob_nrdb

        post self_report_tournament_round_pairing_path(tournament,
                                                       tournament.rounds[0],
                                                       tournament.rounds[0].pairings[0]),
             params: {}, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end

    describe 'when self reporting is enabled' do
      let!(:alice) { create(:player, tournament:, name: 'Alice', pronouns: 'she/her', user_id: alice_nrdb.id) }
      let!(:bob) { create(:player, tournament:, name: 'Bob', pronouns: 'he/him', user_id: bob_nrdb.id) }
      let!(:charlie) { create(:player, tournament:, name: 'Charlie', pronouns: 'she/her', user_id: charlie_nrdb.id) }

      let(:tournament) { create(:tournament, name: 'SR Enabled', user: organiser, allow_self_reporting: true) }

      before do
        Round.delete_all
        Pairer.new(tournament.new_round!, Random.new(0)).pair!
      end

      it 'return unauthorized when not logged in' do
        sign_in nil

        post self_report_tournament_round_pairing_path(tournament,
                                                       tournament.rounds[0],
                                                       tournament.rounds[0].pairings[0]),
             params: {}, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it 'return unauthorized when logged in user is not part of pairing' do
        sign_in alice_nrdb

        post self_report_tournament_round_pairing_path(tournament,
                                                       tournament.rounds[0],
                                                       tournament.rounds[0].pairings[0]),
             params: {}, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it 'create self report and returns status ok' do
        sign_in bob_nrdb

        expect do
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params, as: :json
        end.to change(SelfReport, :count).by(1)

        expect(response).to have_http_status(:ok)

        expect(Pairing.find(tournament.rounds[0].pairings[0].id)).to have_attributes(
          score1: nil,
          score2: nil
        )
      end

      it 'self report matches and pairing scores are set' do
        expect do
          sign_in bob_nrdb
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params, as: :json

          sign_in charlie_nrdb
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params, as: :json
        end.to change(SelfReport, :count).by(2)

        expect(Pairing.find(tournament.rounds[0].pairings[0].id)).to have_attributes(
          score1: 3,
          score2: 0
        )
      end

      it 'self report differ and pairing scores are not set' do
        expect do
          sign_in bob_nrdb
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params, as: :json

          sign_in charlie_nrdb
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params({ score2_runner: 3, score2: 3 }), as: :json
        end.to change(SelfReport, :count).by(2)

        expect(Pairing.find(tournament.rounds[0].pairings[0].id)).to have_attributes(
          score1: nil,
          score2: nil
        )
      end

      it 'returns forbidden when user already reported' do
        sign_in bob_nrdb
        expect do
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params, as: :json
          post self_report_tournament_round_pairing_path(tournament,
                                                         tournament.rounds[0],
                                                         tournament.rounds[0].pairings[0]),
               params: create_pairing_params, as: :json
        end.to change(SelfReport, :count).by(1)

        expect(response).to have_http_status(:unauthorized)
      end
    end

    def create_pairing_params(overrides = {})
      {
        pairing: {
          score1_runner: 0,
          score1_corp: 3,
          score2_runner: 0,
          score2_corp: 0,
          score1: 3,
          score2: 0,
          intentional_draw: false
        }.merge(overrides)
      }
    end
  end

  describe 'tournament actions' do
    let(:tournament) { create(:tournament, user: organiser) }
    let(:round) { create(:round, tournament:, stage: tournament.current_stage) }
    let!(:alice) { create(:player, tournament:, name: 'Alice', pronouns: 'she/her', user_id: alice_nrdb.id) }
    let!(:bob) { create(:player, tournament:, name: 'Bob', pronouns: 'he/him', user_id: bob_nrdb.id) }

    before do
      sign_in organiser
    end

    describe 'create pairings' do
      it 'allows you to create a new pairing' do
        expect do
          post tournament_round_pairings_path(tournament, round), params: create_pairing_params, as: :json
        end.to change(round.pairings, :count).by(1)
  
        expect(round.pairings.last.table_number).to eq(23)
        expect(round.unpaired_players).to eq([])
      end
  
      it 'handles byes' do
        expect do
          post tournament_round_pairings_path(tournament, round), params: create_pairing_params({ player2_id: nil }), as: :json
        end.to change(round.pairings, :count).by(1)
  
        expect(round.unpaired_players).to eq([bob])
      end

      def create_pairing_params(overrides = {})
        {
          pairing: {
            table_number: 23,
            player1_id: alice.id,
            player2_id: bob.id,
          }.merge(overrides)
        }
      end
    end
  
    describe 'delete pairings' do
      before do
        Pairer.new(round, Random.new(0)).pair!
      end
      
      it 'deletes pairing' do
        pairing = round.pairings.first
  
        expect do
          delete tournament_round_pairing_path(tournament, round, pairing)
        end.to change(round.pairings, :count).by(-1)
      end
  
      it 'unpairs players' do
        pairing = round.pairings.first
  
        delete tournament_round_pairing_path(tournament, round, pairing)
  
        expect(round.unpaired_players).to eq([alice, bob])
      end
    end
  end
end
