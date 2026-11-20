# frozen_string_literal: true

# Shared setup for request specs against the Beta::* (and other JSON) endpoints.
# The contexts below expect the including spec to define `let(:tournament)`.

# Beta::Tournaments/Rounds/Pairings/StagesController reject requests unless this flag is on.
RSpec.shared_context 'with beta testing enabled' do
  before { Flipper.enable(:beta_testing) }
end

RSpec.shared_context 'when signed in as the organizer' do
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

RSpec.shared_context 'when signed in as another user' do
  let(:other_user) { create(:user) }

  before { sign_in other_user }
end

RSpec.shared_context 'when not signed in' do
  before { sign_out }
end

# Asserts that only the tournament organizer can call a particular endpoint.
# The including spec must define `organizer_only_request`, which will make the request:
#
#   def organizer_only_request
#     json_delete beta_tournament_stage_path(tournament, stage), confirmation_name: tournament.name
#   end
#
#   it_behaves_like 'an organizer-only endpoint'
RSpec.shared_examples 'an organizer-only endpoint' do
  context 'when signed in as another user' do
    include_context 'when signed in as another user'

    it 'returns unauthorized' do
      organizer_only_request

      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'when not signed in' do
    include_context 'when not signed in'

    it 'returns unauthorized' do
      organizer_only_request

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
