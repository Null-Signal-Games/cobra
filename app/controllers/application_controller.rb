# frozen_string_literal: true

class ApplicationController < ActionController::Base # rubocop:disable Style/Documentation
  protect_from_forgery with: :exception

  include Pundit::Authorization

  after_action :verify_authorized
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorised
  rescue_from ActiveRecord::RecordNotFound, with: :error

  helper_method :current_user, :user_signed_in?

  def current_user
    @current_user ||= load_current_user
  end

  def user_signed_in?
    !!current_user
  end

  protected

  def set_tournament
    @tournament = Tournament.find(params[:tournament_id])
  end

  private

  def user_not_authorised
    render json: { error: "🔒 Sorry, you can't do that" }, status: :unauthorized
  end

  def error
    render json: { error: 'Not found' }, status: :not_found
  end

  def load_current_user
    id = session[:user_id]
    return nil unless id

    User.find_by(id:)
  end
end
