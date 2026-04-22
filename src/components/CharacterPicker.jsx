import React, { useMemo, useState } from "react"
import PetSprite from "../tamagotchi/components/PetSprite"
import { CHARACTER_ROSTER } from "../tamagotchi/config/characterRoster"
import { useCharacterStore } from "../tamagotchi/store/useCharacterStore"
import { usePetStore } from "../tamagotchi/store/usePetstore"

import leftChevron from "../hud/CTAs/CTA_Small_8BIT_Chevron_Left.webp"
import leftChevronPressed from "../hud/CTAs/CTA_Small_8BIT_Chevron_Left_Pressed.webp"
import rightChevron from "../hud/CTAs/CTA_Small_8BIT_Chevron_Right.webp"
import rightChevronPressed from "../hud/CTAs/CTA_Small_8BIT_Chevron_Right_Pressed.webp"

const CHEVRON_BUTTON_SIZE = 52
const PREVIEW_CHARACTER_SCALE = 5

function ChevronButton({
  label,
  defaultImage,
  pressedImage,
  pressed,
  onPress,
  onRelease,
  color,
}) {
  const displayImage = pressed ? pressedImage || defaultImage : defaultImage

  return (
    <button
      type="button"
      aria-label={label}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        onPress?.()
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId)
        onRelease?.()
      }}
      onPointerLeave={() => onRelease?.()}
      onPointerCancel={() => onRelease?.()}
      style={{
        width: `${CHEVRON_BUTTON_SIZE}px`,
        height: `${CHEVRON_BUTTON_SIZE}px`,
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <img
          src={displayImage}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            imageRendering: "pixelated",
            display: "block",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitUserDrag: "none",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: color || "#8f8f8f",
            mixBlendMode: "color",
            pointerEvents: "none",
            WebkitMaskImage: `url(${displayImage})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            maskImage: `url(${displayImage})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
          }}
        />
      </div>
    </button>
  )
}

export default function CharacterPicker() {
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId)
  const setCharacter = useCharacterStore((s) => s.setCharacter)
  const theme = usePetStore((s) => s.theme)
  const controlColor = theme?.modelColor || "#8f8f8f"

  const [leftPressed, setLeftPressed] = useState(false)
  const [rightPressed, setRightPressed] = useState(false)

  const characters = useMemo(() => {
    if (Array.isArray(CHARACTER_ROSTER)) return CHARACTER_ROSTER
    return []
  }, [])

  const currentIndex = useMemo(() => {
    const foundIndex = characters.findIndex((character) => character.id === activeCharacterId)
    return foundIndex >= 0 ? foundIndex : 0
  }, [characters, activeCharacterId])

  const currentCharacter = characters[currentIndex] || characters[0] || null

  const goToPreviousCharacter = () => {
    if (!characters.length) return
    const previousIndex = (currentIndex - 1 + characters.length) % characters.length
    const previousCharacter = characters[previousIndex]
    if (previousCharacter) {
      setCharacter(previousCharacter.id)
    }
  }

  const goToNextCharacter = () => {
    if (!characters.length) return
    const nextIndex = (currentIndex + 1) % characters.length
    const nextCharacter = characters[nextIndex]
    if (nextCharacter) {
      setCharacter(nextCharacter.id)
    }
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {currentCharacter && (
          <PetSprite
            characterId={currentCharacter.id}
            previewMode
            forceAnimation="idle"
            forceFacingDirection="right"
            scaleOverride={PREVIEW_CHARACTER_SCALE}
          />
        )}
      </div>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: `${CHEVRON_BUTTON_SIZE}px 1fr ${CHEVRON_BUTTON_SIZE}px`,
          alignItems: "center",
          gap: "8px",
        }}
      >
        <ChevronButton
          label="Previous character"
          defaultImage={leftChevron}
          pressedImage={leftChevronPressed}
          pressed={leftPressed}
          color={controlColor}
          onPress={() => setLeftPressed(true)}
          onRelease={() => {
            if (leftPressed) {
              goToPreviousCharacter()
            }
            setLeftPressed(false)
          }}
        />

        <div
          style={{
            color: "white",
            fontSize: "16px",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {currentCharacter?.name || "Character"}
        </div>

        <ChevronButton
          label="Next character"
          defaultImage={rightChevron}
          pressedImage={rightChevronPressed}
          pressed={rightPressed}
          color={controlColor}
          onPress={() => setRightPressed(true)}
          onRelease={() => {
            if (rightPressed) {
              goToNextCharacter()
            }
            setRightPressed(false)
          }}
        />
      </div>
    </div>
  )
}