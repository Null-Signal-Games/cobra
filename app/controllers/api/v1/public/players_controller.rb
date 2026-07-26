# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the Player resource. A tournament ID is required and enforced in the resource.
      class PlayersController < PublicApiController
        def index
          params[:filter] ||= {}
          params[:filter][:tournament_id] = params[:tournament_id]
          add_total_stat(params)
          base_scope = players_base_scope
          players = PlayerResource.all(params, base_scope)
          respond_with(players)
        end

        def show
          base_scope = players_base_scope.where(tournament_id: params[:tournament_id])
          player = PlayerResource.find(params, base_scope)
          respond_with(player)
        end

        private

        def players_base_scope
          tournaments_scope = Tournament.public_tournaments
          if current_user.present?
            private_owned_scope = Tournament.where(private: true, user_id: current_user.id)
            tournaments_scope = tournaments_scope.or(private_owned_scope)
          end
          Player.where(tournament: tournaments_scope)
        end
      end
    end
  end
end
