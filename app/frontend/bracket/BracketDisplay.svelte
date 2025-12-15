<script lang="ts">
  import type {
    BracketStage,
    BracketPairing,
    PredecessorMap,
  } from "./BracketData.ts";
  import BracketMatchNode from "./BracketMatchNode.svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { showIdentities } from "../pairings/ShowIdentities";

  let { stage }: { stage: BracketStage } = $props();

  const isDoubleElim = $derived(stage.format === "double_elim");
  const maxRoundNumber = $derived(
    Math.max(...stage.rounds.map((r) => r.number)),
  );

  const remSize =
    typeof window !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;

  // Filter function to exclude empty bracket reset games
  function shouldIncludePairing(
    pairing: BracketPairing,
    roundNumber: number,
  ): boolean {
    // If this is the last round in double elim and the pairing has no players, exclude it
    if (isDoubleElim && roundNumber === maxRoundNumber) {
      return !!(pairing.player1 ?? pairing.player2);
    }
    return true;
  }

  const allPairings = $derived(stage.rounds.flatMap((r) => r.pairings));

  const predecessorMap: PredecessorMap = $derived.by(() => {
    const map: PredecessorMap = {};

    for (const pairing of allPairings) {
      if (pairing.winner_game) {
        map[pairing.winner_game] = [
          ...(map[pairing.winner_game] ?? []),
          { method: "winner", game: pairing.table_number },
        ];
      }
      if (pairing.loser_game) {
        map[pairing.loser_game] = [
          ...(map[pairing.loser_game] ?? []),
          { method: "loser", game: pairing.table_number },
        ];
      }
    }

    return map;
  });

  const upperRounds = $derived(
    stage.rounds.map((r) => ({
      number: r.number,
      pairings: r.pairings
        .filter((p) => p.bracket_type === "upper")
        .filter((p) => shouldIncludePairing(p, r.number)),
    })),
  );
  const lowerRounds = $derived(
    stage.rounds
      .map((r) => ({
        number: r.number,
        pairings: r.pairings
          .filter((p) => p.bracket_type === "lower")
          .filter((p) => shouldIncludePairing(p, r.number)),
      }))
      .filter((r) => r.pairings.length > 0),
  );

  // Layout constants scaled by rem size
  // Base sizes are designed for 16px (1rem = 16px)
  const scaleFactor = remSize / 16;
  const columnWidth = 250 * scaleFactor;
  const columnGap = 32 * scaleFactor;
  const matchHeight = $derived(($showIdentities ? 80 : 48) * scaleFactor);
  const matchGap = 16 * scaleFactor;
  const padding = 16 * scaleFactor;
  const bracketGap = 32 * scaleFactor; // vertical gap between upper and lower bracket

  const columnX = (index: number): number =>
    padding + index * (columnWidth + columnGap);

  const baseMatchY = $derived(
    (index: number): number => padding + index * (matchHeight + matchGap),
  );

  // Extract a flattened list of matches per column to compute connectors
  function roundsToColumns(rounds: typeof upperRounds): BracketPairing[][] {
    return rounds.sort((a, b) => a.number - b.number).map((r) => r.pairings);
  }

  // Compute SVG size heuristically
  const upperCols = $derived(roundsToColumns(upperRounds));
  const lowerCols = $derived(roundsToColumns(lowerRounds));
  const numUpperRows = $derived(
    stage.rounds.reduce(
      (max, r) =>
        Math.max(
          max,
          r.pairings.filter((p) => p.bracket_type === "upper").length,
        ),
      0,
    ),
  );
  const numLowerRows = $derived(
    stage.rounds.reduce(
      (max, r) =>
        Math.max(
          max,
          r.pairings.filter((p) => p.bracket_type === "lower").length,
        ),
      0,
    ),
  );

  // Align lower bracket's first column with the upper bracket's second column (by round number alignment)
  const minLowerRound = $derived(
    lowerRounds.length > 0 ? Math.min(...lowerRounds.map((r) => r.number)) : 1,
  );
  const lowerColOffset = $derived(Math.max(0, minLowerRound - 1));

  const numCols = $derived(
    Math.max(upperCols.length, lowerCols.length + lowerColOffset),
  );
  const svgWidth = $derived(padding * 2 + numCols * (columnWidth + columnGap));
  const svgHeightUpper = $derived(
    padding * 2 + Math.max(1, numUpperRows) * (matchHeight + matchGap),
  );
  const svgHeightLower = $derived(
    padding * 2 + Math.max(1, numLowerRows) * (matchHeight + matchGap),
  );
  const svgHeightTotal = $derived(svgHeightUpper + bracketGap + svgHeightLower);

  // For connectors: map winner_game within same bracket
  const connectorPath = $derived(
    (
      fromCol: number,
      fromRow: number,
      toCol: number,
      toRow: number,
      yPos: number[][],
      colOffset = 0,
    ) => {
      const x = (col: number) => columnX(col + colOffset);
      const x1 = x(fromCol) + columnWidth;
      const y1 =
        (yPos[fromCol]?.[fromRow] ?? baseMatchY(fromRow)) + matchHeight / 2;
      const x2 = x(toCol);
      const y2 = (yPos[toCol]?.[toRow] ?? baseMatchY(toRow)) + matchHeight / 2;
      const mx = (x1 + x2) / 2;
      return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
    },
  );

  function getIndex(cols: BracketPairing[][]) {
    const index = new SvelteMap<string, { col: number; row: number }>();
    cols.forEach((col, cIdx) => {
      col.forEach((m, rIdx) => {
        index.set(String(m.table_number), { col: cIdx, row: rIdx });
      });
    });
    return index;
  }

  const upperIndex = $derived(getIndex(upperCols));
  const lowerIndex = $derived(getIndex(lowerCols));

  const connectorPathTo = $derived(
    (
      index: SvelteMap<string, { col: number; row: number }>,
      fromCol: number,
      fromRow: number,
      winnerGame: number,
      yPos: number[][],
      colOffset = 0,
    ): string | null => {
      const target = index.get(String(winnerGame));
      if (!target) return null;
      return connectorPath(
        fromCol,
        fromRow,
        target.col,
        target.row,
        yPos,
        colOffset,
      );
    },
  );

  // Compute Y positions per column so that each game is centered between its predecessors
  const computeYPositions = $derived((cols: BracketPairing[][]): number[][] => {
    const positions: number[][] = cols.map((col) =>
      new Array<number>(col.length).fill(0),
    );
    if (cols.length === 0) return positions;

    // First column: base spacing
    for (let r = 0; r < cols[0].length; r++) {
      positions[0][r] = baseMatchY(r);
    }

    // Subsequent columns
    for (let c = 1; c < cols.length; c++) {
      for (let r = 0; r < cols[c].length; r++) {
        const match = cols[c][r];
        const predecessorYs: number[] = [];
        // Find predecessors in any earlier column whose winner game points to this match
        for (let pc = 0; pc < c; pc++) {
          for (let pr = 0; pr < cols[pc].length; pr++) {
            const prevMatch = cols[pc][pr];
            if (prevMatch.winner_game != null) {
              if (prevMatch.winner_game === match.table_number) {
                predecessorYs.push(positions[pc][pr] + matchHeight / 2);
              }
            }
          }
        }

        if (predecessorYs.length > 0) {
          // Center between predecessors
          const minY = Math.min(...predecessorYs);
          const maxY = Math.max(...predecessorYs);
          positions[c][r] = (minY + maxY) / 2 - matchHeight / 2;
        } else {
          // Fallback to base spacing
          positions[c][r] = baseMatchY(r);
        }
      }
    }

    return positions;
  });

  const upperY = $derived(computeYPositions(upperCols));
  const lowerY = $derived(computeYPositions(lowerCols));
