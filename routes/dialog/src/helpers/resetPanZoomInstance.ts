import svgPanZoom from 'svg-pan-zoom';

export function resetPanZoomInstance(
  panZoomInstance: typeof svgPanZoom | null
) {
  if (!panZoomInstance) {
    return;
  }
  panZoomInstance.resize();
  panZoomInstance.center();
  panZoomInstance.fit();
}

export default resetPanZoomInstance;
