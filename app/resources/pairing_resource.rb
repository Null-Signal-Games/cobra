# frozen_string_literal: true

# Public resource for Pairing objects.
class PairingResource < ApplicationResource
  primary_endpoint '/tournaments/:tournament_id/pairings', %i[index show]
  self.validate_endpoints = false

  # Since this is scoped to tournaments, set a larger page size by default.
  self.default_page_size = 1000

  # Construct the self link manually since we have non-standard scoping and
  # the default impl from Graphiti is incorrect in this case.
  link :self do |model|
    "/api/v1/public/tournaments/#{model.round.tournament_id}/pairings/#{model.id}"
  end

  attribute :id, :integer
  attribute :table_number, :integer
  attribute :side, :string
  attribute :score1, :integer
  attribute :score2, :integer
  attribute :player1_id, :integer
  attribute :player2_id, :integer
  attribute :reported, :boolean do
    @object.reported?
  end
  attribute :intentional_draw, :boolean
  attribute :two_for_one, :boolean

  belongs_to :round, resource: RoundResource do
    link do |pairing|
      "/api/v1/public/tournaments/#{pairing.round.tournament_id}/rounds/#{pairing.round_id}"
    end
  end

  belongs_to :player1, resource: PlayerResource do
    link do |pairing|
      "/api/v1/public/tournaments/#{pairing.round.tournament_id}/players/#{pairing.player1_id}" if pairing.player1_id
    end
  end

  belongs_to :player2, resource: PlayerResource do
    link do |pairing|
      "/api/v1/public/tournaments/#{pairing.round.tournament_id}/players/#{pairing.player2_id}" if pairing.player2_id
    end
  end

  # Enforce the tournament_id filter as required
  filter :tournament_id, :integer, required: true do
    eq do |scope, value|
      scope.joins(:round).where(rounds: { tournament_id: value })
    end
  end
end
