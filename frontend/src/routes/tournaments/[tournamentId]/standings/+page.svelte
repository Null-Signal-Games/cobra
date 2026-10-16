<script lang="ts">
  import type { PageProps } from "./$types";
  import DoubleElimStandings from "./DoubleElimStandings.svelte";
  import SwissStandings from "./SwissStandings.svelte";
  import type { CutStage, SwissStage } from "$lib/model/Standings";
  
  let { data, params }: PageProps = $props();
</script>

<div class="col-12">
  <h2>Standings</h2>

  {#if data}
    {#each data.standings.stages as stage (stage.format)}
      {#if stage.format === "single_elim" || stage.format === "double_elim"}
        <DoubleElimStandings
          tournamentId={params.tournamentId}
          stage={stage as CutStage}
        />
      {:else}
        <SwissStandings
          tournamentId={params.tournamentId}
          stage={stage as SwissStage}
          manual_seed={data.standings.manual_seed}
        />
      {/if}
    {/each}
  {:else}
    <div class="d-flex align-items-center m-2">
      <div class="spinner-border m-auto"></div>
    </div>
  {/if}
</div>
