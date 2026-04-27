# frozen_string_literal: true

RSpec.describe IdentitiesController do
  describe '#index' do
    it 'lists corp identities' do
      ampere = create(:id_ampere)
      etf = create(:id_etf)
      muslihat = create(:id_muslihat)
      catalyst = create(:id_catalyst)

      get identities_path

      json = response.parsed_body
      expect(json['corp']).to contain_exactly(
        { 'label' => ampere.autocomplete, 'value' => ampere.name },
        { 'label' => etf.autocomplete, 'value' => etf.name }
      )
      expect(json['runner']).to contain_exactly(
        { 'label' => catalyst.autocomplete, 'value' => catalyst.name },
        { 'label' => muslihat.autocomplete, 'value' => muslihat.name }
      )
    end
  end
end
