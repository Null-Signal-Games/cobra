# frozen_string_literal: true

# NOTE: This test is a little funny because it does NOT verify the javascript protection.
# We are using capybara but no javascript driver at the moment.
# Since we are moving to Svelte, we will handle the full range of testing the real user experience there.
RSpec.describe 'destroying tournaments and stages', type: :feature do
  let(:tournament) { create(:tournament) }
  let!(:swiss_stage) { create(:stage, tournament:, format: :single_sided_swiss, number: 1) }
  let!(:elim_stage) { create(:stage, tournament:, format: :single_elim, number: 2) }

  before do
    # Remove initial stage auto-created by tournament after_create callback if present
    tournament.stages.where.not(id: [swiss_stage.id, elim_stage.id]).destroy_all

    sign_in tournament.user
    visit danger_zone_tournament_path(tournament)
  end

  describe 'destroying tournaments' do
    let(:round) { create(:round, tournament:, stage: swiss_stage) }

    before do
      create(:player, tournament:)
      create(:player, tournament:)
      round.pair!
    end

    it 'does not destroy tournament when tournament name is not filled in' do
      expect do
        click_button 'Delete Tournament', disabled: true
      end.not_to change(Tournament, :count)

      expect(page).to have_text('Confirmation name does not match the tournament name')
    end

    it 'destroys tournament and associated records when tournament name is confirmed' do
      expect(page).to have_button('Delete Tournament', disabled: true)
      expect(find_by_id('tournament_name').value).to be_empty
      expect(find_by_id('name_for_confirmation', visible: :all).value).to eq(tournament.name)

      fill_in 'tournament_name', with: tournament.name

      expect do
        click_button 'Delete Tournament', disabled: true
      end.to change(Tournament, :count).by(-1)
        .and change(Player, :count).by(-2) # rubocop:disable Layout/MultilineMethodCallIndentation
        .and change(Round, :count).by(-1)
        .and change(Pairing, :count).by(-1)
    end
  end

  describe 'destroying stages' do
    it 'displays delete sections for both stages' do
      expect(page).to have_text('Delete Single Sided Swiss Stage')
      expect(page).to have_text('Delete Single Elim Stage')

      expect(page).to have_button('Delete Single Sided Swiss Stage', disabled: true)
      expect(page).to have_button('Delete Single Elim Stage', disabled: true)

      expect(find_by_id("tournament_stage_name_#{swiss_stage.id}").value).to be_empty
      expect(find_by_id("name_for_confirmation_#{tournament.id}_#{swiss_stage.id}",
                        visible: :all).value).to eq(tournament.name)

      expect(find_by_id("tournament_stage_name_#{elim_stage.id}").value).to be_empty
      expect(find_by_id("name_for_confirmation_#{tournament.id}_#{elim_stage.id}",
                        visible: :all).value).to eq(tournament.name)
    end

    it 'does not destroy stage when tournament name is not filled in' do
      expect do
        click_button 'Delete Single Sided Swiss Stage', disabled: true
      end.not_to change(Stage, :count)

      expect(page).to have_text('Confirmation name does not match the tournament name')
    end

    it 'destroys a stage and leaves only the remaining stage section on the danger zone page' do
      fill_in "tournament_stage_name_#{swiss_stage.id}", with: tournament.name

      expect do
        click_button 'Delete Single Sided Swiss Stage', disabled: true
      end.to change(Stage, :count).by(-1)

      visit danger_zone_tournament_path(tournament)

      expect(page).to have_text('Delete Single Elim Stage')
      expect(page).to have_button('Delete Single Elim Stage', disabled: true)
      # It is important to have this after a positive match since capybara
      # does NOT wait for a negative match after visiting a page.
      expect(page).to have_no_text('Delete Single Sided Swiss Stage')
    end
  end
end
