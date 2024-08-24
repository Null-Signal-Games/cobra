# frozen_string_literal: true

RSpec.describe 'creating a tournament' do
  before do
    sign_in create(:user)
    visit new_tournament_path

    fill_in 'Tournament name', with: 'Test Tournament'
  end

  it 'creates a tournament' do
    expect do
      click_button 'Create'
    end.to change(Tournament, :count).by(1)
  end

  it 'populates the tournament correctly' do
    fill_in :tournament_stream_url, with: 'https://twitch.tv'
    check :tournament_manual_seed

    click_button 'Create'

    subject = Tournament.last

    aggregate_failures do
      expect(subject.name).to eq('Test Tournament')
      expect(subject.stream_url).to eq('https://twitch.tv')
      expect(subject.created_at).not_to be_nil
      expect(subject.manual_seed?).to be(true)
    end
  end

  it 'redirects to tournament page' do
    click_button 'Create'

    expect(page).to have_current_path(tournament_path(Tournament.last), ignore_query: true)
    expect(page).to have_content('Test Tournament')
  end
end
