# frozen_string_literal: true

module ApiHelpers
  # The v1 API controllers inherit from ActionController::API, not ApplicationController,
  # so SignIn#sign_in doesn't reach them. Use this instead.
  def sign_in_api(user)
    [Api::V1::Public::PublicApiController, Api::V1::Private::PrivateApiController].each do |controller|
      allow_any_instance_of(controller) # rubocop:disable RSpec/AnyInstance
        .to receive(:current_user)
        .and_return(user)
    end
  end

  # GET a v1 endpoint with JSON:API query params, e.g.
  #   jsonapi_get '/api/v1/public/tournaments', filter: { date: '2026-11-20' }, sort: 'name'
  def jsonapi_get(path, params = {})
    get path, params:, headers: { 'Accept' => 'application/vnd.api+json' }
  end

  # response.parsed_body doesn't parse application/vnd.api+json.
  def jsonapi_body
    JSON.parse(response.body)
  end

  # IDs of the records in `data` (a list or a single record), as strings.
  def jsonapi_ids
    Array.wrap(jsonapi_body['data']).pluck('id')
  end

  def matches_record(path, expected_id, attributes = {})
    get path

    expect(response).to have_http_status(:ok)
    expect(response.content_type).to match(%r{application/(json|vnd\.api\+json)})

    json = JSON.parse(response.body)
    expect(json['data']['id']).to eq(expected_id.to_s)

    attributes.each do |key, value|
      expect(json['data']['attributes'][key.to_s]).to eq(value)
    end
    json
  end

  def missing_record(path)
    get path

    expect(response).to have_http_status(:not_found)
    expect(response.content_type).to match(%r{application/(json|vnd\.api\+json)})

    json = JSON.parse(response.body)
    expect(json).to have_key('errors')
    expect(json['errors'].first['status']).to eq('404')
    expect(json['errors'].first['detail']).to eq('Specified Record Not Found')
  end

  # relationships_to_check is a hash of resource_type => expected URL fragment.
  def has_relationships(path, relationships_to_check = {})
    get path

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    relationships = json['data']['relationships']

    expect(relationships).to be_present

    # Check for expected relationships
    relationships_to_check.each do |rel_name, expected_route_part|
      expect(relationships).to have_key(rel_name.to_s)
      expect(relationships[rel_name.to_s]).to have_key('links')
      expect(relationships[rel_name.to_s]['links']).to have_key('related')
      expect(relationships[rel_name.to_s]['links']['related']).to include(expected_route_part)
    end

    # Check for any relationships not specified in relationships_to_check
    relationships.each_key do |rel_name|
      expect(relationships_to_check).to have_key(rel_name.to_sym),
                                        "Unexpected relationship '#{rel_name}' found in response"
    end
  end

  def api_num_results(path, expected_count)
    get path

    expect(response).to have_http_status(:ok)
    expect(response.content_type).to match(%r{application/(json|vnd\.api\+json)})

    json = JSON.parse(response.body)
    expect(json['data'].size).to eq(expected_count)
    json
  end

  def has_stats_total_count(json, expected_count)
    expect(json).to have_key('meta')
    expect(json['meta']).to have_key('stats')
    expect(json['meta']['stats']).to have_key('total')
    expect(json['meta']['stats']['total']).to have_key('count')
    expect(json['meta']['stats']['total']['count']).to eq(expected_count)
  end
end
