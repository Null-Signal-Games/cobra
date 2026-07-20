# frozen_string_literal: true

# Public resource for Standing (summarized_standings) objects.
class StandingResource < ApplicationResource
  self.model = SummarizedStanding
  primary_endpoint '/tournaments/:tournament_id/standings', %i[index show]
  self.validate_endpoints = false

  # Since this is scoped to tournaments, set a larger page size by default.
  self.default_page_size = 1000

  # Construct the self link manually since we have non-standard scoping and
  # the default impl from Graphiti is incorrect in this case.
  link :self do |model|
    "#{context.request.base_url}/api/v1/public/tournaments/#{model.tournament_id}/standings/#{model.id}"
  end

  attribute :id, :string
  attribute :stage_id, :integer
  attribute :player_id, :integer
  attribute :position, :integer
  attribute :points, :integer
  attribute :sos, :float do
    @object.sos&.to_f
  end
  attribute :extended_sos, :float do
    @object.extended_sos&.to_f
  end
  attribute :corp_points, :integer
  attribute :runner_points, :integer
  attribute :bye_points, :integer
  attribute :side_bias, :integer do
    @object.side_bias.to_i
  end

  belongs_to :stage, resource: StageResource
  belongs_to :player, resource: PlayerResource

  # Enforce the tournament_id filter as required
  filter :tournament_id, :integer, required: true

  # Custom filter for id using stage_id and position
  filter :id, :string do
    eq do |scope, value|
      value = value.first if value.is_a?(Array)
      if value.include?(':')
        stage_id, position = value.split(':')
        scope.where(stage_id: stage_id, position: position)
      else
        scope.where(position: value)
      end
    end
  end

  # Custom stat count calculation to avoid counting by non-physical primary key id column
  stat total: [:count] do
    count do |scope, _attr|
      scope.count
    end
  end
end
