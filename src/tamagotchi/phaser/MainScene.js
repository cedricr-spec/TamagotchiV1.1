import Phaser from 'phaser';
import { WORLD_ATLAS_TEXTURES, CHARACTER_SHADOW_ASSET, ALL_ASSETS } from './assetManifest';
import {
  WORLD_ATLAS_DATA,
  applyWorldAtlasObjectState,
  createWorldAtlasStumpRenderItem,
} from '../utils/worldAtlasData';
import { getWorldAtlasLayout } from '../utils/worldAtlasFamilies';
import { WORLD_SEASON_IDS } from '../config/worldSeasonConfig';
import { getItemWorldSprite, getItemSprite } from '../config/itemSpriteRegistry';
import { getItemDefinition } from '../config/itemsRegistry';
import { getItemSpriteAsset } from '../config/itemSprites';
import { useWorldStore } from '../store/worldSlice';
import { useEntityStore } from '../store/entitySlice';
import { useBrokenObjectsStore } from '../store/brokenObjectsStore';
import { useWorldFxStore } from '../store/worldFxStore';
import { useCharacterStore } from '../store/useCharacterStore';
import { getPhaserDebugFlags, setPhaserDebugFlag } from './phaserDebugFlags';
import PhaserPet from './PhaserPet';
import axeSlashSheet from '../../spritesheets/fx/attacks/Hslash1.png';
import pickaxeSlashSheet from '../../spritesheets/fx/attacks/VslashSmall1.png';

const THEME_TO_ATLAS_KEY = {
  [WORLD_SEASON_IDS.SPRING]: 'atlas_spring',
  [WORLD_SEASON_IDS.SUMMER]: 'atlas_summer',
  [WORLD_SEASON_IDS.AUTUMN]: 'atlas_autumn',
  [WORLD_SEASON_IDS.WINTER]: 'atlas_winter',
};

// Entity sprites rendered at 2× (matches React Entity.jsx ENTITY_SCALE).
const ENTITY_SCALE = 2;

const WORLD_FX_TEXTURES = {
  axe_slash: {
    key: 'fx_axe_slash',
    url: axeSlashSheet,
    frameWidth: 64,
    frameHeight: 32,
    frames: 5,
    renderScale: 2,
    frameDurationMs: 70,
    verticalOffsetY: 0,
  },
  pickaxe_slash: {
    key: 'fx_pickaxe_slash',
    url: pickaxeSlashSheet,
    frameWidth: 32,
    frameHeight: 48,
    frames: 4,
    renderScale: 2,
    frameDurationMs: 70,
    verticalOffsetY: 10,
  },
};

