# frozen_string_literal: true

# Public resource for Tournament objects.
class TournamentResource < ApplicationResource
  primary_endpoint '/tournaments', %i[index show]

  self.default_page_size = 25

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
  attribute :official_prize_kit_name, :string do
    @object.official_prize_kit&.name
  end

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
  attribute :format_name, :string do
    @object.format&.name
  end
  attribute :deckbuilding_restriction_id, :string
  attribute :deckbuilding_restriction_name, :string do
    @object.deckbuilding_restriction&.name
  end
  attribute :card_set_id, :string

  attribute :active_player_count, :integer do
    @object.players.active.count
  end

  attribute :dropped_player_count, :integer do
    @object.players.dropped.count
  end

  attribute :created_at, :datetime
  attribute :updated_at, :datetime

  belongs_to :tournament_type
  belongs_to :card_set
  belongs_to :deckbuilding_restriction
  belongs_to :format
  belongs_to :official_prize_kit
  belongs_to :user
  has_many :stages do
    link do |tournament|
      "/api/v1/public/tournaments/#{tournament.id}/stages"
    end
  end
  has_many :rounds do
    link do |tournament|
      "/api/v1/public/tournaments/#{tournament.id}/rounds"
    end
  end
  has_many :players do
    link do |tournament|
      "/api/v1/public/tournaments/#{tournament.id}/players"
    end
  end
  has_many :pairings do
    link do |tournament|
      "/api/v1/public/tournaments/#{tournament.id}/pairings"
    end
  end

  def create_timestamp(date, time_24h, timezone)
    return nil if date.nil? || time_24h.nil? || timezone.nil?

    begin
      # Parse the date and time string
      datetime_string = "#{date} #{time_24h}"

      # Create a Time object in the specified timezone
      Time.zone = timezone
      Time.zone.parse(datetime_string)
    rescue ArgumentError => _e
      nil
    end
  end
end
