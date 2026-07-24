# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Stages' do
  let!(:tournament) { create(:tournament, private: false) }
  let!(:stage) { create(:stage, tournament: tournament, number: 1, format: :swiss) }

  describe 'GET /api/v1/public/tournaments/:tournament_id/stages' do
    it 'succeeds and lists stages for the tournament' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/stages", 2)
      expect(json['data'].pluck('id')).to include(stage.id.to_s)
    end

    it 'returns the correct self link containing the actual tournament ID' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/stages", 2)
      expect(json['data'].first['links']['self']).to include("/tournaments/#{tournament.id}/stages/")
      expect(json['data'].first['links']['self']).not_to include(':tournament_id')
    end
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/stages/:id' do
    it 'matches existing record' do
      matches_record("/api/v1/public/tournaments/#{tournament.id}/stages/#{stage.id}",
                     stage.id, number: 1, format: 'swiss')
    end

    it 'has expected relationships' do
      has_relationships(
        "/api/v1/public/tournaments/#{tournament.id}/stages/#{stage.id}",
        tournament: '/api/v1/public/tournaments/',
        rounds: 'rounds'
      )
    end

    it 'does not match missing record' do
      missing_record("/api/v1/public/tournaments/#{tournament.id}/stages/999999")
    end
  end
end
