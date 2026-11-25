# frozen_string_literal: true

RSpec.describe 'Beta::StagesController #create' do
  let(:tournament) { create(:tournament, player_count: 4) }

  before { tournament.current_stage.destroy }

  def organizer_only_request
    json_post beta_tournament_stages_path(tournament)
  end

  it_behaves_like 'a tournament organizer only endpoint'

  context 'when signed in as the tournament organizer' do
    include_context 'when signed in as the tournament organizer'

    it 'creates a swiss stage with every player' do
      expect { organizer_only_request }.to change(Stage, :count).by(1)

      expect(response).to have_http_status(:ok)
      stage = tournament.reload.current_stage
      expect(stage.format).to eq('swiss')
      expect(stage.players.count).to eq(4)
    end

    context 'with a single-sided tournament' do
      let(:tournament) { create(:tournament, :single_sided, player_count: 4) }

      it 'creates a single-sided swiss stage' do
        organizer_only_request

        expect(tournament.reload.current_stage.format).to eq('single_sided_swiss')
      end
    end
  end

  context 'when signed in as another player' do
    include_context 'when signed in as another player'

    it 'does not create a stage' do
      expect { organizer_only_request }.not_to change(Stage, :count)
    end
  end
end
