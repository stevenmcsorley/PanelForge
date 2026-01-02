# Product Requirements Document (PRD)

## Product Name

**PanelForge** – AIDA64 SensorPanel Simulator

## Purpose

PanelForge is a visual simulator and design tool for creating, testing, and previewing AIDA64 SensorPanel layouts **without requiring AIDA64 or physical hardware**. It enables creators to design professional-grade panels (e.g. Etsy products), validate layouts across resolutions, and simulate live sensor data.

---

## Problem Statement

Designing AIDA64 SensorPanels currently requires:

* AIDA64 running
* A compatible secondary display
* Trial-and-error iteration

This slows down panel creation, makes multi-resolution support painful, and prevents confident previewing before sale.

---

## Goals

### Primary Goals

* Accurately preview SensorPanel layouts at real resolutions
* Simulate live sensor data (temps, loads, RPM, etc.)
* Enable rapid iteration on visual panel design

### Secondary Goals

* Package and export panel bundles for sale
* Reduce buyer support issues by validating layouts pre-sale
* Provide a future path to partial AIDA64 config compatibility

---

## Non-Goals

* Replacing AIDA64
* Reverse-engineering proprietary internals beyond reasonable parsing
* Full hardware sensor access

---

## Target Users

### Primary

* Etsy sellers creating AIDA64 SensorPanel packs
* PC modders / SFF builders

### Secondary

* Homelab dashboard designers
* Stream overlay designers (repurposing panels)

---

## Platform

**Phase 1:** Web app (desktop-first)

* Chrome / Chromium / Edge

**Phase 2 (optional):** Electron desktop app

---

## Core Features (MVP)

### 1. Canvas & Resolution System

* Fixed-resolution canvas modes:

  * 800×480
  * 1024×600
  * 1280×400
  * 1920×480
* Pixel-perfect rendering (no CSS scaling)
* Background image layer (PNG/JPG)
* Safe-area guides (optional)

---

### 2. Widget System

#### Supported Widgets (MVP)

**Text Widget**

* Static text
* Dynamic value binding (e.g. `${cpu_temp}`)
* Font family, size, weight
* Color and opacity
* Alignment and rotation

**Image Widget**

* PNG/JPG (needles, overlays, masks)
* Anchor point control (important for needle rotation)
* Rotation bound to sensor value

**Bar Widget**

* Horizontal / vertical
* Min / max
* Color thresholds

**Radial Segment Widget (Critical)**

* Semi-circular or arc-based segments
* Segment count
* Start / end angle
* Active vs inactive color
* Glow strength

---

### 3. Sensor Simulation Engine

#### Built-in Sensors

* cpu_temp
* gpu_temp
* cpu_load
* gpu_load
* ram_usage
* fan_rpm
* power_watts

#### Simulation Modes

* Static value
* Sine wave
* Random walk
* Manual slider
* Timeline playback (JSON/CSV)

#### Update Rate

* Configurable (250ms, 500ms, 1000ms)

---

### 4. Data Binding & Expressions

#### Value Binding

* `${sensor}`
* `${sensor|round}`
* `${sensor|fixed(1)}`

#### Conditional Styling

```
if cpu_temp > 80 then color = red
if cpu_temp > 90 then glow = strong
```

---

### 5. Layout Tools

* Drag / drop positioning
* Snap to grid
* Nudge via keyboard
* Z-order control
* Lock layers
* Duplicate widgets

---

### 6. Export System

#### Exports

* PNG render (exact resolution)
* Bundle ZIP:

  * /backgrounds
  * /overlays
  * panel.json
  * preview.png

---

## Data Model (Simplified)

```json
{
  "canvas": {
    "width": 1024,
    "height": 600
  },
  "widgets": [
    {
      "type": "text",
      "x": 120,
      "y": 90,
      "binding": "cpu_temp",
      "format": "{value}°C"
    }
  ]
}
```

---

## Architecture (Recommended)

* **Frontend:** React
* **Rendering:** Konva.js (Canvas abstraction)
* **State:** Zustand or Redux Toolkit
* **Expressions:** Lightweight interpreter (custom or eval-safe)

---

## UX Principles

* Everything should feel *instrument-grade*
* No responsive scaling (pixel precision only)
* Dark-UI by default
* No gamified visuals

---

## Future Features (Post-MVP)

* Multi-resolution sync editing
* AIDA64 config import (best-effort)
* Theme system
* Template marketplace
* Animation easing curves

---

## Risks & Constraints

* AIDA64 config formats may change
* Expression evaluation must be sandboxed
* Performance on very large panels

---

## Success Metrics

* Panel designers can complete a full layout without AIDA64
* Zero-guess preview for Etsy listings
* Reduced iteration time (>50%)

---

## Next Steps

1. Approve MVP scope
2. Choose Web vs Electron
3. Scaffold repo
4. Implement canvas + text widget
5. Add sensor simulation

---

**Status:** Draft
