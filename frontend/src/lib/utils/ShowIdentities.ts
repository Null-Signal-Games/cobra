import { browser } from "$app/env";
import { writable } from "svelte/store";

const initialValue: boolean = browser
  ? JSON.parse(localStorage.getItem("showIdentities") ?? "true") as boolean
  : true;
export const showIdentities = writable(initialValue);
showIdentities.subscribe(
  (value) => {
    if (browser) {
      localStorage.showIdentities = JSON.stringify(value);
    }
  }
);
