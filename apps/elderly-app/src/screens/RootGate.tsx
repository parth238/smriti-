import { Navigate } from "react-router-dom";

import { Home } from "./Home";

export function RootGate() {
  const seen = window.sessionStorage.getItem("smriti.splash");
  if (seen !== "1") {
    return <Navigate to="/splash" replace />;
  }
  return <Home />;
}
