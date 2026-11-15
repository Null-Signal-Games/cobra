# frozen_string_literal: true

RSpec.describe PairingStrategies::SingleElim do
  let(:round) { create(:round, number: 1, stage:) }
  let(:stage) { tournament.current_stage }
  let(:tournament) { create(:tournament) }

  context 'top 8' do
    %w[alexr evie jo_z spiderbro locks stwyde plural sindarin].each_with_index do |name, i|
      let!(name) { create(:player, tournament:, name:, seed: i + 1) }
    end

    it 'passes its random source to SideDeterminer' do
      random = Random.new(42)
      allow(SideDeterminer).to receive(:determine_sides).and_call_original

      described_class.new(round, random).pair!

      expect(SideDeterminer).to have_received(:determine_sides)
        .with(anything, anything, stage, random:).exactly(4).times
    end
  end
end
