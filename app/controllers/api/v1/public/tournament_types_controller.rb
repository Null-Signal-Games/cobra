# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the CardCycle resource.
      class TournamentTypesController < PublicApiController
        def index
          add_total_stat(params)
          tournament_types = TournamentTypeResource.all(params)
          respond_with(tournament_types)
        end

        def show
          tournament_type = TournamentTypeResource.find(params)
          respond_with(tournament_type)
        end
      end
    end
  end
end
