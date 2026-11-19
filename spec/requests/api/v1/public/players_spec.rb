# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API Players' do
  let!(:organiser) { create(:user) }
  let!(:player_user) { create(:user) }
  let!(:tournament) { create(:tournament, private: false, user: organiser) }
  let!(:corp_identity) { create(:id_etf) }
  let!(:runner_identity) { create(:id_az) }
  let!(:player) do
    create(
      :player,
      tournament: tournament,
      user: player_user,
      name: 'Alice',
      corp_identity: corp_identity.name,
      runner_identity: runner_identity.name,
      corp_identity_ref: corp_identity,
      runner_identity_ref: runner_identity
    )
  end

  let(:index_path) { "/api/v1/public/tournaments/#{tournament.id}/players" }
  let(:show_path) { "/api/v1/public/tournaments/#{tournament.id}/players/#{player.id}" }
  let(:include_identities) { '?include=corp_identity,runner_identity' }

  def sign_in_public_api(user)
    allow_any_instance_of(Api::V1::Public::PublicApiController) # rubocop:disable RSpec/AnyInstance
      .to receive(:current_user)
      .and_return(user)
  end

  def pair_first_round
    # Tournaments create their first stage on creation.
    create(:round, tournament: tournament, stage: tournament.stages.first)
  end

  def get_json(path)
    get path
    expect(response).to have_http_status(:ok)
    JSON.parse(response.body) # rubocop:disable Rails/ResponseParsedBody -- parsed_body does not parse vnd.api+json
  end

  def expect_identities_hidden(json)
    data = Array.wrap(json['data'])
    expect(data).not_to be_empty
    data.each do |record|
      expect(record['attributes']['corp_identity_id']).to be_nil
      expect(record['attributes']['runner_identity_id']).to be_nil
      expect(record.dig('relationships', 'corp_identity', 'links', 'related')).to be_nil
      expect(record.dig('relationships', 'runner_identity', 'links', 'related')).to be_nil
    end
    expect(Array.wrap(json['included']).pluck('type')).not_to include('identities')
  end

  def expect_identities_visible(json)
    record = Array.wrap(json['data']).find { |r| r['id'] == player.id.to_s }
    expect(record['attributes']['corp_identity_id']).to eq(corp_identity.id)
    expect(record['attributes']['runner_identity_id']).to eq(runner_identity.id)
    expect(json['included'].pluck('type')).to include('identities')
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/players' do
    it 'succeeds and lists players for the tournament' do
      json = api_num_results(index_path, 1)
      expect(json['data'].first['id']).to eq(player.id.to_s)
    end

    it 'returns the correct self link containing the actual tournament ID' do
      json = api_num_results(index_path, 1)
      expect(json['data'].first['links']['self']).to include("/tournaments/#{tournament.id}/players/")
      expect(json['data'].first['links']['self']).not_to include(':tournament_id')
    end

    context 'before the first round is paired' do
      it 'hides identities from anonymous users' do
        expect_identities_hidden(get_json(index_path + include_identities))
      end

      it 'hides identities from other signed-in users' do
        sign_in_public_api(create(:user))
        expect_identities_hidden(get_json(index_path + include_identities))
      end

      it 'shows identities to the tournament organiser' do
        sign_in_public_api(organiser)
        expect_identities_visible(get_json(index_path + include_identities))
      end

      it "shows a player's own identities only to that player" do
        other = create(:player, tournament: tournament, name: 'Bob',
                                corp_identity_ref: corp_identity, runner_identity_ref: runner_identity)
        sign_in_public_api(player_user)

        json = get_json(index_path)
        by_id = json['data'].index_by { |r| r['id'] }
        expect(by_id[player.id.to_s]['attributes']['corp_identity_id']).to eq(corp_identity.id)
        expect(by_id[other.id.to_s]['attributes']['corp_identity_id']).to be_nil
      end
    end

    context 'after the first round is paired' do
      before { pair_first_round }

      it 'shows identities to anonymous users' do
        expect_identities_visible(get_json(index_path + include_identities))
      end
    end
  end

  describe 'GET /api/v1/public/tournaments/:tournament_id/players/:id' do
    it 'does not match missing record' do
      missing_record("/api/v1/public/tournaments/#{tournament.id}/players/999999")
    end

    context 'with private tournament' do
      let!(:private_tournament) { create(:tournament, private: true) }
      let!(:private_player) { create(:player, tournament: private_tournament) }

      it 'does not match a player in an unauthorized private tournament' do
        missing_record("/api/v1/public/tournaments/#{private_tournament.id}/players/#{private_player.id}")
      end
    end

    context 'before the first round is paired' do
      it 'returns the player without identities to anonymous users' do
        json = matches_record(show_path + include_identities, player.id, name: 'Alice')
        expect_identities_hidden(json)
      end

      it 'shows identities to the player' do
        sign_in_public_api(player_user)
        expect_identities_visible(get_json(show_path + include_identities))
      end

      it 'shows identities to the tournament organiser' do
        sign_in_public_api(organiser)
        expect_identities_visible(get_json(show_path + include_identities))
      end
    end

    context 'after the first round is paired' do
      before { pair_first_round }

      it 'matches existing record' do
        matches_record(
          show_path,
          player.id,
          name: 'Alice',
          corp_identity_id: corp_identity.id,
          runner_identity_id: runner_identity.id
        )
      end

      it 'has expected relationships' do
        has_relationships(
          show_path,
          tournament: '/api/v1/public/tournaments/',
          user: '/api/v1/public/users/',
          corp_identity: "/api/v1/public/identities/#{corp_identity.id}",
          runner_identity: "/api/v1/public/identities/#{runner_identity.id}"
        )
      end
    end
  end

  describe 'GET /api/v1/public/tournaments/:id?include=players' do
    it 'hides sideloaded player identities before the first round is paired' do
      json = get_json("/api/v1/public/tournaments/#{tournament.id}?include=players")
      players = json['included'].select { |r| r['type'] == 'players' }
      expect(players).not_to be_empty
      players.each do |record|
        expect(record['attributes']['corp_identity_id']).to be_nil
        expect(record['attributes']['runner_identity_id']).to be_nil
      end
    end
  end
end
