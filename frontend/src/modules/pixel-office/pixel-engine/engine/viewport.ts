/** Render at native resolution, then scale the completed scene once without smoothing. */
export function fitOfficeZoom(width: number, height: number, mapWidth: number, mapHeight: number) {
  const fit = Math.min(width / mapWidth, height / mapHeight) * 0.96;
  return fit >= 1 ? Math.floor(fit) : Math.max(0.1, fit);
}

export function officeViewport(width: number, height: number, zoom: number,
  pan: {x:number;y:number}, mapWidth:number, mapHeight:number) {
  const nativeWidth = Math.max(1, Math.ceil(width / zoom));
  const nativeHeight = Math.max(1, Math.ceil(height / zoom));
  const panX = Math.round(pan.x / zoom);
  const panY = Math.round(pan.y / zoom);
  return {width:nativeWidth,height:nativeHeight,panX,panY,
    offsetX:(Math.floor((nativeWidth-mapWidth)/2)+panX)*zoom,
    offsetY:(Math.floor((nativeHeight-mapHeight)/2)+panY)*zoom};
}
