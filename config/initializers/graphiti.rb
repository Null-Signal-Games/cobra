# frozen_string_literal: true

Graphiti.cache = ::Rails.cache

Graphiti.configure do |config|
  config.cache_rendering = true
  config.pagination_links = true
end
