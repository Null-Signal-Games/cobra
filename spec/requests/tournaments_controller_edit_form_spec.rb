# frozen_string_literal: true

RSpec.describe TournamentsController do
  describe '#edit' do
    let(:user) { create(:user) }
    let(:other_user) { create(:user) }
    let(:tournament_params) do
      {
        tournament: {
          name: 'Test Tournament',
          stream_url: 'https://twitch.tv/test',
          manual_seed: true,
          self_registration: true,
          date: '2023-05-15'
        }
      }
    end
    let(:tournament) do
      sign_in user
      post tournaments_path, params: tournament_params, as: :json
      post logout_path
      Tournament.last
    end

    before do
      tournament
    end

    context 'when user is signed in as tournament owner' do
      before do
        sign_in user
      end

      it 'returns tournament data' do
        get edit_form_tournament_path(tournament), as: :json

        expect(response).to be_successful
        expect(response.content_type).to include('application/json')

        data = response.parsed_body
        data['tournament']&.delete 'created_at'
        data['tournament']&.delete 'updated_at'
        expect(data['tournament']).to eq(
          {
            'all_players_unlocked' => true,
            'allow_self_reporting' => false,
            'any_player_unlocked' => true,
            'cut_deck_visibility' => 'cut_decks_private',
            'date' => '2023-05-15',
            'decklist_required' => false,
            'id' => tournament.id,
            'manual_seed' => true,
            'name' => 'Test Tournament',
            'nrdb_deck_registration' => false,
            'private' => false,
            'self_registration' => true,
            'slug' => tournament.slug,
            'stage' => 'swiss',
            'stream_url' => 'https://twitch.tv/test',
            'swiss_deck_visibility' => 'swiss_decks_private',
            'swiss_format' => 'double_sided',
            'tournament_organizer' => 'test_user',
            'user_id' => tournament.user_id
          }
        )
        expect(data['csrf_token']).not_to be_empty
      end

      it 'includes form options data' do
        # Create some reference data
        tournament_type = create(:tournament_type, name: 'Store Championship')
        format = create(:format, name: 'Standard')
        card_set = create(:card_set, name: 'System Gateway')
        restriction = create(:deckbuilding_restriction, name: 'Standard Ban List')
        prize_kit = create(:official_prize_kit, name: '2025 Q1 Game Night Kit', position: 1)

        get edit_form_tournament_path(tournament), as: :json

        data = response.parsed_body
        expect(data['options'].except('time_zones')).to eq(
          {
            'tournament_types' => [
              { 'id' => tournament_type.id, 'name' => 'Store Championship' }
            ],
            'formats' => [
              { 'id' => format.id, 'name' => 'Standard' }
            ],
            'card_sets' => [
              { 'id' => card_set.id, 'name' => 'System Gateway' }
            ],
            'deckbuilding_restrictions' => [
              { 'id' => restriction.id, 'name' => 'Standard Ban List' }
            ],
            'official_prize_kits' => [
              { 'id' => prize_kit.id, 'name' => '2025 Q1 Game Night Kit' }
            ]
          }
        )
        expect(data['options']['time_zones']).to include(
          { 'id' => 'UTC', 'name' => '(GMT+00:00) UTC' }
        )
        expect(data['feature_flags']).to eq(
          {
            'allow_self_reporting' => false
          }
        )
      end
    end

    context 'when user is signed in but not the tournament owner' do
      before do
        sign_in other_user
      end

      it 'returns unauthorized status' do
        get edit_form_tournament_path(tournament), as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when user is not signed in' do
      before do
        sign_out
      end

      it 'returns unauthorized status' do
        get edit_form_tournament_path(tournament), as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
