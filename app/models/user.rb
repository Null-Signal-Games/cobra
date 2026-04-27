# frozen_string_literal: true

class User < ApplicationRecord # rubocop:disable Style/Documentation
  has_many :tournaments

  def flipper_id
    nrdb_username
  end
end
