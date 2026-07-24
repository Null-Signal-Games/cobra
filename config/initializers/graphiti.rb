# frozen_string_literal: true

Graphiti.cache = Rails.cache

Graphiti.configure do |config|
  config.cache_rendering = true
  config.pagination_links = true
end

# Patch Graphiti::Delegates::Pagination to resolve route placeholders (e.g. :tournament_id) in top-level self and pagination links.
module Graphiti
  module Delegates
    class Pagination
      alias_method :orig_pagination_link, :pagination_link

      def pagination_link(page)
        link_str = orig_pagination_link(page)
        return link_str unless link_str

        params_hash = pagination_params.with_indifferent_access
        filter_params = (params_hash[:filter] || {}).with_indifferent_access

        link_str.gsub(/:([a-zA-Z_]+)/) do |match|
          param_name = $1
          params_hash[param_name] || filter_params[param_name] || match
        end
      end
    end
  end
end
