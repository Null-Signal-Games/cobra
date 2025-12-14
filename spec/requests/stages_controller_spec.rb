# frozen_string_literal: true

RSpec.describe StagesController do
  let(:organiser) { create(:user) }
  let(:tournament) { create(:tournament, name: 'My Tournament', user: organiser) }
  let!(:alice) { create(:player, tournament:, name: 'Alice', pronouns: 'she/her') }
  let!(:bob) { create(:player, tournament:, name: 'Bob', pronouns: 'he/him') }
  let!(:charlie) { create(:player, tournament:, name: 'Charlie', pronouns: 'she/her') }

  describe 'with no stages' do
    before do
      tournament.current_stage.destroy
    end

    it 'allows the organiser to create a stage' do
      sign_in organiser

      expect do
        post tournament_stages_path(tournament)
      end.to change(tournament.stages, :count).by(1)
    end

    it 'does not allow a player to create a stage' do
      sign_in alice

      expect do
        post tournament_stages_path(tournament)
      end.not_to change(tournament.stages, :count)
    end
  end

  describe 'with swiss stage' do
    it 'allows the organiser to delete a stage' do
      sign_in organiser

      expect do
        delete tournament_stage_path(tournament, tournament.current_stage)
      end.to change(tournament.stages, :count).by(-1)
    end

    it 'does not allow a player to delete a stage' do
      sign_in alice

      expect do
        delete tournament_stage_path(tournament, tournament.current_stage)
      end.not_to change(tournament.stages, :count)
    end
  end
end
