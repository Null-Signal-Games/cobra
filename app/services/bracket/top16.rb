# frozen_string_literal: true

module Bracket
  class Top16 < Base # rubocop:disable Style/Documentation
    game 1, seed(1), seed(16), round: 1, winner_game: 13, loser_game: 9, bracket_type: :upper
    game 2, seed(8), seed(9), round: 1, winner_game: 13, loser_game: 9, bracket_type: :upper
    game 3, seed(5), seed(12), round: 1, winner_game: 14, loser_game: 10, bracket_type: :upper
    game 4, seed(4), seed(13), round: 1, winner_game: 14, loser_game: 10, bracket_type: :upper
    game 5, seed(3), seed(14), round: 1, winner_game: 15, loser_game: 11, bracket_type: :upper
    game 6, seed(6), seed(11), round: 1, winner_game: 15, loser_game: 11, bracket_type: :upper
    game 7, seed(7), seed(10), round: 1, winner_game: 16, loser_game: 12, bracket_type: :upper
    game 8, seed(2), seed(15), round: 1, winner_game: 16, loser_game: 12, bracket_type: :upper

    game 9, loser(1), loser(2), round: 2, winner_game: 17, bracket_type: :lower
    game 10, loser(3), loser(4), round: 2, winner_game: 18, bracket_type: :lower
    game 11, loser(5), loser(6), round: 2, winner_game: 19, bracket_type: :lower
    game 12, loser(7), loser(8), round: 2, winner_game: 20, bracket_type: :lower
    game 13, winner(1), winner(2), round: 2, winner_game: 21, loser_game: 20, bracket_type: :upper
    game 14, winner(3), winner(4), round: 2, winner_game: 21, loser_game: 19, bracket_type: :upper
    game 15, winner(5), winner(6), round: 2, winner_game: 22, loser_game: 18, bracket_type: :upper
    game 16, winner(7), winner(8), round: 2, winner_game: 22, loser_game: 17, bracket_type: :upper

    game 17, loser(16), winner(9), round: 3, winner_game: 23, bracket_type: :lower
    game 18, loser(15), winner(10), round: 3, winner_game: 23, bracket_type: :lower
    game 19, loser(14), winner(11), round: 3, winner_game: 24, bracket_type: :lower
    game 20, loser(13), winner(12), round: 3, winner_game: 24, bracket_type: :lower
    game 21, winner(13), winner(14), round: 3, winner_game: 27, loser_game: 25, bracket_type: :upper
    game 22, winner(15), winner(16), round: 3, winner_game: 27, loser_game: 26, bracket_type: :upper

    game 23, winner(17), winner(18), round: 4, winner_game: 25, bracket_type: :lower
    game 24, winner(19), winner(20), round: 4, winner_game: 26, bracket_type: :lower
    game 27, winner(21), winner(22), round: 4, winner_game: 30, loser_game: 29, bracket_type: :upper

    game 25, loser(21), winner(23), round: 5, winner_game: 28, bracket_type: :lower
    game 26, winner(24), loser(22), round: 5, winner_game: 28, bracket_type: :lower

    game 28, winner(25), winner(26), round: 6, winner_game: 29, bracket_type: :lower

    game 29, loser(27), winner(28), round: 7, winner_game: 30, bracket_type: :lower

    game 30, winner(27), winner(29), round: 8, winner_game: 31, loser_game: 31, bracket_type: :upper

    game 31, winner(30), loser(30), round: 9, bracket_type: :upper

    STANDINGS = [
      [winner(31), winner_if_also_winner(30, 27)],
      [loser(31), loser_if_also_winner(30, 29)],
      loser(29),
      loser(28),
      seed_of([loser(25), loser(26)], 1),
      seed_of([loser(25), loser(26)], 2),
      seed_of([loser(23), loser(24)], 1),
      seed_of([loser(23), loser(24)], 2),
      seed_of([loser(17), loser(18), loser(19), loser(20)], 1),
      seed_of([loser(17), loser(18), loser(19), loser(20)], 2),
      seed_of([loser(17), loser(18), loser(19), loser(20)], 3),
      seed_of([loser(17), loser(18), loser(19), loser(20)], 4),
      seed_of([loser(9), loser(10), loser(11), loser(12)], 1),
      seed_of([loser(9), loser(10), loser(11), loser(12)], 2),
      seed_of([loser(9), loser(10), loser(11), loser(12)], 3),
      seed_of([loser(9), loser(10), loser(11), loser(12)], 4)
    ].freeze
  end
end
