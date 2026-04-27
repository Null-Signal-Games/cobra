# frozen_string_literal: true

class BetaController < ApplicationController # rubocop:disable Style/Documentation
  def set_beta
    authorize :beta, :beta_testing_enabled?

    cookies[:beta_enabled] = params.fetch(:beta_enabled, 'true')

    redirect_to correct_beta_path(CGI.unescape(params.fetch(:redirect, '/')))
  end

  def help
    authorize :beta, :beta_testing_enabled?
  end
end
