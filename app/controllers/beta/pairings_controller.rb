# frozen_string_literal: true

module Beta
  class PairingsController < ApplicationController # rubocop:disable Style/Documentation
    before_action :set_tournament
    before_action :authorize_beta_testing
    attr_reader :tournament

    def index
      authorize @tournament, :show?
    end

    def create
      authorize @tournament, :update?

      round.pairings.create(pairing_params)

      head :ok
    end

    def destroy
      authorize @tournament, :update?

      pairing.destroy

      head :ok
    end

    def match_slips
      authorize @tournament, :edit?
    end

    def report
      return self_report if params[:self_report]

      authorize @tournament, :update?

      save_report

      head :ok
    end

    def reset_self_report
      authorize @tournament, :update?

      SelfReport.where(pairing_id: pairing.id).destroy_all

      head :ok
    end

    private

    def round
      @round ||= Round.find(params[:round_id])
    end

    def pairing
      @pairing ||= Pairing.find(params[:id])
    end

    def pairing_params
      params.require(:pairing).permit(:player1_id, :player2_id, :table_number, :side)
    end

    def score_params(self_report: false)
      params.require(:self_report) if self_report
      params.require(:pairing)
            .permit(:score1_runner, :score1_corp, :score2_runner, :score2_corp,
                    :score1, :score2, :side, :intentional_draw, :two_for_one)
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

    def self_report
      authorize @tournament, :self_report?
      authorize pairing, :can_self_report?

      self_report_score = score_params(self_report: true)
                          .merge(pairing_id: pairing.id)
                          .merge(report_player_id: current_user.id)
      SelfReport.create(self_report_score)

      # if both players have reported and the reported scores match, finalize scores for the pairing
      reports = Pairing.find(params[:id]).self_reports

      if reports.size == 2
        # if reports don't match, do nothing (later replaced by notification)
        if reports[0].score1 != reports[1].score1 ||
           reports[0].score2 != reports[1].score2 ||
           reports[0].score1_corp != reports[1].score1_corp ||
           reports[0].score2_corp != reports[1].score2_corp ||
           reports[0].score1_runner != reports[1].score1_runner ||
           reports[0].score2_runner != reports[1].score2_runner

          return head :ok
        end

        save_report
      end

      head :ok
    end
  end
end
