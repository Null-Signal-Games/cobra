# frozen_string_literal: true

RSpec.describe 'list pairings for a round' do
  context 'with swiss tournament' do
    let(:tournament) { create(:tournament) }
    let(:round) { create(:round, tournament:, stage: tournament.current_stage) }
    let!(:jack) { create(:player, name: 'Jack', tournament: round.tournament) }
    let!(:jill) { create(:player, name: 'Jill', tournament: round.tournament) }
    let!(:snap) { create(:player, name: 'Snap', tournament: round.tournament) }
    let!(:crackle) { create(:player, name: 'Crackle', tournament: round.tournament) }
    let!(:pop) { create(:player, name: 'Pop', tournament: round.tournament) }

    before do
      round.pairings.create(player1: jack, player2: jill, table_number: 1)
      round.pairings.create(player1: snap, player2: crackle, table_number: 2)
      round.pairings.create(player1: pop, player2: nil, table_number: 3)
      round.tournament.update(cut_deck_visibility: :cut_decks_public)
    end

    it 'displays pairings, repeated' do
      sign_in round.tournament.user
      visit tournament_rounds_path(round.tournament)
      click_link 'Pairings by name'

      expect(page.has_table?(rows: [
                               %w[3 (Bye) Pop],
                               %w[2 Crackle Snap],
                               %w[1 Jack Jill],
                               %w[1 Jill Jack],
                               %w[3 Pop (Bye)],
                               %w[2 Snap Crackle]
                             ])).to be true
    end

    it 'displays preset score options' do
      sign_in round.tournament.user
      visit tournament_rounds_path(round.tournament)

      aggregate_failures do
        expect(page).to have_content('6-0')
        expect(page).to have_content('3-3')
        expect(page).to have_content('(C)')
        expect(page).to have_content('3-3')
        expect(page).to have_content('(R)')
        expect(page).to have_content('0-6')
        expect(page).to have_content('...')
      end
    end

    it 'displays bye with streaming opt out enabled' do
      round.tournament.update(allow_streaming_opt_out: true)
      sign_in round.tournament.user
      visit tournament_rounds_path(round.tournament)

      expect(page).to have_content('(Bye)')
    end
  end

  context 'with double elim tournament' do
    let(:tournament) { create(:tournament, player_count: 4) }
    let(:stage) { create(:stage, tournament:, format: :double_elim) }

    before do
      tournament.players.each_with_index do |player, i|
        create(:registration, stage:, player:, seed: i + 1)
      end

      stage.pair_new_round!

      sign_in tournament.user
      visit tournament_rounds_path(tournament)
    end

    it 'displays side selection buttons' do
      aggregate_failures do
        expect(page).to have_content('Corp')
        expect(page).to have_content('Runner')
      end
    end

    it 'does not display preset score options before side selection' do
      sign_in tournament.user
      visit tournament_rounds_path(tournament)

      expect(page).not_to have_content('3-0 0-3')
    end

    it 'displays preset score options after side selection' do
      round = tournament.rounds.last
      round.pairings.each do |pairing|
        pairing.update(side: 1)
      end
      sign_in tournament.user
      visit tournament_rounds_path(tournament)

      aggregate_failures do
        expect(page).to have_text('3-0')
        expect(page).to have_text('0-3')
      end
    end
  end
end
