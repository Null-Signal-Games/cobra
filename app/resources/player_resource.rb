# frozen_string_literal: true

# Public resource for Player objects.
class PlayerResource < ApplicationResource
  primary_endpoint '/tournaments/:tournament_id/players', %i[index show]
  self.validate_endpoints = false

  link :self do |model|
    "/api/v1/public/tournaments/#{model.tournament_id}/players/#{model.id}"
  end

  self.default_page_size = 50

  attribute :id, :integer
  attribute :tournament_id, :integer
  attribute :user_id, :integer
  attribute :name, :string
  attribute :pronouns, :string
  attribute :active, :boolean
  attribute :seed, :integer
  attribute :fixed_table_number, :integer
  attribute :manual_seed, :integer
  attribute :first_round_bye, :boolean
  attribute :include_in_stream, :boolean
  attribute :registration_locked, :boolean
  attribute :corp_identity_id, :integer do
    @object.corp_identity_ref_id
  end
  attribute :runner_identity_id, :integer do
    @object.runner_identity_ref_id
  end

  belongs_to :tournament
  belongs_to :user

  belongs_to :corp_identity,
             resource: IdentityResource,
             foreign_key: :corp_identity_ref_id do
    scope do |assoc_ids|
      Identity.where(id: assoc_ids)
    end
  end

  belongs_to :runner_identity,
             resource: IdentityResource,
             foreign_key: :runner_identity_ref_id do
    scope do |assoc_ids|
      Identity.where(id: assoc_ids)
    end
  end

  # Enforce the tournament_id filter as required
  filter :tournament_id, :integer, required: true
end
