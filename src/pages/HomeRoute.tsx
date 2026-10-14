import { CaseLibrary } from "../education/CaseLibrary";
import { Education } from "../education/Education";

export function HomeRoute() {
  return import.meta.env.VITE_TEACHING_PREVIEW === "true" ? (
    <CaseLibrary />
  ) : (
    <Education />
  );
}
