import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const { user, tournamentTypes } = await parent();

  return {
    user,
    tournamentTypes
  };
};
