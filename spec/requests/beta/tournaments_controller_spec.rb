# frozen_string_literal: true

# Beta::TournamentsController, as called by the SvelteKit frontend (frontend/src/lib/api/beta.ts).
# #destroy is covered separately in tournaments_controller_destroy_spec.rb.
RSpec.describe 'Beta::TournamentsController' do
  include_context 'with beta testing enabled'

  let(:tournament) { create(:tournament, self_registration: true) }

  describe 'POST cut' do
    let(:tournament) { create(:tournament, player_count: 8) }

    before { tournament.current_stage.pair_new_round!.update!(completed: true) }

    def organizer_only_request(number: 4, elimination_type: nil)
      json_post cut_beta_tournament_path(tournament), { number:, elimination_type: }.compact
    end

    it_behaves_like 'a tournament organizer only endpoint'

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'creates a double elimination stage seeded with the top players' do
        expect { organizer_only_request }.to change(Stage, :count).by(1)

        expect(response).to have_http_status(:ok)
        stage = tournament.reload.current_stage
        expect(stage.format).to eq('double_elim')
        expect(stage.registrations.order(:seed).pluck(:seed)).to eq([1, 2, 3, 4])
      end

      it 'creates a single elimination stage' do
        organizer_only_request(elimination_type: 'single')

        expect(tournament.reload.current_stage.format).to eq('single_elim')
      end

      it 'rejects a cut size the bracket does not support' do
        expect { organizer_only_request(number: 5) }.not_to change(Stage, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_body['error']).to eq("A double elim cut can't have 5 players.")
      end
    end

    context 'when signed in as another player' do
      include_context 'when signed in as another player'

      it 'does not create a stage' do
        expect { organizer_only_request }.not_to change(Stage, :count)
      end
    end
  end

  describe 'registration' do
    let!(:player1) { create(:player, tournament:) }
    let!(:player2) { create(:player, tournament:) }

    def locks
      [player1.reload.registration_locked?, player2.reload.registration_locked?]
    end

    def unlocked_flags
      tournament.reload.slice(:all_players_unlocked, :any_player_unlocked).symbolize_keys
    end

    describe 'PATCH close_registration' do
      def organizer_only_request
        json_patch close_registration_beta_tournament_path(tournament)
      end

      it_behaves_like 'a tournament organizer only endpoint'

      it 'closes registration and locks every player' do
        sign_in tournament.user

        organizer_only_request

        expect(response).to have_http_status(:ok)
        expect(tournament.reload.registration_closed?).to be(true)
        expect(locks).to eq([true, true])
        expect(unlocked_flags).to eq(all_players_unlocked: false, any_player_unlocked: false)
      end
    end

    describe 'PATCH open_registration' do
      before { tournament.close_registration! }

      def organizer_only_request
        json_patch open_registration_beta_tournament_path(tournament)
      end

      it_behaves_like 'a tournament organizer only endpoint'

      it 'reopens registration without unlocking players' do
        sign_in tournament.user

        organizer_only_request

        expect(tournament.reload.registration_closed?).to be(false)
        expect(locks).to eq([true, true])
        expect(unlocked_flags).to eq(all_players_unlocked: false, any_player_unlocked: false)
      end
    end

    describe 'PATCH lock_player_registrations' do
      def organizer_only_request
        json_patch lock_player_registrations_beta_tournament_path(tournament)
      end

      it_behaves_like 'a tournament organizer only endpoint'

      it 'locks every player without closing registration' do
        sign_in tournament.user

        organizer_only_request

        expect(tournament.reload).not_to be_registration_closed
        expect(locks).to eq([true, true])
        expect(unlocked_flags).to eq(all_players_unlocked: false, any_player_unlocked: false)
      end
    end

    describe 'PATCH unlock_player_registrations' do
      before { tournament.close_registration! }

      def organizer_only_request
        json_patch unlock_player_registrations_beta_tournament_path(tournament)
      end

      it_behaves_like 'a tournament organizer only endpoint'

      it 'unlocks every player' do
        sign_in tournament.user

        organizer_only_request

        expect(locks).to eq([false, false])
        expect(unlocked_flags).to eq(all_players_unlocked: true, any_player_unlocked: true)
      end
    end
  end

  describe 'GET current_round_timer' do
    let(:tournament) { create(:tournament, player_count: 2) }

    def fetch_timer
      json_get current_round_timer_beta_tournament_path(tournament)
    end

    it 'reports no timer before any round exists' do
      fetch_timer

      expect(response).to have_http_status(:ok)
      expect(json_body).to include('show' => nil, 'running' => nil, 'started' => nil)
    end

    it 'reports a running timer to a signed out user' do
      tournament.current_stage.pair_new_round!.timer.start!

      fetch_timer

      expect(json_body).to include('show' => true, 'running' => true, 'paused' => false, 'started' => true)
    end

    it 'reports a paused timer with its remaining time' do
      travel_to Time.zone.local(2022, 8, 29, 15, 0)
      round = tournament.current_stage.pair_new_round!
      round.timer.start!
      travel_to Time.zone.local(2022, 8, 29, 15, 30)
      round.timer.stop!

      fetch_timer

      expect(json_body).to include('paused' => true, 'running' => false)
      expect(json_body['state']).to include('paused' => true, 'remaining_seconds' => 35 * 60)
    end

    it 'is rejected for a signed out user when the tournament is private' do
      tournament.update!(private: true)

      fetch_timer

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
