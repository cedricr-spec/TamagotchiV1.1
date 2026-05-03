// Chunk dimensions are expressed in atlas tiles, not pixels.
// Larger chunks reduce cache churn; smaller chunks reduce per-generation cost.
export const CHUNK_TILE_SIZE = 16;

// Extra fully-rendered chunk margin around the exact visible chunk window.
export const ACTIVE_RADIUS_X = 0;
export const ACTIVE_RADIUS_Y = 0;

// Additional chunks to generate and keep warm beyond the active render window.
export const PRELOAD_RADIUS_X = 2;
export const PRELOAD_RADIUS_Y = 2;

// Extra chunk margin kept in cache before distant chunks are pruned.
export const DESPAWN_MARGIN = 2;

// Overscan keeps edge pop-in down while still culling far-away content.
export const RENDER_OVERSCAN_TILES = 10;
export const COLLISION_OVERSCAN_TILES = 6;

// Idle chunk work budget. Keep this tiny so chunk warm-up does not land as a frame hitch.
export const CHUNK_PREWARM_STEPS_PER_FRAME = 1;

// Each cached chunk is generated with a small padding ring for stable borders.
export const CHUNK_GENERATION_PADDING_TILES = 8;

// Decor tuning. These stay global while family-specific rules live in worldObjectProfiles.
export const FLOWER_DENSITY = 1.85;
export const DECOR_JITTER = 1;
export const DECOR_MIN_DISTANCE = 1;
export const TREE_CLUSTER_CHANCE = 1;
export const TREE_MAX_PER_CHUNK = 1;
export const TREE_OVERLAP_PADDING_TILES = 2.4;

// Soft caps for cache churn and optional developer diagnostics.
export const MAX_CACHED_WORLD_CHUNKS = 128;
export const MAX_CACHED_WORLD_WINDOWS = 16;

export const SHOW_WORLD_STREAMING_DEBUG = false;

export const DEV_START_FULLSCREEN_UI = true;
export const DEV_START_WORLD_DEBUG = false;

// "full" = true fullscreen play mode. Set to "contained" for spawn/culling debug tuning.
export const WORLD_VIEWPORT_MODE = "full";
export const WORLD_VIEWPORT_SCALE = 0.9;
export const WORLD_VIEWPORT_ASPECT_RATIO = null;

// Keep canvas terrain for FPS, but with safer culling/debug margins.
export const WORLD_RENDER_MODE = "canvas-terrain";

// Bigger buffers to prevent trees/items being cut or popping too close to the viewport.
export const WORLD_ACTIVE_BUFFER_TILES = 18;
export const WORLD_DESPAWN_BUFFER_TILES = 28;

// All debug flags default OFF for normal play. Enable individually for tuning.
export const SHOW_WORLD_DEBUG_OVERLAY = false;
export const SHOW_VIEWPORT_CULLING_DEBUG = false;
export const SHOW_WORLD_ITEM_BOUNDS_DEBUG = false;
export const SHOW_WORLD_DECOR_BOUNDS_DEBUG = false;
export const SHOW_WORLD_COLLISION_BOUNDS_DEBUG = false;
export const SHOW_COLLISION_RECTS_ONLY = true;
export const SHOW_SPAWN_DESPAWN_BUFFER_DEBUG = false;

export const SHOW_COLLISION_DEBUG =
  SHOW_WORLD_COLLISION_BOUNDS_DEBUG || SHOW_COLLISION_RECTS_ONLY;
export const COLLISION_PROFILE_DEBUG =
  SHOW_WORLD_COLLISION_BOUNDS_DEBUG || SHOW_COLLISION_RECTS_ONLY;

export const SHOW_TERRAIN_AUTOTILE_DEBUG = false;
export const SHOW_TERRAIN_TYPE_DEBUG = false;
export const SHOW_AUTOTILE_CATEGORY_DEBUG = false;
export const SHOW_WATER_COLLISION_DEBUG = false;
export const SHOW_OBJECT_SPAWN_DEBUG = false;

export const SHOW_WORLD_DECOR_DEBUG = false;
export const SHOW_WORLD_DECOR_LABELS_DEBUG = false;
export const SHOW_WORLD_SPAWN_RADIUS_DEBUG = false;
export const SHOW_WORLD_DECOR_TWEAK_PANEL = false;
export const SHOW_WORLD_PERF_DEBUG = false;
