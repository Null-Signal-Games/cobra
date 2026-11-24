# frozen_string_literal: true

RSpec.describe 'Beta::PairingsController #create' do
  let(:tournament) { create(:tournament) }
  let(:round) { create(:round, tournament:, stage: tournament.current_stage) }
  let(:alice) { create(:player, tournament:) }
  let(:bob) { create(:player, tournament:) }

  before do
    sign_in tournament.user
  end

  def create_pairing(player1, player2)
    post beta_tournament_round_pairings_path(tournament, round),
         params: { pairing: { table_number: 1, player1_id: player1.id, player2_id: player2.id } },
         as: :json
  end

  it 'creates a pairing' do
    expect { create_pairing(alice, bob) }.to change(round.pairings, :count).by(1)

    expect(response).to have_http_status(:ok)
  end

  it 'rejects pairing a player against themselves' do
    expect { create_pairing(alice, alice) }.not_to change(Pairing, :count)

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body['errors']).to eq(['A player cannot be paired against themselves'])
  end
end
