# frozen_string_literal: true

# Public resource for Round objects.
class RoundResource < ApplicationResource
  primary_endpoint '/tournaments/:tournament_id/rounds', %i[index show]
  self.validate_endpoints = false

  link :self do |model|
    "/api/v1/public/tournaments/#{model.tournament_id}/rounds/#{model.id}"
  end

  self.default_page_size = 50

  attribute :id, :integer
  attribute :stage_id, :integer
  attribute :tournament_id, :integer
  attribute :number, :integer
  attribute :completed, :boolean
  attribute :length_minutes, :integer
  attribute :weight, :float

  attribute :created_at, :datetime
  attribute :updated_at, :datetime

  belongs_to :stage do
    link do |round|
      "/api/v1/public/tournaments/#{round.tournament_id}/stages/#{round.stage_id}"
    end
  end
  belongs_to :tournament

  filter :tournament_id, :integer, required: true
end
