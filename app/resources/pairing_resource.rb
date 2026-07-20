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
    "#{context.request.base_url}/api/v1/public/tournaments/#{model.round.tournament_id}/pairings/#{model.id}"
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

  belongs_to :round, resource: RoundResource
  belongs_to :player1, resource: PlayerResource
  belongs_to :player2, resource: PlayerResource

  # Enforce the tournament_id filter as required
  filter :tournament_id, :integer, required: true do
    eq do |scope, value|
      scope.joins(:round).where(rounds: { tournament_id: value })
    end
  end
end
