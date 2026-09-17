import type { RefObject } from "react";
import type { SupplyMap } from "./types";
import styles from "./DigitTray.module.css";

interface DigitTrayProps {
  remaining: SupplyMap;
  onPlaceDigit: (digit: number) => void;
  onClear: () => void;
  disabled?: boolean;
  trayRef?: RefObject<HTMLDivElement>;
}

export default function DigitTray({
  remaining,
  onPlaceDigit,
  onClear,
  disabled,
  trayRef,
}: DigitTrayProps) {
  const digits = Object.keys(remaining)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className={styles.tray} ref={trayRef}>
      <div className={styles.digits}>
        {digits.map((digit) => {
          const count = remaining[digit];
          const isEmpty = count <= 0;
          return (
            <button
              key={digit}
              type="button"
              className={styles.digitButton}
              onClick={() => onPlaceDigit(digit)}
              disabled={disabled || isEmpty}
              aria-label={`Place ${digit}, ${count} remaining`}
            >
              <span className={styles.digitValue}>{digit}</span>
              <span className={styles.digitCount}>{count}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.eraseButton}
        onClick={onClear}
        disabled={disabled}
        aria-label="Clear selected cell"
      >
        Erase
      </button>
    </div>
  );
}
