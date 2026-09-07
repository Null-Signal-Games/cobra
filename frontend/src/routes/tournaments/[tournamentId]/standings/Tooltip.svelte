<!-- TODO: Replace with library or move when used more often. Currently no need for a lib-->

<script lang="ts">
  import type { Snippet } from "svelte";
  let { text = "", children }: { text?: string; children?: Snippet } = $props();

  let isHovered = $state(false);
</script>

<div
  role="tooltip"
  class="position-relative"
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
>
  {@render children?.()}
  {#if isHovered}
    <div
      class="position-absolute bg-dark text-white p-1 rounded text-nowrap mb-1"
      style="bottom: 100%; left: 50%; transform: translateX(-50%); z-index: 1000;"
    >
      {text}
    </div>
  {/if}
</div>
