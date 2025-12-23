# frozen_string_literal: true

module Beta
  class PairingsController < ApplicationController
    before_action :set_tournament
    attr_reader :tournament

    def destroy
      authorize @tournament, :update?

      pairing.destroy

      render json: { url: tournament_round_path(tournament, round) }, status: :ok
    end

    def report
      authorize @tournament, :update?

      save_report

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def reset_self_report
      authorize @tournament, :update?

      SelfReport.where(pairing_id: pairing.id).destroy_all

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def save_report
      pairing.update(score_params)

      return unless score_params.key?('side') && pairing.reported?

      score1_corp = pairing.score1_corp
      pairing.score1_corp = pairing.score1_runner
      pairing.score1_runner = score1_corp

      score2_corp = pairing.score2_corp
      pairing.score2_corp = pairing.score2_runner
      pairing.score2_runner = score2_corp

      pairing.save
    end

    def round
      @round ||= Round.find(params[:round_id])
    end

    def pairing
      @pairing ||= Pairing.find(params[:id])
    end

    def score_params
      params.require(:pairing)
            .permit(:score1_runner, :score1_corp, :score2_runner, :score2_corp,
                    :score1, :score2, :side, :intentional_draw, :two_for_one)
    end
  end
end
