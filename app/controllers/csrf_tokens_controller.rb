# frozen_string_literal: true

# Issues a CSRF token tied to the caller's session so the Svelte frontend can make
# state-changing requests to session-authenticated controllers.
class CsrfTokensController < ApplicationController
  before_action :skip_authorization

  def show
    render json: { csrf_token: form_authenticity_token }
  end
end
