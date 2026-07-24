# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Players' do
  let!(:user) { create(:user) }
  let!(:tournament) { create(:tournament, private: false, user: user) }
  let!(:corp_identity) { create(:id_etf) }
  let!(:runner_identity) { create(:id_az) }
  let!(:player) do
    create(
      :player,
      tournament: tournament,
      user: user,
      name: 'Alice',
      corp_identity_ref: corp_identity,
      runner_identity_ref: runner_identity
    )
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/players' do
    it 'succeeds and lists players for the tournament' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/players", 1)
      expect(json['data'].first['id']).to eq(player.id.to_s)
    end

    it 'returns the correct self link containing the actual tournament ID' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/players", 1)
      expect(json['data'].first['links']['self']).to include("/tournaments/#{tournament.id}/players/")
      expect(json['data'].first['links']['self']).not_to include(':tournament_id')
    end
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/players/:id' do
    it 'matches existing record' do
      matches_record(
        "/api/v1/public/tournaments/#{tournament.id}/players/#{player.id}",
        player.id,
        name: 'Alice',
        corp_identity_id: corp_identity.id,
        runner_identity_id: runner_identity.id
      )
    end

    it 'has expected relationships' do
      has_relationships(
        "/api/v1/public/tournaments/#{tournament.id}/players/#{player.id}",
        tournament: '/api/v1/public/tournaments/',
        user: '/api/v1/public/users/',
        corp_identity: "/api/v1/public/identities/#{corp_identity.id}",
        runner_identity: "/api/v1/public/identities/#{runner_identity.id}"
      )
    end

    it 'does not match missing record' do
      missing_record("/api/v1/public/tournaments/#{tournament.id}/players/999999")
    end

    context 'with private tournament' do
      let!(:private_tournament) { create(:tournament, private: true) }
      let!(:private_player) { create(:player, tournament: private_tournament) }

      it 'does not match a player in an unauthorized private tournament' do
        missing_record("/api/v1/public/tournaments/#{private_tournament.id}/players/#{private_player.id}")
      end
    end
  end
end
