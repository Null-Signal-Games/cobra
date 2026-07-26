# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the Stage resource.
      class StagesController < PublicApiController
        def index
          params[:filter] ||= {}
          params[:filter][:tournament_id] = params[:tournament_id]
          add_total_stat(params)
          base_scope = stages_base_scope
          stages = StageResource.all(params, base_scope)
          respond_with(stages)
        end

        def show
          base_scope = stages_base_scope.where(tournament_id: params[:tournament_id])
          stage = StageResource.find(params, base_scope)
          respond_with(stage)
        end

        private

        def stages_base_scope
          tournaments_scope = Tournament.public_tournaments
          if current_user.present?
            private_owned_scope = Tournament.where(private: true, user_id: current_user.id)
            tournaments_scope = tournaments_scope.or(private_owned_scope)
          end
          Stage.where(tournament: tournaments_scope)
        end
      end
    end
  end
end
