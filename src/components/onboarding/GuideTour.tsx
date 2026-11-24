"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ARROW_SIZE, tourLayout, type Box, type TourLayout } from "@/lib/onboarding/layout";
import {
  GUIDE_FACE,
  GUIDE_NAME,
  LAST_STEP,
  TOUR_HOME,
  TOUR_STEPS,
  clampStep,
  shouldAutoStart,
  tourStorageKey,
} from "@/lib/onboarding/tour";

const START_DELAY_MS = 1200;
// Buttons Kit shouldn't stand in front of: every button the tour talks about, plus his replay button.
const KEEP_CLEAR = [...TOUR_STEPS.flatMap((step) => (step.target ? [step.target] : [])), 'button[aria-label^="Replay the QuestGo tour"]'].join(", ");

// The first match that is actually on screen (phones hide the header links,
// computers hide the bottom bar).
function findVisible(selector?: string): HTMLElement | null {
  if (!selector) return null;
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return element;
  }
  return null;
}

type Placement = TourLayout & { roundRing: boolean };

const boxOf = (element: Element): Box => {
  const { top, left, width, height } = element.getBoundingClientRect();
  return { top, left, width, height };
};

// Works out where the ring, the arrow, Kit and his bubble go for one step.
function place(selector?: string): Placement {
  const target = findVisible(selector);
  const screen = {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight,
  };
  const avoid = [...document.querySelectorAll(KEEP_CLEAR)]
    .filter((element) => element !== target)
    .map(boxOf)
    .filter((box) => box.width > 0 && box.height > 0);
  const layout = tourLayout(target ? boxOf(target) : null, screen, avoid);
  return { ...layout, roundRing: target?.tagName === "BUTTON" };
}

