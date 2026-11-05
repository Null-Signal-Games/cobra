<script lang="ts">
  import { getFaction } from "../utils/factions.ts";

  let { name }: { name: string } = $props();
</script>

{#if name}
  <div class={name}>
    <i class="fa icon icon-{name}"></i>
    {getFaction(name).displayName}
  </div>
{/if}
