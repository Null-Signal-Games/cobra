# frozen_string_literal: true

RSpec.describe Bracket::Factory do
  describe '.valid_bracket?' do
    it 'returns true for valid brackets' do
      expect(described_class.valid_bracket?(2, single_elim: true)).to be true
      expect(described_class.valid_bracket?(3, single_elim: true)).to be true
      expect(described_class.valid_bracket?(4, single_elim: true)).to be true
      expect(described_class.valid_bracket?(8, single_elim: true)).to be true
      expect(described_class.valid_bracket?(16, single_elim: true)).to be true
      expect(described_class.valid_bracket?(4)).to be true
      expect(described_class.valid_bracket?(8)).to be true
      expect(described_class.valid_bracket?(16)).to be true
    end

    it 'returns false for invalid brackets' do
      expect(described_class.valid_bracket?(2)).to be false
      expect(described_class.valid_bracket?(3)).to be false
      expect(described_class.valid_bracket?(5)).to be false
      expect(described_class.valid_bracket?(6)).to be false
      expect(described_class.valid_bracket?(7)).to be false
      expect(described_class.valid_bracket?(9)).to be false
    end
  end
end
