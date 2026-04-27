# frozen_string_literal: true

class Registration < ApplicationRecord # rubocop:disable Style/Documentation
  belongs_to :stage
  belongs_to :player
end
