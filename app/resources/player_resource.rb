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
  attribute :corp_identity_id, :integer, filterable: false, sortable: false do
    @object.corp_identity_ref_id
  end
  attribute :runner_identity_id, :integer, filterable: false, sortable: false do
    @object.runner_identity_ref_id
  end

  belongs_to :tournament
  belongs_to :user

  belongs_to :corp_identity,
             as: :corp_identity_ref,
             resource: IdentityResource,
             foreign_key: :corp_identity_ref_id do
    scope do |assoc_ids|
      Identity.where(id: assoc_ids)
    end
  end

  belongs_to :runner_identity,
             as: :runner_identity_ref,
             resource: IdentityResource,
             foreign_key: :runner_identity_ref_id do
    scope do |assoc_ids|
      Identity.where(id: assoc_ids)
    end
  end

  # Enforce the tournament_id filter as required
  filter :tournament_id, :integer, required: true

  # Identities need to stay hidden until the first round is paired except from the
  # tournament organiser and the player themselves.
  # Clearing the FKs on the loaded records hides the identities, relationships and sideloads.
  def resolve(scope)
    players = super
    viewer = context.respond_to?(:current_user) ? context.current_user : nil
    tournaments = Tournament.where(id: players.map(&:tournament_id).uniq).index_by(&:id)
    visible = Hash.new { |cache, tournament_id| cache[tournament_id] = tournaments[tournament_id]&.show_identities? }

    players.each do |player|
      tournament = tournaments[player.tournament_id]
      next if visible[player.tournament_id]
      next if viewer && (tournament&.user_id == viewer.id || player.user_id == viewer.id)

      player.corp_identity_ref_id = nil
      player.runner_identity_ref_id = nil
      # Be defensive and mark this record as read-only to prevent modification when we add editing to this API.
      player.readonly!
    end

    players
  end
end
