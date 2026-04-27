# frozen_string_literal: true

module Bracket
  module Engine # rubocop:disable Style/Documentation
    def self.included(base)
      base.extend ClassMethods
    end

    module ClassMethods # rubocop:disable Style/Documentation
      def game(number, p1, p2, options = {}) # rubocop:disable Naming/MethodParameterName
        class_eval do
          @games ||= []
          @games << {
            number:,
            player1: p1,
            player2: p2,
            round: options[:round],
            winner_game: options[:winner_game],
            loser_game: options[:loser_game],
            bracket_type: options[:bracket_type]
          }
        end
      end

      %w[seed winner loser seed_of winner_if_also_winner loser_if_also_winner].each do |method|
        define_method method do |*args|
          args.unshift(method)
          ->(context) { context.send(*args) }
        end
      end
    end

    def games
      self.class.instance_variable_get(:@games)
    end

    def games_for_round(number)
      games.select { |g| g[:round] == number }
    end
  end
end
