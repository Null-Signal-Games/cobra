import { browser } from "$app/env";
import { writable } from "svelte/store";

const initialValue: boolean = browser
  ? JSON.parse(localStorage.getItem("showReportedPairings") ?? "true") as boolean
  : false;
export const showReportedPairings = writable(initialValue);
showReportedPairings.subscribe(
  (value) => {
    if (browser) {
      (localStorage.showReportedPairings = JSON.stringify(value));
    }
  }
);
