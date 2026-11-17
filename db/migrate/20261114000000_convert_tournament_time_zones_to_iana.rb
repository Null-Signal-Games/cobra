# frozen_string_literal: true

# Convert existing tournament time zones from Rails zone names to IANA ids.
class ConvertTournamentTimeZonesToIana < ActiveRecord::Migration[8.1]
  # Use a fake model here so the migration doesn't depend on Tournament's current validations.
  class MigrationTournament < ActiveRecord::Base
    self.table_name = 'tournaments'
  end

  def up
    # "International Date Line West" was the first entry in the old dropdown, which had no
    # blank option, so it was almost always an accidental default rather than a real choice.
    MigrationTournament.where(time_zone: 'International Date Line West').update_all(time_zone: nil) # rubocop:disable Rails/SkipsModelValidations

    ActiveSupport::TimeZone::MAPPING.each do |rails_name, iana|
      next if rails_name == iana || rails_name == 'UTC'

      MigrationTournament.where(time_zone: rails_name).update_all(time_zone: iana) # rubocop:disable Rails/SkipsModelValidations
    end
  end

  # Slightly lossy restore mechanism. Some Rails names share an IANA zone (e.g. "Edinburgh" and "London"),
  # so the first Rails name for each zone wins. Zones with no Rails name are left as is.
  # Blanked "International Date Line West" values are not restored.
  def down
    ActiveSupport::TimeZone::MAPPING.to_a.reverse.to_h(&:reverse).each do |iana, rails_name|
      next if rails_name == iana || rails_name == 'UTC'

      MigrationTournament.where(time_zone: iana).update_all(time_zone: rails_name) # rubocop:disable Rails/SkipsModelValidations
    end
  end
end
