

import Phaser from "phaser"

const PLAYER_DEPTH = 55

export default class PhaserPetSprite {
  constructor(scene) {
    this.scene = scene
    this.sprite = null
    this.characterId = null
    this.textureKey = null
    this.loadingTextureKey = null
  }

  update(model, visible) {
    if (!model?.spritesheet) return false

    if (this.characterId !== model.characterId) {
      this.resetCharacter(model.characterId)
    }

    const textureKey = this.getTextureKey(model)
    if (!this.ensureTexture(textureKey, model.spritesheet)) {
      this.sprite?.setVisible(false)
      return false
    }

    const texture = this.scene.textures.get(textureKey)
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST)

    const frameKey = this.ensureFrame(texture, textureKey, model)
    if (!frameKey) {
      this.sprite?.setVisible(false)
      return false
    }

    if (!this.sprite) {
      this.sprite = this.scene.add
        .image(model.centerX, model.centerY, textureKey, frameKey)
        .setOrigin(0.5, 0.5)
        .setDepth(PLAYER_DEPTH)
        .setScrollFactor(0)
    }

    this.sprite
      .setTexture(textureKey, frameKey)
      .setPosition(model.centerX, model.centerY)
      .setScale(model.flipX ? -model.scale : model.scale, model.scale)
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

  ensureFrame(texture, textureKey, model) {
    const frameKey = `${textureKey}_${model.animationState}_${model.frameIndex}`

    if (!texture.has(frameKey)) {
      texture.add(
        frameKey,
        0,
        model.frameX,
        model.frameY,
        model.frameWidth,
        model.frameHeight
      )
    }

    return texture.has(frameKey) ? frameKey : null
  }

  getTextureKey(model) {
    return `phaser_pet_${model.characterId}`
  }

  resetCharacter(characterId) {
    this.sprite?.destroy()
    this.sprite = null
    this.characterId = characterId
    this.textureKey = null
    this.loadingTextureKey = null
  }

  setVisible(visible) {
    this.sprite?.setVisible(Boolean(visible))
  }

  destroy() {
    this.sprite?.destroy()
    this.sprite = null
    this.characterId = null
    this.textureKey = null
    this.loadingTextureKey = null
    this.scene = null
  }
}