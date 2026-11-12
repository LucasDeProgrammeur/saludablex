import { Outlet } from "react-router";
import MainNav from "./MainNav";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <MainNav />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
