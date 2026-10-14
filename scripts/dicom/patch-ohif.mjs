import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function patchOHIF(source) {
  const file = resolve(
    source,
    "extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts",
  );
  let text = await readFile(file, "utf8");
  if (text.includes("// RadRepPilot: isolate series presentation")) return;
  const anchor =
    "    return viewport.setStack(imageIds, initialImageIndexToUse).then(() => {";
  if (text.split(anchor).length !== 2)
    throw new Error("Pinned OHIF patch context changed");
  text = text.replace(
    anchor,
    `    // RadRepPilot: isolate series presentation; stop cine and clamp before restoring.
    const previousIds = viewport.getImageIds();
    const changedSeries = previousIds?.[0] !== imageIds[0];
    if (changedSeries) {
      const cineService = this.servicesManager.services.cineService;
      cineService.stopClip(viewport.element, { viewportId: viewport.id });
      cineService.setCine({ id: viewport.id, frameRate: 24, isPlaying: false });
      initialImageIndexToUse = Math.floor(imageIds.length / 2);
      presentations = { ...presentations, positionPresentation: undefined, lutPresentation: undefined };
      const preset = new URLSearchParams(window.location.search).get('radrepWindow');
      if (preset === 'lung' || preset === 'soft-tissue') {
        const width = preset === 'lung' ? 1500 : 400;
        const center = preset === 'lung' ? -600 : 40;
        properties.voiRange = csUtils.windowLevel.toLowHighRange(width, center);
      }
    }
    initialImageIndexToUse = Math.max(0, Math.min(imageIds.length - 1, initialImageIndexToUse));
` + anchor,
  );
  await writeFile(file, text);
}
