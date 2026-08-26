import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The portable page is missing its root element.");
}

createRoot(root).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
