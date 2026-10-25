# frozen_string_literal: true

class PlayerPolicy < ApplicationPolicy # rubocop:disable Style/Documentation
  def create?
    user
  end

  def update?
    user && (record.user == user || record.tournament.user == user)
  end

  def view_decks?
    record.decks_visible_to?(user)
  end

  # The player and the TO can always see the player's decks; others only once the stage shares them.
  def decks?
    update? || view_decks?
  end
end
