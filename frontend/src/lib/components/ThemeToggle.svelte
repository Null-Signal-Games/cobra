<script lang="ts">
  import { theme } from "#lib/utils/theme.svelte.ts";
  import FontAwesomeIcon from "./FontAwesomeIcon.svelte";
</script>

<li class="nav-item">
  <button
    class="btn btn-link nav-link text-light"
    aria-label={theme.current === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    title={theme.current === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    onclick={() => {
      theme.toggle();
    }}
  >
    {#if theme.current === "dark"}
      <FontAwesomeIcon icon="sun-o" cssClass="fa-sun" />
    {:else}
      <FontAwesomeIcon icon="moon-o" cssClass="fa-moon" />
    {/if}
  </button>
</li>
