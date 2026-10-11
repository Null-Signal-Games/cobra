# frozen_string_literal: true

RSpec.describe OauthController do
  describe '#auth' do
    it 'redirects to NRDB' do
      expect_any_instance_of(ActionDispatch::Request).to receive(:host).at_least(:once).and_return('localhost') # rubocop:disable RSpec/AnyInstance

      get login_path

      expect(response).to be_redirect
      expect(response.location).to eq('https://netrunnerdb.com/oauth/v2/auth?client_id=test_id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&response_type=code')
    end
  end

  describe '#logout' do
    it 'clears user_id session and redirects to root_path by default' do
      get logout_path

      expect(session[:user_id]).to be_nil
      expect(response).to redirect_to(root_path)
    end

    it 'redirects to params[:return_to] when provided' do
      get logout_path, params: { return_to: 'http://localhost:5173/' }

      expect(session[:user_id]).to be_nil
      expect(response).to redirect_to('http://localhost:5173/')
    end
  end

  describe 'GET /oauth/login' do
    it 'redirects to NRDB' do
      expect_any_instance_of(ActionDispatch::Request).to receive(:host).at_least(:once).and_return('localhost') # rubocop:disable RSpec/AnyInstance

      get '/oauth/login'

      expect(response).to be_redirect
      expect(response.location).to eq('https://netrunnerdb.com/oauth/v2/auth?client_id=test_id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&response_type=code')
    end
  end

  describe 'GET /oauth/logout' do
    it 'clears user_id session and redirects to root_path by default' do
      get '/oauth/logout'

      expect(session[:user_id]).to be_nil
      expect(response).to redirect_to(root_path)
    end

    it 'redirects to params[:return_to] when provided' do
      get '/oauth/logout', params: { return_to: 'http://localhost:5173/' }

      expect(session[:user_id]).to be_nil
      expect(response).to redirect_to('http://localhost:5173/')
    end
  end

  describe '#callback' do
    let(:make_request) { get oauth_callback_path, params: { code: :some_code } }
    let(:token_data) { { access_token: 'ABC123', refresh_token: 'DEF456' } }
    let(:connection) do
      instance_double(Nrdb::Connection, player_info: [{ id: 12, username: 'jack' }])
    end

    before do
      expect_any_instance_of(ActionDispatch::Request).to receive(:host).at_least(:once).and_return('localhost') # rubocop:disable RSpec/ExpectInHook,RSpec/AnyInstance
      allow(Nrdb::Oauth).to receive(:get_access_token)
        .with('some_code')
        .and_return(token_data)
      allow(Nrdb::Connection).to receive(:new)
        .with(nil, 'ABC123')
        .and_return(connection)
    end

    context 'when user is new' do
      it 'creates a user' do
        expect do
          make_request
        end.to change(User, :count).by(1)
      end

      it 'populates new user' do
        make_request

        expect(User.find_by(nrdb_id: 12).nrdb_username).to eq('jack')
      end
    end

    context 'when user exists' do
      before do
        create(:user, nrdb_id: 12, nrdb_username: 'jill')
      end

      it 'does not create a user' do
        expect do
          make_request
        end.not_to change(User, :count)
      end

      it 'updates user details' do
        make_request

        expect(User.find_by(nrdb_id: 12).nrdb_username).to eq('jack')
      end

      it 'redirects to session return_to URL when provided' do
        get login_path, params: { return_to: 'http://localhost:5173/tournaments/my' }
        get oauth_callback_path, params: { code: :some_code }

        expect(response).to redirect_to('http://localhost:5173/tournaments/my')
      end
    end
  end
end
