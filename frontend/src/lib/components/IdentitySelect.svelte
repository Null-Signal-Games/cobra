<script lang="ts">
  import type { IdentityName } from "#lib/model/Identity.ts";
  import Svelecte from "svelecte";

  let {
    id,
    identityNames,
    value = $bindable(),
    cssClass = "",
    placeholder = "Search for ID",
    enabled = true,
  }: {
    id: string;
    identityNames: IdentityName[];
    value?: string;
    cssClass?: string;
    placeholder?: string;
    enabled?: boolean;
  } = $props();

  let selectedValue = $derived.by(() => {
    const id = identityNames.find((id) => id.value === value);
    return id ? id.label : null;
  });

  // We save the display name instead of the searchable text so we need to
  // manually set the value since we can't bind to the display text with
  // Svelecte.
  function idChanged(selected: IdentityName | null) {
    value = selected ? selected.value : "";
  }
</script>

<Svelecte
  name={id}
  inputId={id}
  controlClass={cssClass}
  disabled={!enabled}
  {placeholder}
  options={identityNames}
  labelField="value"
  valueField="label"
  bind:value={selectedValue}
  onChange={idChanged}
/>
