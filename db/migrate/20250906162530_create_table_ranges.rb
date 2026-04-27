# frozen_string_literal: true

class CreateTableRanges < ActiveRecord::Migration[7.2]
  def change
    create_table :table_ranges do |t|
      t.integer :stage_id
      t.integer :first_table, null: false
      t.integer :last_table, null: false
      t.index [:stage_id], name: 'index_table_ranges_on_stages'
    end

    add_foreign_key :table_ranges, :stages, column: :stage_id
  end
end
