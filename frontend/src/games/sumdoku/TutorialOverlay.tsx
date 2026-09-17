import { useEffect, useState, type RefObject } from "react";
import styles from "./TutorialOverlay.module.css";

const STORAGE_KEY = "sumduko:tutorialSeen";

export function hasTutorialBeenSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markTutorialSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

interface Step {
  title: string;
  body: string;
  ref: RefObject<HTMLElement> | null;
}

interface TutorialOverlayProps {
  targetRef: RefObject<HTMLElement>;
  boardRef: RefObject<HTMLElement>;
  trayRef: RefObject<HTMLElement>;
  onDone: () => void;
}

const PAD = 8;

export default function TutorialOverlay({
  targetRef,
  boardRef,
  trayRef,
  onDone,
}: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [, forceTick] = useState(0);

  const steps: Step[] = [
    {
      title: "Meet the target",
      body: "Every row, column, and 3×3 box must add up to this target number.",
      ref: targetRef,
    },
    {
      title: "Repeats are fine",
      body: "Digits can repeat anywhere on the board — this isn't classic Sudoku.",
      ref: boardRef,
    },
    {
      title: "Watch your fuel",
      body: "You only have a limited supply of each digit. Once one runs out, you can't place it again.",
      ref: trayRef,
    },
    {
      title: "You're ready",
      body: "Tap a cell, then tap a digit. Lines glow green at target, amber if you go over.",
      ref: null,
    },
  ];

  useEffect(() => {
    const onResize = () => forceTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, []);

  const step = steps[stepIndex];
  const rect = step.ref?.current?.getBoundingClientRect() ?? null;

  const finish = () => {
    markTutorialSeen();
    onDone();
  };

  const next = () => {
    if (stepIndex === steps.length - 1) {
      finish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const highlightStyle = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const cardStyle = rect
    ? {
        top: Math.min(rect.bottom + 16, window.innerHeight - 200),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 320)),
      }
    : undefined;

  return (
    <div className={styles.overlay}>
      {highlightStyle && <div className={styles.spotlight} style={highlightStyle} />}
      <div className={rect ? styles.cardPositioned : styles.cardCentered} style={cardStyle}>
        <p className={styles.stepCount}>
          {stepIndex + 1} / {steps.length}
        </p>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={finish}>
            Skip
          </button>
          <button type="button" className={styles.next} onClick={next}>
            {stepIndex === steps.length - 1 ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
