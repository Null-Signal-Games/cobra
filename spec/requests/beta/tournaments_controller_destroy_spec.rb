# frozen_string_literal: true

RSpec.describe 'Beta::TournamentsController #destroy' do
  let(:tournament) { create(:tournament) }
  let!(:stage) { create(:stage, tournament:) }
  let!(:round) { create(:round, tournament:, stage:) }

  before do
    Flipper.enable(:beta_testing)
    create_list(:player, 2, tournament:)
    round.pair!
  end

  context 'when authenticated as tournament owner' do
    before { sign_in tournament.user }

    it 'destroys tournament and associated records' do
      expect do
        delete beta_tournament_path(tournament), as: :json
      end.to change(Tournament, :count).by(-1)
        .and change(Stage, :count).by(-2) # rubocop:disable Layout/MultilineMethodCallIndentation
        .and change(Round, :count).by(-1)
        .and change(Player, :count).by(-2)
        .and change(Pairing, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  context 'when authenticated as a different user' do
    let(:other_user) { create(:user) }

    before { sign_in other_user }

    it 'returns unauthorized' do
      expect do
        delete beta_tournament_path(tournament), as: :json
      end.not_to change(Tournament, :count)

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
