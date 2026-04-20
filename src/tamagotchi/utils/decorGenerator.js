// 🔥 SINGLE SOURCE OF TRUTH FOR DECOR (trees)

export const DECOR_CONFIG = {
  cellSize: 300,
  range: 12,
};

// deterministic random based on grid coords
function randFromSeed(gx, gy, salt = 0) {
  const seed = (gx * 73856093) ^ (gy * 19349663) ^ salt;
  return Math.abs(Math.sin(seed)) % 1;
}

export function getTreesAround(playerX, playerY, options = {}) {
  const cellSize = options.cellSize || DECOR_CONFIG.cellSize;

  // 🔥 clamp range to viewport so all systems stay in sync
  const viewportMax = Math.max(window.innerWidth || 0, window.innerHeight || 0);
  const dynamicRange = Math.ceil(viewportMax / cellSize) + 2;

  const range = Math.min(options.range || DECOR_CONFIG.range, dynamicRange);

  const trees = [];

  const gridX = Math.floor(playerX / cellSize);
  const gridY = Math.floor(playerY / cellSize);

  for (let gx = gridX - range; gx <= gridX + range; gx++) {
    for (let gy = gridY - range; gy <= gridY + range; gy++) {
      const density = randFromSeed(gx, gy);

      const DENSITY_THRESHOLD = 0.65;
      if (density > DENSITY_THRESHOLD) continue;

      const baseX = gx * cellSize;
      const baseY = gy * cellSize;

      // jitter (stable)
      const jx = (randFromSeed(gx, gy, 1) - 0.5) * cellSize * 0.6;
      const jy = (randFromSeed(gx, gy, 2) - 0.5) * cellSize * 0.4;

      const worldX = baseX + jx;
      const worldY = baseY + jy;

      // approximate sprite size (can tweak later)
      const width = 60;
      const height = 80;

      // 🔥 IMPORTANT: y = BOTTOM of sprite (align with render transformOrigin)
      const y = worldY + height;

      // 👉 FOOT = same as bottom for now
      const footY = y;

      trees.push({
        id: `${gx}_${gy}`,
        x: worldX,
        y,
        width,
        height,
        footY,
        type: "tree",
      });
    }
  }

  return trees;
}