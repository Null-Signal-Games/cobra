# frozen_string_literal: true

# Public resource for Tournament objects.
class TournamentResource < ApplicationResource
  primary_endpoint '/tournaments', %i[index show]

  self.default_page_size = 3

  attribute :id, :integer
  attribute :name, :string
  attribute :slug, :string
  attribute :abr_code, :string
  attribute :private, :boolean

  attribute :user_id, :integer
  attribute :tournament_organizer, :string do
    @object.user&.nrdb_username
  end

  attribute :date, :date
  attribute :time_zone, :string
  attribute :registration_starts, :datetime do
    create_timestamp(@object.date, @object.registration_starts, @object.time_zone)
  end
  attribute :tournament_starts, :datetime do
    create_timestamp(@object.date, @object.tournament_starts, @object.time_zone)
  end

  attribute :organizer_contact, :string
  attribute :event_link, :string
  attribute :stream_url, :string
  attribute :description, :string
  attribute :additional_prizes_description, :string
  attribute :official_prize_kit_id, :integer

  attribute :stage, :string

  attribute :manual_seed, :boolean
  attribute :self_registration, :boolean
  attribute :nrdb_deck_registration, :boolean
  attribute :decklist_required, :boolean
  attribute :allow_self_reporting, :boolean
  attribute :allow_streaming_opt_out, :boolean

  attribute :all_players_unlocked, :boolean
  attribute :any_player_unlocked, :boolean
  attribute :registration_closed, :boolean
  attribute :swiss_deck_visibility, :string
  attribute :cut_deck_visibility, :string

  attribute :swiss_format, :string
  attribute :tournament_type_id, :integer
  attribute :format_id, :integer
  attribute :deckbuilding_restriction_id, :string
  attribute :card_set_id, :string

  attribute :created_at, :datetime
  attribute :updated_at, :datetime

  belongs_to :tournament_type
  belongs_to :user

  def create_timestamp(date, time_24h, timezone)
    # Parse the date and time string
    datetime_string = "#{date} #{time_24h}"

    # Create a Time object in the specified timezone
    Time.zone = timezone
    Time.zone.parse(datetime_string)
  rescue ArgumentError => _e
    nil
  end
end
