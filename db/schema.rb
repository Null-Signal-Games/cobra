# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_10_08_193019) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", precision: nil, null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "card_sets", id: :string, force: :cascade do |t|
    t.string "name"
    t.date "date_release"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_card_sets_on_name", unique: true
  end

  create_table "custom_prizes", force: :cascade do |t|
    t.string "name", null: false
    t.string "description"
    t.string "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "tournament_id", null: false
    t.index ["name"], name: "index_custom_prizes_on_name", unique: true
    t.index ["tournament_id"], name: "index_custom_prizes_on_tournament_id"
  end

  create_table "deck_cards", force: :cascade do |t|
    t.bigint "deck_id"
    t.string "title"
    t.integer "quantity"
    t.integer "influence"
    t.string "nrdb_card_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "nrdb_printing_id"
    t.string "card_type_id"
    t.string "faction_id"
    t.integer "influence_cost"
    t.index ["deck_id"], name: "index_deck_cards_on_deck_id"
  end

  create_table "deckbuilding_restrictions", id: :string, force: :cascade do |t|
    t.string "name"
    t.date "date_start"
    t.string "play_format_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_deckbuilding_restrictions_on_name", unique: true
  end

  create_table "decks", force: :cascade do |t|
    t.bigint "player_id"
    t.string "side_id"
    t.string "name"
    t.string "identity_title"
    t.integer "min_deck_size"
    t.integer "max_influence"
    t.string "nrdb_uuid"
    t.string "identity_nrdb_card_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "identity_nrdb_printing_id"
    t.bigint "user_id"
    t.string "faction_id"
    t.index ["player_id"], name: "index_decks_on_player_id"
    t.index ["user_id"], name: "index_decks_on_user_id"
  end

  create_table "flipper_features", force: :cascade do |t|
    t.string "key", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_flipper_features_on_key", unique: true
  end

  create_table "flipper_gates", force: :cascade do |t|
    t.string "feature_key", null: false
    t.string "key", null: false
    t.text "value"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["feature_key", "key", "value"], name: "index_flipper_gates_on_feature_key_and_key_and_value", unique: true
  end

  create_table "formats", force: :cascade do |t|
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_formats_on_name", unique: true
    t.index ["position"], name: "index_formats_on_position", unique: true
  end

  create_table "identities", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "side"
    t.string "faction"
    t.string "nrdb_code"
    t.string "autocomplete"
    t.index ["side"], name: "index_identities_on_side"
  end

  create_table "official_prize_kits", force: :cascade do |t|
    t.string "name", null: false
    t.string "link"
    t.string "image_url"
    t.string "description"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_official_prize_kits_on_name", unique: true
    t.index ["position"], name: "index_official_prize_kits_on_position", unique: true
  end

  create_table "pairings", id: :serial, force: :cascade do |t|
    t.integer "round_id"
    t.integer "player1_id"
    t.integer "player2_id"
    t.integer "table_number"
    t.integer "score1"
    t.integer "score2"
    t.integer "side"
    t.integer "score1_runner"
    t.integer "score1_corp"
    t.integer "score2_corp"
    t.integer "score2_runner"
    t.datetime "created_at", precision: nil, default: -> { "now()" }, null: false
    t.datetime "updated_at", precision: nil, default: -> { "now()" }, null: false
    t.boolean "intentional_draw", default: false, null: false
    t.boolean "two_for_one", default: false, null: false
    t.index ["player1_id"], name: "index_pairings_on_player1_id"
    t.index ["player2_id"], name: "index_pairings_on_player2_id"
    t.index ["round_id"], name: "index_pairings_on_round_id"
  end

  create_table "player_match_reports", id: false, force: :cascade do |t|
    t.integer "tournament_id", null: false
    t.integer "round_id", null: false
    t.integer "pairing_id", null: false
    t.integer "player_id", null: false
    t.integer "player1_id", null: false
    t.integer "player2_id", null: false
    t.integer "score1"
    t.integer "score2"
    t.integer "side"
    t.integer "score1_runner"
    t.integer "score1_corp"
    t.integer "score2_corp"
    t.integer "score2_runner"
    t.boolean "intentional_draw", default: false, null: false
    t.boolean "two_for_one", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tournament_id", "round_id", "pairing_id", "player_id"], name: "idx_unq_id_player_match_reports", unique: true
  end

  create_table "players", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "tournament_id"
    t.boolean "active", default: true
    t.string "corp_identity"
    t.string "runner_identity"
    t.integer "seed"
    t.boolean "first_round_bye", default: false
    t.integer "previous_id"
    t.integer "manual_seed"
    t.bigint "user_id"
    t.boolean "registration_locked"
    t.string "pronouns"
    t.boolean "include_in_stream", default: true
    t.bigint "corp_identity_ref_id"
    t.bigint "runner_identity_ref_id"
    t.integer "fixed_table_number"
    t.index ["corp_identity_ref_id"], name: "index_players_on_corp_identity_ref_id"
    t.index ["runner_identity_ref_id"], name: "index_players_on_runner_identity_ref_id"
    t.index ["tournament_id", "name"], name: "idx_uniq_players_tournament_id_name", unique: true
    t.index ["tournament_id"], name: "index_players_on_tournament_id"
    t.index ["user_id"], name: "index_players_on_user_id"
  end

  create_table "registrations", id: :serial, force: :cascade do |t|
    t.integer "player_id"
    t.integer "stage_id"
    t.integer "seed"
    t.index ["player_id"], name: "index_registrations_on_player_id"
    t.index ["stage_id"], name: "index_registrations_on_stage_id"
  end

  create_table "round_timer_activations", force: :cascade do |t|
    t.bigint "tournament_id"
    t.bigint "round_id"
    t.datetime "start_time", default: -> { "now()" }, null: false
    t.datetime "stop_time"
    t.index ["round_id"], name: "index_round_timer_activations_on_round_id"
    t.index ["tournament_id"], name: "index_round_timer_activations_on_tournament_id"
  end

  create_table "rounds", id: :serial, force: :cascade do |t|
    t.integer "tournament_id", null: false
    t.integer "number"
    t.boolean "completed", default: false
    t.decimal "weight", default: "1.0"
    t.integer "stage_id"
    t.datetime "created_at", precision: nil, default: -> { "now()" }, null: false
    t.datetime "updated_at", precision: nil, default: -> { "now()" }, null: false
    t.integer "length_minutes", default: 65
    t.index ["stage_id"], name: "index_rounds_on_stage_id"
    t.index ["tournament_id"], name: "index_rounds_on_tournament_id"
  end

  create_table "self_reports", force: :cascade do |t|
    t.integer "pairing_id"
    t.integer "report_player_id"
    t.integer "score1"
    t.integer "score2"
    t.integer "score1_corp"
    t.integer "score1_runner"
    t.integer "score2_corp"
    t.integer "score2_runner"
    t.boolean "intentional_draw"
    t.index ["pairing_id"], name: "index_self_reports_on_pairings"
  end

  create_table "stages", id: :serial, force: :cascade do |t|
    t.integer "tournament_id"
    t.integer "number", default: 1
    t.integer "format", default: 0, null: false
    t.datetime "created_at", precision: nil, default: -> { "now()" }, null: false
    t.datetime "updated_at", precision: nil, default: -> { "now()" }, null: false
    t.index ["tournament_id"], name: "index_stages_on_tournament_id"
  end

  create_table "standing_rows", id: :serial, force: :cascade do |t|
    t.integer "position"
    t.integer "player_id"
    t.integer "stage_id"
    t.integer "points"
    t.decimal "sos"
    t.decimal "extended_sos"
    t.integer "corp_points"
    t.integer "runner_points"
    t.integer "bye_points", default: 0
    t.index ["player_id"], name: "index_standing_rows_on_player_id"
    t.index ["stage_id"], name: "index_standing_rows_on_stage_id"
  end

  create_table "table_ranges", force: :cascade do |t|
    t.integer "stage_id"
    t.integer "first_table", null: false
    t.integer "last_table", null: false
    t.index ["stage_id"], name: "index_table_ranges_on_stages"
  end

  create_table "tournament_types", force: :cascade do |t|
    t.string "name", null: false
    t.boolean "nsg_format", default: false, null: false
    t.integer "position", default: 0, null: false
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tournament_types_on_name", unique: true
    t.index ["position"], name: "index_tournament_types_on_position", unique: true
  end

  create_table "tournaments", id: :serial, force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: nil
    t.string "abr_code"
    t.integer "stage", default: 0
    t.integer "previous_id"
    t.integer "user_id"
    t.string "slug"
    t.date "date"
    t.boolean "private", default: false
    t.string "stream_url"
    t.boolean "manual_seed"
    t.datetime "updated_at", precision: nil, default: -> { "now()" }, null: false
    t.boolean "self_registration"
    t.boolean "nrdb_deck_registration", default: false
    t.boolean "all_players_unlocked", default: true
    t.boolean "any_player_unlocked", default: true
    t.boolean "registration_closed"
    t.integer "swiss_deck_visibility", default: 0, null: false
    t.integer "cut_deck_visibility", default: 0, null: false
    t.boolean "allow_streaming_opt_out"
    t.integer "swiss_format", default: 0, null: false
    t.bigint "tournament_type_id"
    t.bigint "format_id"
    t.string "deckbuilding_restriction_id"
    t.string "registration_starts"
    t.string "tournament_starts"
    t.boolean "decklist_required", default: false, null: false
    t.string "organizer_contact"
    t.string "event_link"
    t.text "description"
    t.text "additional_prizes_description"
    t.bigint "official_prize_kit_id"
    t.string "card_set_id"
    t.string "time_zone"
    t.boolean "allow_self_reporting", default: false
    t.index ["card_set_id"], name: "index_tournaments_on_card_set_id"
    t.index ["deckbuilding_restriction_id"], name: "index_tournaments_on_deckbuilding_restriction_id"
    t.index ["format_id"], name: "index_tournaments_on_format_id"
    t.index ["official_prize_kit_id"], name: "index_tournaments_on_official_prize_kit_id"
    t.index ["tournament_type_id"], name: "index_tournaments_on_tournament_type_id"
    t.index ["user_id"], name: "index_tournaments_on_user_id"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "nrdb_id"
    t.string "nrdb_username"
    t.string "nrdb_access_token"
    t.string "nrdb_refresh_token"
    t.index ["nrdb_id"], name: "index_users_on_nrdb_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "custom_prizes", "tournaments"
  add_foreign_key "deck_cards", "decks"
  add_foreign_key "decks", "players"
  add_foreign_key "pairings", "players", column: "player1_id"
  add_foreign_key "pairings", "players", column: "player2_id"
  add_foreign_key "pairings", "rounds"
  add_foreign_key "players", "identities", column: "corp_identity_ref_id"
  add_foreign_key "players", "identities", column: "runner_identity_ref_id"
  add_foreign_key "players", "tournaments"
  add_foreign_key "players", "users"
  add_foreign_key "registrations", "players"
  add_foreign_key "registrations", "stages"
  add_foreign_key "round_timer_activations", "rounds"
  add_foreign_key "round_timer_activations", "tournaments"
  add_foreign_key "rounds", "stages"
  add_foreign_key "rounds", "tournaments"
  add_foreign_key "self_reports", "pairings"
  add_foreign_key "stages", "tournaments"
  add_foreign_key "standing_rows", "players"
  add_foreign_key "standing_rows", "stages"
  add_foreign_key "table_ranges", "stages"
  add_foreign_key "tournaments", "card_sets"
  add_foreign_key "tournaments", "deckbuilding_restrictions"
  add_foreign_key "tournaments", "formats"
  add_foreign_key "tournaments", "official_prize_kits"
  add_foreign_key "tournaments", "tournament_types"
  add_foreign_key "tournaments", "users"

  create_view "cut_conversion_rates", sql_definition: <<-SQL
      WITH corps AS (
           SELECT s_1.tournament_id,
              s_1.number AS stage_number,
              s_1.id AS stage_id,
              'corp'::text AS side,
              COALESCE(id.name, 'Unspecified'::character varying) AS identity,
              COALESCE(id.faction, 'Unspecified'::character varying) AS faction
             FROM (((stages s_1
               JOIN registrations r ON ((s_1.id = r.stage_id)))
               JOIN players p ON ((r.player_id = p.id)))
               LEFT JOIN identities id ON ((p.corp_identity_ref_id = id.id)))
          ), runners AS (
           SELECT s_1.tournament_id,
              s_1.number AS stage_number,
              s_1.id AS stage_id,
              'runner'::text AS side,
              COALESCE(id.name, 'Unspecified'::character varying) AS identity,
              COALESCE(id.faction, 'Unspecified'::character varying) AS faction
             FROM (((stages s_1
               JOIN registrations r ON ((s_1.id = r.stage_id)))
               JOIN players p ON ((r.player_id = p.id)))
               LEFT JOIN identities id ON ((p.runner_identity_ref_id = id.id)))
          ), combined AS (
           SELECT corps.tournament_id,
              corps.stage_number,
              corps.stage_id,
              corps.side,
              corps.identity,
              corps.faction
             FROM corps
          UNION ALL
           SELECT runners.tournament_id,
              runners.stage_number,
              runners.stage_id,
              runners.side,
              runners.identity,
              runners.faction
             FROM runners
          ), swiss AS (
           SELECT combined.tournament_id,
              combined.stage_id,
              combined.stage_number,
              combined.side,
              combined.identity,
              combined.faction,
              count(*) AS num_players
             FROM combined
            WHERE (combined.stage_number = 1)
            GROUP BY combined.tournament_id, combined.stage_id, combined.stage_number, combined.side, combined.identity, combined.faction
          ), cut AS (
           SELECT combined.tournament_id,
              combined.stage_id,
              combined.stage_number,
              combined.side,
              combined.identity,
              combined.faction,
              count(*) AS num_players
             FROM combined
            WHERE (combined.stage_number = 2)
            GROUP BY combined.tournament_id, combined.stage_id, combined.stage_number, combined.side, combined.identity, combined.faction
          )
   SELECT s.tournament_id,
      s.side,
      s.faction,
      s.identity,
      sum(s.num_players) AS num_swiss_players,
      sum(COALESCE(c.num_players, (0)::bigint)) AS num_cut_players,
      ((sum(COALESCE(c.num_players, (0)::bigint)) / sum(s.num_players)) * (100)::numeric) AS cut_conversion_percentage
     FROM (swiss s
       LEFT JOIN cut c USING (tournament_id, side, identity, faction))
    GROUP BY s.tournament_id, s.faction, s.side, s.identity;
  SQL
  create_view "side_win_percentages", sql_definition: <<-SQL
      WITH base AS (
           SELECT s.tournament_id,
              s.number AS stage_number,
                  CASE
                      WHEN (s.format = 0) THEN 2
                      ELSE 1
                  END AS num_expected_games,
                  CASE
                      WHEN ((s.format = 0) AND ((((p.score1_corp + p.score1_runner) + p.score2_corp) + p.score2_runner) > 0)) THEN 2
                      WHEN ((s.format > 0) AND (p.side > 0) AND ((p.score1 + p.score2) > 0)) THEN 1
                      ELSE 0
                  END AS num_valid_games,
                  CASE
                      WHEN ((s.format = 0) AND (((p.score1_corp = 3) AND (p.score2_corp = 0)) OR ((p.score1_corp = 0) AND (p.score2_corp = 3)))) THEN 1
                      WHEN ((s.format = 0) AND (p.score1_corp = 3) AND (p.score2_corp = 3)) THEN 2
                      WHEN (((s.format > 0) AND (p.score1_corp = 3)) OR (p.score2_corp = 3)) THEN 1
                      ELSE 0
                  END AS num_corp_wins,
                  CASE
                      WHEN ((s.format = 0) AND (((p.score1_runner = 3) AND (p.score2_runner = 0)) OR ((p.score1_runner = 0) AND (p.score2_runner = 3)))) THEN 1
                      WHEN ((s.format = 0) AND (p.score1_runner = 3) AND (p.score2_runner = 3)) THEN 2
                      WHEN (((s.format > 0) AND (p.score1_runner = 3)) OR (p.score2_runner = 3)) THEN 1
                      ELSE 0
                  END AS num_runner_wins
             FROM ((stages s
               JOIN rounds r ON ((s.id = r.stage_id)))
               JOIN pairings p ON ((p.round_id = r.id)))
            WHERE r.completed
          ), calculated AS (
           SELECT base.tournament_id,
              base.stage_number,
              base.num_expected_games,
              base.num_valid_games,
                  CASE
                      WHEN (base.num_valid_games = 0) THEN 0
                      ELSE base.num_corp_wins
                  END AS num_corp_wins,
                  CASE
                      WHEN (base.num_valid_games = 0) THEN 0
                      ELSE base.num_runner_wins
                  END AS num_runner_wins
             FROM base
          )
   SELECT calculated.tournament_id,
      calculated.stage_number,
      sum(calculated.num_expected_games) AS num_games,
      sum(calculated.num_valid_games) AS num_valid_games,
      (
          CASE
              WHEN (sum(calculated.num_expected_games) > 0) THEN ((sum(calculated.num_valid_games))::double precision / (sum(calculated.num_expected_games))::double precision)
              ELSE (0.0)::double precision
          END * (100)::double precision) AS valid_game_percentage,
      sum(calculated.num_corp_wins) AS num_corp_wins,
      (
          CASE
              WHEN (sum(calculated.num_valid_games) > 0) THEN ((sum(calculated.num_corp_wins))::double precision / (sum(calculated.num_valid_games))::double precision)
              ELSE (0.0)::double precision
          END * (100)::double precision) AS corp_win_percentage,
      sum(calculated.num_runner_wins) AS num_runner_wins,
      (
          CASE
              WHEN (sum(calculated.num_valid_games) > 0) THEN ((sum(calculated.num_runner_wins))::double precision / (sum(calculated.num_valid_games))::double precision)
              ELSE (0.0)::double precision
          END * (100)::double precision) AS runner_win_percentage
     FROM calculated
    GROUP BY calculated.tournament_id, calculated.stage_number
    ORDER BY calculated.tournament_id, calculated.stage_number;
  SQL
  create_view "summarized_pairings", sql_definition: <<-SQL
      WITH players_with_identities AS (
           SELECT p.tournament_id,
              p.id AS player_id,
              p.user_id,
              p.name,
              p.pronouns,
              p.corp_identity,
              ci.faction AS corp_faction,
              p.runner_identity,
              ri.faction AS runner_faction
             FROM ((players p
               LEFT JOIN identities ci ON ((p.corp_identity_ref_id = ci.id)))
               LEFT JOIN identities ri ON ((p.runner_identity_ref_id = ri.id)))
          ), tournaments_and_stages AS (
           SELECT t.id AS tournament_id,
              s.id AS stage_id,
              s.number AS stage_number,
              s.format AS stage_format
             FROM (tournaments t
               JOIN stages s ON ((t.id = s.tournament_id)))
          ), rounds_and_pairings AS (
           SELECT r.stage_id,
              p.round_id,
              r.number AS round_number,
              r.completed AS round_completed,
              p.id AS pairing_id,
              p.table_number,
              p.player1_id,
              p.player2_id,
              p.score1,
              p.score2,
              p.side,
              p.score1_corp,
              p.score1_runner,
              p.score2_corp,
              p.score2_runner,
              p.intentional_draw,
              p.two_for_one,
              pwi_1.user_id AS player1_user_id,
              pwi_1.name AS player1_name,
              pwi_1.pronouns AS player1_pronouns,
              pwi_1.corp_identity AS player1_corp_identity,
              pwi_1.corp_faction AS player1_corp_faction,
              pwi_1.runner_identity AS player1_runner_identity,
              pwi_1.runner_faction AS player1_runner_faction,
              pwi_2.user_id AS player2_user_id,
              pwi_2.name AS player2_name,
              pwi_2.pronouns AS player2_pronouns,
              pwi_2.corp_identity AS player2_corp_identity,
              pwi_2.corp_faction AS player2_corp_faction,
              pwi_2.runner_identity AS player2_runner_identity,
              pwi_2.runner_faction AS player2_runner_faction
             FROM ((((pairings p
               JOIN rounds r ON ((p.round_id = r.id)))
               JOIN stages s ON ((r.stage_id = s.id)))
               LEFT JOIN players_with_identities pwi_1 ON ((p.player1_id = pwi_1.player_id)))
               LEFT JOIN players_with_identities pwi_2 ON ((p.player2_id = pwi_2.player_id)))
          )
   SELECT tas.tournament_id,
      tas.stage_id,
      tas.stage_number,
      tas.stage_format,
      rap.round_id,
      rap.round_number,
      rap.round_completed,
      rap.pairing_id,
      rap.table_number,
      rap.player1_id,
      rap.player2_id,
      rap.score1,
      rap.score2,
      rap.side,
      rap.score1_corp,
      rap.score1_runner,
      rap.score2_corp,
      rap.score2_runner,
      rap.intentional_draw,
      rap.two_for_one,
      rap.player1_user_id,
      rap.player1_name,
      rap.player1_pronouns,
      rap.player1_corp_identity,
      rap.player1_corp_faction,
      rap.player1_runner_identity,
      rap.player1_runner_faction,
      rap.player2_user_id,
      rap.player2_name,
      rap.player2_pronouns,
      rap.player2_corp_identity,
      rap.player2_corp_faction,
      rap.player2_runner_identity,
      rap.player2_runner_faction
     FROM (rounds_and_pairings rap
       LEFT JOIN tournaments_and_stages tas ON ((rap.stage_id = tas.stage_id)));
  SQL
  create_view "summarized_standings", sql_definition: <<-SQL
      WITH two_player_side_bias_by_pairing AS (
           SELECT r.stage_id,
              p.player1_id,
                  CASE
                      WHEN (p.side = 1) THEN 1
                      WHEN (p.side = 2) THEN '-1'::integer
                      ELSE 0
                  END AS player1_side_bias,
              p.player2_id,
                  CASE
                      WHEN (p.side = 1) THEN '-1'::integer
                      WHEN (p.side = 2) THEN 1
                      ELSE 0
                  END AS player2_side_bias
             FROM ((pairings p
               JOIN rounds r ON ((p.round_id = r.id)))
               JOIN stages s ON ((r.stage_id = s.id)))
            WHERE ((s.format = 2) AND r.completed)
          ), single_player_side_bias_by_stage AS (
           SELECT two_player_side_bias_by_pairing.stage_id,
              two_player_side_bias_by_pairing.player1_id AS player_id,
              two_player_side_bias_by_pairing.player1_side_bias AS side_bias
             FROM two_player_side_bias_by_pairing
          UNION ALL
           SELECT two_player_side_bias_by_pairing.stage_id,
              two_player_side_bias_by_pairing.player2_id AS player_id,
              two_player_side_bias_by_pairing.player2_side_bias AS side_bias
             FROM two_player_side_bias_by_pairing
          ), side_bias AS (
           SELECT single_player_side_bias_by_stage.stage_id,
              single_player_side_bias_by_stage.player_id,
              sum(single_player_side_bias_by_stage.side_bias) AS side_bias
             FROM single_player_side_bias_by_stage
            WHERE (single_player_side_bias_by_stage.player_id IS NOT NULL)
            GROUP BY single_player_side_bias_by_stage.stage_id, single_player_side_bias_by_stage.player_id
          ), standings_for_tournament AS (
           SELECT s.tournament_id,
              s.id AS stage_id,
              s.format AS stage_format,
              sr."position",
              sr.player_id,
              p.name,
              p.pronouns,
              p.active,
              sr.points,
              sr.corp_points,
              sr.runner_points,
              sr.bye_points,
              sr.sos,
              sr.extended_sos
             FROM ((standing_rows sr
               JOIN players p ON ((sr.player_id = p.id)))
               JOIN stages s ON ((s.id = sr.stage_id)))
          ), rounds_for_stages AS (
           SELECT s.id AS stage_id,
              s.number AS stage_number,
              count(DISTINCT r.id) AS num_rounds,
              count(DISTINCT r.id) FILTER (WHERE r.completed) AS num_rounds_completed
             FROM (stages s
               LEFT JOIN rounds r ON ((s.id = r.stage_id)))
            GROUP BY s.id, s.number
          ), cut_positions AS (
           SELECT r.stage_id,
              r.seed
             FROM (registrations r
               JOIN stages s ON ((r.stage_id = s.id)))
            WHERE (s.format = ANY (ARRAY[1, 3]))
          ), cut_players AS (
           SELECT cp.stage_id,
              cp.seed AS "position",
              sr.player_id,
              r.seed,
              r.id AS registration_id
             FROM ((cut_positions cp
               LEFT JOIN standing_rows sr ON (((cp.stage_id = sr.stage_id) AND (cp.seed = sr."position"))))
               LEFT JOIN registrations r ON (((sr.stage_id = r.stage_id) AND (sr.player_id = r.player_id))))
          ), cut_stages_with_players AS (
           SELECT s.tournament_id,
              s.id AS stage_id,
              s.number AS stage_number,
              s.format AS stage_format,
              cp.registration_id,
              cp."position",
              r.seed,
              p.id AS player_id,
              p.name AS player_name,
              p.pronouns AS player_pronouns,
              p.active AS player_active,
              p.user_id AS player_user_id,
              p.manual_seed AS player_manual_seed,
              corp_id.name AS corp_id_name,
              corp_id.faction AS corp_id_faction,
              runner_id.name AS runner_id_name,
              runner_id.faction AS runner_id_faction
             FROM (((((cut_players cp
               JOIN stages s ON ((cp.stage_id = s.id)))
               LEFT JOIN registrations r ON ((cp.registration_id = r.id)))
               LEFT JOIN players p ON ((r.player_id = p.id)))
               LEFT JOIN identities corp_id ON ((p.corp_identity_ref_id = corp_id.id)))
               LEFT JOIN identities runner_id ON ((p.runner_identity_ref_id = runner_id.id)))
          ), swiss_stages_with_players AS (
           SELECT s.tournament_id,
              s.id AS stage_id,
              s.number AS stage_number,
              s.format AS stage_format,
              r.id AS registration_id,
              r.seed,
              p.id AS player_id,
              p.name AS player_name,
              p.pronouns AS player_pronouns,
              p.active AS player_active,
              p.user_id AS player_user_id,
              p.manual_seed AS player_manual_seed,
              corp_id.name AS corp_id_name,
              corp_id.faction AS corp_id_faction,
              runner_id.name AS runner_id_name,
              runner_id.faction AS runner_id_faction
             FROM ((((stages s
               JOIN registrations r ON ((s.id = r.stage_id)))
               JOIN players p ON ((r.player_id = p.id)))
               LEFT JOIN identities corp_id ON ((p.corp_identity_ref_id = corp_id.id)))
               LEFT JOIN identities runner_id ON ((p.runner_identity_ref_id = runner_id.id)))
            WHERE (s.format = ANY (ARRAY[0, 2]))
          ), expanded_swiss_standings AS (
           SELECT t.id AS tournament_id,
              t.swiss_deck_visibility,
              t.cut_deck_visibility,
              t.user_id AS tournament_user_id,
              COALESCE(t.manual_seed, false) AS tournament_manual_seed,
              rfs.num_rounds,
              ((rfs.stage_number = 1) AND (rfs.num_rounds = 0)) AS is_player_meeting,
              rfs.num_rounds_completed,
              swp.stage_id,
              swp.stage_format,
              swp.stage_number,
              swp.player_id,
              swp.player_user_id,
              swp.player_name,
              swp.player_pronouns,
              swp.player_manual_seed,
              swp.seed,
              swp.corp_id_name,
              swp.corp_id_faction,
              swp.runner_id_name,
              swp.runner_id_faction,
              swp.player_active,
              sft."position",
              sft.points,
              sft.corp_points,
              sft.runner_points,
              sft.bye_points,
              sft.sos,
              sft.extended_sos,
              sb.side_bias
             FROM ((((tournaments t
               JOIN swiss_stages_with_players swp ON ((swp.tournament_id = t.id)))
               JOIN rounds_for_stages rfs ON ((rfs.stage_id = swp.stage_id)))
               LEFT JOIN standings_for_tournament sft ON (((sft.tournament_id = swp.tournament_id) AND (sft.stage_id = swp.stage_id) AND (sft.player_id = swp.player_id))))
               LEFT JOIN side_bias sb ON (((sb.stage_id = sft.stage_id) AND (sft.player_id = sb.player_id))))
          ), expanded_cut_standings AS (
           SELECT t.id AS tournament_id,
              t.swiss_deck_visibility,
              t.cut_deck_visibility,
              t.user_id AS tournament_user_id,
              COALESCE(t.manual_seed, false) AS tournament_manual_seed,
              rfs.num_rounds,
              ((rfs.stage_number = 1) AND (rfs.num_rounds = 0)) AS is_player_meeting,
              rfs.num_rounds_completed,
              cwp.stage_id,
              cwp.stage_format,
              cwp.stage_number,
              cwp.player_id,
              cwp.player_user_id,
              cwp.player_name,
              cwp.player_pronouns,
              cwp.player_manual_seed,
              cwp.seed,
              cwp.corp_id_name,
              cwp.corp_id_faction,
              cwp.runner_id_name,
              cwp.runner_id_faction,
              cwp.player_active,
              cwp."position",
              sft.points,
              sft.corp_points,
              sft.runner_points,
              sft.bye_points,
              sft.sos,
              sft.extended_sos,
              sb.side_bias
             FROM ((((tournaments t
               JOIN cut_stages_with_players cwp ON ((cwp.tournament_id = t.id)))
               JOIN rounds_for_stages rfs ON ((rfs.stage_id = cwp.stage_id)))
               LEFT JOIN standings_for_tournament sft ON (((sft.tournament_id = cwp.tournament_id) AND (sft.stage_id = cwp.stage_id) AND (sft.player_id = cwp.player_id))))
               LEFT JOIN side_bias sb ON (((sb.stage_id = sft.stage_id) AND (sft.player_id = sb.player_id))))
          )
   SELECT expanded_swiss_standings.tournament_id,
      expanded_swiss_standings.swiss_deck_visibility,
      expanded_swiss_standings.cut_deck_visibility,
      expanded_swiss_standings.tournament_user_id,
      expanded_swiss_standings.tournament_manual_seed,
      expanded_swiss_standings.num_rounds,
      expanded_swiss_standings.is_player_meeting,
      expanded_swiss_standings.num_rounds_completed,
      expanded_swiss_standings.stage_id,
      expanded_swiss_standings.stage_format,
      expanded_swiss_standings.stage_number,
      expanded_swiss_standings.player_id,
      expanded_swiss_standings.player_user_id,
      expanded_swiss_standings.player_name,
      expanded_swiss_standings.player_pronouns,
      expanded_swiss_standings.player_manual_seed,
      expanded_swiss_standings.seed,
      expanded_swiss_standings.corp_id_name,
      expanded_swiss_standings.corp_id_faction,
      expanded_swiss_standings.runner_id_name,
      expanded_swiss_standings.runner_id_faction,
      expanded_swiss_standings.player_active,
      expanded_swiss_standings."position",
      expanded_swiss_standings.points,
      expanded_swiss_standings.corp_points,
      expanded_swiss_standings.runner_points,
      expanded_swiss_standings.bye_points,
      expanded_swiss_standings.sos,
      expanded_swiss_standings.extended_sos,
      expanded_swiss_standings.side_bias
     FROM expanded_swiss_standings
  UNION ALL
   SELECT expanded_cut_standings.tournament_id,
      expanded_cut_standings.swiss_deck_visibility,
      expanded_cut_standings.cut_deck_visibility,
      expanded_cut_standings.tournament_user_id,
      expanded_cut_standings.tournament_manual_seed,
      expanded_cut_standings.num_rounds,
      expanded_cut_standings.is_player_meeting,
      expanded_cut_standings.num_rounds_completed,
      expanded_cut_standings.stage_id,
      expanded_cut_standings.stage_format,
      expanded_cut_standings.stage_number,
      expanded_cut_standings.player_id,
      expanded_cut_standings.player_user_id,
      expanded_cut_standings.player_name,
      expanded_cut_standings.player_pronouns,
      expanded_cut_standings.player_manual_seed,
      expanded_cut_standings.seed,
      expanded_cut_standings.corp_id_name,
      expanded_cut_standings.corp_id_faction,
      expanded_cut_standings.runner_id_name,
      expanded_cut_standings.runner_id_faction,
      expanded_cut_standings.player_active,
      expanded_cut_standings."position",
      expanded_cut_standings.points,
      expanded_cut_standings.corp_points,
      expanded_cut_standings.runner_points,
      expanded_cut_standings.bye_points,
      expanded_cut_standings.sos,
      expanded_cut_standings.extended_sos,
      expanded_cut_standings.side_bias
     FROM expanded_cut_standings;
  SQL
end
