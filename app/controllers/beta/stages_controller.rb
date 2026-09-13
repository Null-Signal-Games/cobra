# frozen_string_literal: true

module Beta
  class StagesController < ApplicationController # rubocop:disable Style/Documentation
    before_action :set_tournament
    before_action :set_stage, only: %i[destroy]
    before_action :authorize_beta_testing

    def create
      authorize @tournament, :update?

      stage = @tournament.stages.create(format: (@tournament.single_sided? ? :single_sided_swiss : :swiss))
      @tournament.players.each { |p| stage.players << p }

      head :ok
    end

    def destroy
      authorize @tournament, :update?

      confirmation_name = params[:confirmation_name]
      if confirmation_name.blank? || confirmation_name.strip != @tournament.name.strip
        return render json: { error: 'Confirmation name does not match the tournament name' },
                      status: :unprocessable_content
      end

      @stage.destroy!

      head :ok
    end

    private

    def set_stage
      @stage = Stage.find(params[:id])
    end
  end
end
