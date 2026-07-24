# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the Round resource.
      class RoundsController < PublicApiController
        def index
          params[:filter] ||= {}
          params[:filter][:tournament_id] = params[:tournament_id]
          add_total_stat(params)
          base_scope = rounds_base_scope
          rounds = RoundResource.all(params, base_scope)
          respond_with(rounds)
        end

        def show
          base_scope = rounds_base_scope.where(tournament_id: params[:tournament_id])
          round = RoundResource.find(params, base_scope)
          respond_with(round)
        end

        private

        def rounds_base_scope
          tournaments_scope = Tournament.public_tournaments
          if current_user.present?
            private_owned_scope = Tournament.where(private: true, user_id: current_user.id)
            tournaments_scope = tournaments_scope.or(private_owned_scope)
          end
          Round.where(tournament: tournaments_scope)
        end
      end
    end
  end
end
