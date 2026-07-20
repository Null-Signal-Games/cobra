# frozen_string_literal: true

# Read-only model representing a player's standing row in a stage
# mapped to the database view summarized_standings.
# For incomplete cuts, SummarizedStanding may have null player fields.
class SummarizedStanding < ApplicationRecord
  self.table_name = 'summarized_standings'

  belongs_to :tournament
  belongs_to :stage
  belongs_to :player, optional: true

  self.primary_key = :id

  def readonly?
    true
  end

  # Returns a unique composite ID using stage_id and position.
  # Position is guaranteed non-null in summarized_standings.
  def id
    "#{stage_id}:#{position}"
  end

  # Override count to avoid syntax errors on composite/missing primary key
  def self.count(*_args)
    super(:all)
  end
end
