# frozen_string_literal: true

module Api
  module V1
    module Public
      # Controller for the User resource.
      class UsersController < PublicApiController
        def show
          user = UserResource.find(params)
          respond_with(user)
        end
      end
    end
  end
end
