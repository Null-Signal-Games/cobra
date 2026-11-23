# frozen_string_literal: true

RSpec.describe TournamentsController do
  let(:tournament) { create(:tournament, name: 'My Tournament') }

  let(:shortlink) { "http://www.example.com/#{tournament.slug}" }

  describe '#show as json' do
    it 'links the export to the tournament shortlink' do
      get tournament_path(tournament, format: :json)

      uploaded_from = response.parsed_body['links'].find { |link| link['rel'] == 'uploadedfrom' }
      expect(uploaded_from['href']).to eq(shortlink)
    end
  end

  describe '#save_json' do
    let(:nrtm_json) { instance_double(NrtmJson, data: { some: :data }) }

    before do
      allow(NrtmJson).to receive(:new).with(tournament, root_url).and_return(nrtm_json)
    end

    it 'links the export to the tournament shortlink' do
      get save_json_tournament_path(tournament)

      expect(nrtm_json).to have_received(:data).with(shortlink)
    end

    it 'responds with json file' do
      get save_json_tournament_path(tournament)

      expect(response.headers['Content-Disposition']).to eq(
        'attachment; filename="my tournament.json"; filename*=UTF-8\'\'my%20tournament.json'
      )
      expect(response.body).to eq('{"some":"data"}')
    end

    it 'is available from the classic api' do
      get save_json_api_classic_tournament_path(tournament)

      expect(response.body).to eq('{"some":"data"}')
    end
  end

  describe '#upload_to_abr' do
    before { sign_in tournament.user }

    it 'stores the ABR code and returns it as json' do
      allow(AbrUpload).to receive(:upload!).and_return({ code: 'abc123' }.with_indifferent_access)

      post upload_to_abr_api_classic_tournament_path(tournament), as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq('abr_code' => 'abc123')
      expect(tournament.reload.abr_code).to eq('abc123')
    end

    it 'uploads with the tournament shortlink' do
      allow(AbrUpload).to receive(:upload!).and_return({ code: 'abc123' }.with_indifferent_access)

      post upload_to_abr_api_classic_tournament_path(tournament), as: :json

      expect(AbrUpload).to have_received(:upload!).with(tournament, root_url, shortlink)
    end

    it 'returns the upload error when ABR rejects the upload' do
      allow(AbrUpload).to receive(:upload!)
        .and_return({ error: 'Always Be Running rejected the upload (HTTP 401).' }.with_indifferent_access)

      post upload_to_abr_api_classic_tournament_path(tournament), as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq('error' => 'Always Be Running rejected the upload (HTTP 401).')
    end

    it 'returns an error when ABR does not return a code' do
      allow(AbrUpload).to receive(:upload!).and_return({}.with_indifferent_access)

      post upload_to_abr_api_classic_tournament_path(tournament), as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq('error' => 'Upload to Always Be Running failed.')
      expect(tournament.reload.abr_code).to be_nil
    end
  end
end
