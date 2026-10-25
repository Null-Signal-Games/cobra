# frozen_string_literal: true

class AbrUpload # rubocop:disable Style/Documentation
  attr_reader :tournament

  def initialize(tournament, root_url, tournament_url)
    @tournament = tournament
    @root_url = root_url
    @tournament_url = tournament_url
  end

  def upload!
    response = send_data
    unless response.success?
      return failure("Always Be Running rejected the upload (HTTP #{response.status}).", response)
    end

    JSON.parse(response.body).with_indifferent_access
  rescue JSON::ParserError
    failure('Always Be Running returned an unexpected response.', response)
  rescue Faraday::Error => e
    failure("Could not reach Always Be Running: #{e.message}")
  end

  def self.upload!(tournament, root_url, tournament_url)
    new(tournament, root_url, tournament_url).upload!
  end

  private

  def send_data
    r = Faraday.new do |conn|
      conn.request :multipart
      conn.adapter :net_http
      conn.request :authorization, :basic, 'cobra', Rails.configuration.abr_auth
    end
    r.post endpoint do |req|
      upload = Faraday::UploadIO.new(StringIO.new(json(@tournament, @root_url, @tournament_url)), 'text/json')
      req.body = { jsonresults: upload }
    end
  end

  def failure(message, response = nil)
    Rails.logger.error(
      "ABR upload failed for tournament #{@tournament.id}: #{message} #{response&.body.to_s.truncate(500)}"
    )
    { error: message }.with_indifferent_access
  end

  def endpoint
    "#{Rails.configuration.abr_host}/api/nrtm"
  end

  def json(_tournament, _root_url, _tournament_url)
    NrtmJson.new(@tournament, @root_url).data(@tournament_url).to_json
  end
end
