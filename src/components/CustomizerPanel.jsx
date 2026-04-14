import React, { useState, useEffect, useRef } from "react"
import PanelItem from "./PanelItem"
import IconButton from "./IconButton"
import { HexColorPicker } from "react-colorful"
import tinycolor from "tinycolor2"
import { usePetStore } from "../tamagotchi/store/usePetStore"

export default function CustomizerPanel({ open, setStarsColor, onRandomizeStars, onClose }) {
  const [active, setActive] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [isPresetOpen, setIsPresetOpen] = useState(false)
  const panelRef = useRef()
  const [color, setColor] = useState("#4fd1ff")
  const { petColor, setPetColor, modelColor, setModelColor } = usePetStore()
  const [history, setHistory] = useState({ past: [], present: { color: "#4fd1ff", starsColor: "#ffffff", starsSeed: 0, petColor: petColor, modelColor: modelColor }, future: [] })
  const [savePressed, setSavePressed] = useState(false)
  const [starsTemp, setStarsTemp] = useState("#ffffff")
  const [starsSaved, setStarsSaved] = useState("#ffffff")
  const [starsSavePressed, setStarsSavePressed] = useState(false)
  const [randomPressed, setRandomPressed] = useState(false)

const [petTemp, setPetTemp] = useState(petColor)
const [petSaved, setPetSaved] = useState(petColor)
const [petSavePressed, setPetSavePressed] = useState(false)

const isPetDirty = petTemp !== petSaved
  const isModelDirty = modelColor !== history.present.modelColor
  const presets = [
  { name: "LAVA", background: "#ff5a1f", starsColor: "#ffb347", petColor: "#ff7a3a" },
  { name: "ICE", background: "#4fd1ff", starsColor: "#e0f7ff", petColor: "#bfe9ff" },
  { name: "NEON", background: "#7b00ff", starsColor: "#00ffe0", petColor: "#c084ff" }
]

  const isDirty = color !== history.present.color
  const isStarsDirty = starsTemp !== starsSaved
  const pushToHistory = (newPartialState) => {
    setHistory((prev) => {
      const newPresent = {
        ...prev.present,
        ...newPartialState
      }

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: []
      }
    })
  }

  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future]
      }
    })
  }

  const handleRedo = () => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1)
      }
    })
  }

  const applyGradient = (hex) => {
    const base = tinycolor(hex)

    const grad1 = base.lighten(25).toRgbString()
    const grad2 = base.toRgbString()
    const grad3 = base.darken(35).toRgbString()

    const root = document.documentElement
    root.style.setProperty("--grad-1", grad1)
    root.style.setProperty("--grad-2", grad2)
    root.style.setProperty("--grad-3", grad3)
  }

  // CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (open && onClose) onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // SYNC HISTORY
  useEffect(() => {
    const c = history.present.color || color
    setColor(c)
    applyGradient(c)

    if (history.present.starsColor) {
      setStarsTemp(history.present.starsColor)
      setStarsSaved(history.present.starsColor)
      if (setStarsColor) setStarsColor(history.present.starsColor)

      if (history.present.starsSeed !== undefined && onRandomizeStars) {
        onRandomizeStars(history.present.starsSeed)
      }
    }
    if (history.present.petColor) {
      setPetTemp(history.present.petColor)
      setPetSaved(history.present.petColor)
      setPetColor(history.present.petColor)
    }
    if (history.present.modelColor) {
      setModelColor(history.present.modelColor)
    }
  }, [history.present])

  return (
   <div
  ref={panelRef}
  style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "320px",
        height: "100vh",
        backgroundImage: "url('/background_panel.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxSizing: "border-box",
        zIndex: 15,

        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s ease",

        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}
    >
      {/* HEADER */}
      <div className="panel-header panel-section"
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  }}
>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "20px",
              fontWeight: "600"
            }}
          >
            PERSONNALISER
          </div>
          
          {/* Undo / Redo */}
        <div style={{ display: "flex", gap: "8px" }}>
 <IconButton
  defaultSrc="/undo.svg"
  clickSrc="/undo_click.svg"
  mode="press"
  onClick={handleUndo}
/>

<IconButton
  defaultSrc="/redo.svg"
  clickSrc="/redo_click.svg"
  mode="press"
  onClick={handleRedo}