</script>

<div class="bracket-embedded overflow-auto border rounded p-2">
  <svg width={svgWidth} height={svgHeightTotal} role="img" aria-label="Bracket">
    {#if upperRounds.length > 0}
      <g>
        <g>
          <!-- Connectors -->
          {#each upperCols as col, cIdx (cIdx)}
            {#each col as m, rIdx (m.table_number)}
              {#if m.winner_game != null}
                {#if upperIndex.has(String(m.winner_game))}
                  <path
                    d={connectorPathTo(
                      upperIndex,
                      cIdx,
                      rIdx,
                      m.winner_game,
                      upperY,
                    )}
                    stroke="#999"
                    fill="none"
                  />
                {/if}
              {/if}
            {/each}
          {/each}
        </g>

        <!-- Matches -->
        {#each upperCols as col, cIdx (cIdx)}
          {#each col as match, rIdx (match.table_number)}
            <BracketMatchNode
              {match}
              allMatches={allPairings}
              {predecessorMap}
              x={columnX(cIdx)}
              y={upperY[cIdx]?.[rIdx] ?? baseMatchY(rIdx)}
              width={columnWidth}
              height={matchHeight}
            />
          {/each}
        {/each}
      </g>
    {/if}

    {#if lowerRounds.length > 0}
      <g transform={`translate(0, ${svgHeightUpper + bracketGap})`}>
        <!-- Connectors -->
        <g>
          {#each lowerCols as col, cIdx (cIdx)}
            {#each col as match, rIdx (match.table_number)}
              {#if match.winner_game != null}
                {#if lowerIndex.has(String(match.winner_game))}
                  <path
                    d={connectorPathTo(
                      lowerIndex,
                      cIdx,
                      rIdx,
                      match.winner_game,
                      lowerY,
                      lowerColOffset,
                    )}
                    stroke="#999"
                    fill="none"
                  />
                {/if}
              {/if}
            {/each}
          {/each}
        </g>
        <!-- Matches -->
        {#each lowerCols as col, cIdx (cIdx)}
          {#each col as match, rIdx (match.table_number)}
            <BracketMatchNode
              {match}
              allMatches={allPairings}
              {predecessorMap}
              x={columnX(cIdx + lowerColOffset)}
              y={lowerY[cIdx]?.[rIdx] ?? baseMatchY(rIdx)}
              width={columnWidth}
              height={matchHeight}
            />
          {/each}
        {/each}
      </g>
    {/if}
  </svg>
</div>

<style>
  .bracket-embedded {
    background-color: #fafafa;
  }
</style>
