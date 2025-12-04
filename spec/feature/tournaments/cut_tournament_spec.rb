# frozen_string_literal: true

RSpec.describe 'cutting tournament' do
  let(:tournament) do
    create(:tournament, player_count: 10)
  end

  context 'as guest' do
    context 'on rounds page' do
      before do
        visit tournament_rounds_path(tournament)
      end

      it 'does not display link' do
        expect(page).not_to have_content('Cut to Top')
      end
    end
  end

  context 'as tournament owner' do
    before do
      sign_in tournament.user
    end

    context 'on settings page' do
      before do
        visit edit_tournament_path(tournament)
      end

      it 'creates double elim stage' do
        expect do
          click_button 'Double-Elimination Top 4'
        end.to change(tournament.stages, :count).by(1)
      end
    end

    context 'on rounds page' do
      before do
        visit tournament_rounds_path(tournament)
      end

      it 'creates double elim stage' do
        expect(tournament.stages.size).to eq(1)

        within find('td', text: 'Double Elimination').ancestor('tr').find('td:nth-child(4)') do
          click_button 'Top 8'
        end

        expect(tournament.stages.size).to eq(2)
        expect(tournament.stages.last.format).to eq('double_elim')
      end

      it 'creates single elim stage' do
        expect(tournament.stages.size).to eq(1)

        within find('td', text: 'Single Elimination').ancestor('tr').find('td:nth-child(3)') do
          click_button 'Top 4'
        end

        expect(tournament.stages.size).to eq(2)
        expect(tournament.stages.last.format).to eq('single_elim')
      end
    end
  end
end
