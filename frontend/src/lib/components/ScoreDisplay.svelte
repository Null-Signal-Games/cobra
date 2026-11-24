<script lang="ts">
  import type { Pairing } from "#lib/model/Pairing.ts";

  let { pairing }: { pairing: Pairing } = $props();
</script>

{pairing.score_label}
{#if pairing.intentional_draw}
  <span class="badge badge-pill badge-secondary score-badge">
    ID
  </span>
{/if}
{#if pairing.two_for_one}
  <span class="badge badge-pill badge-secondary score-badge">
    2 for 1
  </span>
{/if}
