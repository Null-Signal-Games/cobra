# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the Pairing resource.
      class PairingsController < PublicApiController
        def index
          params[:filter] ||= {}
          params[:filter][:tournament_id] = params[:tournament_id]
          add_total_stat(params)
          base_scope = pairings_base_scope
          pairings = PairingResource.all(params, base_scope)
          respond_with(pairings)
        end

        def show
          base_scope = pairings_base_scope.where(rounds: { tournament_id: params[:tournament_id] })
          pairing = PairingResource.find(params, base_scope)
          respond_with(pairing)
        end

        private

        def pairings_base_scope
          tournaments_scope = Tournament.public_tournaments
          if current_user.present?
            private_owned_scope = Tournament.where(private: true, user_id: current_user.id)
            tournaments_scope = tournaments_scope.or(private_owned_scope)
          end
          Pairing.joins(:round).where(rounds: { tournament: tournaments_scope })
        end
      end
    end
  end
end
