const ROCK_COLLISION_HEIGHT_RATIO = 0.45;
const TREE_COLLISION_HEIGHT_RATIO = 0.35;

export function getSpriteFrameBounds(item) {
  const width = item.width * item.scale;
  const height = item.height * item.scale;

  return {
    left: item.x - width * 0.5,
    right: item.x + width * 0.5,
    top: item.y - height,
    bottom: item.y,
  };
}

export function getDecorCollisionBounds(item) {
  const width = item.width * item.scale;
  const height = item.height * item.scale;

  if (item.type === "tree") {
    return {
      left: item.x - width / 2,
      right: item.x + width / 2,
      top: item.y - height * TREE_COLLISION_HEIGHT_RATIO,
      bottom: item.y,
    };
  }

  if (item.type === "rock") {
    return {
      left: item.x - width / 2,
      right: item.x + width / 2,
      top: item.y - height * ROCK_COLLISION_HEIGHT_RATIO,
      bottom: item.y,
    };
  }

  return {
    left: item.x - width / 2,
    right: item.x + width / 2,
    top: item.y - height,
    bottom: item.y,
  };
}
