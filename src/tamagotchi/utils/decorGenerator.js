// 🔥 SINGLE SOURCE OF TRUTH FOR DECOR (trees)
// ⚠️ EVERYTHING here must be 100% deterministic (NO Math.random)
// used by BOTH DecorLayer and CollisionSystem

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

  // ⚠️ CRITICAL: range MUST be deterministic and identical across all systems
  // DO NOT use viewport or dynamic values here (breaks sync → orphan hitboxes)
  const range = options.range || DECOR_CONFIG.range;

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

      const spriteIndex = Math.floor(randFromSeed(gx, gy, 3) * 8); // 8 tree sprites

      trees.push({
        id: `${gx}_${gy}`,
        x: worldX,
        y,
        width,
        height,
        footY,
        spriteIndex, // ⚠️ MUST be used by DecorLayer
        type: "tree",
      });
    }
  }

  return trees;
}