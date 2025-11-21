# frozen_string_literal: true

require 'simplecov'
require 'simplecov-cobertura'
SimpleCov.coverage_dir 'coverage/spec'
SimpleCov.enable_coverage :branch
SimpleCov.formatter = SimpleCov::Formatter::CoberturaFormatter

SimpleCov.start do
  add_filter 'spec/'
  add_filter 'test/'
  add_group 'Controllers', 'app/controllers'
  add_group 'Models', 'app/models'
  add_group 'Resources', 'app/resources'
  add_group 'Libraries', 'lib'
end

Capybara.register_driver :playwright do |app|
  Capybara::Playwright::Driver.new(app, browser_type: :firefox, headless: false) # TODO: This need to be true
end
Capybara.default_max_wait_time = 60
Capybara.default_driver = :playwright

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.disable_monkey_patching!

  config.default_formatter = 'doc' if config.files_to_run.one?

  config.order = :random
  Kernel.srand config.seed
end