/>
</div>
        </div>

      {/* END HEADER */}
      </div>

     {/* PRESETS SECTION */}
<div className="panel-section panel-frame">
  <div className="preset-section">

    <div
      className="preset-bar"
      onClick={() => setIsPresetOpen(!isPresetOpen)}
      style={{
        position: "relative",
        width: "100%",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer"
      }}
    >
      <img
        src="/preset_bar.svg"
        style={{
          position: "absolute",
          display: "flex",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}
      />

<div
  style={{
    position: "relative",
    color: "white",
    fontSize: "18px",
    paddingLeft: "20px",
    paddingRight: "40px", // espace pour le chevron
    zIndex: 2,

    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }}
>
        {selectedPreset || "Aucun preset sélectionné"}
      </div>

      <img
        src="/dropdown_chevron.svg"
        style={{
          position: "relative",
          width: "20px",
          marginRight: "20px",
          zIndex: 2,
          transform: isPresetOpen ? "scaleY(-1)" : "scaleY(1)"
        }}
      />
    </div>

    {isPresetOpen && (
      <div className="preset-popin">
        <div className="preset-popin-content">
          {presets.map((p) => (
            <div
              key={p.name}
              className={selectedPreset === p.name ? "active" : ""}
              onClick={() => {
  setSelectedPreset(p.name)
  setIsPresetOpen(false)

  applyGradient(p.background)

  if (setStarsColor) setStarsColor(p.starsColor)

  // 🔥 AJOUT PET
  if (p.petColor) {
  setPetColor(p.petColor)
  setPetTemp(p.petColor)
  setPetSaved(p.petColor)

  if (window.setPetColor) {
    window.setPetColor(p.petColor)
  }
}

  const newSeed = Date.now()
  if (onRandomizeStars) onRandomizeStars(newSeed)

  pushToHistory({
    color: p.background,
    starsColor: p.starsColor,
    starsSeed: newSeed,
    petColor: p.petColor
  })
}}
            >
              {p.name}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</div>

      {/* BUTTONS */}
      <div className="panel-buttons">
        <PanelItem
          label="ARRIÈRE PLAN"
          selected={active === "background"}
          onClick={() =>
            setActive(active === "background" ? null : "background")
          }
        />

        <PanelItem
          label="ÉTOILES"
          selected={active === "stars"}
          onClick={() =>
            setActive(active === "stars" ? null : "stars")
          }
        />

        <PanelItem
          label="STICKERS"
          selected={active === "stickers"}
          onClick={() =>
            setActive(active === "stickers" ? null : "stickers")
          }
        />
        <PanelItem
          label="PET"
          selected={active === "pet"}
          onClick={() =>
            setActive(active === "pet" ? null : "pet")
          }
        />
        {/* COLOR PANEL BUTTON */}
        <PanelItem
          label="COULEUR"
          selected={active === "color"}
          onClick={() =>
            setActive(active === "color" ? null : "color")
          }
        />
      </div>
      <div className={active === "stickers" ? "panel-section-full-width" : "panel-section"} style={{}}>
  {active === "background" && (
    <div style={{ marginTop: "10px" }}>
      <div style={{ width: "100%" }}>
        <HexColorPicker
          style={{ width: "100%" }}
          color={color}
          onChange={(newColor) => {
            setColor(newColor)
            applyGradient(newColor)
          }}
        />
      </div>
      
      <div style={{ marginTop: "12px", color: "white", fontSize: "14px" }}>
        {color}
      </div>
      <div
        onClick={() => {
          if (!isDirty) return
          setSavePressed(true)
          setTimeout(() => setSavePressed(false), 150)
          pushToHistory({ color })
        }}
        onMouseDown={() => setSavePressed(true)}
        onMouseUp={() => setSavePressed(false)}
        onMouseLeave={() => setSavePressed(false)}
        style={{
          position: "relative",
          width: "100%",
          height: "48px",
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDirty ? "pointer" : "not-allowed",
          opacity: isDirty ? 1 : 0.5,
          transform: savePressed ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.1s ease"
        }}
      >
        <img
          src={
            !isDirty
              ? "/CTA_item_panel_unselected.svg"
              : savePressed
              ? "/CTA_item_panel_click.svg"
              : "/CTA_item_panel_unselected.svg"
          }
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            left: 0,
            pointerEvents: "none"
          }}
        />

        <div
          style={{
            position: "relative",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
            width: "100%",
            pointerEvents: "none"
          }}
        >
          ENREGISTRER
        </div>
      </div>
    </div>
  )}

  {active === "stars" && (
  <div style={{ marginTop: "10px", width: "100%" }}>
    
    <HexColorPicker
      style={{ width: "100%" }}
      color={starsTemp}
      onChange={(c) => {
        setStarsTemp(c)
        if (setStarsColor) setStarsColor(c)
      }}
    />

    {/* SAVE STARS COLOR */}
    <div
      onClick={() => {
        if (!isStarsDirty) return
        setStarsSavePressed(true)
        setTimeout(() => setStarsSavePressed(false), 150)
        setStarsSaved(starsTemp)
        if (setStarsColor) setStarsColor(starsTemp)
        pushToHistory({ starsColor: starsTemp })
      }}
      onMouseDown={() => setStarsSavePressed(true)}
      onMouseUp={() => setStarsSavePressed(false)}
      onMouseLeave={() => setStarsSavePressed(false)}
      style={{
        position: "relative",
        width: "100%",
        height: "48px",
        marginTop: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isStarsDirty ? "pointer" : "not-allowed",
        opacity: isStarsDirty ? 1 : 0.5,
        transform: starsSavePressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.1s ease"
      }}
    >
      <img
        src={
          !isStarsDirty
            ? "/CTA_item_panel_unselected.svg"
            : starsSavePressed
            ? "/CTA_item_panel_click.svg"
            : "/CTA_item_panel_unselected.svg"
        }
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          color: "white",
          fontSize: "14px",
          fontWeight: 500,
          textAlign: "center",
          width: "100%",
          pointerEvents: "none"
        }}
      >
        ENREGISTRER
      </div>
    </div>

    {/* BOUTON RANDOM */}
    <div
      onClick={() => {
        setRandomPressed(true)
        setTimeout(() => setRandomPressed(false), 150)
        if (onRandomizeStars) onRandomizeStars()
        const newSeed = Date.now()

if (onRandomizeStars) onRandomizeStars(newSeed)

pushToHistory({ starsSeed: newSeed })
      }}
      onMouseDown={() => setRandomPressed(true)}
      onMouseUp={() => setRandomPressed(false)}
      onMouseLeave={() => setRandomPressed(false)}
      style={{
        position: "relative",
        width: "100%",
        height: "48px",
        marginTop: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transform: randomPressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.1s ease"
      }}
    >
      <img
        src={randomPressed ? "/CTA_item_panel_click.svg" : "/CTA_item_panel_unselected.svg"}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          color: "white",
          fontSize: "14px",
          fontWeight: 500,
          textAlign: "center",
          width: "100%",
          pointerEvents: "none"
        }}
      >
        RANDOMISER
      </div>
    </div>

  </div>
)}
  {active === "pet" && (
    <div style={{ marginTop: "10px", width: "100%" }}>
      <HexColorPicker
        style={{ width: "100%" }}
        color={petTemp}
        onChange={(c) => {
          setPetTemp(c)
          setPetColor(c) // live preview
        }}
      />

      {/* SAVE PET */}
      <div
        onClick={() => {
          if (!isPetDirty) return
          setPetSavePressed(true)
          setTimeout(() => setPetSavePressed(false), 150)

          setPetSaved(petTemp)
          setPetColor(petTemp)

          pushToHistory({ petColor: petTemp })
        }}
        onMouseDown={() => setPetSavePressed(true)}
        onMouseUp={() => setPetSavePressed(false)}
        onMouseLeave={() => setPetSavePressed(false)}
        style={{
          position: "relative",
          width: "100%",
          height: "48px",
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isPetDirty ? "pointer" : "not-allowed",
          opacity: isPetDirty ? 1 : 0.5,
          transform: petSavePressed ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.1s ease"
        }}
      >
        <img
          src={
            !isPetDirty
              ? "/CTA_item_panel_unselected.svg"
              : petSavePressed
              ? "/CTA_item_panel_click.svg"
              : "/CTA_item_panel_unselected.svg"
          }
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            left: 0,
            pointerEvents: "none"
          }}
        />

        <div
          style={{
            position: "relative",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
            width: "100%",
            pointerEvents: "none"
          }}
        >
          ENREGISTRER
        </div>
      </div>
    </div>
  )}

  {/* COLOR PANEL SECTION */}
  {active === "color" && (
    <div style={{ marginTop: "10px", width: "100%" }}>
      <HexColorPicker
        style={{ width: "100%" }}
        color={modelColor}
        onChange={(c) => {
          setModelColor(c)
        }}
      />
      <div style={{ marginTop: "12px", color: "white", fontSize: "14px" }}>
        {modelColor}
      </div>
      <div
        onClick={() => {
          if (!isModelDirty) return
          setSavePressed(true)
          setTimeout(() => setSavePressed(false), 150)

          setModelColor(modelColor)

          pushToHistory({ modelColor })
        }}
        onMouseDown={() => setSavePressed(true)}
        onMouseUp={() => setSavePressed(false)}
        onMouseLeave={() => setSavePressed(false)}
        style={{
          position: "relative",
          width: "100%",
          height: "48px",
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isModelDirty ? "pointer" : "not-allowed",
          opacity: isModelDirty ? 1 : 0.5,
          transform: savePressed ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.1s ease"
        }}
      >
        <img
          src={
            !isModelDirty
              ? "/CTA_item_panel_unselected.svg"
              : savePressed
              ? "/CTA_item_panel_click.svg"
              : "/CTA_item_panel_unselected.svg"
          }
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            top: 0,
            left: 0,
            pointerEvents: "none"
          }}
        />

        <div
          style={{
            position: "relative",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            textAlign: "center",
            width: "100%",
            pointerEvents: "none"
          }}
        >
          ENREGISTRER
        </div>
      </div>
    </div>
  )}
  {active === "stickers" && (
    <div className="panel-section-full-width" style={{ width: "100%", color: "white" }}>
      <div className="panel-section-full-width panel-frame" style={{ padding: "12px 24px", width: "100%", boxSizing: "border-box" }}>
        {/* STICKER 1 */}
        <div style={{}}>Sticker 1</div>
        <div
          onClick={() => {
            const el = document.getElementById("upload-sticker-1")
            if (el) el.click()
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            height: "48px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 0.1s ease"
          }}
        >
          <img
            src="/CTA_item_panel_unselected.svg"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              top: 0,
              left: 0,
              pointerEvents: "none"
            }}
          />
          <div style={{ position: "relative", fontSize: "14px" }}>
            IMPORTER IMAGE
          </div>
        </div>
        <input
          id="upload-sticker-1"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0]
            if (file && window.uploadSticker1) {
              window.uploadSticker1(file)
            }
          }}
        />
        {/* ROTATION 1 */}
        <div style={{ marginBottom: "6px" }}>Rotation</div>
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step="0.01"
          onChange={(e) => {
            if (window.setSticker1Rotation) {
              window.setSticker1Rotation(parseFloat(e.target.value))
            }
          }}
          style={{ width: "100%", marginBottom: "16px" }}
        />
      </div>
      <div className="panel-section-full-width panel-frame" style={{ padding: "12px 24px", marginTop: "12px", width: "100%", boxSizing: "border-box" }}>
        {/* STICKER 2 */}
        <div style={{ marginBottom: "10px" }}>Sticker 2</div>
        <div
          onClick={() => {
            const el = document.getElementById("upload-sticker-2")
            if (el) el.click()
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            height: "48px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 0.1s ease"
          }}
        >
          <img
            src="/CTA_item_panel_unselected.svg"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              top: 0,
              left: 0,
              pointerEvents: "none"
            }}
          />
          <div style={{ position: "relative", fontSize: "14px" }}>
            IMPORTER IMAGE
          </div>
        </div>
        <input
          id="upload-sticker-2"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0]
            if (file && window.uploadSticker2) {
              window.uploadSticker2(file)
            }
          }}
        />
        {/* ROTATION 2 */}
        <div style={{ marginBottom: "6px" }}>Rotation</div>
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step="0.01"
          onChange={(e) => {
            if (window.setSticker2Rotation) {
              window.setSticker2Rotation(parseFloat(e.target.value))
            }
          }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  )}
</div>
    </div>
  )
  
}