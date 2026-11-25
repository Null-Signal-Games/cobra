# frozen_string_literal: true

# Run using bin/ci

CI.run do
  step 'Setup', 'bin/setup --skip-server'

  step 'Style: Ruby', 'bin/rubocop'

  step 'Security: Gem audit', 'bin/bundler-audit'
  step 'Security: Brakeman code analysis', 'bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error'
  step 'Tests: Seeds', 'env RAILS_ENV=test bin/rails db:seed:replant'

  step 'Tests: System', 'bundle exec rspec'

  step 'Lint: oxlint', 'cd frontend && npm run lint'
  step 'Format: oxfmt', 'cd frontend && npm run fmt:check'
  step 'Lint: Svelte', 'cd frontend && npm run check'
  step 'Tests: Vitest', 'cd frontend && npm run test'

  # Optional: set a green GitHub commit status to unblock PR merge.
  # Requires the `gh` CLI and `gh extension install basecamp/gh-signoff`.
  # if success?
  #   step "Signoff: All systems go. Ready for merge and deploy.", "gh signoff"
  # else
  #   failure "Signoff: CI failed. Do not merge or deploy.", "Fix the issues and try again."
  # end
end
