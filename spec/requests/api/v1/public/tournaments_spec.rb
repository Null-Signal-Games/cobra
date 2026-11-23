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
        players: 'players',
        pairings: 'pairings'
      )
    end

    it 'reports no elimination stage for a swiss-only tournament' do
      matches_record("/api/v1/public/tournaments/#{tournament.id}", tournament.id, has_elimination_stage: false)
    end

    it 'reports an elimination stage once one exists' do
      create(:stage, tournament: tournament, format: :single_elim, number: 2)

      matches_record("/api/v1/public/tournaments/#{tournament.id}", tournament.id, has_elimination_stage: true)
    end

    it 'does not match missing record' do
      missing_record('/api/v1/public/tournaments/999999')
    end

    context 'with a private tournament' do
      let(:tournament_organizer) { create(:user) }
      let(:private_tournament) { create(:tournament, name: 'Secret GNK', user: tournament_organizer, private: true) }

      it 'is not found for a signed out user' do
        missing_record("/api/v1/public/tournaments/#{private_tournament.id}")
      end

      it 'is not found for another player' do
        sign_in_api(create(:user))

        missing_record("/api/v1/public/tournaments/#{private_tournament.id}")
      end

      it 'is found for its tournament organizer' do
        sign_in_api(tournament_organizer)

        matches_record("/api/v1/public/tournaments/#{private_tournament.id}", private_tournament.id,
                       name: 'Secret GNK')
      end
    end
  end

  describe 'GET /api/v1/public/tournaments' do
    let(:tournament_organizer) { create(:user) }

    let!(:public_today) { create(:tournament, name: 'Today GNK', date: Date.current) }
    let!(:public_yesterday) { create(:tournament, name: 'Yesterday GNK', date: Date.yesterday) }
    let!(:public_tomorrow) { create(:tournament, name: 'Tomorrow GNK', date: Date.tomorrow) }
    let!(:private_today) do
      create(:tournament, name: 'Private GNK', date: Date.current, user: tournament_organizer, private: true)
    end

    it 'lists public tournaments and leaves out private ones' do
      jsonapi_get '/api/v1/public/tournaments'

      expect(response).to have_http_status(:ok)
      expect(jsonapi_ids).to include(public_today.id.to_s, public_yesterday.id.to_s, public_tomorrow.id.to_s)
      expect(jsonapi_ids).not_to include(private_today.id.to_s)
    end

    it 'includes private tournaments for their tournament organizer' do
      sign_in_api(tournament_organizer)

      jsonapi_get '/api/v1/public/tournaments'

      expect(jsonapi_ids).to include(private_today.id.to_s, public_today.id.to_s)
    end

    it 'does not include private tournaments for another player' do
      sign_in_api(create(:user))

      jsonapi_get '/api/v1/public/tournaments'

      expect(jsonapi_ids).not_to include(private_today.id.to_s)
    end

    # The home page asks for today's tournaments this way.
    it 'filters by date' do
      jsonapi_get '/api/v1/public/tournaments', filter: { date: Date.current.iso8601 }

      expect(response).to have_http_status(:ok)
      # The outer `tournament` also defaults to today's date, so check membership rather than an exact list.
      expect(jsonapi_ids).to include(public_today.id.to_s)
      expect(jsonapi_ids).not_to include(public_yesterday.id.to_s, public_tomorrow.id.to_s, private_today.id.to_s)
    end
  end
end
