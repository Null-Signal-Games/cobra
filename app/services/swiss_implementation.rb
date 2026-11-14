# frozen_string_literal: true

require 'graph_matching'

module SwissImplementation # rubocop:disable Style/Documentation
  def self.pair(players, options = {}, &)
    Pairer.new(options).pair(players, &)
  end

  class Player # rubocop:disable Style/Documentation
    attr_accessor :id, :delta, :exclude, :label

    def initialize(id, label = '')
      @id = id
      @delta = 0
      @exclude = []
      @label = label
    end
  end

  class Bye; end # rubocop:disable Lint/EmptyClass

  class Pairer # rubocop:disable Style/Documentation
    def initialize(options = {})
      @delta_key = options[:delta_key] || :delta
      @exclude_key = options[:exclude_key] || :exclude
      @bye_delta = options[:bye_delta] || -1
      @random = options[:random] || Random
    end

    def pair(player_data, &)
      @player_data = player_data
      edges = graph(&).maximum_weighted_matching(true).edges
      edges.map do |pairing|
        [players[pairing[0]], players[pairing[1]]]
      end
    end

    private

    attr_reader :delta_key, :exclude_key, :bye_delta

    def graph
      edges = [].tap do |e|
        (0...players.length).to_a.combination(2).each do |p1_index, p2_index|
          p1 = players[p1_index]
          p2 = players[p2_index]

          if block_given?
            weight = yield(p1, p2)
            e << [p1_index, p2_index, weight] unless weight.nil?
          elsif permitted?(p1, p2)
            e << [p1_index, p2_index, delta(p1, p2)]
          end
        end
      end
      GraphMatching::Graph::WeightedGraph.send('[]', *edges)
    end

    # Checks each player's exclusion list directly rather than building a lists of
    # every permitted target per pair to keep pairings fast.
    def permitted?(a, b) # rubocop:disable Naming/MethodParameterName
      excluded_opponents(a).exclude?(exclusion_key(b)) && excluded_opponents(b).exclude?(exclusion_key(a))
    end

    def delta(a, b) # rubocop:disable Naming/MethodParameterName
      0 - ((delta_value(a) - delta_value(b))**2)
    end

    # Exclusion lists hold player ids, plus the Bye sentinel itself.
    def exclusion_key(player)
      player == Bye ? Bye : player.id
    end

    def delta_value(player)
      return player.send(delta_key) if player.respond_to?(delta_key)

      return bye_delta if player == Bye

      0
    end

    def excluded_opponents(player)
      return player.send(exclude_key) if player.respond_to?(exclude_key)

      []
    end

    def players
      @players ||= @player_data.clone.tap do |data|
        data << Bye unless data.length.even?
      end.shuffle(random: @random)
    end
  end
end
