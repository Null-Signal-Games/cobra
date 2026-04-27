# frozen_string_literal: true

class DeckCard < ApplicationRecord # rubocop:disable Style/Documentation
  belongs_to :deck
end
