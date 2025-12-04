# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the CardCycle resource.
      class TournamentsController < PublicApiController
        def index
          add_total_stat(params)

          base_scope = Tournament.public_tournaments.includes(%i[user])
          tournaments = TournamentResource.all(params, base_scope)
          respond_with(tournaments)
        end

        def show
          base_scope = Tournament.public_tournaments.includes(%i[user])
          tournament = TournamentResource.find(params, base_scope)
          respond_with(tournament)
        end
      end
    end
  end
end
