# frozen_string_literal: true

module Beta
  class StagesController < ApplicationController # rubocop:disable Style/Documentation
    include DangerZoneConfirmable

    before_action :set_tournament
    before_action :set_stage, only: %i[destroy]
    before_action :authorize_beta_testing
    before_action :validate_confirmation_name, only: :destroy

    def create
      authorize @tournament, :update?

      stage = @tournament.stages.create(format: (@tournament.single_sided? ? :single_sided_swiss : :swiss))
      @tournament.players.each { |p| stage.players << p }

      head :ok
    end

    def destroy
      @stage.destroy!

      head :ok
    end

    private

    def set_stage
      @stage = Stage.find(params[:id])
    end
  end
end
