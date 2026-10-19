# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CsrfTokensController do
  describe 'GET /api/classic/csrf_token' do
    it 'returns a CSRF token' do
      get '/api/classic/csrf_token'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['csrf_token']).to be_present
    end

    it 'stores the token in the session so later requests can verify it' do
      get '/api/classic/csrf_token'

      expect(session[:_csrf_token]).to be_present
    end
  end
end
