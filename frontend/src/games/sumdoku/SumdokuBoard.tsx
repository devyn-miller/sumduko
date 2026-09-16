import type { CSSProperties, RefObject } from "react";
import type { LineStates } from "./lines";
import { boxIndexForCell } from "./lines";
import type { Grid } from "./types";
import styles from "./SumdokuBoard.module.css";

interface SumdokuBoardProps {
  grid: Grid;
  clueGrid: Grid;
  selected: { row: number; col: number } | null;
  lineStates: LineStates;
  onSelectCell: (row: number, col: number) => void;
  disabled?: boolean;
  boardRef?: RefObject<HTMLDivElement>;
}

function badgeClass(status: string): string {
  if (status === "match") return styles.badgeMatch;
  if (status === "over") return styles.badgeOver;
  return styles.badgeNeutral;
}

function cellBoxClass(status: string): string {
  if (status === "match") return styles.cellBoxMatch;
  if (status === "over") return styles.cellBoxOver;
  return "";
}

export default function SumdokuBoard({
  grid,
  clueGrid,
  selected,
  lineStates,
  onSelectCell,
  disabled,
  boardRef,
}: SumdokuBoardProps) {
  const cells = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = grid[r][c];
      const isClue = clueGrid[r][c] !== 0;
      const isSelected = selected?.row === r && selected?.col === c;
      const boxIndex = boxIndexForCell(r, c);
      const boxStatus = lineStates.boxes[boxIndex].status;

      const style: CSSProperties = {
        gridColumn: c + 1,
        gridRow: r + 1,
        borderRight: c === 2 || c === 5 ? "2px solid var(--color-border-strong)" : undefined,
        borderBottom: r === 2 || r === 5 ? "2px solid var(--color-border-strong)" : undefined,
      };

      cells.push(
        <button
          key={`${r}-${c}`}
          type="button"
          style={style}
          className={[
            styles.cell,
            isClue ? styles.cellClue : styles.cellPlayer,
            isSelected ? styles.cellSelected : "",
            cellBoxClass(boxStatus),
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelectCell(r, c)}
          disabled={disabled || isClue}
          aria-label={`Row ${r + 1}, column ${c + 1}${value ? `, ${value}` : ", empty"}`}
        >
          {value !== 0 && (
            <span key={value} className={styles.digit}>
              {value}
            </span>
          )}
        </button>,
      );
    }
  }

  const rowBadges = lineStates.rows.map((row) => (
    <div
      key={`row-${row.index}`}
      className={[styles.badge, badgeClass(row.status)].join(" ")}
      style={{ gridColumn: 10, gridRow: row.index + 1 }}
    >
      {row.sum}
    </div>
  ));

  const colBadges = lineStates.cols.map((col) => (
    <div
      key={`col-${col.index}`}
      className={[styles.badge, badgeClass(col.status)].join(" ")}
      style={{ gridColumn: col.index + 1, gridRow: 10 }}
    >
      {col.sum}
    </div>
  ));

  return (
    <div className={styles.board} ref={boardRef}>
      {cells}
      {rowBadges}
      {colBadges}
    </div>
  );
}
