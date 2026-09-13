# frozen_string_literal: true

RSpec.describe 'Beta::StagesController #destroy' do
  let(:tournament) { create(:tournament) }
  let!(:stage) { create(:stage, tournament:) }

  before do
    Flipper.enable(:beta_testing)
  end

  context 'when authenticated as tournament owner' do
    before { sign_in tournament.user }

    it 'destroys stage when confirmation_name matches' do
      expect do
        delete beta_tournament_stage_path(tournament, stage),
               params: { confirmation_name: tournament.name },
               as: :json
      end.to change(Stage, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end

    it 'returns unprocessable_content when confirmation_name does not match' do
      expect do
        delete beta_tournament_stage_path(tournament, stage),
               params: { confirmation_name: 'Wrong Name' },
               as: :json
      end.not_to change(Stage, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Confirmation name does not match the tournament name')
    end

    it 'returns unprocessable_content when confirmation_name is missing' do
      expect do
        delete beta_tournament_stage_path(tournament, stage), as: :json
      end.not_to change(Stage, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Confirmation name does not match the tournament name')
    end
  end

  context 'when authenticated as a different user' do
    let(:other_user) { create(:user) }

    before { sign_in other_user }

    it 'returns unauthorized' do
      expect do
        delete beta_tournament_stage_path(tournament, stage),
               params: { confirmation_name: tournament.name },
               as: :json
      end.not_to change(Stage, :count)

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
