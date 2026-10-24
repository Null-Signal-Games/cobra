# frozen_string_literal: true

RSpec.describe 'Beta::PlayersController #decks' do
  let(:tournament) { create(:tournament, swiss_deck_visibility: :swiss_decks_private) }
  let(:player_user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:player) { create(:player, tournament:, user: player_user) }
  let(:other_player) { create(:player, tournament:, user: other_user) }

  before do
    Flipper.enable(:beta_testing)
    Deck.create!(player:, user: player_user, side_id: 'corp', name: 'Player Corp')
    Deck.create!(player: other_player, user: other_user, side_id: 'corp', name: 'Other Corp')
  end

  def deck_names
    response.parsed_body.map { |d| d['details']['name'] }
  end

  describe 'a single player\'s decks' do
    it 'returns them to the player while decks are private' do
      sign_in player_user
      get decks_beta_tournament_player_path(tournament, player), as: :json

      expect(response).to have_http_status(:ok)
      expect(deck_names).to eq(['Player Corp'])
    end

    it 'returns them to the TO while decks are private' do
      sign_in tournament.user
      get decks_beta_tournament_player_path(tournament, player), as: :json

      expect(response).to have_http_status(:ok)
      expect(deck_names).to eq(['Player Corp'])
    end

    it 'rejects another player while decks are private' do
      sign_in other_user
      get decks_beta_tournament_player_path(tournament, player), as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns them to anyone once decks are public' do
      tournament.update!(swiss_deck_visibility: :swiss_decks_public)
      sign_in other_user
      get decks_beta_tournament_player_path(tournament, player), as: :json

      expect(response).to have_http_status(:ok)
      expect(deck_names).to eq(['Player Corp'])
    end
  end

  describe 'all decks' do
    it 'returns every deck to the TO' do
      sign_in tournament.user
      get decks_beta_tournament_players_path(tournament), as: :json

      expect(response).to have_http_status(:ok)
      expect(deck_names).to contain_exactly('Player Corp', 'Other Corp')
    end

    it 'returns only their own decks to a player' do
      sign_in player_user
      get decks_beta_tournament_players_path(tournament), as: :json

      expect(response).to have_http_status(:ok)
      expect(deck_names).to eq(['Player Corp'])
    end
  end
end
