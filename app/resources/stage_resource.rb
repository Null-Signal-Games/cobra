# frozen_string_literal: true

# Public resource for Stage objects.
class StageResource < ApplicationResource
  primary_endpoint '/tournaments/:tournament_id/stages', %i[index show]
  self.validate_endpoints = false

  link :self do |model|
    "/api/v1/public/tournaments/#{model.tournament_id}/stages/#{model.id}"
  end

  self.default_page_size = 50

  attribute :id, :integer
  attribute :tournament_id, :integer
  attribute :number, :integer
  attribute :format, :string

  attribute :created_at, :datetime
  attribute :updated_at, :datetime

  belongs_to :tournament
  has_many :rounds do
    link do |stage|
      "/api/v1/public/tournaments/#{stage.tournament_id}/rounds?filter[stage_id]=#{stage.id}"
    end
  end

  filter :tournament_id, :integer, required: true
end
