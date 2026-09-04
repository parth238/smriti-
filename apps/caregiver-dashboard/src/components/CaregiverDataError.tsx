import { Link } from "react-router-dom";

import type { CaregiverDataFailure } from "../api/errors";
import { Notice } from "./Notice";

export function CaregiverSignInLink({ className = "font-semibold underline" }) {
  return (
    <Link className={className} to="/login">
      Sign in
    </Link>
  );
}

export function CaregiverDataError({ error }: { error: CaregiverDataFailure }) {
  return (
    <Notice>
      {error.message}{" "}
      {error.kind === "authentication" ? <CaregiverSignInLink /> : null}
    </Notice>
  );
}
