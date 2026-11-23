# frozen_string_literal: true

RSpec.describe Round do
  let(:round) { create(:round) }
  let(:pairer) { instance_double(Pairer, pair!: true) }

  before do
    allow(Pairer).to receive(:new).and_return(pairer)
  end

  describe 'ordering' do
    before do
      create(:pairing, round:, table_number: 2)
      create(:pairing, round:, table_number: 1)
      create(:pairing, round:, table_number: 3)
    end

    it 'returns pairings by table' do
      expect(round.pairings.map(&:table_number)).to eq([1, 2, 3])
    end
  end

  describe '#pair!' do
    it 'invokes Pairer' do
      round.pair!

      expect(Pairer).to have_received(:new).with(round)
      expect(pairer).to have_received(:pair!)
    end
  end

  describe '#unpaired_players' do
    let!(:snap) { create(:player, tournament:) }
    let!(:crackle) { create(:player, tournament:) }
    let!(:pop) { create(:player, tournament:) }
    let(:tournament) { round.tournament }

    before do
      round.pairings.create(player1: snap, player2: crackle)
    end

    it 'returns players who have not been paired' do
      expect(round.unpaired_players).to eq([pop])
    end
  end

  describe '#repair!' do
    before do
      round.pairings << create(:pairing)
    end

    it 'destroys pairings' do
      expect do
        round.repair!
      end.to change(round.pairings, :count).by(-1)
    end

    it 'invokes pairer' do
      round.repair!

      expect(Pairer).to have_received(:new)
      expect(pairer).to have_received(:pair!)
    end
  end

  describe '#cache_standings!' do
    before do
      allow(round.stage).to receive(:cache_standings!)
    end

    context 'when completed' do
      let(:round) { create(:round, completed: true) }

      it 'is not called' do
        round.update(completed: true)

        expect(round.stage).not_to have_received(:cache_standings!)
      end
    end

    context 'when not completed' do
      let(:round) { create(:round, completed: false) }

      it 'is called when round is completed' do
        round.update(completed: true)

        expect(round.stage).to have_received(:cache_standings!)
      end

      it 'is not called when round remains incomplete' do
        round.update(number: 1)

        expect(round.stage).not_to have_received(:cache_standings!)
      end
    end
  end
end
