# frozen_string_literal: true

RSpec.describe 'cutting tournament', type: :feature do
  let(:tournament) do
    create(:tournament, player_count: 10)
  end

  context 'as guest' do
    context 'on rounds page' do
      before do
        visit tournament_rounds_path(tournament)
      end

      it 'does not display link' do
        expect(page).to have_no_text('Cut to Top')
      end
    end
  end

  context 'as tournament owner' do
    before do
      sign_in tournament.user
    end

    context 'on pairings page with no completed rounds' do
      before do
        create(:round, stage: tournament.stages.first, completed: true)

        visit tournament_rounds_path(tournament)
      end

      it 'has no cut links when no rounds have been completed' do
        expect(page).to have_text('Swiss') # Shows a default stage.
        expect(page).to have_no_text('Cut to Top')
      end
    end

    context 'on pairings page with no stages' do
      before do
        tournament.stages.destroy_all
        visit tournament_rounds_path(tournament)
      end

      it 'has no cut links when no rounds have been completed' do
        expect(page).to have_text('Add Swiss stage')
        expect(page).to have_no_text('Cut to Top')
      end
    end

    context 'on pairings page with a completed swiss round' do
      before do
        create(:round, stage: tournament.stages.first, completed: true)

        visit tournament_rounds_path(tournament)
      end

      it 'shows cut buttons and allows creating double elim stage' do
        expect(tournament.stages.size).to eq(1)

        find("a[id='double_elim_top_8']").click

        expect(tournament.stages.size).to eq(2)
        expect(tournament.stages.last.format).to eq('double_elim')
      end

      it 'shows cut buttons and allows creating single elim stage' do
        expect(tournament.stages.size).to eq(1)

        find("a[id='single_elim_top_4']").click

        expect(tournament.stages.size).to eq(2)
        expect(tournament.stages.last.format).to eq('single_elim')
      end
    end
  end
end
