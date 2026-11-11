"use client";

import { useEffect } from "react";

/**
 * ScrollMotion — a page's scroll choreography, in one effect.
 *
 * Markup opts in with data attributes, so server components stay server
 * components:
 *
 *   data-reveal="up|fade|scale|blur|left|right"   entrance when scrolled into view
 *   data-reveal-delay="120"                       stagger, in ms
 *   data-progress="enter|cross|line"              scroll-linked progress (fallback only)
 *
 * Render it once, as the last child of the page that uses those attributes, so
 * it mounts after that page's markup exists.
 *
 * What it guarantees:
 *  - Content is visible by default. Nothing is hidden in HTML or CSS, so with
 *    JavaScript off, or before hydration, the page is complete.
 *  - Entrances are Web Animations held paused on their first frame. That hides
 *    below-the-fold elements without touching a single DOM attribute, so it can
 *    never cause a hydration mismatch or fight a React re-render.
 *  - Anything already on screen when this mounts is left alone — no flash.
 *  - Under prefers-reduced-motion nothing starts at all.
 *  - Only opacity / transform / filter animate.
 *
 * Scroll-linked effects (.hb-settle, .hb-lit, …) are CSS scroll-driven
 * animations wherever the browser has them. Only where it does not, this
 * component measures progress and writes `--p` for the CSS fallback: one
 * batched read/write pass per frame, over tracked elements near the viewport.
 */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function framesFor(kind: string | undefined): { frames: Keyframe[]; duration: number } {
  switch (kind) {
    case "fade":
      return { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 900 };
    case "scale":
      return {
        frames: [
          { opacity: 0, transform: "translate3d(0, 24px, 0) scale(0.94)" },
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
        ],
        duration: 1200,
      };
    case "blur":
      return {
        frames: [
          { opacity: 0, filter: "blur(12px)", transform: "translate3d(0, 24px, 0)" },
          { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0)" },
        ],
        duration: 1200,
      };
    case "left":
      return {
        frames: [
          { opacity: 0, transform: "translate3d(-36px, 0, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        duration: 1100,
      };
    case "right":
      return {
        frames: [
          { opacity: 0, transform: "translate3d(36px, 0, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        duration: 1100,
      };
    default:
      return {
        frames: [
          { opacity: 0, transform: "translate3d(0, 32px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        duration: 1100,
      };
  }
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function numberAttr(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Progress of one tracked element, from its position in the viewport. */
function progressOf(el: HTMLElement, rect: DOMRect, viewport: number): number {
  switch (el.dataset.progress) {
    case "enter": {
      // Fractions of a viewport height the top edge has travelled since it
      // met the bottom of the viewport: 0 at `start`, 1 at `end`.
      const start = numberAttr(el.dataset.progressStart, 0);
      const end = numberAttr(el.dataset.progressEnd, 0.7);
      const travelled = (viewport - rect.top) / viewport;
      return clamp01((travelled - start) / Math.max(0.0001, end - start));
    }
    case "line": {
      // How far a reading line (a fixed fraction down the viewport) has moved
      // through the element.
      const line = numberAttr(el.dataset.progressLine, 0.55) * viewport;
      return clamp01((line - rect.top) / Math.max(1, rect.height));
    }
    default:
      // "cross": 0 as it enters at the bottom, 1 as it leaves at the top.
      return clamp01((viewport - rect.top) / (viewport + rect.height));
  }
}

export function ScrollMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const cleanups: Array<() => void> = [];
    const viewportAtMount = window.innerHeight;

    /* ---- Entrances ---------------------------------------------------- */
    if (typeof Element.prototype.animate === "function") {
      const pending = new Map<Element, Animation>();

      const play = (el: Element) => {
        const animation = pending.get(el);
        if (!animation) return;
        pending.delete(el);
        animation.play();
        // Once finished, the element's own styles equal the last keyframe, so
        // dropping the animation is invisible and frees its layer.
        animation.finished.then(() => animation.cancel()).catch(() => undefined);
      };

      const show = (el: Element) => {
        const animation = pending.get(el);
        if (!animation) return;
        pending.delete(el);
        animation.cancel();
      };

      // The root is stretched far above the viewport, so an element that was
      // jumped past (anchor link, End key) still reports in — and is simply
      // shown, rather than animating in later when scrolled back to.
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            if (entry.boundingClientRect.bottom <= 0) show(entry.target);
            else play(entry.target);
          }
        },
        { rootMargin: "100000px 0px -8% 0px", threshold: 0.01 },
      );

      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        // On screen already, above the viewport, or not rendered: leave it be.
        if (rect.top < viewportAtMount * 0.94 || (rect.width === 0 && rect.height === 0)) return;
        const { frames, duration } = framesFor(el.dataset.reveal);
        const delay = numberAttr(el.dataset.revealDelay, 0);
        const animation = el.animate(frames, { duration, delay, easing: EASE, fill: "both" });
        animation.pause();
        pending.set(el, animation);
        observer.observe(el);
      });

      // Nothing may stay hidden: at the very end of the page the last few
      // elements can sit below the trigger line with no scroll left.
      let endFrame = 0;
      const checkEnd = () => {
        endFrame = 0;
        if (pending.size === 0) return;
        const doc = document.documentElement;
        if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
          Array.from(pending.keys()).forEach(play);
        }
      };
      const onScrollEnd = () => {
        if (endFrame === 0 && pending.size > 0) endFrame = window.requestAnimationFrame(checkEnd);
      };
      const showAll = () => Array.from(pending.keys()).forEach(show);

      window.addEventListener("scroll", onScrollEnd, { passive: true });
      window.addEventListener("beforeprint", showAll);

      cleanups.push(() => {
        window.removeEventListener("scroll", onScrollEnd);
        window.removeEventListener("beforeprint", showAll);
        if (endFrame !== 0) window.cancelAnimationFrame(endFrame);
        observer.disconnect();
        showAll();
      });
    }

    /* ---- Scroll-linked progress (fallback path only) -------------------- */
    const nativeTimelines =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: view()");

    if (!nativeTimelines) {
      // Elements on screen at mount keep their finished state: starting them
      // now would visibly snap content the reader is already looking at.
      const tracked = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]")).filter(
        (el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= viewportAtMount && (rect.width > 0 || rect.height > 0);
        },
      );

      if (tracked.length > 0) {
        const active = new Set<HTMLElement>();
        const last = new WeakMap<HTMLElement, number>();
        let frame = 0;

        const update = (elements: Iterable<HTMLElement>) => {
          const viewport = window.innerHeight;
          // Read everything, then write everything: one layout per frame.
          const next: Array<[HTMLElement, number]> = [];
          for (const el of elements) {
            next.push([el, progressOf(el, el.getBoundingClientRect(), viewport)]);
          }
          for (const [el, value] of next) {
            const previous = last.get(el);
            if (previous !== undefined && Math.abs(previous - value) < 0.0005) continue;
            last.set(el, value);
            el.style.setProperty("--p", value.toFixed(4));
          }
        };

        const tick = () => {
          frame = 0;
          update(active);
        };
        const schedule = () => {
          if (frame === 0 && active.size > 0) frame = window.requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(
          (entries) => {
            const changed: HTMLElement[] = [];
            for (const entry of entries) {
              const el = entry.target as HTMLElement;
              if (entry.isIntersecting) active.add(el);
              else active.delete(el);
              changed.push(el);
            }
            // Settles each element on an exact end value as it leaves range.
            update(changed);
          },
          { rootMargin: "30% 0px 30% 0px", threshold: 0 },
        );

        update(tracked);
        tracked.forEach((el) => observer.observe(el));
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });

        cleanups.push(() => {
          window.removeEventListener("scroll", schedule);
          window.removeEventListener("resize", schedule);
          observer.disconnect();
          if (frame !== 0) window.cancelAnimationFrame(frame);
          tracked.forEach((el) => el.style.removeProperty("--p"));
        });
      }
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
