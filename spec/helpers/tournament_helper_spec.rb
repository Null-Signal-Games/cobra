# frozen_string_literal: true

RSpec.describe TournamentHelper do
  describe '#time_zone_options' do
    it 'lists IANA zones labelled without underscores' do
      expect(helper.time_zone_options).to include(
        { id: 'UTC', name: 'UTC' },
        { id: 'America/Chicago', name: 'America/Chicago' },
        { id: 'America/New_York', name: 'America/New York' },
        { id: 'US/Eastern', name: 'US/Eastern' }
      )
    end
  end
end
