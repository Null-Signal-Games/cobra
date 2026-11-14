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

  # While there is not a SummarizedPairings model, this is reasonable place to put these tests.
  describe '#summarized_pairings_view' do
    let(:tournament1) { create(:tournament, swiss_format: :single_sided) }
    let(:stage1) { tournament1.current_stage }
    let(:plural) { create(:player, name: 'plural') }
    let(:evie) { create(:player, name: 'evie') }
    let(:spiderbro) { create(:player, name: 'spiderbro') }
    let(:stwyde) { create(:player, name: 'stwyde') }
    let(:lia) { create(:player, name: 'lia') }

    let(:pairing1) { create(:pairing, stage: stage1, player1: plural, player2: evie, side: :player1_is_corp) }
    let(:pairing2) { create(:pairing, stage: stage1, player1: stwyde, player2: spiderbro, side: :player1_is_runner) }
    let(:pairing3) { create(:pairing, stage: stage1, player1: lia, player2: nil) }

    let(:tournament2) { create(:tournament, swiss_format: :double_sided) }
    let(:stage2) { tournament2.current_stage }
    let(:pairing4) { create(:pairing, stage: stage2, player1: lia, player2: evie) }
    let(:pairing5) { create(:pairing, stage: stage2, player1: spiderbro, player2: plural) }
    let(:pairing6) { create(:pairing, stage: stage2, player1: stwyde, player2: nil) }

    context 'across tournament and pairing types' do
      it 'returns the correct pairings' do
        pairing1.save!
        pairing2.save!
        pairing3.save!
        pairing4.save!
        pairing5.save!
        pairing6.save!

        sql = ActiveRecord::Base.sanitize_sql(
          'SELECT * FROM summarized_pairings'
        )
        rows = ActiveRecord::Base.connection.exec_query(sql).to_a

        # Number of pairings records maatches number of summarized_pairings records.
        expect(described_class.count).to eq(rows.length)

        # Check pairing players and sides
        summarized_map = {}
        rows.each do |r|
          summarized_map[r['pairing_id']] =
            { p1: r['player1_id'], p2: r['player2_id'], stage_format: r['stage_format'], side: r['side'] }
        end

        expect({
                 pairing1.id => {
                   p1: plural.id, p2: evie.id, side: 1, stage_format: 2
                 },
                 pairing2.id => {
                   p1: stwyde.id, p2: spiderbro.id, side: 2, stage_format: 2
                 },
                 pairing3.id => {
                   p1: lia.id, p2: nil, side: nil, stage_format: 2
                 },
                 pairing4.id => {
                   p1: lia.id, p2: evie.id, side: nil, stage_format: 0
                 },
                 pairing5.id => {
                   p1: spiderbro.id, p2: plural.id, side: nil, stage_format: 0
                 },
                 pairing6.id => {
                   p1: stwyde.id, p2: nil, side: nil, stage_format: 0
                 }
               }).to eq(summarized_map)
      end
    end
  end

  describe 'tied scores in elimination stages are not allowed' do
    let(:stage) { create(:stage, format: :single_elim) }
    let(:round) { create(:round, stage:) }
    let(:pairing) { create(:pairing, round:, score1: nil, score2: nil) }

    it 'rejects a tied custom score' do
      expect(pairing.update(score1: 3, score2: 3)).to be(false)
      expect(pairing.errors[:base]).to include('Elimination games cannot end in a tie')
    end

    it 'rejects a tie entered as side scores' do
      expect(pairing.update(score1_corp: 3, score2_runner: 3)).to be(false)
    end

    it 'allows a decisive score' do
      expect(pairing.update(score1: 3, score2: 0)).to be(true)
    end

    it 'allows an unreported pairing' do
      expect(pairing).to be_valid
    end

    it 'allows ties in swiss stages' do
      swiss_pairing = create(:pairing, score1: nil, score2: nil)

      expect(swiss_pairing.update(score1: 3, score2: 3)).to be(true)
    end
  end
end
