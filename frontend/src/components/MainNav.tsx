import { NavLink } from "react-router";
import "./MainNav.css";

const icons = {
  today: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  progress: "M4 20V10m6 10V4m6 16v-7m6 7H2",
  recipes: "M6 3.5h11.5A1.5 1.5 0 0 1 19 5v15.5H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1-1.5zM5 17.5h14M9 8h6M9 11.5h4",
  labels: "M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6a1.5 1.5 0 0 1 1 .44l7 7a1.5 1.5 0 0 1 0 2.12l-7.6 7.6a1.5 1.5 0 0 1-2.12 0l-7-7a1.5 1.5 0 0 1-.38-1.06zM8.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  settings: "M4 7h8m4 0h4M14 4.5v5M4 17h4m4 0h8M10 14.5v5",
  camera:
    "M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.8A1.5 1.5 0 0 1 10.5 3.5h3a1.5 1.5 0 0 1 1.2.7L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5zM12 15.8a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6z",
};

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Bottom tab bar on phones, sidebar on wide screens (see MainNav.css). */
export default function MainNav() {
  return (
    <nav className="main-nav" aria-label="Main">
      <span className="main-nav-brand">Saludablex</span>

      <NavLink to="/" end className="main-nav-link">
        <Icon path={icons.today} />
        <span>Today</span>
      </NavLink>
      <NavLink to="/progress" className="main-nav-link">
        <Icon path={icons.progress} />
        <span>Progress</span>
      </NavLink>
      <NavLink to="/add" className="main-nav-add">
        <Icon path={icons.camera} />
        <span className="main-nav-add-label">Add food</span>
      </NavLink>
      <NavLink to="/recipes" className="main-nav-link">
        <Icon path={icons.recipes} />
        <span>Recipes</span>
      </NavLink>
      <NavLink to="/references" className="main-nav-link">
        <Icon path={icons.labels} />
        <span>References</span>
      </NavLink>
      <NavLink to="/settings" className="main-nav-link">
        <Icon path={icons.settings} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
