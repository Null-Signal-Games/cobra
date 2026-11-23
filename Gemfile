# frozen_string_literal: true

source 'https://rubygems.org'

ruby '~> 3.4'

# Gems that have trouble with native packages on alpine.
gem 'nokogiri', force_ruby_platform: true

gem 'faraday', '~> 2.14'
gem 'faraday-multipart'
gem 'flipper'
gem 'flipper-active_record'
gem 'graphiti'
gem 'graphiti-rails'
gem 'graph_matching'
gem 'kaminari', '~> 1.3'
gem 'net-http'
gem 'ostruct'
gem 'pg', '~> 1.3'
gem 'puma'
gem 'pundit'
gem 'rack-cors'
gem 'rails', '~> 8'
gem 'rails_semantic_logger'
gem 'responders'
gem 'scenic'
# Bundled IANA zone data, so time zones match everywhere instead of depending on the OS's tzdata.
gem 'tzinfo-data'

group :development, :test do
  gem 'brakeman'
  gem 'bullet'
  gem 'debug'
  gem 'factory_bot_rails', require: false
  gem 'graphiti_spec_helpers'
  gem 'pry'
  gem 'ruby-lsp'
  gem 'ruby-lsp-rails', require: false
  gem 'ruby-lsp-rails-factory-bot', require: false
  gem 'ruby-lsp-rspec', require: false
  gem 'simplecov'
  gem 'simplecov-cobertura'
end

group :test do
  gem 'bundler-audit'
  gem 'database_cleaner'
  gem 'faker'
  gem 'rspec-rails'
  gem 'vcr'
end

group :development do
  gem 'listen'
  gem 'rubocop'
  gem 'rubocop-factory_bot'
  gem 'rubocop-rails'
  gem 'rubocop-rspec'
  gem 'rubocop-rspec_rails'
  gem 'spring'
  gem 'stackprof'
end
