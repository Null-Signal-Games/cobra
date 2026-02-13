# frozen_string_literal: true

class BetaController < ApplicationController
  def set_beta
    authorize :beta, :beta_testing_enabled?

    cookies[:beta_enabled] = params.fetch(:beta_enabled, 'true')

    redirect_to correct_beta_path(CGI.unescape(params.fetch(:redirect, '/')))
  end
end
