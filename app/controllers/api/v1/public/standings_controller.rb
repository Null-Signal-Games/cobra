# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the Standing resource.
      class StandingsController < PublicApiController
        def index
          params[:filter] ||= {}
          params[:filter][:tournament_id] = params[:tournament_id]
          add_total_stat(params)
          base_scope = standings_base_scope
          standings = StandingResource.all(params, base_scope)
          respond_with(standings)
        end

        def show
          base_scope = standings_base_scope.where(tournament_id: params[:tournament_id])
          standing = StandingResource.find(params, base_scope)
          respond_with(standing)
        end

        private

        def standings_base_scope
          tournaments_scope = Tournament.public_tournaments
          if current_user.present?
            private_owned_scope = Tournament.where(private: true, user_id: current_user.id)
            tournaments_scope = tournaments_scope.or(private_owned_scope)
          end
          SummarizedStanding.where(tournament: tournaments_scope)
        end
      end
    end
  end
end
