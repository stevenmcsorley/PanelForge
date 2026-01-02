# PanelForge

A desktop-first web application for designing, previewing, and simulating AIDA64 SensorPanel layouts without running AIDA64 or owning hardware.

## Features

- **Pixel-Perfect Canvas**: Fixed-size canvas at exact resolutions (800×480, 1024×600, 1280×400, 1920×480)
- **Widget Types**:
  - **TextWidget**: Static or sensor-bound text with formatting support
  - **ImageWidget**: Images with optional rotation binding for gauge needles
  - **ImageSequenceWidget**: AIDA64-compatible frame-based gauges
  - **ImageTransformWidget**: Rotating images (needles, fans)
  - **MaskedImageWidget**: Progress bars and LED arcs
  - **RadialSegmentWidget** *(deprecated)*: Arc-based segment gauges
- **Sensor Simulation**: Built-in simulation engine with multiple modes:
  - Static value
  - Sine wave oscillation
  - Random walk with momentum
  - Manual slider control
- **Layout Tools**: Drag/drop, keyboard nudging, z-order control, lock/unlock
- **Export**: PNG image export and JSON config export/import

## Tech Stack

- React 18 (TypeScript)
- Konva.js (canvas rendering via react-konva)
- Zustand (state management)
- Vite (build tooling)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Folder Structure

```
src/
├── components/
│   ├── canvas/          # Konva canvas component
│   ├── widgets/         # Widget renderers (Text, Image, RadialSegment)
│   ├── editor/          # Editor panels (settings, properties, sensors)
│   └── ui/              # Reusable UI components
├── stores/              # Zustand state stores
│   ├── canvasStore.ts   # Canvas settings (resolution, background, grid)
│   ├── widgetStore.ts   # Widget CRUD and selection
│   └── sensorStore.ts   # Sensor values and simulation state
├── engine/              # Sensor simulation engine
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions (formatting, export)
└── assets/              # Static assets
```

## Usage Guide

### Creating Widgets

1. Click **+ Text**, **+ Image**, or **+ Radial** in the Widgets panel
2. Select the widget on canvas or in the list
3. Edit properties in the Properties panel

### Binding Sensors

1. Select a widget
2. In Properties, choose a sensor from the "Sensor Binding" dropdown
3. Configure the format string (for text) or value mapping (for gauges)

### Format Strings

Text widgets support format strings for sensor values:

- `{value}` - Raw value
- `{value|round}` - Rounded to integer
- `{value|fixed(2)}` - Fixed decimal places
- `{value|floor}` - Floor value
- `{value|ceil}` - Ceiling value

Example: `CPU: {value|round}°C`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow Keys | Nudge widget 1px |
| Shift + Arrows | Nudge widget 10px |
| Delete/Backspace | Remove selected widget |
| Ctrl+C | Copy widget |
| Ctrl+V | Paste widget |
| Ctrl+D | Duplicate widget |
| Ctrl+L | Toggle lock |
| Ctrl+] | Bring forward |
| Ctrl+[ | Send backward |
| Ctrl+Shift+] | Bring to front |
| Ctrl+Shift+[ | Send to back |

### Exporting

- **Export PNG**: Renders the canvas at exact resolution
- **Export JSON**: Saves complete panel configuration
- **Import JSON**: Load a previously saved configuration

## Example Panels

- `examples/demo-panel.json` - Basic panel configuration
- `examples/aida64-demo-panel.json` - Advanced AIDA64-style panel
- `examples/image-sequence-demo-panel.json` - ImageSequenceWidget demonstration

Import any example using the "Import JSON Config" button.

## AIDA64 Gauge Types

### Procedural Gauges (Deprecated)

RadialSegmentWidget draws arcs procedurally using vector graphics. This does **not** match AIDA64's actual behavior and is deprecated.

### AIDA64-Compatible Gauges (Recommended)

AIDA64 uses frame-based animation for custom gauges:

1. **ImageSequenceWidget** - The primary method
   - Import an ordered sequence of frame images
   - Each frame represents a discrete gauge state
   - Frame selection: `frameIndex = floor(normalized × (frameCount - 1))`
   - Matches AIDA64's exact behavior

2. **ImageTransformWidget** - For rotating elements
   - Needles, fan blades, rotating indicators
   - Uses pivot point and angle mapping

3. **MaskedImageWidget** - For progress/level indicators
   - LED arcs, progress bars, level meters
   - Crops image based on sensor value

### Preparing Frame Sequences

To create AIDA64-compatible gauge frames:

1. Design your gauge in your preferred image editor
2. Export frames numbered sequentially (e.g., `frame01.png` to `frame20.png`)
3. Select all frames and import them into ImageSequenceWidget
4. Set min/max values to match your sensor range

## Built-in Sensors

| Key | Label | Unit | Range |
|-----|-------|------|-------|
| cpu_temp | CPU Temperature | °C | 20-100 |
| gpu_temp | GPU Temperature | °C | 20-100 |
| cpu_load | CPU Load | % | 0-100 |
| gpu_load | GPU Load | % | 0-100 |
| ram_usage | RAM Usage | % | 0-100 |
| fan_rpm | Fan RPM | RPM | 0-5000 |

## Simulation Modes

- **Static**: Fixed value, set by slider
- **Sine Wave**: Oscillates between offset ± amplitude at configurable frequency
- **Random Walk**: Moves randomly with momentum, bounces at boundaries
- **Manual**: Direct slider control, pauses automatic updates

## License

MIT
