# frozen_string_literal: true

# Helper methods for JSON request specs against the endpoints the SvelteKit frontend calls.
#
#   json_patch beta_tournament_round_path(tournament, round), round: { weight: 0.8 }
#   expect(json_body['errors']).to be_empty
module JsonRequestHelpers
  # Not `as: :json`: for a GET with params, Rails's test harness would send a POST with an
  # X-Http-Method-Override header and a JSON body. Send a real GET with query params instead.
  def json_get(path, params = {})
    get path, params:, headers: { 'Accept' => 'application/json' }
  end

  def json_post(path, params = {})
    post path, params:, as: :json
  end

  def json_patch(path, params = {})
    patch path, params:, as: :json
  end

  def json_put(path, params = {})
    put path, params:, as: :json
  end

  def json_delete(path, params = {})
    delete path, params:, as: :json
  end

  def json_body
    response.parsed_body
  end
end
