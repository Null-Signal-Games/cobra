# frozen_string_literal: true

RSpec.describe 'listing rounds', type: :feature do
  let(:tournament) { create(:tournament) }
  let(:stage) { create(:stage, tournament:) }

  before do
    sign_in tournament.user
  end

  it 'is successful' do
    visit tournament_rounds_path(tournament)

    expect(page).to have_http_status :ok
  end

  context 'with one round' do
    let!(:round1) { create(:round, tournament:, stage: tournament.current_stage, number: 1) }

    before do
      round1.stage.players = create_list(:player, 17)
      round1.stage.players[0].update(first_round_bye: true)
      round1.stage.players[1].update(first_round_bye: true)
    end

    it 'does not count byes for the table count warning' do
      tournament.current_stage.table_ranges.create(first_table: 101, last_table: 107)

      visit tournament_rounds_path(tournament)

      # Positive assertion before negative assertion to avoid false positives on the negative.
      expect(page).to have_content('Cobra')
      expect(page).to have_no_content('There are not enough tables to cover all players')
    end
  end

  context 'with multiple rounds' do
    let!(:round1) { create(:round, tournament:, stage: tournament.current_stage, number: 1) }

    before do
      create(:round, tournament:, stage: tournament.current_stage, number: 2)
    end

    it 'lists all rounds' do
      visit tournament_rounds_path(tournament)

      aggregate_failures do
        expect(page).to have_content('Round 1')
        expect(page).to have_content('Round 2')
      end
    end

    context 'with a lot of players' do
      before do
        round1.stage.players = create_list(:player, 121)
        round1.stage.players[0].update(first_round_bye: true)
        round1.stage.players[1].update(first_round_bye: true)
      end

      it 'lists all rounds when logged in as TO' do
        visit tournament_rounds_path(tournament)

        aggregate_failures do
          expect(page).to have_content('Round 1')
          expect(page).to have_content('Round 2')
          expect(page).to have_no_content('only the most recent round')
        end
      end

      it 'is inaccessible when not logged in as TO' do
        sign_in nil
        visit tournament_rounds_path(tournament)

        aggregate_failures do
          expect(page).to have_current_path(root_path, ignore_query: true)
          expect(page).to have_content("Sorry, you can't do that")
        end
      end

      it 'displays table count warning when not enough custom tables exist' do
        tournament.current_stage.table_ranges.create(first_table: 101, last_table: 159)

        visit tournament_rounds_path(tournament)

        expect(page).to have_content('There are not enough tables to cover all players')
      end

      it 'does not display table count warning when enough custom tables exist' do
        tournament.current_stage.table_ranges.create(first_table: 101, last_table: 160)

        visit tournament_rounds_path(tournament)

        expect(page).to have_content('Cobra')
        expect(page).to have_no_content('There are not enough tables to cover all players')
      end
    end
  end
end
