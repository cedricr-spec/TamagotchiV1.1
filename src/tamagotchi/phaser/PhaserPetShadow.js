

import Phaser from "phaser"

const SHADOW_DEPTH = 54
const SHADOW_SIZE_MULTIPLIER = 0.75

export default class PhaserPetShadow {
  constructor(scene) {
    this.scene = scene
    this.sprite = null
    this.textureKey = null
    this.loadingTextureKey = null
  }

  update(model, visible) {
    const shadow = model?.shadowModel
    if (!shadow?.sprite) {
      this.setVisible(false)
      return false
    }

    const textureKey = this.getTextureKey(shadow.sprite)
    if (!this.ensureTexture(textureKey, shadow.sprite)) {
      this.setVisible(false)
      return false
    }

    const texture = this.scene.textures.get(textureKey)
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST)

    if (!this.sprite) {
      this.sprite = this.scene.add
        .image(shadow.centerX, shadow.centerY, textureKey)
        .setOrigin(0.5, 0.5)
        .setDepth(SHADOW_DEPTH)
        .setScrollFactor(0)
    }

    this.sprite
      .setTexture(textureKey)
      .setPosition(shadow.centerX, shadow.centerY)
      .setDisplaySize(
        shadow.displayWidth * SHADOW_SIZE_MULTIPLIER,
        shadow.displayHeight * SHADOW_SIZE_MULTIPLIER
      )
      .setAlpha(shadow.opacity)
      .setVisible(Boolean(visible))

    return true
  }

  ensureTexture(textureKey, src) {
    if (this.scene.textures.exists(textureKey)) return true
    if (this.loadingTextureKey === textureKey) return false

    this.loadingTextureKey = textureKey
    this.scene.load.image(textureKey, src)
    this.scene.load.once(`filecomplete-image-${textureKey}`, () => {
      this.loadingTextureKey = null
    })
    this.scene.load.once("loaderror", () => {
      this.loadingTextureKey = null
    })
    this.scene.load.start()
    return false
  }

  getTextureKey(src) {
    return `phaser_pet_shadow_${String(src).replace(/[^a-zA-Z0-9]/g, "_")}`
  }

  setVisible(visible) {
    this.sprite?.setVisible(Boolean(visible))
  }

  destroy() {
    this.sprite?.destroy()
    this.sprite = null
    this.textureKey = null
    this.loadingTextureKey = null
    this.scene = null
  }
}