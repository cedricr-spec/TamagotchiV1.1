import { WORLD_THEME_CONFIG } from '../config/worldThemeConfig';
import { WORLD_SEASON_IDS } from '../config/worldSeasonConfig';
import { DEFAULT_CHARACTER_SHADOW } from '../config/characterRoster';

/**
 * World atlas textures — one PNG per season, all share the same sprite
 * coordinate layout defined in atlas-clean-v1.json.
 *
 * The URLs here are Vite-resolved (hashed) at import time, so they work
 * both in dev and in prod builds without any path remapping.
 */
export const WORLD_ATLAS_TEXTURES = [
  {
    key: 'atlas_spring',
    url: WORLD_THEME_CONFIG[WORLD_SEASON_IDS.SPRING].atlasImage,
  },
  {
    key: 'atlas_summer',
    url: WORLD_THEME_CONFIG[WORLD_SEASON_IDS.SUMMER].atlasImage,
  },
  {
    key: 'atlas_autumn',
    url: WORLD_THEME_CONFIG[WORLD_SEASON_IDS.AUTUMN].atlasImage,
  },
  {
    key: 'atlas_winter',
    url: WORLD_THEME_CONFIG[WORLD_SEASON_IDS.WINTER].atlasImage,
  },
];

/**
 * Character shadow sprite — shared by every character in the roster.
 * Lives under public/pets/ so the path is static.
 */
export const CHARACTER_SHADOW_ASSET = {
  key: 'character_shadow',
  url: DEFAULT_CHARACTER_SHADOW.sprite,
};

/** Flat list of every asset this manifest declares. */
export const ALL_ASSETS = [...WORLD_ATLAS_TEXTURES, CHARACTER_SHADOW_ASSET];
