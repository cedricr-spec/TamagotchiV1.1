import PhaserPetAnimation from "./phaserPetAnimation"
import {
  resolvePhaserPetModel,
  syncPhaserPetMovementState,
} from "./PhaserPetModel"
import PhaserPetShadow from "./PhaserPetShadow"
import PhaserPetSprite from "./PhaserPetSprite"

export default class PhaserPet {
  constructor(scene, options = {}) {
    this.scene = scene
    this.mode = options.mode || "world"
    this.characterIdOverride = options.characterId || null
    this.persistentStateOverride = options.persistentState ?? null
    this.transientStateOverride = options.transientState
    this.movementActiveOverride = options.movementActive ?? null
    this.facingDirectionOverride = options.facingDirection || null
    this.scaleOverride = options.scaleOverride ?? null
    this.forceAnimationStateOverride = options.forceAnimationState || null
    this.visible = false
    this.model = null
    this.characterId = null

    this.animation = new PhaserPetAnimation(scene)
    this.sprite = new PhaserPetSprite(scene)
    this.shadow = new PhaserPetShadow(scene)
  }

  setVisible(visible) {
    this.visible = Boolean(visible)
    this.sprite.setVisible(this.visible)
    this.shadow.setVisible(this.visible)
  }

  update() {
    if (this.mode === "world") {
      syncPhaserPetMovementState()
    }

    const baseModel = this.resolveCurrentModel()
    if (!baseModel) {
      this.hideRenderers()
      return
    }

    if (this.characterId !== baseModel.characterId) {
      this.characterId = baseModel.characterId
      this.animation.reset()
    }

    this.animation.syncAnimationState(baseModel.animationState)
    this.animation.update(baseModel.animation)

    const model = this.resolveCurrentModel()
    if (!model) {
      this.hideRenderers()
      return
    }

    this.model = model
    this.shadow.update(model, this.visible)
    this.sprite.update(model, this.visible)
  }

  resolveCurrentModel() {
    const cam = this.scene.cameras.main
    return resolvePhaserPetModel({
      frameIndex: this.animation.frameIndex,
      viewportWidth: cam.width,
      viewportHeight: cam.height,
      characterIdOverride: this.characterIdOverride,
      persistentStateOverride: this.persistentStateOverride,
      transientStateOverride: this.transientStateOverride,
      movementActiveOverride: this.movementActiveOverride,
      facingDirectionOverride: this.facingDirectionOverride,
      scaleOverride: this.scaleOverride,
      forceAnimationStateOverride: this.forceAnimationStateOverride,
    })
  }

  setCharacter(characterId) {
    if (this.characterIdOverride === characterId) return
    this.characterIdOverride = characterId
    this.characterId = null
    this.model = null
    this.animation.reset()
    this.hideRenderers()
  }

  hideRenderers() {
    this.sprite.setVisible(false)
    this.shadow.setVisible(false)
  }

  destroy() {
    this.sprite?.destroy()
    this.shadow?.destroy()
    this.animation?.destroy()

    this.sprite = null
    this.shadow = null
    this.animation = null
    this.scene = null
    this.model = null
    this.characterId = null
    this.characterIdOverride = null
    this.persistentStateOverride = null
    this.transientStateOverride = undefined
    this.movementActiveOverride = null
    this.facingDirectionOverride = null
    this.scaleOverride = null
    this.forceAnimationStateOverride = null
    this.mode = null
    this.visible = false
  }
}