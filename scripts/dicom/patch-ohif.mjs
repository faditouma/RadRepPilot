import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function patchOHIF(source) {
  const file = resolve(
    source,
    "extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts",
  );
  let text = await readFile(file, "utf8");
  if (!text.includes("// RadRepPilot: isolate series presentation")) {
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
  const scrollbarFile = resolve(source, 'extensions/cornerstone/src/Viewport/Overlays/ViewportImageScrollbar.tsx');
  let scrollbar = await readFile(scrollbarFile, 'utf8');
  if (scrollbar.includes('// RadRepPilot: ignore delayed events from a replaced stack')) return;
  const scrollbarAnchor = '      // find the index of imageId in the imageIds';
  if (scrollbar.split(scrollbarAnchor).length !== 2) throw new Error('Pinned OHIF scrollbar patch context changed');
  scrollbar = scrollbar.replace(scrollbarAnchor, `      // RadRepPilot: ignore delayed events from a replaced stack.
      if (viewportType === Enums.ViewportType.STACK) {
        const stack = viewport as any;
        const activeIds = stack.getImageIds();
        const eventImageId = event.detail.imageId ?? event.detail.image?.imageId;
        const index = eventImageId ? activeIds.indexOf(eventImageId) : stack.getCurrentImageIdIndex();
        if (index < 0 || !numberOfSlices) return;
        setImageSliceData({
          imageIndex: Math.max(0, Math.min(numberOfSlices - 1, index)),
          numberOfSlices,
        });
        return;
      }
` + scrollbarAnchor);
  await writeFile(scrollbarFile, scrollbar);
}
