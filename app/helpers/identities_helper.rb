# frozen_string_literal: true

module IdentitiesHelper # rubocop:disable Style/Documentation
  def autocomplete_hash(id)
    { label: id.autocomplete, value: id.name }
  end
end
