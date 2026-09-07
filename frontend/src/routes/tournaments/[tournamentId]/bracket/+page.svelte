<script lang="ts">
  import type { PageProps } from "./$types";
  import BracketDisplay from "$lib/components/BracketDisplay.svelte";

  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import { showIdentities } from "$lib/utils/ShowIdentities";

  let { data }: PageProps = $props();

  function toggleIdentities() {
    showIdentities.update((value) => !value);
  }
</script>

<div class="col-12">
{#if data}
  {#if data.bracket.stages.filter((s) => s.is_elimination).length === 0}
    <div class="alert alert-info">No elimination bracket available.</div>
  {:else}
    <div class="d-flex gap-2 align-items-center mb-2">
      <button class="btn btn-primary" onclick={toggleIdentities}>
        <FontAwesomeIcon icon="eye-slash" />
        Show/hide identities
      </button>
    </div>
    {#each data.bracket.stages.filter((s) => s.is_elimination) as stage (stage.format)}
      <h4 class="mt-3 mb-2">{stage.name}</h4>
      <BracketDisplay {stage} />
    {/each}
  {/if}
{:else}
  <div class="d-flex align-items-center m-2">
    <div class="spinner-border m-auto"></div>
  </div>
{/if}

</div>
