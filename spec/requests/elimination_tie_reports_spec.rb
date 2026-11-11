# frozen_string_literal: true

RSpec.describe 'Reporting tied scores in elimination stages' do
  let(:organiser) { create(:user) }
  let(:alice) { create(:user) }
  let(:bob) { create(:user) }
  let(:tournament) { create(:tournament, user: organiser, allow_self_reporting: true) }
  let(:stage) { create(:stage, tournament:, format: :single_elim) }
  let(:round) { create(:round, stage:, tournament:) }
  let(:pairing) do
    create(:pairing, round:, score1: nil, score2: nil,
                     player1: create(:player, tournament:, user_id: alice.id),
                     player2: create(:player, tournament:, user_id: bob.id))
  end
  let(:tie) { { score1: 3, score2: 3 } }

  describe 'classic organiser report' do
    before { sign_in organiser }

    it 'does not save the tie and shows an alert' do
      post report_tournament_round_pairing_path(tournament, round, pairing), params: { pairing: tie }

      expect(pairing.reload.score1).to be_nil
      expect(flash[:alert]).to eq('Elimination games cannot end in a tie')
    end
  end

  describe 'classic self report' do
    before { sign_in alice }

    it 'rejects the tie' do
      expect do
        post self_report_tournament_round_pairing_path(tournament, round, pairing),
             params: { pairing: tie }, as: :json
      end.not_to change(SelfReport, :count)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe 'beta' do
    before { Flipper.enable(:beta_testing) }

    it 'rejects an organiser tie' do
      sign_in organiser

      post report_beta_tournament_round_pairing_path(tournament, round, pairing),
           params: { pairing: tie }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to eq(['Elimination games cannot end in a tie'])
      expect(pairing.reload.score1).to be_nil
    end

    it 'rejects a self-reported tie' do
      sign_in alice

      expect do
        post report_beta_tournament_round_pairing_path(tournament, round, pairing),
             params: { pairing: tie, self_report: true }, as: :json
      end.not_to change(SelfReport, :count)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'accepts a decisive organiser score' do
      sign_in organiser

      post report_beta_tournament_round_pairing_path(tournament, round, pairing),
           params: { pairing: { score1: 3, score2: 0 } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(pairing.reload.score1).to eq(3)
    end
  end
end
