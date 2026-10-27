# frozen_string_literal: true

class Standings # rubocop:disable Style/Documentation
  include Enumerable

  attr_reader :stage, :random

  delegate :each, to: :players

  def initialize(stage, random: nil)
    @stage = stage
    @random = random
  end

  def players
    @players ||= strategy.new(stage, random:).calculate!
  end

  def top(number)
    players.map(&:player).select(&:active?)[0...number]
  end

  private

  def strategy
    return StandingStrategies::Swiss unless %w[swiss double_elim single_elim].include? stage.format

    "StandingStrategies::#{stage.format.camelize}".constantize
  end
end
