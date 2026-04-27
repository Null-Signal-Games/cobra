# frozen_string_literal: true

class DeckbuildingRestriction < ApplicationRecord # rubocop:disable Style/Documentation
  has_many :tournaments
end
