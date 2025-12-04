# frozen_string_literal: true

module Api
  module V1
    module Public
      # Base controller for NRDB API Resources.
      class PublicApiController < ActionController::API
        include Graphiti::Rails::Responders

        register_exception Graphiti::Errors::RecordNotFound,
                           message: ->(_e) { 'Contact us at 123-456-7899' }

        def add_total_stat(params)
          params['stats'] = {} unless params.include?('stats')
          params['stats']['total'] = 'count'
        end
      end
    end
  end
end
