# frozen_string_literal: true

RSpec.describe ApplicationController do
  let(:tournament) { create(:tournament) }

  it 'returns JSON not found for a missing record' do
    sign_in tournament.user

    get edit_form_api_classic_tournament_path(id: 0), as: :json

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to eq('error' => 'Not found')
  end

  it 'returns JSON unauthorized when a policy denies access' do
    sign_in create(:user)

    get edit_form_api_classic_tournament_path(tournament), as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body).to eq('error' => "🔒 Sorry, you can't do that")
  end

  it 'returns JSON unauthorized for a request that does not ask for JSON' do
    sign_out

    get edit_form_api_classic_tournament_path(tournament)

    expect(response).to have_http_status(:unauthorized)
    expect(response.media_type).to eq('application/json')
  end
end
