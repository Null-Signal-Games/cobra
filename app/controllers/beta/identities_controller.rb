# frozen_string_literal: true

module Beta
  class IdentitiesController < ApplicationController # rubocop:disable Style/Documentation
    include IdentitiesHelper

    def index
      skip_authorization

      render json: {
        corp: Identity.where(side: :corp).map { |id| autocomplete_hash(id) }.uniq { |id| id[:label] },
        runner: Identity.where(side: :runner).map { |id| autocomplete_hash(id) }.uniq { |id| id[:label] }
      }
    end
  end
end
