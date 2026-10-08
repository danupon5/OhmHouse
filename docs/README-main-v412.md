# Main index — Blender STABLE v412

index.html uses the same GLB as index2.html, with the previous site features: opening selection, labels, wall/column/roof layers, 2D plan, selected/all dimensions, dimension filters, plan zoom, tables, CSV, printing and PNG capture.

The complete previous site is preserved at old-version/ with its own JS, JSON, styles and dependencies.

scene-v412.json measures opening outer frames (excluding hardware) and columns from Blender. Sill/head heights use FFL = +0.500 m above the model ground datum. Wall axes use Blender transforms with the original Pascal axis lengths; slab and room polygons remain model boundaries, not net finished areas. Original opening IDs and web codes are retained.

D09 remains 0.010 m beyond its wall axis endpoint and is flagged in the UI and CSV.

The original Blender SHA-256 is recorded in both scene-v412.json and home102-viewer/assets/model-info.json. measurement-report.json lists the extracted opening dimensions.

Run python3 -m http.server 5178 --bind 127.0.0.1, then visit /index.html.
