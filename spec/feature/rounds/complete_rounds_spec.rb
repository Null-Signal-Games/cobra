# frozen_string_literal: true

RSpec.describe 'Completing rounds' do
  let(:tournament) { create(:tournament) }
  let(:round) { create(:round, tournament:, stage: tournament.current_stage, completed: false) }

  before do
    sign_in round.tournament.user
    visit tournament_rounds_path(round.tournament)
  end

  it 'completes the round' do
    click_button 'Complete'

    expect(round.reload.completed?).to be(true)
  end
end
