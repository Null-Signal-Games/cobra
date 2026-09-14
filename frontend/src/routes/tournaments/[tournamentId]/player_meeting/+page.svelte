<script lang="ts">
  import { resolve } from "$app/paths";
  import { afterNavigate } from "$app/navigation";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { PageProps } from "./$types";
  import { createPlayerMeetingPairings, getBackDetails } from "./pairings";

  let { data, params }: PageProps = $props();

  let pairings = $derived(createPlayerMeetingPairings(data.players.activePlayers));

  function getInitialPreviousPath(): string | null {
    if (typeof document !== "undefined" && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          return refUrl.pathname;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  let previousPath = $state<string | null>(getInitialPreviousPath());

  afterNavigate(({ from }) => {
    if (from) {
      previousPath = from.url.pathname;
    }
  });

  let backDetails = $derived(getBackDetails(previousPath, params.tournamentId));
  let backHref = $derived(resolve(backDetails.path));
  let backLabel = $derived(backDetails.label);

  function handleBack(e: MouseEvent) {
    if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  }
</script>

<div class="col-12">
  <p class="dontprint">
    <a href={backHref} onclick={handleBack} class="btn btn-primary">
      <FontAwesomeIcon icon="arrow-left" />
      {backLabel}
    </a>
  </p>

  <h3>Player meeting</h3>

  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Player 1</th>
        <th>Player 2</th>
      </tr>
    </thead>
    <tbody>
      {#each pairings as pairing, i (i)}
        <tr>
          <td>{i + 1}</td>
          <td>{pairing[0].name}</td>
          <td>{pairing[1]?.name ?? ""}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
