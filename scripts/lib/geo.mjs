/** Geometry helpers used at build time for point-in-polygon screening. */

export function bboxOfGeometry(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === 'number') {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else {
      for (const c of coords) visit(c);
    }
  };
  if (geometry?.coordinates) visit(geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

export function pointInRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersects = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInPolygonCoordinates(coords, x, y) {
  if (!coords?.length) return false;
  if (!pointInRing(coords[0], x, y)) return false;
  for (let i = 1; i < coords.length; i += 1) {
    if (pointInRing(coords[i], x, y)) return false;
  }
  return true;
}

export function geometryContains(geometry, x, y) {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return pointInPolygonCoordinates(geometry.coordinates, x, y);
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => pointInPolygonCoordinates(poly, x, y));
  }
  return false;
}

const CELL = 0.05;

/**
 * Builds a lightweight uniform-grid index for a GeoJSON layer so thousands of
 * points can be screened without scanning every polygon.
 */
export function buildLayerIndex(features) {
  const items = features.map((feature, index) => {
    const bbox = bboxOfGeometry(feature.geometry);
    return { index, feature, bbox };
  });
  const grid = new Map();
  const global = [];
  for (const item of items) {
    const [minX, minY, maxX, maxY] = item.bbox;
    if (![minX, minY, maxX, maxY].every(Number.isFinite)) continue;
    const cx0 = Math.floor(minX / CELL);
    const cx1 = Math.floor(maxX / CELL);
    const cy0 = Math.floor(minY / CELL);
    const cy1 = Math.floor(maxY / CELL);
    const cellCount = (cx1 - cx0 + 1) * (cy1 - cy0 + 1);
    if (cellCount > 2500) {
      global.push(item);
      continue;
    }
    for (let cx = cx0; cx <= cx1; cx += 1) {
      for (let cy = cy0; cy <= cy1; cy += 1) {
        const key = `${cx},${cy}`;
        let bucket = grid.get(key);
        if (!bucket) {
          bucket = [];
          grid.set(key, bucket);
        }
        bucket.push(item);
      }
    }
  }
  return { items, grid, global };
}

export function queryLayerIndex(index, lon, lat) {
  const key = `${Math.floor(lon / CELL)},${Math.floor(lat / CELL)}`;
  const candidates = [...(index.grid.get(key) ?? []), ...index.global];
  const matches = [];
  for (const item of candidates) {
    const [minX, minY, maxX, maxY] = item.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    if (geometryContains(item.feature.geometry, lon, lat)) matches.push(item.feature);
  }
  return matches;
}

export const FLOOD_RANK = { VHF: 4, HF: 3, MF: 2, LF: 1 };
export const SLIDE_RANK = { VHL: 4, HL: 3, ML: 2, LL: 1, DF: 2 };
