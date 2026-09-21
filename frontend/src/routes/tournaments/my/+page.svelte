<script lang="ts">
  import { onMount } from "svelte";
  import { authStore, type AuthUser } from "$lib/utils/auth.svelte";
  import { COBRA_API_SERVER } from "$app/env/public";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import { resolve } from "$app/paths";

  interface Tournament {
    id: number;
    name: string;
    date: string;
    slug?: string;
    private: boolean;
    active_player_count: number;
    dropped_player_count: number;
    stage?: string;
  }

  interface JsonApiTournamentItem {
    id: string | number;
    attributes: {
      name: string;
      date: string;
      slug?: string;
      private: boolean;
      active_player_count?: number;
      dropped_player_count?: number;
      stage?: string;
    };
  }

  interface JsonApiTournamentsResponse {
    data: JsonApiTournamentItem[];
  }

  const serverOrigin = (COBRA_API_SERVER || "").replace(/\/$/, "");
  let user = $state<AuthUser | null>(null);
  let tournaments = $state<Tournament[]>([]);
  let isLoading = $state<boolean>(true);

  onMount(async () => {
    user = await authStore.checkAuth();
    if (!user) {
      const currentUrl = window.location.origin + window.location.pathname;
      authStore.redirectToLogin(currentUrl);
      return;
    }

    try {
      const response = await fetch(`${serverOrigin}/api/v1/private/user/tournaments`, {
        credentials: "include",
        headers: { Accept: "application/vnd.api+json" },
      });
      if (response.ok) {
        const json = (await response.json()) as JsonApiTournamentsResponse;
        tournaments = json.data.map((item) => ({
          id: Number(item.id),
          name: item.attributes.name,
          date: item.attributes.date,
          slug: item.attributes.slug,
          private: item.attributes.private,
          active_player_count: item.attributes.active_player_count ?? 0,
          dropped_player_count: item.attributes.dropped_player_count ?? 0,
          stage: item.attributes.stage,
        }));
      }
    } catch {
      // Ignore load error
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="container mt-4">
  {#if isLoading}
    <div class="d-flex justify-content-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only">Loading My Tournaments...</span>
      </div>
    </div>
  {:else if user}
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2>My Tournaments</h2>
        <p class="text-muted mb-0">Logged in as <strong>{user.nrdb_username}</strong></p>
      </div>
      <a href={resolve("/tournaments/new")} class="btn btn-success">
        <FontAwesomeIcon icon="plus" /> New Tournament
      </a>
    </div>

    {#if tournaments.length === 0}
      <div class="alert alert-info">You haven't created any tournaments yet.</div>
    {:else}
      <div class="list-group">
        {#each tournaments as t (t.id)}
          <div
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 class="mb-1">
                <a href={resolve(`/tournaments/${t.id}`)}>{t.name}</a>
                {#if t.private}
                  <span class="badge badge-secondary ml-2">Private</span>
                {/if}
              </h5>
              <small class="text-muted">
                {new Date(t.date).toLocaleDateString()} — {t.active_player_count} active players
              </small>
            </div>
            <div>
              <a
                href={resolve(`/tournaments/${t.id}/organizer/settings`)}
                class="btn btn-sm btn-outline-primary mr-2"
              >
                <FontAwesomeIcon icon="edit" /> Edit
              </a>
              <a
                href={resolve(`/tournaments/${t.id}`)}
                class="btn btn-sm btn-primary"
              >
                View
              </a>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
