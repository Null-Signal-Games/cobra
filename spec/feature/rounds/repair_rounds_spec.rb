# frozen_string_literal: true

RSpec.describe 'Re-pairing rounds', type: :feature do
  let(:tournament) { create(:tournament) }
  let(:round) { create(:round, tournament:, stage: tournament.current_stage) }

  before do
    create(:player, tournament:)
    create(:player, tournament:)
    sign_in round.tournament.user
    visit tournament_round_path(round.tournament, round)
  end

  it 're-pairs the round' do
    expect do
      click_link 'Re-pair'
    end.to change(Pairing, :count).by(1)

    expect(round.reload.unpaired_players).to eq([])
  end
end
