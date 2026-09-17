import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import styles from "./AppHeader.module.css";

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        Puzzle Games
      </Link>
      <ThemeToggle />
    </header>
  );
}
