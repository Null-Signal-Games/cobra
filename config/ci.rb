# frozen_string_literal: true

# Run using bin/ci

CI.run do
  step 'Setup', 'bin/setup --skip-server'

  step 'Style: Ruby', 'bin/rubocop'

  step 'Security: Gem audit', 'bin/bundler-audit'
  step 'Security: Brakeman code analysis', 'bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error'
  step 'Tests: Rails', 'bin/rails test'
  step 'Tests: Seeds', 'env RAILS_ENV=test bin/rails db:seed:replant'

  step 'Tests: System', 'bundle exec rspec'

  step 'Lint: Javascript', 'npm run lint'
  step 'Lint: Svelte', 'npm run svelte-check'
  step 'Tests: Vite', 'npm run test'

  # Optional: set a green GitHub commit status to unblock PR merge.
  # Requires the `gh` CLI and `gh extension install basecamp/gh-signoff`.
  # if success?
  #   step "Signoff: All systems go. Ready for merge and deploy.", "gh signoff"
  # else
  #   failure "Signoff: CI failed. Do not merge or deploy.", "Fix the issues and try again."
  # end
end
