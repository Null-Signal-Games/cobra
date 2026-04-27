# frozen_string_literal: true

RSpec.describe 'listing tournaments', type: :feature do
  before do
    create(:tournament, name: 'Some Tournament')
    create(:tournament, name: 'Private Tournament', private: true)
    visit tournaments_path
  end

  it 'shows the tournaments' do
    expect(page).to have_content('Some Tournament')
  end

  it 'does not show private tournaments' do
    expect(page).to have_no_content('Private Tournament')
  end
end
