# frozen_string_literal: true

# Public resource for Tournament objects.
class UserResource < ApplicationResource
  primary_endpoint '/users', %i[show]

  attribute :id, :integer
  attribute :nrdb_username, :string

  has_many :tournaments
end
