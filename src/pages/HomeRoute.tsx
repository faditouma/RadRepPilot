import { LearningApp } from "../learning/LearningApp";
import { Education } from "../education/Education";

export function HomeRoute() {
  return import.meta.env.VITE_TEACHING_PREVIEW === "true" ? (
    <LearningApp />
  ) : (
    <Education />
  );
}
