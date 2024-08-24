# frozen_string_literal: true

class OauthController < ApplicationController
  before_action :skip_authorization

  def auth
    session[:return_to] = params[:return_to]
    redirect_to Nrdb::Oauth.auth_uri(request.host), allow_other_host: true
  end

  def logout
    session[:user_id] = nil

    redirect_to root_path
  end

  def callback
    if callback_code
      token_data = Nrdb::Oauth.get_access_token(callback_code)

      user_data = Nrdb::Connection.new(nil, token_data[:access_token]).player_info.first

      user = User.find_or_create_by(nrdb_id: user_data[:id])
      user.update(
        nrdb_username: user_data[:username],
        nrdb_access_token: token_data[:access_token],
        nrdb_refresh_token: token_data[:refresh_token]
      )

      session[:user_id] = user.id

      redirect_to session[:return_to] || root_path
    else
      render json: { message: :failed }, status: :internal_server_error
    end
  end

  private

  def callback_code
    params.require(:code)
  end
end
