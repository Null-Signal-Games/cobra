<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ProgressButton from "$lib/components/ProgressButton.svelte";

  let { text, page }: { text: string; page: number } = $props();

  let error = $state("");

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(text);
      error = "";
      return true;
    } catch {
      error = "Unable to copy text.";
      return false;
    }
  }
</script>

<h3>
  <ProgressButton
    css="btn btn-info align-top"
    inProgressText="Copying"
    completeText="Copied"
    onclick={copyMarkdown}
  >
    <FontAwesomeIcon icon="copy" /> Copy
  </ProgressButton>
  <span style="margin-left: 1rem">Page {page}</span>
</h3>

<textarea readonly={true} style="width: 100%; min-height: 15rem; box-sizing: border-box;">{text}</textarea>

{#if error}
  <div class="alert alert-danger">{error}</div>
{/if}
