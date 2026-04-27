# frozen_string_literal: true

class TableRange < ApplicationRecord # rubocop:disable Style/Documentation
  belongs_to :stage, touch: true

  default_scope { order(:first_table) }

  def in_range?(table_number)
    table_number.between?(first_table, last_table)
  end
end
