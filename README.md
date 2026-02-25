# Sort Layers by Screen Position (AE ScriptUI Panel)

A dockable After Effects ScriptUI panel that sorts selected layers in the timeline based on their on-screen (comp-space) X/Y position.

Designed for motion/UI workflows where you need predictable ordering (e.g., charts, grids, stacked bars), including a **stable sort** and a **primary-axis bucket mode** that preserves stacking order for layers that share the same column/row.

## Features

- Sort selected layers by **comp-space** position using `toComp()` (respects transforms / parenting / 3D / cameras)
- Choose **Primary axis** (X or Y) + direction (Asc/Desc)
- Choose **Secondary axis** + direction (or auto “other axis”)
- Choose **sampling time** (Current / inPoint / outPoint / 0)
- Choose **reference point**
  - Bounds center when possible (`sourceRectAtTime`) for Text/Shape
  - Fallback to anchorPoint
- **Stable sort** (merge sort) for deterministic results in ExtendScript
- **Preserve stacking within PRIMARY buckets** (ideal for stacked bar segments):
  - Sort by X (or Y) while keeping layers that share the same primary value in their original front-to-back order
- Tie tolerance (pixels)

## Install

1. Download `SortLayersByScreenPosition_v3.1.jsx`
2. Place it here:

**macOS**
`/Applications/Adobe After Effects <version>/Scripts/ScriptUI Panels/`

**Windows**
`C:\Program Files\Adobe\Adobe After Effects <version>\Support Files\Scripts\ScriptUI Panels\`

3. Restart After Effects
4. Open: `Window → Sort Layers by Screen Position v3.1 (Stable)`

## Usage (recommended settings)

### Sort chart columns left → right without breaking stacked segments
- Primary: **X Asc**
- Tie tolerance: **5 px** (adjust as needed)
- ✅ Preserve stacking within PRIMARY buckets: **ON**

### Sort rows top → bottom
- Primary: **Y Asc**
- Preserve stacking within PRIMARY buckets: optional

## Notes / Limitations

- Locked layers cannot be reordered and will be skipped.
- Sorting requires an active Comp and 2+ selected, unlocked layers.
- For very large selections, the temporary Point Control sampling can take a moment (it is removed automatically).

## License

MIT — see LICENSE.

## Credits

Created by <YOUR NAME / HANDLE>.
Inspired by practical chart/UI motion design needs in After Effects.
