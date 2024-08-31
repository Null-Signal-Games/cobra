# frozen_string_literal: true

class CreateStandingRows < ActiveRecord::Migration[5.0]
  def change
    create_table :standing_rows do |t| # rubocop:disable Rails/CreateTableWithTimestamps
      t.integer :position
      t.references :player, foreign_key: true
      t.references :stage, foreign_key: true
      t.integer :points
      t.decimal :sos
      t.decimal :extended_sos
    end
  end
end
