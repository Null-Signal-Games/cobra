# frozen_string_literal: true

RSpec.describe Pairing do
  let(:jack) { create(:player) }
  let(:jill) { create(:player) }
  let(:pairing) { create(:pairing, player1: jack, player2: jill) }

  describe '#players' do
    it 'returns both players' do
      expect(pairing.players).to eq([jack, jill])
    end
  end

  describe 'nil players' do
    let(:pairing) { create(:pairing, player1: nil) }
    let(:nil_player) { instance_double(NilPlayer) }

    before do
      allow(NilPlayer).to receive(:new).and_return(nil_player)
    end

    it 'provides null object' do
      expect(pairing.player1).to eq(nil_player)
    end
  end

  describe '.for_player' do
    let(:other) { create(:pairing) }

    it 'returns correct pairings' do
      expect(described_class.for_player(jack)).to eq([pairing])
      expect(described_class.for_player(other.player2)).to eq([other])
    end
  end

  describe '#reported?' do
    let(:pairing) { create(:pairing, score1: nil, score2: nil) }

    context 'when no score reported' do
      it 'returns false' do
        expect(pairing.reported?).to be(false)
      end
    end

    context 'when score reported' do
      before do
        pairing.update(
          score1: 6,
          score2: 0
        )
      end

      it 'returns true' do
        expect(pairing.reported?).to be(true)
      end
    end
  end

  describe '#score_for' do
    before do
      pairing.update(score1: 4, score2: 1)
    end

    context 'when player1' do
      it 'returns correct score' do
        expect(pairing.score_for(jack)).to eq(4)
      end
    end

    context 'when player2' do
      it 'returns correct score' do
        expect(pairing.score_for(jill)).to eq(1)
      end
    end

    context 'when unrelated player' do
      it 'returns nil' do
        expect(pairing.score_for(create(:player))).to be_nil
      end
    end
  end

  describe '#opponent_for' do
    context 'when player1' do
      it 'returns player 2' do
        expect(pairing.opponent_for(jack)).to eq(jill)
      end
    end

    context 'when player2' do
      it 'returns player 1' do
        expect(pairing.opponent_for(jill)).to eq(jack)
      end
    end

    context 'when unrelated player' do
      it 'returns nil' do
        expect(pairing.opponent_for(create(:player))).to be_nil
      end
    end
  end

  describe '#winner' do
    let(:pairing) { create(:pairing, player1: jack, player2: jill, score1: 6, score2: 0) }

    it 'returns winner' do
      expect(pairing.winner).to eq(jack)
    end
  end

  describe '#loser' do
    let(:pairing) { create(:pairing, player1: jack, player2: jill, score1: 6, score2: 0) }

    it 'returns loser' do
      expect(pairing.loser).to eq(jill)
    end
  end

  describe '#player1_side' do
    let(:pairing) { create(:pairing, side: :player1_is_corp) }

    it 'handles corp' do
      expect(pairing.player1_side).to eq(:corp)
    end

    it 'handles runner' do
      pairing.side = :player1_is_runner

      expect(pairing.player1_side).to eq(:runner)
    end

    it 'handles undeclared' do
      pairing.side = nil

      expect(pairing.player1_side).to be_nil
    end
  end

  describe '#player2_side' do
    let(:pairing) { create(:pairing, side: :player1_is_corp) }

    it 'handles runner' do
      expect(pairing.player2_side).to eq(:runner)
    end

    it 'handles corp' do
      pairing.side = :player1_is_runner

      expect(pairing.player2_side).to eq(:corp)
    end

    it 'handles undeclared' do
      pairing.side = nil

      expect(pairing.player2_side).to be_nil
    end
  end

  describe '#cache_standings!' do
    let(:pairing) { create(:pairing, round:) }

    before do
      allow(pairing.stage).to receive(:cache_standings!)
    end

    context 'when round is incomplete' do
      let(:round) { create(:round, completed: false) }

      it 'is not called' do
        pairing.update(score1: 3)

        expect(pairing.stage).not_to have_received(:cache_standings!)
      end
    end

    context 'when round is complete' do
      let(:round) { create(:round, completed: true) }

      it 'is called' do
        pairing.update(score1: 3)

        expect(pairing.stage).to have_received(:cache_standings!)
      end
    end
  end

  describe 'side scores' do
    it 'updates combined score fields' do
      pairing.update(score1_runner: 1, score2_corp: 1, score1_corp: 3, score2_runner: 0)

      expect(pairing.score1).to eq(4)
      expect(pairing.score2).to eq(1)
    end

    it 'handles non-numeric values' do
      pairing.update(score1_runner: 3, score2_corp: nil)

      expect(pairing.score1).to eq(3)
      expect(pairing.score2).to eq(0)
    end
  end
end
