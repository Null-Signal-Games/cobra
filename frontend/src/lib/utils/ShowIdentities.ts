import { browser } from "$app/env";
import { writable } from "svelte/store";

const STORAGE_KEY = "showIdentities";

const initialValue: boolean =
  browser && typeof localStorage !== "undefined"
    ? (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "true") as boolean)
    : true;

export const showIdentities = writable<boolean>(initialValue);

if (browser && typeof localStorage !== "undefined") {
  showIdentities.subscribe((value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  });
}
