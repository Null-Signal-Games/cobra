<script lang="ts">
  import ProgressButton from "$lib/components/ProgressButton.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";

  let {
    title,
    entityType = "tournament",
    instructionsText,
    expectedName,
    buttonLabel,
    inProgressText = "Deleting",
    completeText = "Deleted",
    inputId,
    buttonId,
    onDelete,
  }: {
    title: string;
    entityType?: "tournament" | "stage";
    instructionsText: string;
    expectedName: string;
    buttonLabel: string;
    inProgressText?: string;
    completeText?: string;
    inputId?: string;
    buttonId?: string;
    onDelete: () => Promise<boolean>;
  } = $props();

  let typedName = $state("");
  let matches = $derived(typedName === expectedName);

  function confirmDeletion(): boolean {
    return confirm("Are you absolutely sure? This cannot be reversed.");
  }
</script>

<div class="alert alert-secondary mt-4">
  <h5 class="mb-3">{title}</h5>
  <p>
    Deleting {entityType === "stage" ? "a stage" : "a tournament"} is
    <strong>permanent and cannot be undone.</strong>
    All data associated with {entityType === "stage" ? "this stage" : "the tournament"} will be lost.
  </p>
  <p class="w-100">{instructionsText}</p>
  <div class="d-flex flex-column align-items-center">
    <input
      type="text"
      class="form-control w-75 mb-3"
      id={inputId}
      placeholder="Enter tournament name to confirm deletion"
      bind:value={typedName}
    />
    <ProgressButton
      css="btn btn-danger text-nowrap"
      id={buttonId}
      disabled={!matches}
      confirm={confirmDeletion}
      onclick={onDelete}
      {inProgressText}
      {completeText}
    >
      <FontAwesomeIcon icon="trash" />
      {buttonLabel}
    </ProgressButton>
  </div>
</div>
