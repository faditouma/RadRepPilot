import { useEffect, useRef, useState } from "react";
import { request } from "./api";
import type { Asset, Case, Answer } from "./types";
export function Viewer({
  study,
  annotations = [],
}: {
  study: Case;
  annotations?: Answer["annotations"];
}) {
  const [series, setSeries] = useState(0),
    [frame, setFrame] = useState(0),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const current = study.series?.[series];
  const id = current?.assetIds[frame];
  const a = study.assets?.find((a: Asset) => a.id === id);
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  useEffect(() => {
    setSeries(0);
    setFrame(0);
    reset();
  }, [study.id, study.version]);
  useEffect(() => {
    let live = true,
      objectUrl = "";
    setError("");
    setUrl("");
    if (!id) return;
    setLoading(true);
    request(`assets/${id}`, "GET", undefined, true)
      .then((b) => {
        if (live) {
          objectUrl = URL.createObjectURL(b);
          setUrl(objectUrl);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  const move = (n: number) => {
    setFrame((f) =>
      Math.max(0, Math.min((current?.assetIds.length || 1) - 1, f + n)),
    );
    reset();
  };
  return (
    <section className="edu-viewer" aria-label="Image viewer">
      <div className="edu-viewer-tools">
        <select
          aria-label="Series"
          value={series}
          onChange={(e) => {
            setSeries(Number(e.target.value));
            setFrame(0);
            reset();
          }}
        >
          {study.series?.map((s, i) => (
            <option value={i} key={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.25, 8))}
          aria-label="Zoom in"
        >
          ＋
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.25, 0.5))}
          aria-label="Zoom out"
        >
          −
        </button>
        <button onClick={reset}>Reset</button>
        <button
          onClick={() => {
            root.current
              ?.requestFullscreen()
              .catch(() =>
                setError("Fullscreen is unavailable in this browser."),
              );
          }}
        >
          Fullscreen
        </button>
      </div>
      <div
        className="edu-image-stage"
        ref={root}
        tabIndex={0}
        role="region"
        aria-label="Use plus/minus to zoom, arrow keys to pan, Page Up/Down to scroll images, zero to reset"
        onKeyDown={(e) => {
          if (
            [
              "+",
              "-",
              "0",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "PageUp",
              "PageDown",
            ].includes(e.key)
          )
            e.preventDefault();
          if (e.key === "+") setZoom((z) => Math.min(z * 1.25, 8));
          if (e.key === "-") setZoom((z) => Math.max(z / 1.25, 0.5));
          if (e.key === "0") reset();
          if (e.key === "PageDown") move(1);
          if (e.key === "PageUp") move(-1);
          if (e.key.startsWith("Arrow"))
            setPan((p) => ({
              x:
                p.x +
                (e.key === "ArrowRight" ? 30 : e.key === "ArrowLeft" ? -30 : 0),
              y:
                p.y +
                (e.key === "ArrowDown" ? 30 : e.key === "ArrowUp" ? -30 : 0),
            }));
        }}
        onWheel={(e) => {
          if (current && current.assetIds.length > 1)
            move(e.deltaY > 0 ? 1 : -1);
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setPan({
              x: drag.current.px + e.clientX - drag.current.x,
              y: drag.current.py + e.clientY - drag.current.y,
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {loading ? <p role="status">Loading authorized image…</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {current?.format !== "raster" ? (
          <p>
            Unsupported format. DICOM requires a verified DICOM viewer adapter.
          </p>
        ) : url ? (
          <div
            className="edu-image-wrap"
            style={{
              transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
              aspectRatio: a ? `${a.width}/${a.height}` : undefined,
            }}
          >
            <img
              draggable={false}
              src={url}
              alt={`Selected ${study.modality.toLowerCase()} image ${frame + 1}`}
              onError={() =>
                setError("The downloaded image could not be rendered.")
              }
            />
            {annotations
              .filter((x) => x.assetId === id)
              .map((x, i) => (
                <span
                  className="edu-annotation"
                  style={{ left: `${x.x * 100}%`, top: `${x.y * 100}%` }}
                  key={i}
                >
                  {x.label}
                </span>
              ))}
          </div>
        ) : null}
        {current?.orientation ? (
          <span className="edu-orientation">{current.orientation}</span>
        ) : null}
      </div>
      <div className="edu-stack">
        <button disabled={frame === 0} onClick={() => move(-1)}>
          Previous image
        </button>
        <span>
          {frame + 1} / {current?.assetIds.length || 0} ·{" "}
          {Math.round(zoom * 100)}%
        </span>
        <button
          disabled={frame >= (current?.assetIds.length || 1) - 1}
          onClick={() => move(1)}
        >
          Next image
        </button>
      </div>
      <p className="edu-caption">
        {study.studyCompleteness}. Raster viewer: no calibrated measurements or
        DICOM window/level.
      </p>
      {a ? (
        <details className="edu-attribution">
          <summary>
            Image attribution{" "}
            {a.attributionRevealsAnswer ? "· may reveal the finding" : ""}
          </summary>
          <p>{a.attribution}</p>
          <a href={a.license.url} target="_blank" rel="noreferrer">
            {a.license.name}
          </a>
          {a.sourceUrl ? (
            <p>
              <a href={a.sourceUrl} target="_blank" rel="noreferrer">
                Original source
              </a>
            </p>
          ) : null}
        </details>
      ) : null}
    </section>
  );
}
