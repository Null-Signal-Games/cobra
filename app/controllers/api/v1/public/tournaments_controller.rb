# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the CardCycle resource.
      class TournamentsController < PublicApiController
        def index
          add_total_stat(params)

          Rails.logger.info "Current user: #{current_user&.id}"
          base_scope = tournaments_base_scope
          tournaments = TournamentResource.all(params, base_scope)
          respond_with(tournaments)
        end

        def show
          base_scope = tournaments_base_scope
          tournament = TournamentResource.find(params, base_scope)
          respond_with(tournament)
        end

        private

        def tournaments_base_scope
          base_scope = Tournament.public_tournaments
          if current_user.present?
            private_owned_scope = Tournament.where(private: true, user_id: current_user.id)
            base_scope = base_scope.or(private_owned_scope)
          end
          base_scope.includes(%i[deckbuilding_restriction format official_prize_kit stages tournament_type user])
        end
      end
    end
  end
end
