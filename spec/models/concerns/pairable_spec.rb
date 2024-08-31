# frozen_string_literal: true

RSpec.describe Pairable do
  let(:player) { create(:player) }
  let(:jack) { create(:player) }
  let(:jill) { create(:player) }

  describe '#unpairable_opponents' do
    before do
      create(:pairing, player1: player, player2: jack)
      create(:pairing, player1: jill, player2: player)
      create(:pairing, player1: player, player2: nil)
    end

    it 'returns opponents with special bye class' do
      expect(player.unpairable_opponents).to contain_exactly(jack, jill, SwissImplementation::Bye)
    end
  end
end
