# frozen_string_literal: true

# Shared setup for request specs against the Beta::* (and other JSON) endpoints.
# The contexts below expect the including spec to define `let(:tournament)`.
#
# User types: "tournament organizer" (the TO), "player" (registered in the tournament),
# "other player" (signed in, but neither the TO nor a player in it) and "signed out user".

RSpec.shared_context 'when signed in as the tournament organizer' do
  before { sign_in tournament.user }
end

# Signs in a user who is registered as a player in `tournament`. Exposes `player_user` and `player`.
RSpec.shared_context 'when signed in as a player' do
  let(:player_user) { create(:user) }
  let(:player) { create(:player, tournament:, user_id: player_user.id) }

  before do
    player
    sign_in player_user
  end
end

# Signs in a user who is neither the tournament organizer nor a player in `tournament`.
RSpec.shared_context 'when signed in as another player' do
  let(:other_player_user) { create(:user) }

  before { sign_in other_player_user }
end

RSpec.shared_context 'when signed out' do
  before { sign_out }
end

# Asserts that only the tournament organizer can call a particular endpoint.
# The including spec must define `organizer_only_request`, which will make the request:
#
#   def organizer_only_request
#     json_delete beta_tournament_stage_path(tournament, stage), confirmation_name: tournament.name
#   end
#
#   it_behaves_like 'a tournament organizer only endpoint'
RSpec.shared_examples 'a tournament organizer only endpoint' do
  context 'when signed in as another player' do
    include_context 'when signed in as another player'

    it 'returns unauthorized' do
      organizer_only_request

      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'when signed out' do
    include_context 'when signed out'

    it 'returns unauthorized' do
      organizer_only_request

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
