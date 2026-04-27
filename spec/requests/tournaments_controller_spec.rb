# frozen_string_literal: true

RSpec.describe TournamentsController do
  let(:tournament) { create(:tournament, name: 'My Tournament') }

  describe '#save_json' do
    before do
      allow(NrtmJson).to receive(:new).with(tournament).and_return(
        instance_double(NrtmJson, data: { some: :data })
      )
    end

    it 'responds with json file' do
      get save_json_tournament_path(tournament)

      expect(response.headers['Content-Disposition']).to eq(
        'attachment; filename="my tournament.json"; filename*=UTF-8\'\'my%20tournament.json'
      )
      expect(response.body).to eq('{"some":"data"}')
    end
  end

  describe '#cut' do
    let(:cut) { create(:stage, tournament:) }

    before do
      allow(Tournament).to receive(:find)
        .with(tournament.to_param)
        .and_return(tournament)
      allow(tournament).to receive(:cut_to!).and_return(cut)
    end

    it 'cuts tournament' do
      sign_in tournament.user
      post cut_tournament_path(tournament), params: { number: 8 }

      expect(tournament).to have_received(:cut_to!).with(:double_elim, 8)
    end
  end

  describe '#change_swiss_format' do
    before do
      allow(Tournament).to receive(:find)
        .with(tournament.to_param)
        .and_return(tournament)
    end

    it 'changes swiss format when stage has no pairings' do
      sign_in tournament.user

      patch tournament_path(tournament), params: { tournament: { swiss_format: 'single_sided' } }

      expect(tournament.single_sided?).to be(true)
    end

    it 'will not change swiss format when stage has pairings' do
      expect(tournament.swiss?).to be(true)
      tournament.pair_new_round!
      sign_in tournament.user

      patch tournament_path(tournament), params: { tournament: { swiss_format: 'single_sided' } }

      expect(flash[:alert]).to eq("Can't change Swiss format when rounds exist.")

      # Format is unchanged
      expect(tournament.swiss?).to be(true)
    end
  end

  describe '#cut_conversion_rates' do
    before do
      allow(Tournament).to receive(:find)
        .with(tournament.to_param)
        .and_return(tournament)
      allow(tournament).to receive(:cut_conversion_rates_data)
        .and_return([{ foo: 'bar' }, { baz: 'qux' }])
    end

    # This method just returns what tournament gives it as JSON.
    it 'returns tournament.side_win_percentages JSON' do
      get cut_conversion_rates_tournament_path(tournament)

      expect(response.parsed_body)
        .to eq([{ 'foo' => 'bar' }, { 'baz' => 'qux' }])
    end
  end

  describe '#side_win_percentages' do
    before do
      allow(Tournament).to receive(:find)
        .with(tournament.to_param)
        .and_return(tournament)
      allow(tournament).to receive(:side_win_percentages_data)
        .and_return([{ foo: 'bar' }, { baz: 'qux' }])
    end

    # This method just returns what tournament gives it as JSON.
    it 'returns tournament.side_win_percentages JSON' do
      get side_win_percentages_tournament_path(tournament)

      expect(response.parsed_body)
        .to eq([{ 'foo' => 'bar' }, { 'baz' => 'qux' }])
    end
  end

  describe '#id_and_faction_data' do
    before do
      allow(Tournament).to receive(:find)
        .with(tournament.to_param)
        .and_return(tournament)
      allow(tournament).to receive(:id_and_faction_data)
        .and_return([{ foo: 'bar' }, { baz: 'qux' }])
    end

    # This method just returns what tournament gives it as JSON.
    it 'returns tournament.id_and_faction_data JSON' do
      get id_and_faction_data_tournament_path(tournament)

      expect(response.parsed_body)
        .to eq([{ 'foo' => 'bar' }, { 'baz' => 'qux' }])
    end
  end

  # Test cases:
  # - when not signed in, returns unauthorized
  # - when signed in as a user not in the tournament, redirects with message
  # - when signed in as a user in the tournament, returns their tournament info
  describe '#my_tournament' do
    let(:organizer) { create(:user) }
    let(:player) { create(:user) }
    let(:tournament) { create(:tournament, user: organizer) }

    context 'when not signed in' do
      it 'returns unauthorized when not signed in (JSON)' do
        get my_tournament_tournament_path(tournament, format: :json)

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body).to eq('error' => 'Not authorized')
      end

      it 'redirects when not signed in (HTML)' do
        get my_tournament_tournament_path(tournament)

        expect(response).to redirect_to(tournament_path(tournament))
        expect(flash[:alert]).to eq('Please log in to view your tournament information.')
      end
    end

    context 'when user is in the tournament' do
      before do
        create(:player, tournament: tournament, user: organizer)
        sign_in organizer
        allow(SummarizedPairings).to receive(:for_user_in_tournament)
          .and_return({ tournament_id: tournament.id, user_id: organizer.id, pairings: [{ id: 1 }] })
      end

      it 'returns tournament data (JSON)' do
        get my_tournament_tournament_path(tournament, format: :json)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to include('pairings')
      end

      it 'renders the my_tournament page (HTML)' do
        get my_tournament_tournament_path(tournament)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('my_tournament_anchor')
      end
    end

    context 'when user is not in the tournament' do
      before do
        sign_in player
        allow(SummarizedPairings).to receive(:for_user_in_tournament)
          .and_return({ tournament_id: tournament.id, user_id: player.id, pairings: [] })
      end

      it 'returns empty data (JSON)' do
        get my_tournament_tournament_path(tournament, format: :json)

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body).to eq('error' => 'You are not registered in this tournament.')
      end

      it 'redirects with message (HTML)' do
        get my_tournament_tournament_path(tournament)

        expect(response).to redirect_to(tournament_path(tournament))
        expect(flash[:alert]).to eq('You are not registered in this tournament.')
      end
    end
  end
end
