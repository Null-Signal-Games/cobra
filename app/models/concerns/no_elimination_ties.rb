# frozen_string_literal: true

# Disallow ties for elimination games.
module NoEliminationTies
  extend ActiveSupport::Concern

  included do
    validate :no_ties_in_elimination, if: -> { will_save_change_to_score1? || will_save_change_to_score2? }
  end

  private

  def no_ties_in_elimination
    return unless score1.present? && score1 == score2 && stage&.elimination?

    errors.add(:base, 'Elimination games cannot end in a tie')
  end
end