// S3-11: Kit walks first-time users through the app. On every step he walks
// over to the button, a gold arrow points at it, and the text is his speech bubble.
export function GuideTour() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const current = TOUR_STEPS[step];
  const isLast = step === LAST_STEP;
  const onHome = pathname === TOUR_HOME;

  const openTour = useCallback(() => {
    setStep(0);
    setPlacement(place(TOUR_STEPS[0].target));
    setOpen(true);
  }, []);

  // 1. Start by itself once per account (remembered in this browser).
  useEffect(() => {
    if (!user) return;
    let seen = true; // if the browser blocks storage, don't nag
    try {
      seen = window.localStorage.getItem(tourStorageKey(user.uid)) === "done";
    } catch {
      /* storage blocked */
    }
    if (!shouldAutoStart(pathname, seen, user.metadata?.creationTime)) return;
    const timer = window.setTimeout(openTour, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [user, pathname, openTour]);

  const finish = useCallback(() => {
    setOpen(false);
    if (user) {
      try {
        window.localStorage.setItem(tourStorageKey(user.uid), "done");
      } catch {
        /* storage blocked */
      }
    }
    launcherRef.current?.focus();
  }, [user]);

  // 2. Walk Kit, the arrow and the ring over to the button this step talks about.
  useEffect(() => {
    if (!open) return;
    const update = () => setPlacement(place(current.target));
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, current.target]);

  // 3. Keyboard: arrows move, Esc skips, Tab stays inside the tour.
  useEffect(() => {
    if (!open) return;
    nextRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight") setStep((value) => clampStep(value + 1));
      else if (event.key === "ArrowLeft") setStep((value) => clampStep(value - 1));
      else if (event.key === "Tab" && dialogRef.current) {
        const buttons = [...dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  const ring = placement?.ring;
  const arrow = placement?.arrow;
  const kit = placement?.kit;
  const bubble = placement?.bubble;

  return (
    <>
      {onHome && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openTour}
          aria-label={`Replay the QuestGo tour with ${GUIDE_NAME}`}
          title="Need help? Replay the tour"
          className="fixed bottom-28 left-4 z-[55] h-14 w-14 overflow-hidden rounded-full border-[3px] border-gold bg-cream shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 md:bottom-6"
        >
          <Image src={GUIDE_FACE} alt="" width={56} height={56} className="h-full w-full object-cover" />
        </button>
      )}

      {open && bubble && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-tour-title"
          aria-describedby="guide-tour-text"
          className="fixed inset-0 z-[65]"
        >
          {/* Dim everything except the highlighted button, which gets a gold ring. */}
          {ring ? (
            <div
              data-part="ring"
              aria-hidden="true"
              style={{ top: ring.top, left: ring.left, width: ring.width, height: ring.height, borderRadius: placement?.roundRing ? 9999 : 16 }}
              className="pointer-events-none fixed shadow-[0_0_0_9999px_rgba(10,4,6,0.72)] ring-[3px] ring-gold transition-all duration-500 ease-out motion-reduce:transition-none"
            />
          ) : (
            <div data-part="dim" aria-hidden="true" className="fixed inset-0 bg-[rgba(10,4,6,0.72)]" />
          )}

          {/* Bouncing arrow pointing straight at the button. */}
          {arrow && (
            <div
              data-part="arrow"
              aria-hidden="true"
              style={{ top: arrow.top, left: arrow.left, width: ARROW_SIZE.width, height: ARROW_SIZE.height }}
              className={`pointer-events-none fixed transition-all duration-500 ease-out motion-reduce:transition-none ${arrow.points === "up" ? "rotate-180" : ""}`}
            >
              <svg viewBox="0 0 34 38" className="h-full w-full animate-bounce drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)] motion-reduce:animate-none">
                <path d="M11 2h12v17h9L17 36 2 19h9z" fill="#c9a227" stroke="#5f1727" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Kit, standing beside the arrow and facing it. */}
          {kit && (
            <div
              data-part="kit"
              aria-hidden="true"
              style={{ top: kit.top, left: kit.left, width: kit.width, height: kit.height }}
              className="pointer-events-none fixed transition-[top,left] duration-500 ease-out motion-reduce:transition-none"
            >
              <Image
                key={current.pose}
                src={current.pose}
                alt=""
                width={kit.width}
                height={kit.height}
                className={`h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] motion-safe:transition-opacity motion-safe:duration-300 motion-safe:starting:opacity-0 ${kit.flip ? "-scale-x-100" : ""}`}
              />
            </div>
          )}

          {/* Kit's speech bubble, with a little tail pointing at him. */}
          <div
            data-part="bubble"
            style={{ top: bubble.y, left: bubble.left, width: bubble.width }}
            className={`fixed rounded-2xl bg-cream p-4 text-dark shadow-2xl transition-[top,left] duration-500 ease-out motion-reduce:transition-none ${bubble.grows === "up" ? "-translate-y-full" : ""}`}
          >
            <span
              aria-hidden="true"
              style={{ left: bubble.tailX - 7 }}
              className={`absolute h-3.5 w-3.5 rotate-45 bg-cream ${bubble.grows === "up" ? "-bottom-1.5" : "-top-1.5"}`}
            />
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-light">
              Step {step + 1} of {TOUR_STEPS.length}
            </p>
            <h2 id="guide-tour-title" className="font-display text-lg font-bold text-maroon">
              {current.title}
            </h2>
            <p id="guide-tour-text" className="mt-1 text-sm text-muted">
              {current.text}
            </p>
            <div className="my-3 flex gap-1.5" aria-hidden="true">
              {TOUR_STEPS.map((item, index) => (
                <span
                  key={item.id}
                  className={`h-1.5 rounded-full transition-all ${index === step ? "w-5 bg-gold" : "w-1.5 bg-subtle"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={finish} className="px-1 py-1.5 text-sm font-semibold text-muted underline">
                Skip
              </button>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => setStep((value) => clampStep(value - 1))}
                disabled={step === 0}
                className="rounded-lg border-2 border-maroon px-3 py-1.5 text-sm font-semibold text-maroon disabled:opacity-40"
              >
                Back
              </button>
              <button
                ref={nextRef}
                type="button"
                onClick={() => (isLast ? finish() : setStep((value) => clampStep(value + 1)))}
                className="rounded-lg border-2 border-maroon bg-maroon px-3 py-1.5 text-sm font-semibold text-white hover:bg-maroon-light"
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {`Step ${step + 1} of ${TOUR_STEPS.length}: ${current.title}. ${current.text}`}
          </p>
        </div>
      )}
    </>
  );
}