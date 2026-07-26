# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Pairings' do
  let!(:user) { create(:user) }
  let!(:tournament) { create(:tournament, private: false, user: user) }
  let!(:stage) { create(:stage, tournament: tournament) }
  let!(:round) { create(:round, tournament: tournament, stage: stage, number: 1) }
  let!(:player1) { create(:player, tournament: tournament) }
  let!(:player2) { create(:player, tournament: tournament) }
  let!(:pairing) do
    create(
      :pairing,
      round: round,
      player1: player1,
      player2: player2,
      table_number: 1,
      score1: 3,
      score2: 0,
      side: :player1_is_corp
    )
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/pairings' do
    it 'succeeds and lists pairings' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/pairings", 1)
      expect(json['data'].first['id']).to eq(pairing.id.to_s)
    end

    it 'returns the correct self link containing the actual tournament ID' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/pairings", 1)
      expect(json['data'].first['links']['self']).to include("/tournaments/#{tournament.id}/pairings/")
      expect(json['data'].first['links']['self']).not_to include(':tournament_id')
    end
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/pairings/:id' do
    it 'matches existing record' do
      matches_record(
        "/api/v1/public/tournaments/#{tournament.id}/pairings/#{pairing.id}",
        pairing.id,
        table_number: 1,
        score1: 3,
        score2: 0,
        player1_id: player1.id,
        player2_id: player2.id,
        reported: true,
        intentional_draw: false,
        two_for_one: false
      )
    end

    it 'has expected relationships' do
      has_relationships(
        "/api/v1/public/tournaments/#{tournament.id}/pairings/#{pairing.id}",
        round: 'rounds',
        player1: '/api/v1/public/tournaments/',
        player2: '/api/v1/public/tournaments/'
      )
    end

    it 'does not match missing record' do
      missing_record("/api/v1/public/tournaments/#{tournament.id}/pairings/999999")
    end

    context 'with private tournament' do
      let!(:private_tournament) { create(:tournament, private: true) }
      let!(:private_stage) { create(:stage, tournament: private_tournament) }
      let!(:private_round) { create(:round, tournament: private_tournament, stage: private_stage) }
      let!(:private_pairing) { create(:pairing, round: private_round) }

      it 'does not match a pairing in an unauthorized private tournament' do
        missing_record("/api/v1/public/tournaments/#{private_tournament.id}/pairings/#{private_pairing.id}")
      end
    end
  end
end
