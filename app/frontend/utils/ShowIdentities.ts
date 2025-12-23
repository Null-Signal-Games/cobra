import { writable } from "svelte/store";

const initialValue: boolean = JSON.parse(
  localStorage.getItem("showIdentities") ?? "true",
) as boolean;
export const showIdentities = writable(initialValue);
showIdentities.subscribe(
  (value) => (localStorage.showIdentities = JSON.stringify(value)),
);
