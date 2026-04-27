# frozen_string_literal: true

module StandingStrategies
  class DoubleElim < Base # rubocop:disable Style/Documentation
    def calculate!
      bracket.new(stage).standings
    end

    private

    def bracket
      Bracket::Factory.bracket_for stage.players.count
    end
  end
end
