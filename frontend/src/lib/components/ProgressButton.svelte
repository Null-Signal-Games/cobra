<script lang="ts">
  import type { Snippet } from "svelte";
  import FontAwesomeIcon from "./FontAwesomeIcon.svelte";

  const State = Object.freeze({
    DEFAULT: 0,
    IN_PROGRESS: 1,
    COMPLETE: 2,
    ERROR: 3,
  });
  const COMPLETE_DURATION = 1000;

  let {
    css = "btn btn-info",
    id,
    disabled = false,
    children,
    inProgressText = "In progress",
    completeText = "Complete",
    errorText = "Error",
    confirm,
    onclick,
  }: {
    css?: string;
    id?: string;
    disabled?: boolean;
    children: Snippet;
    inProgressText?: string;
    completeText?: string;
    errorText?: string;
    confirm?: () => boolean;
    onclick: () => boolean | Promise<boolean>;
  } = $props();

  let state: number = $state(State.DEFAULT);

  async function clicked() {
    if (state !== State.DEFAULT || (confirm !== undefined && !confirm())) {
      return;
    }

    state = State.IN_PROGRESS;
    state = (await onclick()) ? State.COMPLETE : State.ERROR;

    setTimeout(() => {
      state = State.DEFAULT;
    }, COMPLETE_DURATION);
  }
</script>

<button
  type="button"
  {id}
  class={css}
  onclick={clicked}
  disabled={disabled || state !== State.DEFAULT}
>
  {#if state === State.IN_PROGRESS}
    <span class="spinner-border spinner-border-sm m-auto"></span>
    {inProgressText}
  {:else if state === State.COMPLETE}
    <FontAwesomeIcon icon="check" /> {completeText}
  {:else if state === State.ERROR}
    <FontAwesomeIcon icon="warning" /> {errorText}
  {:else}
    {@render children()}
  {/if}
</button>
