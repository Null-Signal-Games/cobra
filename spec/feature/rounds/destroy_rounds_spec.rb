# frozen_string_literal: true

RSpec.describe 'Destroying rounds' do
  let(:round) { create(:round) }

  before do
    round.pairings << create(:pairing)
    sign_in round.tournament.user
    visit tournament_round_path(round.tournament, round)
  end

  it 'deletes the round' do
    expect do
      click_link 'Delete round'
    end.to change(Round, :count).by(-1)
  end
end
