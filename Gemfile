# frozen_string_literal: true

source 'https://rubygems.org'

ruby '~> 3.4.4'

# Gems that have trouble with native packages on alpine.
gem 'nokogiri', force_ruby_platform: true

gem 'bootstrap', '~> 4.6'
gem 'bootstrap-datepicker-rails'
gem 'coffee-rails'
gem 'execjs'
gem 'faraday', '~> 2.14'
gem 'faraday-multipart'
gem 'flipper'
gem 'flipper-active_record'
gem 'font-awesome-rails'
gem 'graphiti'
gem 'graphiti-rails'
gem 'graph_matching'
gem 'jbuilder'
gem 'jquery-rails'
gem 'js-routes'
gem 'kaminari', '~> 1.0'
gem 'net-http'
gem 'ostruct'
gem 'pg', '~> 1.3'
gem 'puma'
gem 'pundit'
gem 'rails', '~> 8'
gem 'rails_semantic_logger'
gem 'redcarpet'
gem 'responders'
gem 'rqrcode'
gem 'sassc-rails'
gem 'scenic'
gem 'simple_form'
gem 'slim-rails'
gem 'turbolinks', '~> 5'
gem 'uglifier', '>= 1.3.0'
gem 'vite_rails'

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
  gem 'capybara'
  gem 'database_cleaner'
  gem 'faker'
  gem 'launchy'
  gem 'rspec-rails'
  gem 'vcr'
end

group :development do
  gem 'listen'
  gem 'rubocop'
  gem 'rubocop-capybara'
  gem 'rubocop-factory_bot'
  gem 'rubocop-rails'
  gem 'rubocop-rspec'
  gem 'rubocop-rspec_rails'
  gem 'spring'
  gem 'stackprof'
end
