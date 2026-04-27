# frozen_string_literal: true

module Bracket
  class SingleElimTop2 < Base
    game 1, seed(1), seed(2), round: 1, bracket_type: :upper

    STANDINGS = [
      winner(1),
      loser(1)
    ].freeze
  end
end
