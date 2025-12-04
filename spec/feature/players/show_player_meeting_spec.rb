# frozen_string_literal: true

RSpec.describe 'show player meeting' do
  let(:tournament) { create(:tournament) }

  it 'displays meeting pairings' do
    create(:player, name: 'Jack', tournament:)
    create(:player, name: 'Jill', tournament:)
    create(:player, name: 'Snap', tournament:)
    create(:player, name: 'Crackle', tournament:)
    create(:player, name: 'Pop', tournament:)

    sign_in tournament.user
    visit tournament_players_path(tournament)
    click_link 'Player meeting'

    expect(page.has_table?(rows: [
                             ['1', 'Crackle', 'Jack'],
                             ['2', 'Jill', 'Pop'],
                             ['3', 'Snap', '']
                           ])).to be true
  end

  it 'sorts player names correctly' do
    create(:player, name: 'alan', tournament:)
    create(:player, name: 'Ben', tournament:)
    create(:player, name: 'callum', tournament:)
    create(:player, name: 'David', tournament:)

    sign_in tournament.user
    visit tournament_players_path(tournament)
    click_link 'Player meeting'

    expect(page.has_table?(rows: [
                             %w[1 alan Ben],
                             %w[2 callum David]
                           ])).to be true
  end
end
