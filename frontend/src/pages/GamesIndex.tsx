import { Link } from "react-router-dom";
import styles from "./GamesIndex.module.css";

export default function GamesIndex() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Puzzle Games</h1>
      <p className={styles.subheading}>A new logic puzzle to sharpen your morning.</p>

      <div className={styles.grid}>
        <Link to="/sumdoku" className={styles.card}>
          <div className={styles.cardIcon}>🔢</div>
          <div>
            <h2 className={styles.cardTitle}>Sum Sudoku</h2>
            <p className={styles.cardDescription}>
              Every row, column, and box must hit the target. Digits repeat — fuel doesn&apos;t.
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
