import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { Difficulty } from "./types";
import styles from "./WinModal.module.css";

interface WinModalProps {
  difficulty: Difficulty;
  elapsedSeconds: number;
  onPlayAgain: () => void;
  onClose: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: "🟢",
  medium: "🟡",
  hard: "🔴",
};

export default function WinModal({
  difficulty,
  elapsedSeconds,
  onPlayAgain,
  onClose,
}: WinModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const duration = 900;
    const end = Date.now() + duration;
    const colors = ["#375ee0", "#16794f", "#f0975a"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const shareText = `Sum Sudoku ${DIFFICULTY_EMOJI[difficulty]} — solved in ${formatTime(
    elapsedSeconds,
  )}`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; silently ignore
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.checkmark} aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle className={styles.checkCircle} cx="26" cy="26" r="24" />
            <path className={styles.checkPath} d="M14 27l7 7 16-16" />
          </svg>
        </div>
        <h2 className={styles.title}>Solved!</h2>
        <p className={styles.time}>{formatTime(elapsedSeconds)}</p>
        <p className={styles.subtitle}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.shareButton} onClick={handleShare}>
            {copied ? "Copied!" : "Share result"}
          </button>
          <button type="button" className={styles.playAgainButton} onClick={onPlayAgain}>
            Play again
          </button>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}
