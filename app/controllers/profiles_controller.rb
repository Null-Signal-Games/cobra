# frozen_string_literal: true

class ProfilesController < ApplicationController
  def index
    skip_authorization
  end
end
