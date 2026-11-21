# frozen_string_literal: true

# Beta::PlayersController, as called by the SvelteKit frontend (frontend/src/lib/api/beta.ts).
# Decks (#decks) are covered separately in players_controller_decks_spec.rb.
RSpec.describe 'Beta::PlayersController' do
  let(:tournament) { create(:tournament, self_registration: true) }

  def deck_payload(name, cards = [])
    { details: { name: }, cards: }
  end

  describe 'POST create' do
    def create_player(player, organiser_view: false)
      json_post beta_tournament_players_path(tournament), player:, organiser_view:
    end

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      let(:new_player) { tournament.players.find_by!(name: 'spiderbro') }

      it 'creates a player with the submitted details' do
        expect do
          create_player({ name: 'spiderbro', corp_identity: 'Haas-Bioroid: Engineering the Future',
                          runner_identity: 'Noise', first_round_bye: true, manual_seed: 3,
                          fixed_table_number: 7 }, organiser_view: true)
        end.to change(Player, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_body['player']['name']).to eq('spiderbro')
        expect(new_player).to have_attributes(
          corp_identity: 'Haas-Bioroid: Engineering the Future', runner_identity: 'Noise',
          first_round_bye: true, manual_seed: 3, fixed_table_number: 7, user_id: nil
        )
      end

      it 'registers the new player in the current stage' do
        create_player({ name: 'spiderbro' }, organiser_view: true)

        expect(tournament.current_stage.players).to include(new_player)
      end

      it 'sets their own user ID when registering themselves' do
        create_player({ name: 'spiderbro' })

        expect(new_player.user_id).to eq(tournament.user_id)
      end

      it 'creates a player when registration is closed' do
        tournament.close_registration!

        expect { create_player({ name: 'spiderbro' }, organiser_view: true) }.to change(Player, :count).by(1)
      end

      it 'creates a player when the tournament has no stages' do
        tournament.stages.destroy_all

        expect { create_player({ name: 'spiderbro' }, organiser_view: true) }.to change(Player, :count).by(1)
      end

      it 'rejects a duplicate name' do
        create(:player, tournament:, name: 'spiderbro')

        expect { create_player({ name: 'spiderbro' }, organiser_view: true) }.not_to change(Player, :count)
        expect(json_body['errors']).to eq(['A user with the name spiderbro is already registered for this event.'])
      end

      it 'keeps players unlocked when everyone else is locked' do
        create(:player, tournament:)
        tournament.lock_player_registrations!

        create_player({ name: 'spiderbro' }, organiser_view: true)

        expect(new_player.registration_locked?).to be(false)
        expect(tournament.reload).to have_attributes(all_players_unlocked: false, any_player_unlocked: true)
      end
    end

    context 'when signed in as another player (self-registration)' do
      include_context 'when signed in as another player'

      let(:new_player) { tournament.players.find_by!(name: 'Evie') }

      it 'creates a player linked to their user' do
        create_player({ name: 'Evie', corp_identity: 'Jinteki: Personal Evolution' })

        expect(response).to have_http_status(:ok)
        expect(new_player).to have_attributes(user_id: other_player_user.id,
                                              corp_identity: 'Jinteki: Personal Evolution')
      end

      it 'creates a player when the tournament has no stages' do
        tournament.stages.destroy_all

        expect { create_player({ name: 'Evie' }) }.to change(Player, :count).by(1)
      end

      it 'ignores the first round bye and manual seed' do
        create_player({ name: 'Evie', first_round_bye: true, manual_seed: 1 })

        expect(new_player).to have_attributes(first_round_bye: nil, manual_seed: nil)
      end

      it 'still links the player to their user when they claim the organizer view' do
        create_player({ name: 'Evie' }, organiser_view: true)

        expect(new_player.user_id).to eq(other_player_user.id)
      end

      it 'is rejected when registration is closed' do
        tournament.close_registration!

        expect { create_player({ name: 'Evie' }) }.not_to change(Player, :count)
        expect(response).to have_http_status(:unauthorized)
      end

      it 'is rejected when self-registration is off' do
        tournament.update!(self_registration: false)

        expect { create_player({ name: 'Evie' }) }.not_to change(Player, :count)
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when signed out' do
      include_context 'when signed out'

      it 'is rejected' do
        expect { create_player({ name: 'Nobody' }) }.not_to change(Player, :count)
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH update' do
    let(:player_user) { create(:user) }
    let!(:player) { create(:player, tournament:, name: 'Player 1', user_id: player_user.id) }

    def update_player(attributes, organiser_view: false)
      json_patch beta_tournament_player_path(tournament, player), player: attributes, organiser_view:
    end

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'updates every editable field and leaves the user ID alone' do
        update_player({ name: 'Evie', pronouns: 'she/her', corp_identity: 'Jinteki: Personal Evolution',
                        runner_identity: 'Gabriel Santiago', first_round_bye: true, manual_seed: 3,
                        fixed_table_number: 20, include_in_stream: false }, organiser_view: true)

        expect(response).to have_http_status(:ok)
        expect(player.reload).to have_attributes(
          name: 'Evie', pronouns: 'she/her', corp_identity: 'Jinteki: Personal Evolution',
          runner_identity: 'Gabriel Santiago', first_round_bye: true, manual_seed: 3, fixed_table_number: 20,
          include_in_stream: false, user_id: player_user.id
        )
      end

      it 'updates a player whose registration is locked' do
        player.update!(registration_locked: true)

        update_player({ name: 'Changed Name' }, organiser_view: true)

        expect(player.reload.name).to eq('Changed Name')
      end
    end

    context 'when signed in as the player' do
      before { sign_in player_user }

      it 'updates their own details' do
        update_player({ name: 'Changed Name', pronouns: 'she/her' })

        expect(player.reload).to have_attributes(name: 'Changed Name', pronouns: 'she/her',
                                                 user_id: player_user.id)
      end

      it 'only updates pronouns and stream preference when their registration is locked' do
        player.update!(registration_locked: true)

        update_player({ name: 'Changed Name', corp_identity: 'Some corp', pronouns: 'they/them',
                        include_in_stream: false })

        expect(player.reload).to have_attributes(name: 'Player 1', corp_identity: nil, pronouns: 'they/them',
                                                 include_in_stream: false)
      end

      it 'ignores submitted decks when deck registration is off' do
        update_player({ corp_identity: 'Some Corp', corp_deck: deck_payload('Corp Deck') })

        expect(player.reload.corp_identity).to eq('Some Corp')
        expect(player.corp_deck).to be_nil
      end

      context 'with deck registration on' do
        let(:tournament) { create(:tournament, :nrdb_registration) }

        def submit_decks
          update_player({
                          corp_identity: 'Haas-Bioroid: Engineering the Future',
                          runner_identity: 'Az McCaffrey: Mechanical Prodigy',
                          corp_deck: deck_payload('Corp Deck', [{ title: 'Accelerated Beta Test', quantity: 3 }]),
                          runner_deck: deck_payload('Runner Deck', [{ title: 'Diversion of Funds', quantity: 3 }])
                        })
          player.reload
        end

        it 'saves the identities' do
          submit_decks

          expect(player).to have_attributes(corp_identity: 'Haas-Bioroid: Engineering the Future',
                                            runner_identity: 'Az McCaffrey: Mechanical Prodigy')
        end

        it 'saves the decks and their cards' do
          submit_decks

          expect(player.corp_deck.name).to eq('Corp Deck')
          expect(player.runner_deck.name).to eq('Runner Deck')
          expect(player.corp_deck.cards.map { |c| [c.title, c.quantity] }).to eq([['Accelerated Beta Test', 3]])
          expect(player.runner_deck.cards.map { |c| [c.title, c.quantity] }).to eq([['Diversion of Funds', 3]])
        end

        it "records the player's user on the decks" do
          submit_decks

          expect(player.corp_deck.user).to eq(player_user)
          expect(player.runner_deck.user).to eq(player_user)
        end

        it 'replaces a previously submitted deck' do
          submit_decks
          update_player({ corp_deck: deck_payload('New Corp Deck') })

          expect(player.decks.where(side_id: 'corp').pluck(:name)).to eq(['New Corp Deck'])
        end

        it 'ignores decks when their registration is locked' do
          player.update!(registration_locked: true)

          submit_decks

          expect(player.corp_deck).to be_nil
          expect(player.runner_deck).to be_nil
        end
      end
    end

    context 'when signed in as another player' do
      include_context 'when signed in as another player'

      it 'is rejected' do
        update_player({ name: 'Changed Name' })

        expect(response).to have_http_status(:unauthorized)
        expect(player.reload.name).to eq('Player 1')
      end
    end

    context 'when signed out' do
      include_context 'when signed out'

      it 'is rejected' do
        update_player({ name: 'Changed Name' })

        expect(response).to have_http_status(:unauthorized)
        expect(player.reload.name).to eq('Player 1')
      end
    end
  end

  describe 'DELETE destroy' do
    let!(:player) { create(:player, tournament:) }

    def organizer_only_request
      json_delete beta_tournament_player_path(tournament, player)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'deletes a player who has a bye pairing' do
        round = create(:round, tournament:, stage: tournament.current_stage)
        create(:pairing, round:, player1: player, player2: nil)

        expect { organizer_only_request }.to change(tournament.players, :count).by(-1)
        expect(response).to have_http_status(:ok)
      end

      it 'shows all players locked when the only unlocked player is deleted' do
        create(:player, tournament:)
        tournament.lock_player_registrations!
        player.update!(registration_locked: false)

        organizer_only_request

        expect(tournament.reload).to have_attributes(all_players_unlocked: false, any_player_unlocked: false)
      end

      it 'shows all players unlocked when the only locked player is deleted' do
        create(:player, tournament:)
        player.update!(registration_locked: true)

        organizer_only_request

        expect(tournament.reload).to have_attributes(all_players_unlocked: true, any_player_unlocked: true)
      end
    end
  end

  describe 'PATCH drop' do
    let!(:player) { create(:player, tournament:, active: true) }

    def organizer_only_request
      json_patch drop_beta_tournament_player_path(tournament, player)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'drops the player when signed in as the tournament organizer' do
      sign_in tournament.user

      expect { organizer_only_request }.not_to change(tournament.players, :count)
      expect(player.reload.active).to be(false)
    end
  end

  describe 'PATCH reinstate' do
    let!(:player) { create(:player, tournament:, active: false) }

    def organizer_only_request
      json_patch reinstate_beta_tournament_player_path(tournament, player)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'reinstates the player when signed in as the tournament organizer' do
      sign_in tournament.user

      organizer_only_request

      expect(player.reload.active).to be(true)
    end
  end

  describe 'PATCH lock_registration' do
    let!(:player) { create(:player, tournament:) }
    let!(:player2) { create(:player, tournament:) }

    def organizer_only_request
      json_patch lock_registration_beta_tournament_player_path(tournament, player)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'locks one player but not the other' do
        organizer_only_request

        expect(player.reload.registration_locked?).to be(true)
        expect(player2.reload.registration_locked?).to be(false)
        expect(tournament.reload).to have_attributes(all_players_unlocked: false, any_player_unlocked: true)
      end

      it 'shows no players unlocked once every player is locked' do
        player2.update!(registration_locked: true)

        organizer_only_request

        expect(tournament.reload).to have_attributes(all_players_unlocked: false, any_player_unlocked: false)
      end
    end
  end

  describe 'PATCH unlock_registration' do
    let!(:player) { create(:player, tournament:) }
    let!(:player2) { create(:player, tournament:) }

    def organizer_only_request
      json_patch unlock_registration_beta_tournament_player_path(tournament, player)
    end

    before { tournament.close_registration! }

    it_behaves_like 'a tournament organizer only endpoint'

    context 'when signed in as the tournament organizer' do
      include_context 'when signed in as the tournament organizer'

      it 'unlocks one player but not the other' do
        organizer_only_request

        expect(player.reload.registration_locked?).to be(false)
        expect(player2.reload.registration_locked?).to be(true)
        expect(tournament.reload).to have_attributes(all_players_unlocked: false, any_player_unlocked: true)
      end

      it 'shows all players unlocked once every player is unlocked' do
        player2.update!(registration_locked: false)

        organizer_only_request

        expect(tournament.reload).to have_attributes(all_players_unlocked: true, any_player_unlocked: true)
      end
    end
  end

  describe 'GET players_data' do
    def organizer_only_request
      json_get players_data_beta_tournament_players_path(tournament)
    end

    it_behaves_like 'a tournament organizer only endpoint'

    it 'lists active players sorted case-insensitively, with dropped players separate' do
      %w[carol Alice bob].each { |name| create(:player, tournament:, name:) }
      create(:player, tournament:, name: 'Dropped Dave', active: false)
      sign_in tournament.user

      organizer_only_request

      expect(response).to have_http_status(:ok)
      expect(json_body['activePlayers'].pluck('name')).to eq(%w[Alice bob carol])
      expect(json_body['droppedPlayers'].pluck('name')).to eq(['Dropped Dave'])
    end
  end

  describe 'GET nrdb_decks' do
    let(:player_user) { create(:user, nrdb_access_token: 'a_token') }
    let!(:player) { create(:player, tournament:, user_id: player_user.id) }

    def fetch_nrdb_decks
      VCR.use_cassette('nrdb_decks/az_palantir_full_deck') do
        json_get nrdb_decks_beta_tournament_player_path(tournament, player)
      end
    end

    it "returns the player's NetrunnerDB decks to the player" do
      sign_in player_user

      fetch_nrdb_decks

      expect(response).to have_http_status(:ok)
      expect(json_body.pluck('name')).to eq(['The Palantir - 1st/Undefeated @ Silver Goblin Store Champs'])
    end

    it 'returns NetrunnerDB decks to the tournament organizer' do
      sign_in tournament.user

      fetch_nrdb_decks

      expect(response).to have_http_status(:ok)
    end

    it 'is rejected for another player' do
      sign_in create(:user)

      fetch_nrdb_decks

      expect(response).to have_http_status(:unauthorized)
    end

    it 'is rejected for a signed out user' do
      sign_out

      fetch_nrdb_decks

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns unprocessable content when NetrunnerDB fails' do
      allow(Nrdb::Connection).to receive(:new).and_raise(StandardError, 'NRDB down')
      sign_in player_user

      json_get nrdb_decks_beta_tournament_player_path(tournament, player)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
