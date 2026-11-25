# frozen_string_literal: true

RSpec.describe StagesController do
  let(:tournament) { create(:tournament) }
  let(:stage) { create(:stage, tournament:) }
  let(:path) { api_classic_tournament_stage_path(tournament, stage) }

  describe '#update' do
    it 'replaces the table ranges for the tournament organizer' do
      stage.table_ranges.create!(first_table: 1, last_table: 5)
      sign_in tournament.user

      json_patch path, stage: { table_ranges: [{ first_table: 10, last_table: 20 }] }

      expect(response).to have_http_status(:ok)
      expect(response.body).to be_empty
      expect(stage.table_ranges.reload.map { |r| [r.first_table, r.last_table] }).to eq([[10, 20]])
    end

    it 'rejects overlapping ranges' do
      sign_in tournament.user

      json_patch path, stage: { table_ranges: [{ first_table: 1, last_table: 10 }, { first_table: 5, last_table: 15 }] }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_body).to eq('error' => 'Table ranges cannot overlap.')
    end

    it 'rejects other players' do
      sign_in create(:user)

      json_patch path, stage: { table_ranges: [{ first_table: 1, last_table: 10 }] }

      expect(response).to have_http_status(:unauthorized)
      expect(stage.table_ranges.reload).to be_empty
    end
  end
end
