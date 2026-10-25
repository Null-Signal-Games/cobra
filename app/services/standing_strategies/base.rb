# frozen_string_literal: true

module StandingStrategies
  class Base # rubocop:disable Style/Documentation
    attr_reader :stage, :random

    def initialize(stage, random: nil)
      @stage = stage
      @random = random
    end
  end
end
