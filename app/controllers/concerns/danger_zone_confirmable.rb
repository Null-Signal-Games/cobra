# frozen_string_literal: true

module DangerZoneConfirmable # rubocop:disable Style/Documentation
  extend ActiveSupport::Concern

  private

  def validate_confirmation_name
    authorize @tournament, :destroy?

    return if params[:confirmation_name].present? && params[:confirmation_name].strip == @tournament.name.strip

    respond_to do |format|
      format.html do
        redirect_back_or_to danger_zone_tournament_path(@tournament),
                            alert: 'Confirmation name does not match the tournament name'
      end
      format.json do
        render json: { error: 'Confirmation name does not match the tournament name' },
               status: :unprocessable_content
      end
    end
  end
end
