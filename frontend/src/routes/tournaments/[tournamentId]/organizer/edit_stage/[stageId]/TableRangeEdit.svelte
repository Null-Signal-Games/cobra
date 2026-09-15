<script lang="ts">
  import { type Stage, type TableRange } from "./StageSettings";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";

  interface Props {
    stage: Stage;
    tableRange?: TableRange;
  }

  let { stage, tableRange }: Props = $props();

  let newFirstTable: number | undefined = $state();
  let newLastTable: number | undefined = $state();
  let isNewRangeValid = $state(false);

  export function addRange(e?: MouseEvent) {
    if (e) {
      e.preventDefault();
    }

    if (newFirstTable === undefined || newLastTable === undefined) {
      return;
    }

    stage.table_ranges.push({
      stage_id: stage.id,
      first_table: newFirstTable,
      last_table: newLastTable,
    });

    reset();
  }

  export function reset() {
    newFirstTable = undefined;
    newLastTable = undefined;
    isNewRangeValid = false;
  }

  function deleteRange(e: MouseEvent, tableRange: TableRange) {
    e.preventDefault();
    const index = stage.table_ranges.indexOf(tableRange);
    if (index !== -1) {
      stage.table_ranges.splice(index, 1);
    }
  }

  function handleFirstTableInput(event: { currentTarget: HTMLInputElement }) {
    const rawValue = event.currentTarget.value;
    const value = rawValue === "" ? undefined : Number(rawValue);
    if (tableRange) {
      tableRange.first_table = value ?? 0;
    } else {
      newFirstTable = value;
    }
    newTableChanged();
  }

  function handleLastTableInput(event: { currentTarget: HTMLInputElement }) {
    const rawValue = event.currentTarget.value;
    const value = rawValue === "" ? undefined : Number(rawValue);
    if (tableRange) {
      tableRange.last_table = value ?? 0;
    } else {
      newLastTable = value;
    }
    newTableChanged();
  }

  function newTableChanged() {
    isNewRangeValid =
      newFirstTable !== undefined &&
      newLastTable !== undefined &&
      !isNaN(newFirstTable) &&
      !isNaN(newLastTable) &&
      newFirstTable >= 0 &&
      newLastTable >= 0 &&
      newFirstTable <= newLastTable;
  }
</script>

<li class="list-group-item">
  <div class="row">
    <div class="col-md-3">
      <label for={tableRange ? `first_table_${tableRange.first_table}` : "first_table"}>First Table</label>
      <input
        id={tableRange ? `first_table_${tableRange.first_table}` : "first_table"}
        type="number"
        class="form-control"
        placeholder="Enter table number"
        value={tableRange ? tableRange.first_table : newFirstTable}
        oninput={handleFirstTableInput}
      />
    </div>
    <div class="col-md-3">
      <label for={tableRange ? `last_table_${tableRange.last_table}` : "last_table"}>Last Table</label>
      <input
        id={tableRange ? `last_table_${tableRange.last_table}` : "last_table"}
        type="number"
        class="form-control"
        placeholder="Enter table number"
        value={tableRange ? tableRange.last_table : newLastTable}
        oninput={handleLastTableInput}
      />
    </div>
    <div class="col-md-1 align-self-end">
      {#if tableRange !== undefined}
        <button
          onclick={(e) => {
            deleteRange(e, tableRange);
          }}
          class="btn btn-danger"
          aria-label="Delete range"
        >
          <FontAwesomeIcon icon="trash" />
        </button>
      {:else}
        <button
          onclick={(e) => {
            addRange(e);
          }}
          class="btn btn-success"
          aria-label="Add range"
          disabled={!isNewRangeValid}
        >
          <FontAwesomeIcon icon="plus" />
        </button>
      {/if}
    </div>
    <div class="col-md-5"></div>
  </div>
</li>
