import { useEffect, useRef, useState } from "react";
import type { QuizCase } from "./quizEngine";
export function RadiographViewer({ study }: { study: QuizCase }) {
  const box = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
      null,
    );
  const [view, setView] = useState(0),
    [scale, setScale] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [retry, setRetry] = useState(0);
  const reset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };
  useEffect(() => {
    setView(0);
    reset();
  }, [study.id]);
  useEffect(() => {
    reset();
    setLoaded(false);
    setError(false);
  }, [view, study.id]);
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const changeScale = (delta: number) =>
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
  const clampPan = (x: number, y: number) => {
    const r = box.current?.getBoundingClientRect();
    const maxX = ((r?.width || 600) * Math.max(scale, 1)) / 2,
      maxY = ((r?.height || 500) * Math.max(scale, 1)) / 2;
    setPan({
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    });
  };
  const asset = study.assets[view] || study.assets[0];
  return (
    <div className="lrn-viewer" ref={box}>
      <div className="lrn-viewer-toolbar">
        <span>
          Image {view + 1} of {study.assets.length}
        </span>
        <div>
          <button aria-label="Zoom out" onClick={() => changeScale(-0.25)}>
            −
          </button>
          <button aria-label="Zoom in" onClick={() => changeScale(0.25)}>
            +
          </button>
          <button onClick={reset}>Reset</button>
          <button
            onClick={async () => {
              try {
                if (fullscreen) await document.exitFullscreen();
                else await box.current?.requestFullscreen();
              } catch {
                setError(true);
              }
            }}
          >
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>
      <div
        className="lrn-image-canvas"
        role="region"
        aria-label="Radiograph: zoom with controls, drag to pan"
        tabIndex={0}
        onKeyDown={(e) => {
          if (
            [
              "+",
              "=",
              "-",
              "0",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
            ].includes(e.key)
          )
            e.preventDefault();
          if (["+", "="].includes(e.key)) changeScale(0.25);
          if (e.key === "-") changeScale(-0.25);
          if (e.key === "0") reset();
          if (e.key === "ArrowLeft") clampPan(pan.x - 40, pan.y);
          if (e.key === "ArrowRight") clampPan(pan.x + 40, pan.y);
          if (e.key === "ArrowUp") clampPan(pan.x, pan.y - 40);
          if (e.key === "ArrowDown") clampPan(pan.x, pan.y + 40);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(e) => {
          if (drag.current)
            clampPan(
              drag.current.px + e.clientX - drag.current.x,
              drag.current.py + e.clientY - drag.current.y,
            );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {!loaded && !error ? (
          <p className="lrn-image-status" role="status">
            Loading radiograph…
          </p>
        ) : null}
        {error ? (
          <div className="lrn-image-status" role="alert">
            <p>The image could not load.</p>
            <button
              onClick={() => {
                setError(false);
                setLoaded(false);
                setRetry((r) => r + 1);
              }}
            >
              Retry image
            </button>
          </div>
        ) : null}
        <img
          key={asset.path + retry}
          src={asset.path + (retry ? "?retry=" + retry : "")}
          alt={`${study.title} — ${asset.label}`}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            visibility: loaded && !error ? "visible" : "hidden",
          }}
        />
      </div>
      <div className="lrn-view-bar">
        {study.assets.map((a, i) => (
          <button
            key={a.path}
            aria-pressed={view === i}
            onClick={() => setView(i)}
          >
            {a.label}
          </button>
        ))}
        <span>Drag to pan · +/− to zoom · 0 to reset</span>
      </div>
    </div>
  );
}
