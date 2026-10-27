import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, parent }) => {
  const { stages } = await parent();

  const roundId = parseInt(params.roundId, 10);

  let round = null;
  let stage = null;
  for (const s of stages) {
    const found = s.rounds.find((r) => r.id === roundId);
    if (found) {
      round = found;
      stage = s;
      break;
    }
  }

  return {
    round,
    stage,
  };
};
