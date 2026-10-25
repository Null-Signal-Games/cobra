# frozen_string_literal: true

RSpec.describe AbrUpload do
  let(:upload) { described_class.new(tournament, 'https://server/SLUG', 'https://server/SLUG') }
  let(:tournament) { create(:tournament, name: 'Some Tournament') }
  let(:jack) { create(:player, corp_identity: 'ETF', runner_identity: 'Noise') }
  let(:jill) { create(:player, corp_identity: 'PE', runner_identity: 'Gabe') }
  let(:round) { create(:round, tournament:) }

  before do
    round.pairings << create(:pairing, player1: jack, player2: jill)
  end

  describe '.upload!' do
    before do
      allow(described_class).to receive(:new).with(tournament, 'https://server/SLUG', 'https://server/SLUG').and_return(upload)
      allow(upload).to receive(:upload!)
    end

    it 'calls new instance' do
      described_class.upload!(tournament, 'https://server/SLUG', 'https://server/SLUG')

      expect(upload).to have_received(:upload!)
    end
  end

  describe '#upload!' do
    let(:json) { NrtmJson.new(tournament, 'https://server/SLUG') }

    before do
      allow(NrtmJson).to receive(:new).with(tournament, 'https://server/SLUG').and_return(json)
      allow(json).to receive(:data).and_return({ some: :data })
    end

    it 'responds with a code' do
      VCR.use_cassette :upload_to_abr do
        response = upload.upload!

        expect(response[:code]).to eq(301_063)
      end
    end

    it 'returns an error when ABR rejects the upload' do
      allow(upload).to receive(:send_data).and_return(
        instance_double(Faraday::Response, success?: false, status: 401, body: '<!DOCTYPE html>')
      )

      expect(upload.upload![:error]).to eq('Always Be Running rejected the upload (HTTP 401).')
    end

    it 'returns an error when ABR responds with something other than json' do
      allow(upload).to receive(:send_data).and_return(
        instance_double(Faraday::Response, success?: true, status: 200, body: '<!DOCTYPE html>')
      )

      expect(upload.upload![:error]).to eq('Always Be Running returned an unexpected response.')
    end

    it 'returns an error when ABR cannot be reached' do
      allow(upload).to receive(:send_data).and_raise(Faraday::ConnectionFailed, 'connection refused')

      expect(upload.upload![:error]).to eq('Could not reach Always Be Running: connection refused')
    end

    it 'delegates to json class' do
      VCR.use_cassette :upload_to_abr do
        upload.upload!

        expect(json).to have_received(:data)
      end
    end
  end
end
