# frozen_string_literal: true

RSpec.describe TournamentHelper do
  describe '#short_date' do
    let(:tournament) { create(:tournament, created_at: '2017/01/02', date: '2017/01/04') }

    it 'returns date when date exists' do
      expect(helper.short_date(tournament)).to eq('4 Jan 2017')
    end

    it 'returns nil when no date is set' do
      tournament.update(date: nil)

      expect(helper.short_date(tournament)).to be_nil
    end
  end

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
