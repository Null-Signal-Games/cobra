# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Tournaments' do
  let!(:user) { create(:user) }
  let!(:tournament_type) { create(:tournament_type, name: 'Megacity Championship') }
  let!(:card_set) { create(:card_set) }
  let!(:restriction) { create(:deckbuilding_restriction) }
  let!(:format) { create(:format) }
  let!(:kit) { create(:official_prize_kit) }

  let!(:tournament) do
    create(
      :tournament,
      name: 'Summer Open',
      user: user,
      tournament_type: tournament_type,
      card_set: card_set,
      deckbuilding_restriction: restriction,
      format: format,
      official_prize_kit: kit,
      private: false
    )
  end

  describe 'GET /api/v1/public/tournaments/:id' do
    it 'matches existing record' do
      matches_record("/api/v1/public/tournaments/#{tournament.id}", tournament.id, name: 'Summer Open')
    end

    it 'has expected relationships' do
      has_relationships(
        "/api/v1/public/tournaments/#{tournament.id}",
        tournament_type: '/api/v1/public/tournament_types/',
        user: '/api/v1/public/users/',
        card_set: '/api/v1/public/card_sets/',
        deckbuilding_restriction: '/api/v1/public/deckbuilding_restrictions/',
        format: '/api/v1/public/formats/',
        official_prize_kit: '/api/v1/public/official_prize_kits/',
        stages: 'stages',
        rounds: 'rounds',
        players: 'players'
      )
    end

    it 'does not match missing record' do
      missing_record('/api/v1/public/tournaments/999999')
    end
  end
end
