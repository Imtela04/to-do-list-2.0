import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./style.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter basename="/to-do-list-2.0">
            <App />
        </BrowserRouter>
    </StrictMode>
);