# frozen_string_literal: true

class ProfilesController < ApplicationController # rubocop:disable Style/Documentation
  def index
    skip_authorization
  end
end
