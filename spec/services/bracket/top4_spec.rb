# frozen_string_literal: true

RSpec.describe Bracket::Top4 do
  let(:tournament) { create(:tournament) }
  let(:stage) { tournament.stages.create(format: :double_elim) }
  let(:bracket) { described_class.new(stage) }

  %w[alpha bravo charlie delta].each do |name|
    let!(name) { create(:player, tournament:, name:) }
  end

  before do
    create(:registration, player: alpha, stage:, seed: 1)
    create(:registration, player: bravo, stage:, seed: 2)
    create(:registration, player: charlie, stage:, seed: 3)
    create(:registration, player: delta, stage:, seed: 4)
  end

  describe '#pair' do
    context 'when round 1' do
      let(:pair) { bracket.pair(1) }

      it 'returns correct pairings' do
        expect(pair).to contain_exactly({ table_number: 1, player1: alpha, player2: delta },
                                        { table_number: 2, player1: bravo, player2: charlie })
      end
    end

    context 'when round 2' do
      let(:pair) { bracket.pair(2) }

      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0
      end

      it 'returns correct pairings' do
        expect(pair).to contain_exactly({ table_number: 3, player1: alpha, player2: bravo },
                                        { table_number: 4, player1: delta, player2: charlie })
      end
    end

    context 'when round 3' do
      let(:pair) { bracket.pair(3) }

      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0

        r2 = create(:round, stage:, completed: true)
        report r2, 3, alpha, 3, bravo, 0
        report r2, 4, delta, 0, charlie, 3
      end

      it 'returns correct pairings' do
        expect(pair).to contain_exactly({ table_number: 5, player1: bravo, player2: charlie })
      end
    end

    context 'when round 4' do
      let(:pair) { bracket.pair(4) }

      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0

        r2 = create(:round, stage:, completed: true)
        report r2, 3, alpha, 3, bravo, 0
        report r2, 4, delta, 0, charlie, 3

        report r2, 5, bravo, 3, charlie, 0
      end

      it 'returns correct pairings' do
        expect(pair).to contain_exactly({ table_number: 6, player1: alpha, player2: bravo })
      end
    end

    context 'when round 5' do
      let(:pair) { bracket.pair(5) }

      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0

        r2 = create(:round, stage:, completed: true)
        report r2, 3, alpha, 3, bravo, 0
        report r2, 4, delta, 0, charlie, 3

        report r2, 5, bravo, 3, charlie, 0
        report r2, 6, alpha, 0, bravo, 3
      end

      it 'returns correct pairings' do
        expect(pair).to contain_exactly({ table_number: 7, player1: bravo, player2: alpha })
      end
    end
  end

  describe '#standings' do
    context 'when complete bracket' do
      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0

        r2 = create(:round, stage:, completed: true)
        report r2, 3, alpha, 3, bravo, 0
        report r2, 4, delta, 0, charlie, 3

        report r2, 5, bravo, 3, charlie, 0
        report r2, 6, alpha, 0, bravo, 3
        report r2, 7, bravo, 3, alpha, 0
      end

      it 'returns correct standings' do
        expect(bracket.standings.map(&:player)).to eq(
          [bravo, alpha, charlie, delta]
        )
      end
    end

    context 'when second final still to play' do
      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0

        r2 = create(:round, stage:, completed: true)
        report r2, 3, alpha, 3, bravo, 0
        report r2, 4, delta, 0, charlie, 3

        report r2, 5, bravo, 3, charlie, 0
      end

      let(:r3) { create(:round, stage:, completed: true) }

      context 'when second final required' do
        before do
          report r3, 6, alpha, 0, bravo, 3
        end

        it 'returns ambiguous top two' do
          expect(bracket.standings.map(&:player)).to eq(
            [nil, nil, charlie, delta]
          )
        end
      end

      context 'when second final not required' do
        before do
          report r3, 6, alpha, 3, bravo, 0
        end

        it 'returns correct top two' do
          expect(bracket.standings.map(&:player)).to eq(
            [alpha, bravo, charlie, delta]
          )
        end
      end
    end

    context 'when multiple rounds still to play' do
      before do
        r1 = create(:round, stage:, completed: true)
        report r1, 1, alpha, 3, delta, 0
        report r1, 2, bravo, 3, charlie, 0

        r2 = create(:round, stage:, completed: true)
        report r2, 3, alpha, 3, bravo, 0
        report r2, 4, delta, 0, charlie, 3
      end

      it 'returns fixed finishes' do
        expect(bracket.standings.map(&:player)).to eq(
          [nil, nil, nil, delta]
        )
      end
    end
  end
end
