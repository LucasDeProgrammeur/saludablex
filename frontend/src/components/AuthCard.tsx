import type { ReactNode } from "react";
import "./AuthCard.css";

/** Centered card used by the login and register pages. */
export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-card-wrapper">
      <div className="auth-card card">
        <h1>Saludablex</h1>
        <h2 className="auth-card-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
