# frozen_string_literal: true

module Bracket
  class Factory
    # 2 and 3 player brackets are only valid for Single-Elimination, but there are both
    # Single and Double Elimination versions of 4, 8, and 16 player brackets.
    def self.valid_bracket?(num_players, single_elim: false)
      [4, 8, 16].include?(num_players) || (single_elim && [2, 3].include?(num_players))
    end

    def self.bracket_for(num_players, single_elim: false)
      raise 'bracket size not supported' unless valid_bracket?(num_players, single_elim: single_elim)

      prefix = 'Top'
      prefix = 'SingleElimTop' if single_elim || num_players == 3
      Rails.logger.info "Bracket class is Bracket::#{prefix}#{num_players}"
      "Bracket::#{prefix}#{num_players}".constantize
    end
  end
end
