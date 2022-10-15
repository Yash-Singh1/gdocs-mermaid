export function clampDimensions([width, height]: [number, number], [mxWidth, mxHeight]: [number, number]) {
  if (height > mxHeight) {
    width *= mxHeight / height;
    height = mxHeight;
  }
  if (width > mxWidth) {
    height *= mxWidth / width;
    width = mxWidth;
  }
  return [width, height];
}

export default clampDimensions;
