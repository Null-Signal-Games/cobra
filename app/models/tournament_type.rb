# frozen_string_literal: true

class TournamentType < ApplicationRecord # rubocop:disable Style/Documentation
  has_many :tournaments
end
