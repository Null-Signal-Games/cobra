# frozen_string_literal: true

class AddStatusToTournaments < ActiveRecord::Migration[5.0]
  def change
    add_column :tournaments, :status, :integer, default: 0
  end
end
