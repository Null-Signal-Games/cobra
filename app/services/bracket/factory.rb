# frozen_string_literal: true

module Bracket
  class Factory
    def self.bracket_for(num_players)
      raise 'bracket size not supported' unless [3, 4, 8, 16].include? num_players

      "Bracket::Top#{num_players}".constantize
    end
  end
end
