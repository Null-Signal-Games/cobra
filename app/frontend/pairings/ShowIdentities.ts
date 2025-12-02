import { writable } from "svelte/store";

const initialValue = JSON.parse(localStorage.getItem("show_identities") ?? "true") as boolean;
export const showIdentities = writable(initialValue);
showIdentities.subscribe((value) => (localStorage.show_identities = JSON.stringify(value)));
