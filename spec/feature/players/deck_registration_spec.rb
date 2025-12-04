# frozen_string_literal: true

RSpec.describe 'registering a deck from NetrunnerDB' do
  let(:organiser) { create(:user, nrdb_access_token: 'a_token') }
  let(:player) { create(:user, nrdb_access_token: 'a_token') }
  let(:tournament) { create(:tournament, user: organiser, self_registration: true, nrdb_deck_registration: true) }

  before do
    Flipper.enable :nrdb_deck_registration
  end

  it 'registers as a player' do
    expect do
      register_as_player
    end.to change(Player, :count).by(1)
    expect(page).to have_current_path(registration_tournament_path(tournament), ignore_query: true)
  end

  it 'TO registers themselves as a player' do
    expect do
      register_as_organizer
    end.to change(Player, :count).by(1)
    expect(page).to have_current_path(registration_tournament_path(tournament), ignore_query: true)
  end

  it 'creates a player as the TO' do
    expect do
      create_player_as_organizer
    end.to change(Player, :count).by(1)
    expect(page).to have_current_path(tournament_players_path(tournament), ignore_query: true)
  end

  it 'displays a deck in the list' do
    register_as_player
    VCR.use_cassette 'nrdb_decks/az_palantir_full_deck' do
      visit registration_tournament_path(tournament)
    end
    expect(displayed_decks_names)
      .to eq(['The Palantir - 1st/Undefeated @ Silver Goblin Store Champs'])
  end

  it 'displays no decks when locked with no deck' do
    register_as_player
    sign_in organiser
    visit tournament_players_path(tournament)
    click_link 'Lock player'
    sign_in player
    visit registration_tournament_path(tournament)
    expect(page).not_to have_selector '#nrdb_decks'
  end

  context 'submitting decks' do
    before do
      register_as_player
      VCR.use_cassette 'nrdb_decks/az_palantir_and_jammy_hb' do
        visit registration_tournament_path(tournament)
        select_corp_deck Deck.new identity_title: 'Haas-Bioroid: Engineering the Future',
                                  name: 'Ben Ni Jammy HB "Always Beta Test" (UK Nationals \'16 14th)',
                                  identity_nrdb_printing_id: '01054',
                                  cards: [
                                    DeckCard.new(title: 'Accelerated Beta Test', quantity: 3)
                                  ]
        select_runner_deck Deck.new identity_title: 'Az McCaffrey: Mechanical Prodigy',
                                    name: 'The Palantir - 1st/Undefeated @ Silver Goblin Store Champs',
                                    identity_nrdb_printing_id: '26010',
                                    cards: [
                                      DeckCard.new(title: 'Diversion of Funds', quantity: 3)
                                    ]
        click_button 'Submit'
      end
      @new_player = Player.last
    end

    it 'saves the identities' do
      expect(@new_player.corp_identity).to eq('Haas-Bioroid: Engineering the Future')
      expect(@new_player.runner_identity).to eq('Az McCaffrey: Mechanical Prodigy')
    end

    it 'saves the decks' do
      expect(@new_player.corp_deck.identity_title).to eq('Haas-Bioroid: Engineering the Future')
      expect(@new_player.runner_deck.identity_title).to eq('Az McCaffrey: Mechanical Prodigy')
    end

    it 'saves the cards' do
      expect(@new_player.corp_deck.deck_cards.map { |card| [card.title, card.quantity] })
        .to eq([['Advanced Assembly Lines', 2], ['Ravana 1.0', 1], ['Magnet', 2], ['Accelerated Beta Test', 3],
                ['Archived Memories', 1], ['Biotic Labor', 3], ['Ichi 1.0', 3], ['Tollbooth', 1], ['Hedge Fund', 3],
                ['Ash 2X3ZB9CY', 2], ['Project Vitruvius', 3], ['Eli 1.0', 3], ['Jackson Howard', 3],
                ['Restructure', 3], ['Blue Level Clearance', 2], ['Targeted Marketing', 1], ['Crisium Grid', 1],
                ['Chronos Project', 2], ['Architect', 3], ['Cyberdex Virus Suite', 2], ['Turing', 3],
                ['Global Food Initiative', 2]])
      expect(@new_player.runner_deck.deck_cards.map { |card| [card.title, card.quantity] })
        .to eq([['Tech Trader', 3], ['Spy Camera', 3], ['Political Operative', 1], ['Sports Hopper', 3],
                ['Deuces Wild', 1], ['Paperclip', 1], ['Diversion of Funds', 3], ['Miss Bones', 2], ['Stargate', 1],
                ['Blueberry!™ Diesel', 2], ['Flip Switch', 2], ['Masterwork (v37)', 3], ['Bravado', 3],
                ['Boomerang', 3], ['Prognostic Q-Loop', 2], ['The Back', 1], ['Simulchip', 1], ['Fermenter', 2],
                ['Mutual Favor', 1], ['Sure Gamble', 3], ['Clot', 1], ['Abagnale', 1], ['Revolver', 2]])
    end

    it 'records the user who saved the decks' do
      expect(@new_player.corp_deck.user).to eq(player)
      expect(@new_player.runner_deck.user).to eq(player)
    end

    it 'displays the decks when locked' do
      sign_in organiser
      visit tournament_players_path(tournament)
      click_button 'Registration'
      click_link 'Close registration'
      sign_in player
      visit registration_tournament_path(tournament)
      expect(page).not_to have_selector '#nrdb_decks'
      expect(page).to have_selector '#display_decks'
      expect(find('#player_corp_deck', visible: false).value).to match(/^\{.+}$/)
      expect(find('#player_runner_deck', visible: false).value).to match(/^\{.+}$/)
    end
  end

  def register_as_player
    sign_in player
    visit tournament_path(tournament)
    find('input[name="player[consent_data_sharing]"]').click
    with_nrdb_decks do
      find(:button, text: 'Deck Registration').click
    end
  end

  def register_as_organizer
    sign_in organiser
    visit tournament_path(tournament)
    fill_in 'Name', with: 'Test Player'
    find('input[name="player[consent_data_sharing]"]').click
    with_nrdb_decks do
      find(:button, text: 'Deck Registration').click
    end
  end

  def create_player_as_organizer
    sign_in organiser
    visit tournament_players_path(tournament)
    fill_in 'Name', with: 'Test Player'
    with_nrdb_decks do
      click_button 'Create'
    end
  end

  def displayed_decks_names
    wait_for_decks

    names = find('ul#nrdb_corp_decks').all('li').map { |deck| deck.find('p').text }
    names.concat(find('ul#nrdb_runner_decks').all('li').map { |deck| deck.find('p').text })
    names
  end

  def select_corp_deck(deck)
    select_deck('corp', deck)
  end

  def select_runner_deck(deck)
    select_deck('runner', deck)
  end

  def select_deck(side, deck)
    wait_for_decks

    find("ul#nrdb_#{side}_decks").find('p', text: deck.name).click
  end

  def with_nrdb_decks(&block)
    VCR.use_cassette 'nrdb_decks/simplified_deck' do
      block.call
    end
  end

  def wait_for_decks
    expect(page).to have_no_css('div.spinner-border', wait: 30)
  end
end
