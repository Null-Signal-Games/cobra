<script lang="ts">
  import { resolve } from "$app/paths";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { PageProps } from "./$types";
  import SharePage from "./SharePage.svelte";
  import { generateMarkdownPages } from "./markdown";

  let { data, params }: PageProps = $props();

  let markdownPages = $derived(
    data.round && data.stage
      ? generateMarkdownPages(
          data.stage.format,
          data.round.number,
          data.round.pairings,
          data.stage.is_single_sided,
        )
      : [],
  );
</script>

<div class="col-12">

<p class="dontprint">
  <a href={resolve(`/tournaments/${params.tournamentId}/organizer/rounds`)} class="btn btn-primary">
    <FontAwesomeIcon icon="arrow-left" /> Back to Pairings
  </a>
</p>

{#if data.round && data.stage}
  <h2>Export Pairings as Markdown</h2>

  {#each markdownPages as text, i (i)}
    <div style="margin-bottom: 2rem">
      <SharePage {text} page={i + 1} />
    </div>
  {/each}
{:else}
  <div class="alert alert-warning">Round not found.</div>
{/if}
</div>
