import { describe, it, expect } from "vitest";
import { httpUrlOrNull } from "./url.ts";

// Cases mirror spec/models/tournament_spec.rb so the frontend links exactly the URLs that
// HttpUrlValidator accepts.
describe("httpUrlOrNull", () => {
  it("returns empty values as null", () => {
    expect(httpUrlOrNull("")).toBeNull();
    expect(httpUrlOrNull(null)).toBeNull();
    expect(httpUrlOrNull(undefined)).toBeNull();
  });

  it("accepts http and https urls", () => {
    expect(httpUrlOrNull("https://twitch.tv")).toBe("https://twitch.tv/");
    expect(
      httpUrlOrNull("https://alwaysberunning.net/tournaments/4723/milwaukee-megacity-championship"),
    ).toBe("https://alwaysberunning.net/tournaments/4723/milwaukee-megacity-championship");
  });

  it("rejects url without a scheme", () => {
    expect(httpUrlOrNull("mycoolstreamsite.co.uk")).toBeNull();
  });

  it("rejects url with scheme other than http or https", () => {
    expect(httpUrlOrNull("ftp://example.com")).toBeNull();
    expect(httpUrlOrNull("javascript:alert(1)")).toBeNull();
  });

  it("rejects url with scheme but no host", () => {
    expect(httpUrlOrNull("http:example.com")).toBeNull();
  });

  it("rejects invalid url", () => {
    expect(httpUrlOrNull(" asdflkjhasd f asdflkjhas df ")).toBeNull();
  });
});