function getDepthSplitYForEntry(entry) {
  const frontY = Number(entry?.depthSplit?.frontY);
  if (Number.isFinite(frontY) && frontY > 0) return frontY;

  const explicitSplit = Number(entry?.depth?.splitY);
  if (Number.isFinite(explicitSplit) && explicitSplit > 0) return explicitSplit;

  const id = entry?.id || entry?.name || '';
  if (/^tree_48x40_/.test(id)) return 34;
  if (/^tree_48x51_/.test(id)) return 46;
  if (/^tree_48x72_/.test(id)) return 58;
  return null;
}

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    let errorCount = 0;
    this.load.on('loaderror', (file) => {
      errorCount++;
      console.warn(`[Phaser] Failed to load asset: "${file.key}" (${file.src || file.url})`);
    });

    if (import.meta.env.DEV) {
      console.log(
        '[Phaser] preload() starting, loading',
        WORLD_ATLAS_TEXTURES.length,
        'atlas textures:',
        WORLD_ATLAS_TEXTURES.map(a => a.key)
      );
    }

    for (const { key, url } of WORLD_ATLAS_TEXTURES) {
      if (import.meta.env.DEV) {
        console.log(`[Phaser] Queueing load: "${key}"`);
      }
      this.load.image(key, url);
    }

    this.load.image(CHARACTER_SHADOW_ASSET.key, CHARACTER_SHADOW_ASSET.url);

    Object.values(WORLD_FX_TEXTURES).forEach((fx) => {
      this.load.image(fx.key, fx.url);
    });

    if (import.meta.env.DEV) {
      const originalComplete = this.load.complete;
      this.load.once('complete', () => {
        const loaded = ALL_ASSETS.filter((a) => this.textures.exists(a.key)).map((a) => a.key);
        console.log(
          `[Phaser] Load complete. Assets ready (${loaded.length}/${ALL_ASSETS.length}):`,
          loaded,
          `(${errorCount} errors)`
        );
        this._assetsLoaded = true;
      });
    }

    if (import.meta.env.DEV) {
      console.log('[Phaser] preload() finish - about to call load.start()');
    }
  }

  create() {
    const cam = this.cameras.main;


    if (import.meta.env.DEV) {
      this._setupViewportTerrain(cam);
      this._setupPhaserEntityLayer();
      this._setupWorldFxLayer();
      this._setupPhaserPlayer();
      this._setupPlayerMarker(cam);
      this._setupEntityMarkers();
      this._setupDebugHandles();
    }
    const flags = getPhaserDebugFlags();
window.phaserDebug.showViewportTerrain = flags.showViewportTerrain;
window.phaserDebug.renderMode = flags.renderMode;
window.phaserDebug.showPhaserEntityLayer = flags.showPhaserEntityLayer;
window.phaserDebug.showPhaserPlayer = flags.showPhaserPlayer;

    this.add.text(8, cam.height - 20, 'Phaser running', {
      font: '10px monospace',
      fill: '#ffffff',
      alpha: 0.45,
      backgroundColor: 'rgba(0,0,0,0)',
    }).setScrollFactor(0).setDepth(100);

    if (import.meta.env.DEV) {
      console.log('[Phaser MainScene] Created successfully');
    }
  }

  // ─── Viewport terrain ────────────────────────────────────────────────────────

  _setupViewportTerrain(cam) {
    // depth 1 so entity sprites (depth 50) and player (depth 55) render above terrain.
    this._viewportTerrainRT = this.add
      .renderTexture(0, 0, cam.width, cam.height)
      .setOrigin(0, 0)
      .setDepth(1)
      .setScrollFactor(0)
      .setVisible(false);

    // Front split layer: used for upper tree foliage that must appear above the
    // Phaser player while trunks/lower parts stay in the terrain RT below it.
    this._viewportFrontRT = this.add
      .renderTexture(0, 0, cam.width, cam.height)
      .setOrigin(0, 0)
      .setDepth(90)
      .setScrollFactor(0)
      .setVisible(false);

    // Phaser 4: RenderTexture.renderMode defaults to 'render', which ONLY displays
    // the current GL texture — it never calls render() to process the command buffer.
    // 'all' mode calls render() (processes draw/stamp/clear commands) then displays.
    // Without this, every rt.stamp() / rt.draw() call is buffered but never executed,
    // leaving the RT permanently transparent (black).
    this._viewportTerrainRT.setRenderMode('all');
    this._viewportFrontRT.setRenderMode('all');

    this._decorFrameKeyCache = new Map();

    this._lastWorldOffset = null;
    this._lastTheme = null;
    this._lastAnimationTick = -1;
this._lastBrokenObjectsSignature = '';
this._drawnTileCount = 0;
  }

  _ensureRTSize(cam) {
    const resizeRT = (rt) => {
      if (!rt) return;
      if (rt.width !== cam.width || rt.height !== cam.height) {
        rt.resize(cam.width, cam.height);
      }
    };

    resizeRT(this._viewportTerrainRT);
    resizeRT(this._viewportFrontRT);
  }

  _drawViewportTerrain(worldOffset, theme) {
    const cam = this.cameras.main;
    const atlasKey = THEME_TO_ATLAS_KEY[theme] || 'atlas_spring';

    this._ensureRTSize(cam);

    if (!this.textures.exists(atlasKey)) {
      if (import.meta.env.DEV && !this._warnedMissingTexture) {
        console.warn(
          `[Phaser] Atlas texture "${atlasKey}" not loaded. Drawing fallback color. ` +
          `Available textures: ${JSON.stringify(Array.from(this.textures.keys()).filter(Boolean))}`
        );
        this._warnedMissingTexture = true;
      }

      const fallbackColors = {
        spring: 0x75ad4c,
        summer: 0x6eaf48,
        autumn: 0x8e7b41,
        winter: 0x8ba6b5,
      };
      const themeId = theme === 'winter' ? 'winter'
        : theme === 'autumn' ? 'autumn'
        : theme === 'summer' ? 'summer'
        : 'spring';
      const color = fallbackColors[themeId] || 0x75ad4c;

      this._viewportTerrainRT.clear();
      this._viewportTerrainRT.fill(color);
      this._viewportFrontRT?.clear();
      this._drawnTileCount = 0;
      return;
    }

    this._warnedMissingTexture = false;

    const rt = this._viewportTerrainRT;
    const frontRT = this._viewportFrontRT;
    rt.clear();
    frontRT?.clear();

    // Use the same world layout source as WorldAtlasLayer. Do not mix this with
    // the terrain sampler/autotile renderer, otherwise transitions and terrain
    // variants get drawn twice or out of order.
    const drawnItems = this._drawViewportObjects(worldOffset, theme, rt, cam, atlasKey, frontRT);
    this._drawnTileCount = drawnItems;
  }

  _drawViewportObjects(worldOffset, theme, rt, cam, atlasKey, frontRT = null) {
    const wx = worldOffset.x || 0;
    const wy = worldOffset.y || 0;
    const playerX = -wx;
    const playerY = -wy;

    const viewport = { width: cam.width, height: cam.height };
    const layout = getWorldAtlasLayout(playerX, playerY, WORLD_ATLAS_DATA, viewport);
    this._lastLayout = layout;

    const chunkItems = [];
    for (const chunk of layout.tileChunks || []) {
      if (Array.isArray(chunk.renderItems)) chunkItems.push(...chunk.renderItems);
      if (Array.isArray(chunk.items)) chunkItems.push(...chunk.items);
      if (Array.isArray(chunk.tiles)) chunkItems.push(...chunk.tiles);
      if (Array.isArray(chunk.tileItems)) chunkItems.push(...chunk.tileItems);
    }

    const brokenObjectState = useBrokenObjectsStore.getState();

const filteredChunkItems = applyWorldAtlasObjectState(
  chunkItems,
  WORLD_ATLAS_DATA,
  brokenObjectState
);

const filteredRenderItems = applyWorldAtlasObjectState(
  layout.renderItems || [],
  WORLD_ATLAS_DATA,
  brokenObjectState
);

const stumpItems = Object.values(brokenObjectState?.stumpObjects || {})
  .map((stumpObject) =>
    createWorldAtlasStumpRenderItem(stumpObject, WORLD_ATLAS_DATA)
  )
  .filter(Boolean);

const items = [
  ...filteredChunkItems,
  ...filteredRenderItems,
  ...stumpItems,
];

    if (!items.length) return 0;

    const texture = this.textures.get(atlasKey);
    if (!texture) return 0;

    if (!this._decorFrameKeyCache.has(atlasKey)) {
      this._decorFrameKeyCache.set(atlasKey, new Map());
    }
    const frameCache = this._decorFrameKeyCache.get(atlasKey);

    let drawn = 0;
    const frameTick = Math.floor(this.time.now / 120);

    // Draw the same layout output as WorldAtlasLayer: tileChunks first, then floating
    // renderItems. This avoids mixing the old sampler/autotile renderer with the
    // React layout pipeline while still restoring terrain chunks.
    for (const item of items) {
      const entry = item.entry;
      if (!entry) continue;

      const scale = item.scale || 1;
      const animation = item.animation;
      const frameCount = Math.max(1, animation?.frameCount || 1);
      const frameWidth = animation?.frameWidth || item.renderWidth || entry.width;
      const frameHeight = animation?.frameHeight || item.renderHeight || entry.height;
      const frameIndex = animation ? frameTick % frameCount : 0;

      const srcX = entry.x + frameIndex * frameWidth;
      const srcY = entry.y;
      const srcW = frameWidth;
      const srcH = frameHeight;

      const renderW = srcW * scale;
      const renderH = srcH * scale;

      const anchorX = item.anchorMode === 'tile' ? 0 : (item.anchorX ?? 0.5);
      const anchorY = item.anchorMode === 'tile' ? 0 : (item.anchorY ?? 1);

      const screenX = Math.round(cam.width / 2 + wx + item.x);
      const screenY = Math.round(cam.height / 2 + wy + item.y);
      const drawX = Math.round(screenX - anchorX * renderW);
      const drawY = Math.round(screenY - anchorY * renderH);

      if (drawX + renderW < -64 || drawX > cam.width + 64) continue;
      if (drawY + renderH < -64 || drawY > cam.height + 64) continue;

      const frameKey = `layout_${srcX}_${srcY}_${srcW}_${srcH}`;
      if (!frameCache.has(frameKey)) {
        texture.add(frameKey, 0, srcX, srcY, srcW, srcH);
        frameCache.set(frameKey, true);
      }

      if (!texture.has(frameKey)) continue;

      const splitY = getDepthSplitYForEntry({
        ...entry,
        depthSplit: item.depthSplit || entry.depthSplit,
        depth: item.depth || entry.depth,
      });
      if (splitY > 0 && splitY < srcH) {
        const topFrameKey = `${frameKey}_top_${splitY}`;
        if (!frameCache.has(topFrameKey)) {
          texture.add(topFrameKey, 0, srcX, srcY, srcW, splitY);
          frameCache.set(topFrameKey, true);
        }

        const bottomH = srcH - splitY;
        const bottomFrameKey = `${frameKey}_bottom_${splitY}`;
        if (!frameCache.has(bottomFrameKey)) {
          texture.add(bottomFrameKey, 0, srcX, srcY + splitY, srcW, bottomH);
          frameCache.set(bottomFrameKey, true);
        }

        if (texture.has(bottomFrameKey)) {
          rt.stamp(atlasKey, bottomFrameKey, drawX, drawY + splitY * scale, {
            scale,
            originX: 0,
            originY: 0,
          });
          drawn++;
        }

        if (texture.has(topFrameKey)) {
          const targetRT = frontRT || rt;
          targetRT.stamp(atlasKey, topFrameKey, drawX, drawY, {
            scale,
            originX: 0,
            originY: 0,
          });
          drawn++;
        }

        continue;
      }

      rt.stamp(atlasKey, frameKey, drawX, drawY, {
        scale,
        originX: 0,
        originY: 0,
      });
      drawn++;
    }

    return drawn;
  }

  // ─── Phaser entity layer ──────────────────────────────────────────────────────

  _setupPhaserEntityLayer() {
    // Map<entityId, Phaser.GameObjects.Image>
    this._entitySpritePool = new Map();
    // Set of textureKeys currently loading — prevents duplicate load calls.
    this._loadingTextures = new Set();
    this._entityLayerVisible = false;
    this._lastEntitySyncOffsetX = null;
    this._lastEntitySyncOffsetY = null;
    this._lastEntitySyncCount = -1;
    // Per-URL texture key registry to avoid sanitizing the same URL twice.
    this._urlToKeyCache = new Map();
  }

  _urlToTextureKey(url) {
    if (this._urlToKeyCache.has(url)) return this._urlToKeyCache.get(url);
    // Stable key: keep alphanumeric/dot/dash chars, collapse the rest.
    const key = 'dyn_' + url.replace(/[^a-z0-9._-]/gi, '_');
    this._urlToKeyCache.set(url, key);
    return key;
  }

  // Returns sprite info needed by Phaser, or null if entity has no renderable sprite.
  _resolveEntitySpriteInfo(entity) {
    const itemId =
      entity.itemKey ||
      entity.itemId ||
      entity.itemType ||
      entity.rewardItem ||
      entity.type;

    if (itemId) {
      const definition = getItemDefinition(itemId);

      // React ItemVisual renders most resources/foods from item definitions using
      // atlasSource + atlasRect. Mirror that first, otherwise Phaser skips those
      // entities and they disappear when React EntityLayer is hidden.
      if (definition?.atlasSource && definition?.atlasRect) {
        const rect = definition.atlasRect;
        return {
          url: definition.atlasSource,
          isCrop: true,
          cropX: rect.x || 0,
          cropY: rect.y || 0,
          cropW: rect.width || 16,
          cropH: rect.height || 16,
          displayW: (rect.width || 16) * ENTITY_SCALE,
          displayH: (rect.height || 16) * ENTITY_SCALE,
        };
      }

      if (definition?.spritePath) {
        return {
          url: definition.spritePath,
          isCrop: false,
          displayW: 16 * ENTITY_SCALE,
          displayH: 16 * ENTITY_SCALE,
        };
      }

      const configuredSprite = getItemSpriteAsset(itemId, 'world') || getItemSpriteAsset(itemId, 'inventory');
      if (configuredSprite?.src) {
        return {
          url: configuredSprite.src,
          isCrop: false,
          displayW: 16 * ENTITY_SCALE,
          displayH: 16 * ENTITY_SCALE,
        };
      }
    }

    let sprite = null;
    if (entity.itemKey) {
      sprite = getItemWorldSprite(entity.itemKey);
    }
    if (!sprite && !entity.itemKey) {
      sprite = getItemSprite(entity.type, entity.spriteKey);
    }
    if (!sprite) return null;

    const url = sprite.src || sprite.sheet;
    if (!url) return null;

    const w = sprite.width || 16;
    const h = sprite.height || 16;

    if (sprite.src || sprite.isDirectAsset) {
      return { url, isCrop: false, displayW: w * ENTITY_SCALE, displayH: h * ENTITY_SCALE };
    }

    return {
      url,
      isCrop: true,
      cropX: sprite.x || 0,
      cropY: sprite.y || 0,
      cropW: w,
      cropH: h,
      displayW: w * ENTITY_SCALE,
      displayH: h * ENTITY_SCALE,
    };
  }

  // Ensures the texture is loaded. Returns true if already available.
  // Calls onLoaded() (with no args) when it finishes loading, if it was not already loaded.
  _ensureTexture(textureKey, url, onLoaded) {
    if (this.textures.exists(textureKey)) return true;

    if (!this._loadingTextures.has(textureKey)) {
      this._loadingTextures.add(textureKey);
      this.load.image(textureKey, url);
      this.load.once('complete', () => {
        this._loadingTextures.delete(textureKey);
        onLoaded?.();
      });
      this.load.start();
    }

    return false;
  }

  _syncPhaserEntitySprites(worldOffset, entities) {
    const cam = this.cameras.main;
    const wx = worldOffset.x || 0;
    const wy = worldOffset.y || 0;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const activeIds = new Set();

    for (const entity of entities) {
      if (!entity.active) continue;
      activeIds.add(entity.id);

      const screenX = Math.round(cx + wx + entity.x);
      const screenY = Math.round(cy + wy + entity.y);
      const offscreen =
        screenX < -64 || screenX > cam.width + 64 ||
        screenY < -64 || screenY > cam.height + 64;

      const existing = this._entitySpritePool.get(entity.id);

      if (existing) {
        existing.setPosition(screenX, screenY).setVisible(!offscreen && this._entityLayerVisible);
        continue;
      }

      if (offscreen) continue;

      const info = this._resolveEntitySpriteInfo(entity);
      // No resolvable sprite — React EntityLayer (ItemVisual / atlas) handles this entity.
      // Do not create a placeholder; skip silently.
      if (!info) continue;

      const textureKey = this._urlToTextureKey(info.url);
      const ready = this._ensureTexture(textureKey, info.url, () => {
        // On load complete, force re-sync.
        this._lastEntitySyncOffsetX = null;
      });

      if (!ready) continue;

      // Texture is loaded — register crop frame if needed, then verify before use.
      let frameKey = '__BASE';
      if (info.isCrop) {
        frameKey = `ef_${info.cropX}_${info.cropY}_${info.cropW}_${info.cropH}`;
        const texture = this.textures.get(textureKey);
        if (!texture.has(frameKey)) {
          texture.add(frameKey, 0, info.cropX, info.cropY, info.cropW, info.cropH);
        }
        // Guard: if the frame still isn't registered (e.g. out-of-bounds crop),
        // skip this entity rather than letting Phaser render a pink missing-frame square.
        if (!texture.has(frameKey)) {
          if (import.meta.env.DEV && !this._warnedFrames?.has(frameKey)) {
            this._warnedFrames = this._warnedFrames || new Set();
            this._warnedFrames.add(frameKey);
            console.warn(`[Phaser] Frame registration failed for entity "${entity.id}": ${frameKey}`);
          }
          continue;
        }
      }

      const img = this.add.image(screenX, screenY, textureKey, frameKey);
      // origin (0.5, 1) = bottom-center, matches React Entity's translate(-50%, -100%).
      img.setOrigin(0.5, 1);
      img.setScale(ENTITY_SCALE);
      img.setDepth(50);
      img.setScrollFactor(0);
      img.setVisible(this._entityLayerVisible);

      this._entitySpritePool.set(entity.id, img);
    }

    // Destroy sprites for removed entities.
    for (const [id, obj] of this._entitySpritePool) {
      if (!activeIds.has(id)) {
        obj.destroy();
        this._entitySpritePool.delete(id);
      }
    }
  }

  // ─── Phaser world interaction FX ─────────────────────────────────────────────

  _setupWorldFxLayer() {
    this._worldFxSpritePool = new Map();
    this._worldImpactSpritePool = new Map();
    this._fxFrameKeyCache = new Map();
  }

  _getFxFrameKey(type, frameIndex) {
    const config = WORLD_FX_TEXTURES[type];
    if (!config) return null;

    const key = `${type}_${frameIndex}`;
    if (this._fxFrameKeyCache.has(key)) return key;

    const texture = this.textures.get(config.key);
    if (!texture) return null;

    texture.add(
      key,
      0,
      frameIndex * config.frameWidth,
      0,
      config.frameWidth,
      config.frameHeight
    );
    this._fxFrameKeyCache.set(key, true);
    return key;
  }

  _syncWorldFxSprites(worldOffset) {
    const fxStore = useWorldFxStore.getState();
    fxStore.cleanupExpiredFx?.();

    const activeFx = fxStore.activeFx || [];
    const activeImpacts = fxStore.activeObjectImpacts || [];
    const cam = this.cameras.main;
    const wx = worldOffset.x || 0;
    const wy = worldOffset.y || 0;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const activeFxIds = new Set();
    const activeImpactIds = new Set();

    for (const fx of activeFx) {
      const config = WORLD_FX_TEXTURES[fx.type];
      if (!config || !this.textures.exists(config.key)) continue;

      const elapsedMs = Math.max(0, Date.now() - (fx.createdAt || Date.now()));
      const frameIndex = Math.min(
        config.frames - 1,
        Math.floor(elapsedMs / config.frameDurationMs)
      );
      const frameKey = this._getFxFrameKey(fx.type, frameIndex);
      if (!frameKey) continue;

      activeFxIds.add(fx.id);
      const screenX = Math.round(cx + wx + fx.x);
      const screenY = Math.round(cy + wy + fx.y + config.verticalOffsetY);
      let sprite = this._worldFxSpritePool.get(fx.id);

      if (!sprite) {
        sprite = this.add.image(screenX, screenY, config.key, frameKey);
        sprite.setOrigin(0.5, 0.5);
        sprite.setScrollFactor(0);
        sprite.setDepth(95);
        this._worldFxSpritePool.set(fx.id, sprite);
      }

      sprite
        .setTexture(config.key, frameKey)
        .setPosition(screenX, screenY)
        .setScale(config.renderScale * (fx.flipX ? -1 : 1), config.renderScale)
        .setVisible(true);
    }

    for (const impact of activeImpacts) {
      const item = impact.item;
      if (!item?.entry) continue;

      const atlasKey = THEME_TO_ATLAS_KEY[useWorldStore.getState().currentWorldTheme] || 'atlas_spring';
      const texture = this.textures.get(atlasKey);
      if (!texture) continue;

      const width = item.renderWidth || item.entry.width || 0;
      const height = item.renderHeight || item.entry.height || 0;
      if (width <= 0 || height <= 0) continue;

      const frameKey = `impact_${item.entry.id || item.entry.name}_${item.entry.x}_${item.entry.y}_${width}_${height}`;
      if (!texture.has(frameKey)) {
        texture.add(frameKey, 0, item.entry.x || 0, item.entry.y || 0, width, height);
      }
      if (!texture.has(frameKey)) continue;

      activeImpactIds.add(impact.objectId);

      const scale = Number.isFinite(item.scale) && item.scale > 0 ? item.scale : 1;
      const anchorX = item.anchorMode === 'tile' ? 0 : (item.anchorX ?? 0.5);
      const anchorY = item.anchorMode === 'tile' ? 0 : (item.anchorY ?? 1);
      const baseScreenX = Math.round(cx + wx + (item.x || 0));
      const baseScreenY = Math.round(cy + wy + (item.y || 0));
      const elapsed = Math.max(0, Date.now() - (impact.startedAt || Date.now()));
      const jiggle = elapsed < (impact.durationMs || 140)
        ? [0, -2, 2, -1][Math.floor((elapsed / Math.max(1, impact.durationMs || 140)) * 4) % 4]
        : 0;

      let sprite = this._worldImpactSpritePool.get(impact.objectId);
      if (!sprite) {
        sprite = this.add.image(baseScreenX, baseScreenY, atlasKey, frameKey);
        sprite.setScrollFactor(0);
        sprite.setDepth(94);
        sprite.setTint(0xffffff)
.setTintMode(Phaser.TintModes.FILL);
        this._worldImpactSpritePool.set(impact.objectId, sprite);
      }

      sprite
        .setTexture(atlasKey, frameKey)
        .setOrigin(anchorX, anchorY)
        .setPosition(baseScreenX + jiggle, baseScreenY)
        .setScale(scale)
        .setTint(0xffffff)
.setTintMode(Phaser.TintModes.FILL)
        .setVisible(true);
    }

    for (const [id, sprite] of this._worldFxSpritePool) {
      if (!activeFxIds.has(id)) {
        sprite.destroy();
        this._worldFxSpritePool.delete(id);
      }
    }

    for (const [id, sprite] of this._worldImpactSpritePool) {
      if (!activeImpactIds.has(id)) {
        sprite.destroy();
        this._worldImpactSpritePool.delete(id);
      }
    }
  }

  // ─── Phaser player ────────────────────────────────────────────────────────────

  _setupPhaserPlayer() {
    this._phaserPet = new PhaserPet(this);
    const flags = getPhaserDebugFlags();
    this._phaserPet.setVisible(Boolean(flags.showPhaserPlayer));
  }


  _setupPlayerMarker(cam) {
    this._playerMarker = this.add.graphics();
    this._playerMarker.setDepth(71).setScrollFactor(0).setVisible(false);
    this._drawPlayerMarker(cam);
  }

  _drawPlayerMarker(cam) {
    const g = this._playerMarker;
    if (!g) return;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const R = 6;
    g.clear();
    g.lineStyle(2, 0xff4444, 0.9);
    g.strokeCircle(cx, cy, R);
    g.lineStyle(1, 0xff4444, 0.7);
    g.lineBetween(cx - R - 4, cy, cx + R + 4, cy);
    g.lineBetween(cx, cy - R - 4, cx, cy + R + 4);
    g.fillStyle(0xff4444, 1);
    g.fillCircle(cx, cy, 2);
  }

  _setupEntityMarkers() {
    this._entityMarkers = this.add.graphics();
    this._entityMarkers.setDepth(70).setScrollFactor(0).setVisible(false);
    this._lastEntityMarkersOffsetX = null;
    this._lastEntityMarkersOffsetY = null;
    this._lastEntityMarkersCount = -1;
  }

  _drawEntityMarkers(worldOffset, entities) {
    const g = this._entityMarkers;
    if (!g) return;
    const cam = this.cameras.main;
    const wx = worldOffset.x || 0;
    const wy = worldOffset.y || 0;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    g.clear();
    g.lineStyle(1.5, 0x44ddff, 0.85);
    g.fillStyle(0x44ddff, 0.55);

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      const sx = cx + wx + e.x;
      const sy = cy + wy + e.y;
      if (sx < -16 || sx > cam.width + 16 || sy < -16 || sy > cam.height + 16) continue;
      g.strokeRect(sx - 5, sy - 5, 10, 10);
      g.fillRect(sx - 3, sy - 3, 6, 6);
    }
  }

  // ─── Debug handles ────────────────────────────────────────────────────────────

  _setupDebugHandles() {
    const scene = this;

    // ── Terrain RenderTexture ──
    const rt = this._viewportTerrainRT;
    Object.defineProperty(window.phaserDebug, 'showViewportTerrain', {
      configurable: true,
      get: () => rt.visible,
      set: (v) => {
        const on = Boolean(v);
        rt.setVisible(on);
        scene._viewportFrontRT?.setVisible(on);
        setPhaserDebugFlag('showViewportTerrain', on);
        if (on) {
          const { worldOffset, currentWorldTheme } = useWorldStore.getState();
          scene._drawViewportTerrain(worldOffset, currentWorldTheme);
          scene._lastWorldOffset = worldOffset;
          scene._lastTheme = currentWorldTheme;
        }
      },
    });

    // ── renderMode — high-level terrain switch ──
    // 'react'  : default — no Phaser terrain, React terrain visible
    // 'hybrid' : both React and Phaser terrain visible (alignment check)
    // 'phaser' : Phaser terrain only — React terrain hidden after Phaser renders
    Object.defineProperty(window.phaserDebug, 'renderMode', {
      configurable: true,
      get: () => getPhaserDebugFlags().renderMode,
      set: (v) => {
        if (!['react', 'hybrid', 'phaser'].includes(v)) return;
        setPhaserDebugFlag('renderMode', v);

        if (v === 'react') {
          rt.setVisible(false);
          scene._viewportFrontRT?.setVisible(false);
          setPhaserDebugFlag('showViewportTerrain', false);
          setPhaserDebugFlag('hideReactWorldLayer', false);
          return;
        }

        // ── Shared path: 'hybrid' and 'phaser' use IDENTICAL terrain rendering ──
        // _drawViewportTerrain writes pixels into the RT's WebGL FBO. Phaser's
        // main render pass (which paints the RT onto the visible canvas) runs on
        // the NEXT requestAnimationFrame. So the draw call is queued here but not
        // on-screen yet. Both modes draw the same way; the only difference is
        // whether React terrain is hidden afterward.
        const { worldOffset, currentWorldTheme } = useWorldStore.getState();
        const atlasKey = THEME_TO_ATLAS_KEY[currentWorldTheme] || 'atlas_spring';

        rt.setVisible(true);
        scene._viewportFrontRT?.setVisible(true);
        setPhaserDebugFlag('showViewportTerrain', true);
        scene._drawViewportTerrain(worldOffset, currentWorldTheme);
        scene._lastWorldOffset = worldOffset;
        scene._lastTheme = currentWorldTheme;

        if (v === 'hybrid') {
          // Keep React terrain — no hide needed.
          setPhaserDebugFlag('hideReactWorldLayer', false);
          return;
        }

        // ── 'phaser' mode only: defer React hide by one Phaser frame ──
        // Hiding React in the same JS task that called _drawViewportTerrain causes
        // a black frame: React terrain disappears before Phaser's rAF fires and
        // commits the RT pixels to the canvas. Deferring via delayedCall(0) lets
        // Phaser complete one render pass first, so the transition is seamless.
        // In hybrid mode the gap is invisible (React terrain covers it); in phaser
        // mode it was exposed, producing the persistent black screen.
        scene.time.delayedCall(0, () => {
          // Guard: abort if RT is no longer visible, atlas is gone, or no tiles were
          // actually drawn. The last check catches the case where _drawViewportTerrain
          // ran but stamped 0 tiles (e.g. worldOffset placed all tiles off-screen).
          if (!rt.visible || !scene.textures.exists(atlasKey) || scene._drawnTileCount < 1) {
            if (import.meta.env.DEV) {
              console.warn(
                `[Phaser] renderMode phaser: RT not ready (visible=${rt.visible}, ` +
                `tilesDrawn=${scene._drawnTileCount}) — keeping React terrain visible`
              );
            }
            return;
          }
          setPhaserDebugFlag('hideReactWorldLayer', true);
        });
      },
    });

    // ── React world layer visibility ──
    Object.defineProperty(window.phaserDebug, 'hideReactWorldLayer', {
      configurable: true,
      get: () => getPhaserDebugFlags().hideReactWorldLayer,
      set: (v) => setPhaserDebugFlag('hideReactWorldLayer', Boolean(v)),
    });

    // ── Phaser entity layer ──
    Object.defineProperty(window.phaserDebug, 'showPhaserEntityLayer', {
      configurable: true,
      get: () => getPhaserDebugFlags().showPhaserEntityLayer,
      set: (v) => {
        const on = Boolean(v);
        scene._entityLayerVisible = on;
        for (const img of scene._entitySpritePool.values()) img.setVisible(on);
        setPhaserDebugFlag('showPhaserEntityLayer', on);
        if (on) scene._lastEntitySyncOffsetX = null;
      },
    });

    // ── React entity layer visibility ──
    Object.defineProperty(window.phaserDebug, 'hideReactEntityLayer', {
      configurable: true,
      get: () => getPhaserDebugFlags().hideReactEntityLayer,
      set: (v) => setPhaserDebugFlag('hideReactEntityLayer', Boolean(v)),
    });

    // ── Phaser player ──
    Object.defineProperty(window.phaserDebug, 'showPhaserPlayer', {
      configurable: true,
      get: () => getPhaserDebugFlags().showPhaserPlayer,
      set: (v) => {
        const on = Boolean(v);
        scene._phaserPet?.setVisible(on);
        setPhaserDebugFlag('showPhaserPlayer', on);
      },
    });

    // ── Debug overlays ──
    const playerMarker = this._playerMarker;
    Object.defineProperty(window.phaserDebug, 'showPlayerMarker', {
      configurable: true,
      get: () => getPhaserDebugFlags().showPlayerMarker,
      set: (v) => {
        const on = Boolean(v);
        playerMarker?.setVisible(on);
        setPhaserDebugFlag('showPlayerMarker', on);
      },
    });

    const entityMarkers = this._entityMarkers;
    Object.defineProperty(window.phaserDebug, 'showEntityMarkers', {
      configurable: true,
      get: () => getPhaserDebugFlags().showEntityMarkers,
      set: (v) => {
        const on = Boolean(v);
        entityMarkers?.setVisible(on);
        setPhaserDebugFlag('showEntityMarkers', on);
        if (on) scene._lastEntityMarkersOffsetX = null;
      },
    });

    // ── forceRedCanvas — hard CSS visibility test ──
    // Sets a full-viewport red rectangle at depth 999.
    // If this is not visible after `window.phaserDebug.forceRedCanvas = true`,
    // the Phaser canvas is still occluded by a React layer — do NOT hide React terrain.
    Object.defineProperty(window.phaserDebug, 'forceRedCanvas', {
      configurable: true,
      get: () => getPhaserDebugFlags().forceRedCanvas,
      set: (v) => {
        const on = Boolean(v);
        setPhaserDebugFlag('forceRedCanvas', on);
        if (!scene._redOverlay) {
          const cam = scene.cameras.main;
          scene._redOverlay = scene.add
            .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xff0000, 0.9)
            .setScrollFactor(0)
            .setDepth(999);
        }
        scene._redOverlay.setVisible(on);
      },
    });
  }

  // ─── Step 5A – small atlas tile strip ────────────────────────────────────────


  update() {
    if (!import.meta.env.DEV) return;

    const { worldOffset, currentWorldTheme } = useWorldStore.getState();
    const wx = worldOffset.x || 0;
    const wy = worldOffset.y || 0;

    const moved =
      this._lastWorldOffset?.x !== worldOffset.x ||
      this._lastWorldOffset?.y !== worldOffset.y;
    const themeChanged = this._lastTheme !== currentWorldTheme;

const brokenState = useBrokenObjectsStore.getState();
const brokenObjectsSignature = JSON.stringify({
  broken: brokenState?.brokenObjectIds || [],
  replaced: brokenState?.replacedObjectIds || [],
  stumps: Object.keys(brokenState?.stumpObjects || {}),
});
const brokenObjectsChanged =
  this._lastBrokenObjectsSignature !== brokenObjectsSignature;

    // ── Viewport terrain ──
    const terrainVisible = this._viewportTerrainRT?.visible || this._viewportFrontRT?.visible;
    const animationTick = Math.floor(this.time.now / 120);
    const hasVisibleWorldAnimations = Boolean(
      terrainVisible &&
        (
          this._lastLayout?.renderItems?.some((item) => item.animation) ||
          this._lastLayout?.tileChunks?.some((chunk) =>
            chunk.renderItems?.some((item) => item.animation) ||
            chunk.tileBackItems?.some((item) => item.animation) ||
            chunk.tileFrontItems?.some((item) => item.animation) ||
            chunk.animatedTileBackItems?.some((item) => item.animation) ||
            chunk.animatedTileFrontItems?.some((item) => item.animation)
          )
        )
    );
    const animationChanged = hasVisibleWorldAnimations && this._lastAnimationTick !== animationTick;

    if (terrainVisible && (moved || themeChanged || animationChanged || brokenObjectsChanged)) {
      this._drawViewportTerrain(worldOffset, currentWorldTheme);
      this._lastWorldOffset = worldOffset;
      this._lastTheme = currentWorldTheme;
      this._lastAnimationTick = animationTick;
      this._lastBrokenObjectsSignature = brokenObjectsSignature;
    }

    // ── Phaser entity sprites ──
    if (this._entityLayerVisible) {
      const { entities } = useEntityStore.getState();
      const entityMoved =
        this._lastEntitySyncOffsetX !== wx ||
        this._lastEntitySyncOffsetY !== wy;
      const countChanged = this._lastEntitySyncCount !== entities.length;

      if (entityMoved || countChanged) {
        this._syncPhaserEntitySprites(worldOffset, entities);
        this._lastEntitySyncOffsetX = wx;
        this._lastEntitySyncOffsetY = wy;
        this._lastEntitySyncCount = entities.length;
      }
    }

    // ── Phaser player ──
    this._phaserPet?.update();

    // ── Phaser world interaction FX ──
    this._syncWorldFxSprites(worldOffset);

    // ── forceRedCanvas resize ──
    if (this._redOverlay?.visible) {
      const cam = this.cameras.main;
      this._redOverlay.setPosition(cam.width / 2, cam.height / 2);
      this._redOverlay.setSize(cam.width, cam.height);
    }

    // ── Debug entity markers ──
    if (this._entityMarkers?.visible) {
      const { entities } = useEntityStore.getState();
      const markerMoved =
        this._lastEntityMarkersOffsetX !== wx ||
        this._lastEntityMarkersOffsetY !== wy;
      const markerCountChanged = this._lastEntityMarkersCount !== entities.length;

      if (markerMoved || markerCountChanged) {
        this._drawEntityMarkers(worldOffset, entities);
        this._lastEntityMarkersOffsetX = wx;
        this._lastEntityMarkersOffsetY = wy;
        this._lastEntityMarkersCount = entities.length;
      }
    }
  }

  shutdown() {
    // Destroy entity sprites.
    if (this._entitySpritePool) {
      for (const obj of this._entitySpritePool.values()) obj.destroy();
      this._entitySpritePool.clear();
    }

    if (this._worldFxSpritePool) {
      for (const obj of this._worldFxSpritePool.values()) obj.destroy();
      this._worldFxSpritePool.clear();
    }

    if (this._worldImpactSpritePool) {
      for (const obj of this._worldImpactSpritePool.values()) obj.destroy();
      this._worldImpactSpritePool.clear();
    }

    this._phaserPet?.destroy();
    this._phaserPet = null;

    this._playerMarker?.destroy();
    this._playerMarker = null;
    this._entityMarkers?.destroy();
    this._entityMarkers = null;
    this._redOverlay?.destroy();
    this._redOverlay = null;
    this._viewportFrontRT?.destroy();
    this._viewportFrontRT = null;

    this._decorFrameKeyCache?.clear();
    this._fxFrameKeyCache?.clear();
    this._urlToKeyCache?.clear();
    this._warnedFrames?.clear();

    if (import.meta.env.DEV) {
      console.log('[Phaser MainScene] Shutting down');
    }
  }
}

export default MainScene;
