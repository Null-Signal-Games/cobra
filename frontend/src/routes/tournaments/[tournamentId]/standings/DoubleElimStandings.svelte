<script lang="ts">
  import type { CutStage } from "$lib/model/Standings";
  import Identity from "$lib/components/identity/Identity.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";

  let { stage }: { stage: CutStage } = $props();
</script>

<table class="table table-striped standings">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Name</th>
      {#if stage.any_decks_viewable}
        <th>Decks</th>
      {/if}
      <th>IDs</th>
      <th>Seed</th>
    </tr>
  </thead>
  <tbody>
    {#each stage.standings as standing (standing.position)}
      <tr>
        <td>{standing.position}</td>
        {#if standing.player}
          <td>{standing.player.name_with_pronouns}</td>
          {#if standing.policy.view_decks}
            <td>
              <a
                href="#top"
                onclick={(event) => {
                  event.preventDefault();
                  alert('TODO: Add view decks');
                }}
              >
                <FontAwesomeIcon icon="eye" />
                View decks
              </a>
            </td>
          {:else if stage.any_decks_viewable}
            <td></td>
          {/if}
          <td class="ids">
            <Identity
              identity={standing.player.corp_id ?? undefined}
              name_if_missing="Corp"
            />
            <Identity
              identity={standing.player.runner_id ?? undefined}
              name_if_missing="Runner"
            />
          </td>
          <td>{standing.seed}</td>
        {:else}
          <td>???</td>
          {#if standing.policy.view_decks}
            <td>???</td>
          {:else if stage.any_decks_viewable}
            <td></td>
          {/if}
          <td class="ids">
            <p>???</p>
            <p>???</p>
          </td>
          <td>???</td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>
