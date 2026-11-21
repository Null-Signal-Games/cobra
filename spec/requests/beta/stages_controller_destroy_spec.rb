# frozen_string_literal: true

RSpec.describe 'Beta::StagesController #destroy' do
  include_context 'with beta testing enabled'

  let(:tournament) { create(:tournament) }
  let!(:stage) { create(:stage, tournament:) }

  def organizer_only_request(confirmation_name: tournament.name)
    json_delete beta_tournament_stage_path(tournament, stage), confirmation_name:
  end

  context 'when signed in as the tournament organizer' do
    include_context 'when signed in as the tournament organizer'

    it 'destroys stage when confirmation_name matches' do
      expect { organizer_only_request }.to change(Stage, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end

    it 'returns unprocessable_content when confirmation_name does not match' do
      expect { organizer_only_request(confirmation_name: 'Wrong Name') }.not_to change(Stage, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_body['error']).to eq('Confirmation name does not match the tournament name')
    end

    it 'returns unprocessable_content when confirmation_name is missing' do
      expect { json_delete beta_tournament_stage_path(tournament, stage) }.not_to change(Stage, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_body['error']).to eq('Confirmation name does not match the tournament name')
    end
  end

  it_behaves_like 'a tournament organizer only endpoint'

  context 'when signed in as another player' do
    include_context 'when signed in as another player'

    it 'does not destroy the stage' do
      expect { organizer_only_request }.not_to change(Stage, :count)
    end
  end
end
