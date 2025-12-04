# frozen_string_literal: true

# Public resource for Tournament objects.
class TournamentTypeResource < ApplicationResource
  primary_endpoint '/tournament_types', %i[index show]

  self.default_page_size = 50

  attribute :id, :integer
  attribute :name, :string
  attribute :nsg_format, :boolean
  attribute :description, :string

  attribute :created_at, :datetime
  attribute :updated_at, :datetime

  has_many :tournaments
end
