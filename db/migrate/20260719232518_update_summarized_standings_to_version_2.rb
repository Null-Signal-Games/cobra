# frozen_string_literal: true

class UpdateSummarizedStandingsToVersion2 < ActiveRecord::Migration[8.1]
  def change
    update_view :summarized_standings,
                version: 2,
                revert_to_version: 1
  end
end
