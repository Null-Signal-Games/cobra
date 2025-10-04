# frozen_string_literal: true

class Stage < ApplicationRecord
  belongs_to :tournament, touch: true
  has_many :rounds, dependent: :destroy
  has_many :registrations, dependent: :destroy
  has_many :players, through: :registrations
  has_many :users, through: :players
  has_many :standing_rows, dependent: :destroy
  has_many :table_ranges, dependent: :destroy

  delegate :top, to: :standings

  enum :format, {
    swiss: 0, # Double-Sided Swiss
    double_elim: 1,
    single_sided_swiss: 2,
    single_elim: 3
  }

  def pair_new_round!
    new_round!.tap(&:pair!)
  end

  def new_round!
    number = (rounds.pluck(:number).max || 0) + 1
    rounds.create(number:, tournament_id:, length_minutes: default_round_minutes)
  end

  def standings
    Standings.new(self)
  end

  def eligible_pairings
    rounds.complete.map(&:pairings).flatten
  end

  def seed(number)
    registrations.find_by(seed: number).try(:player)
  end

  def any_swiss?
    swiss? || single_sided_swiss?
  end

  def single_sided?
    single_sided_swiss? || elimination?
  end

  def elimination?
    single_elim? || double_elim?
  end

  def default_round_minutes
    if single_sided?
      40
    else
      65
    end
  end

  def cache_standings!
    standing_rows.destroy_all
    standings.each_with_index do |standing, i|
      standing_rows.create(
        position: i + 1,
        player: standing.player,
        points: standing.points,
        sos: standing.sos,
        extended_sos: standing.extended_sos,
        corp_points: standing.corp_points,
        runner_points: standing.runner_points,
        bye_points: standing.bye_points || 0
      )
    end
  end

  def decks_open?
    tournament.stage_decks_open?(self)
  end

  def decks_public?
    tournament.stage_decks_public?(self)
  end

  def decks_visible_to(user)
    if decks_open?
      user == tournament.user || users.exists?(user&.id)
    else
      decks_public?
    end
  end

  def custom_table_numbers_count
    table_ranges.inject(0) { |sum, e| sum + (e.last_table - e.first_table) + 1 }
  end

  def validate_table_count
    num_pairable_players = players.count
    if rounds.count < 2 && (rounds.empty? || !rounds.first.completed?)
      num_pairable_players -= players.select(&:first_round_bye).count
    end
    num_pairable_players -= 1 if num_pairable_players.odd?

    if num_pairable_players.negative? || table_ranges.empty? || custom_table_numbers_count >= num_pairable_players / 2
      return
    end

    'There are not enough tables to cover all players' \
    " (players without byes: #{num_pairable_players}, tables: #{custom_table_numbers_count})."
  end
end
