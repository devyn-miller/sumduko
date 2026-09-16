import { Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import GamesIndex from "./pages/GamesIndex";
import SumdokuGame from "./games/sumdoku/SumdokuGame";

export default function App() {
  return (
    <>
      <AppHeader />
      <Routes>
        <Route path="/" element={<GamesIndex />} />
        <Route path="/sumdoku" element={<SumdokuGame />} />
      </Routes>
    </>
  );
}
