# frozen_string_literal: true

module StandingStrategies
  class Swiss < Base # rubocop:disable Style/Documentation
    def calculate!
      SosCalculator.calculate!(stage)
    end
  end
end
