# frozen_string_literal: true

module Beta
  class StagesController < ApplicationController
    before_action :set_tournament
    before_action :set_stage, only: %i[destroy]

    def create
      authorize @tournament, :update?

      stage = @tournament.stages.create(format: (@tournament.single_sided? ? :single_sided_swiss : :swiss))
      @tournament.players.each { |p| stage.players << p }

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def destroy
      authorize @tournament, :update?

      @stage.destroy!

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def set_stage
      @stage = Stage.find(params[:id])
    end
  end
end
