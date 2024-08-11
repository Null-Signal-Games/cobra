# frozen_string_literal: true

class AddFirstRoundByeToPlayers < ActiveRecord::Migration[5.0] # rubocop:disable Style/Documentation
  def change
    add_column :players, :first_round_bye, :boolean, default: false
  end
end
