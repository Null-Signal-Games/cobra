# frozen_string_literal: true

module SwissTables # rubocop:disable Style/Documentation
  def self.assign_table_numbers!(pairings, table_ranges = [])
    PairingOrder.new(pairings, table_ranges).apply_numbers!
  end

  class PairingOrder # rubocop:disable Style/Documentation
    def initialize(pairings, table_ranges)
      @non_byes = []
      @byes = []
      @fixed_tables = []
      pairings.each do |pairing|
        if pairing.fixed_table_number?
          @fixed_tables << pairing
        elsif pairing.bye?
          @byes << pairing
        else
          @non_byes << pairing
        end
      end

      @table_ranges = table_ranges
    end

    def apply_numbers!
      numbers = Numbers.new(@table_ranges)
      @fixed_tables.each do |pairing|
        number = pairing.fixed_table_number
        numbers.exclude_fixed number
        pairing.table_number = number
      end
      PairingSorters::Ranked.sort(@non_byes).each do |pairing|
        pairing.table_number = numbers.next
      end
      @byes.each do |pairing|
        pairing.table_number = numbers.next
      end
    end
  end

  class Numbers # rubocop:disable Style/Documentation
    def initialize(table_ranges)
      @fixed_numbers = Set[]
      @table_ranges = table_ranges
      @current_table_range = @table_ranges[0]
      @next_number = @current_table_range ? @current_table_range.first_table : 1
    end

    def exclude_fixed(number)
      @fixed_numbers << number
    end

    def next
      increment_next_number while @fixed_numbers.include? @next_number
      number = @next_number
      increment_next_number
      number
    end

    private

    def increment_next_number
      @next_number += 1
      return if @current_table_range.nil? || @next_number <= @current_table_range.last_table

      # Move to next table range
      @current_table_range = @table_ranges[@table_ranges.find_index(@current_table_range) + 1]
      @next_number = @current_table_range.first_table if @current_table_range
    end
  end
end
