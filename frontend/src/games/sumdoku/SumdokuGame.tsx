import { useEffect, useRef, useState } from "react";
import DifficultySelector from "./DifficultySelector";
import DigitTray from "./DigitTray";
import SumdokuBoard from "./SumdokuBoard";
import TutorialOverlay, { hasTutorialBeenSeen } from "./TutorialOverlay";
import WinModal from "./WinModal";
import { useSumdokuGame } from "./useSumdokuGame";
import styles from "./SumdokuGame.module.css";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SumdokuGame() {
  const game = useSumdokuGame("medium");
  const [showWinModal, setShowWinModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const targetRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (game.status === "won") {
      setShowWinModal(true);
    }
  }, [game.status]);

  useEffect(() => {
    if (game.status === "playing" && !hasTutorialBeenSeen()) {
      setShowTutorial(true);
    }
  }, [game.status]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (game.status !== "playing") return;
      if (e.key >= "1" && e.key <= "9") {
        game.placeDigit(Number(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        game.clearSelectedCell();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [game.status, game.placeDigit, game.clearSelectedCell]);

  const isBusy = game.status === "loading" || game.status === "checking";

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sum Sudoku</h1>
        <p className={styles.tagline}>
          Fill the grid so every row, column, and box adds up to the target — digits can repeat,
          fuel can't.
        </p>
      </div>

      <DifficultySelector
        value={game.difficulty}
        onChange={(diff) => game.newGame(diff)}
        disabled={isBusy}
      />

      <div className={styles.statusBar}>
        <div className={styles.targetBadge} ref={targetRef}>
          <span className={styles.targetLabel}>Target</span>
          <span className={styles.targetValue}>{game.target || "—"}</span>
        </div>
        <div className={styles.timer}>{formatTime(game.elapsedSeconds)}</div>
        <button
          type="button"
          className={styles.newGameButton}
          onClick={() => game.newGame(game.difficulty)}
          disabled={isBusy}
        >
          New puzzle
        </button>
      </div>

      {game.status === "error" && (
        <div className={styles.errorBanner}>
          {game.errorMessage ?? "Something went wrong."}{" "}
          <button type="button" onClick={() => game.newGame(game.difficulty)}>
            Retry
          </button>
        </div>
      )}

      {game.status === "loading" ? (
        <div className={styles.loading}>Generating puzzle…</div>
      ) : (
        <>
          <SumdokuBoard
            grid={game.playerGrid}
            clueGrid={game.clueGrid}
            selected={game.selected}
            lineStates={game.lineStates}
            onSelectCell={game.selectCell}
            disabled={isBusy}
            boardRef={boardRef}
          />

          <DigitTray
            remaining={game.remainingSupply}
            onPlaceDigit={game.placeDigit}
            onClear={game.clearSelectedCell}
            disabled={isBusy || !game.selected}
            trayRef={trayRef}
          />

          {game.lastResult && !game.lastResult.correct && game.status === "playing" && (
            <p className={styles.hint}>
              Not quite — check the highlighted rows, columns, and boxes above.
            </p>
          )}
        </>
      )}

      {showTutorial && (
        <TutorialOverlay
          targetRef={targetRef}
          boardRef={boardRef}
          trayRef={trayRef}
          onDone={() => setShowTutorial(false)}
        />
      )}

      {showWinModal && (
        <WinModal
          difficulty={game.difficulty}
          elapsedSeconds={game.elapsedSeconds}
          onPlayAgain={() => {
            setShowWinModal(false);
            game.newGame(game.difficulty);
          }}
          onClose={() => setShowWinModal(false)}
        />
      )}
    </main>
  );
}
