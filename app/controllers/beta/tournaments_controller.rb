# frozen_string_literal: true

module Beta
  class TournamentsController < ApplicationController
    before_action :set_tournament, only: %i[
      open_registration close_registration lock_player_registrations unlock_player_registrations
      cut
    ]

    def open_registration
      authorize @tournament, :edit?

      @tournament.open_registration!

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def close_registration
      authorize @tournament, :edit?

      @tournament.close_registration!

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def lock_player_registrations
      authorize @tournament, :edit?

      @tournament.lock_player_registrations!

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def unlock_player_registrations
      authorize @tournament, :edit?

      @tournament.unlock_player_registrations!

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def cut
      authorize @tournament

      number = params[:number].to_i
      format = params[:elimination_type] == 'single' ? :single_elim : :double_elim
      return redirect_to standings_tournament_players_path(@tournament) unless [3, 4, 8, 16].include? number

      @tournament.cut_to!(format, number)

      render json: { url: beta_tournament_rounds_path(@tournament) }, status: :ok
    end

    def set_tournament
      @tournament = Tournament.find(params[:id])
    end
  end
end
