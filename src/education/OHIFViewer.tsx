import { useEffect, useRef, useState } from "react";
export interface DICOMStudy {
  id: string;
  version: number;
  manifestPath: string;
  instanceCount: number;
  completeness: string;
  viewerVersion: string;
  preferredSeriesUID?: string;
  displayPreset?: string;
}
export function OHIFViewer({ study }: { study: DICOMStudy }) {
  const [completed, setCompleted] = useState(0),
    [booted, setBooted] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [fullscreen, setFullscreen] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null),
    container = useRef<HTMLElement>(null);
  useEffect(() => {
    const changed = () =>
      setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const key = `${study.id}:${study.version}`;
  const manifest = new URL(study.manifestPath, location.origin).href;
  const src = `/ohif/viewer/dicomjson?url=${encodeURIComponent(manifest)}&caseKey=${encodeURIComponent(key)}&initialSeriesInstanceUID=${encodeURIComponent(study.preferredSeriesUID || "")}&radrepWindow=${encodeURIComponent(study.displayPreset || "soft-tissue")}`;
  useEffect(() => {
    setCompleted(0);
    setBooted(false);
    setError("");
    const listener = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.caseKey !== key
      )
        return;
      if (event.data.type === "radrep:ohif:booted") setBooted(true);
      if (event.data.type === "radrep:ohif:progress") {
        clearTimeout(timeout);
        setCompleted((n) => Math.max(n, Number(event.data.completed) || 0));
      }
      if (event.data.type === "radrep:ohif:error")
        setError(String(event.data.message).slice(0, 250));
    };
    window.addEventListener("message", listener);
    const timeout = setTimeout(
      () =>
        setError(
          "If CT images have not appeared, verify access to this protected preview and WebGL support, then reload the study.",
        ),
      60000,
    );
    return () => {
      window.removeEventListener("message", listener);
      clearTimeout(timeout);
    };
  }, [key, revision]);
  return (
    <section
      className="edu-ohif"
      ref={container}
      aria-label="DICOM reading viewport"
    >
      <div className="edu-ohif-top">
        <strong>OHIF {study.viewerVersion} · actual DICOM</strong>
        <span role="status">
          {completed
            ? `${Math.min(completed, study.instanceCount)} / ${study.instanceCount} image requests completed`
            : booted
              ? "Viewer started · loading study"
              : "Starting viewer…"}
        </span>
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document
                .exitFullscreen()
                .catch(() =>
                  setError("Unable to exit fullscreen; use Escape."),
                );
              return;
            }
            container.current
              ?.requestFullscreen()
              .catch(() =>
                setError("Fullscreen is unavailable in this browser."),
              );
          }}
        >
          {fullscreen ? "Exit fullscreen" : "Fullscreen viewer"}
        </button>
        <button onClick={() => setRevision((n) => n + 1)}>Reload study</button>
      </div>
      {error ? (
        <div role="alert" className="edu-viewer-error">
          {error}
        </div>
      ) : null}
      <iframe
        key={`${key}:${revision}`}
        ref={frame}
        src={src}
        title={`OHIF DICOM viewer — ${study.id}, version ${study.version}`}
        allow="fullscreen; cross-origin-isolated"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-downloads"
      />
      <p>{study.completeness}</p>
      <p className="edu-muted">
        Scroll the mouse wheel over an image. Use OHIF’s Window/Level, Zoom,
        Pan, series thumbnails and Cine controls. Measurements use preserved
        DICOM pixel spacing. No answer annotations or structured reports are delivered to this viewer.
      </p>
    </section>
  );
}
