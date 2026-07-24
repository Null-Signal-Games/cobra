# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Rounds' do
  let!(:tournament) { create(:tournament, private: false) }
  let!(:stage) { create(:stage, tournament: tournament) }
  let!(:round) { create(:round, tournament: tournament, stage: stage, number: 1, completed: false) }

  describe 'GET /api/v1/public/tournaments/:tournament_id/rounds' do
    it 'succeeds and lists rounds for the tournament' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/rounds", 1)
      expect(json['data'].first['id']).to eq(round.id.to_s)
    end

    it 'returns the correct self link containing the actual tournament ID' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/rounds", 1)
      expect(json['data'].first['links']['self']).to include("/tournaments/#{tournament.id}/rounds/")
      expect(json['data'].first['links']['self']).not_to include(':tournament_id')
    end
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/rounds/:id' do
    it 'matches existing record' do
      matches_record("/api/v1/public/tournaments/#{tournament.id}/rounds/#{round.id}",
                     round.id, number: 1, completed: false)
    end

    it 'has expected relationships' do
      has_relationships(
        "/api/v1/public/tournaments/#{tournament.id}/rounds/#{round.id}",
        stage: 'stages',
        tournament: '/api/v1/public/tournaments/'
      )
    end

    it 'does not match missing record' do
      missing_record("/api/v1/public/tournaments/#{tournament.id}/rounds/999999")
    end
  end
end
