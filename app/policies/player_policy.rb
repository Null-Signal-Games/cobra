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
end
