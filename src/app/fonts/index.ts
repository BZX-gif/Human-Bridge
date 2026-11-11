import localFont from "next/font/local";

/**
 * Inter Variable (with the optical-size axis), self-hosted.
 *
 * The `opsz` axis is what lets one file read as a display cut in large
 * headlines and as a text cut in small labels, which the type system in
 * globals.css depends on. The files are vendored (SIL OFL 1.1, see OFL.txt),
 * so there is no runtime request to a third-party font CDN and no build-time
 * network dependency.
 *
 * Two subsets, two families:
 *  - `inter`     Latin. Preloaded: it renders virtually every glyph on screen.
 *  - `interExt`  Latin Extended (₹, diacritics in names). Its unicode-range
 *                means the browser only fetches it when a page actually
 *                contains one of those characters.
 *
 * `interExt` is listed first in --font-sans; because of its unicode-range the
 * browser skips it for ordinary Latin text and falls through to `inter`, then
 * to the metric-adjusted fallback Next generates, so the swap from fallback to
 * web font does not shift the layout.
 */
export const inter = localFont({
  src: "./Inter-Variable-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});

export const interExt = localFont({
  src: "./Inter-Variable-latin-ext.woff2",
  variable: "--font-inter-ext",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});
