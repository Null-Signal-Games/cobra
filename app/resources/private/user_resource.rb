# frozen_string_literal: true

module Private
  # Resource for private User API requests.
  class UserResource < ApplicationResource
    self.model = User
    self.endpoint_namespace = '/api/v1/private'

    primary_endpoint '/user', %i[show]

    attribute :id, :integer
    attribute :nrdb_id, :integer
    attribute :nrdb_username, :string

    # Per-user feature availability for the SvelteKit frontend.
    # This should be considered a stop-gap for now until we figure out a longer-term plan
    # for more customizable features and feature flag use in the frontend.
    attribute :features, :hash, readable: true, writable: false do
      {
        create_demo_tournaments: Flipper.enabled?(:demo_tournaments, @object)
      }
    end
  end
end
