# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Standings' do
  let!(:user) { create(:user) }
  let!(:tournament) { create(:tournament, private: false, user: user) }
  let!(:stage) { create(:stage, tournament: tournament) }
  let!(:player) { create(:player, tournament: tournament, skip_registration: true) }
  let!(:standing_row) do
    create(
      :standing_row,
      stage: stage,
      player: player,
      position: 1,
      points: 6,
      corp_points: 3,
      runner_points: 3,
      bye_points: 0,
      sos: BigDecimal('0.5'),
      extended_sos: BigDecimal('0.25')
    )
  end

  before do
    create(:registration, player: player, stage: stage)
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/standings' do
    it 'succeeds and lists standings for the tournament' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/standings", 1)
      expect(json['data'].first['id']).to eq("#{stage.id}:#{standing_row.position}")
    end

    it 'returns the correct self link containing the actual tournament ID' do
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/standings", 1)
      expect(json['data'].first['links']['self']).to include("/tournaments/#{tournament.id}/standings/")
      expect(json['data'].first['links']['self']).not_to include(':tournament_id')
    end

    it 'returns standings as player roster before any rounds are paired (empty standing rows)' do
      # Create another player registered to the stage, but with NO standing row
      roster_player = create(:player, tournament: tournament, skip_registration: true)
      create(:registration, player: roster_player, stage: stage)

      # Query the standings for the tournament (expecting 2 results now: one with standing_row, one without)
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/standings", 2)

      # The roster player should be returned with a fallback position assigned by the view and nil points
      roster_standing = json['data'].find { |d| d['attributes']['player_id'] == roster_player.id }
      expect(roster_standing).to be_present
      expect(roster_standing['attributes']['position']).to be_present
      expect(roster_standing['attributes']['points']).to be_nil
    end

    it 'returns all cut standings positions even when unfilled (player_id is nil)' do
      # Create a cut stage (format: single_elim) for the tournament
      cut_stage = create(:stage, tournament: tournament, format: :single_elim, number: 2)

      # Create 8 unfilled registrations for this cut stage (seeds 1 to 8)
      (1..8).each do |seed|
        p = create(:player, tournament: tournament, skip_registration: true)
        Registration.create!(stage: cut_stage, seed: seed, player: p)
      end

      # Query the standings for the tournament
      # (expecting 1 swiss standing row + 8 cut positions = 9 total results)
      json = api_num_results("/api/v1/public/tournaments/#{tournament.id}/standings", 9)

      # Verify the cut positions are all returned with player_id nil, and have unique IDs
      cut_standings = json['data'].select { |d| d['attributes']['stage_id'] == cut_stage.id }
      expect(cut_standings.size).to eq(8)

      expect(cut_standings.pluck('id')).to match_array(
        (1..8).map { |pos| "#{cut_stage.id}:#{pos}" }
      )
      expect(cut_standings.map { |d| d['attributes']['player_id'] }).to all(be_nil)
    end
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/standings/:id' do
    it 'matches existing record' do
      matches_record(
        "/api/v1/public/tournaments/#{tournament.id}/standings/#{stage.id}:#{standing_row.position}",
        "#{stage.id}:#{standing_row.position}",
        position: 1,
        points: 6,
        corp_points: 3,
        runner_points: 3,
        bye_points: 0,
        sos: 0.5,
        extended_sos: 0.25,
        side_bias: 0
      )
    end

    it 'has expected relationships' do
      has_relationships(
        "/api/v1/public/tournaments/#{tournament.id}/standings/#{stage.id}:#{standing_row.position}",
        stage: 'stages',
        player: 'players'
      )
    end

    it 'does not match missing record' do
      missing_record("/api/v1/public/tournaments/#{tournament.id}/standings/999999")
    end

    context 'with private tournament' do
      let!(:private_tournament) { create(:tournament, private: true) }
      let!(:private_stage) { create(:stage, tournament: private_tournament) }
      let!(:private_player) { create(:player, tournament: private_tournament, skip_registration: true) }
      let!(:private_standing_row) { create(:standing_row, stage: private_stage, player: private_player, position: 1) }

      it 'does not match a standing in an unauthorized private tournament' do
        create(:registration, player: private_player, stage: private_stage)
        missing_record("/api/v1/public/tournaments/#{private_tournament.id}/standings/#{private_stage.id}:#{private_standing_row.position}") # rubocop:disable Layout/LineLength
      end
    end
  end
end
