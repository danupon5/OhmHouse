# บ้าน / SITEBOOK

Static 3D architectural reference viewer using Pascal scene snapshot V384.
Serve `dist` with a local HTTP server. All 3D library assets are bundled locally; the optional Thai font falls back to system fonts.

## Measurements

- Wall coordinates are original X/Z endpoints; opening X is measured along the wall from A to B.
- Opening lower/upper levels are center Y minus/plus half the nominal height, relative to the wall's floor datum.
- Dimensions are nominal and not approved rough-opening allowances.
- D09 extends 0.010 m beyond its wall endpoint in the source and is flagged.
- Zone 8 is degenerate and is excluded from mapped room areas.
- Roof surfaces are indicative and are not approved junction or construction geometry.
- The viewer does not modify the Pascal project. Source IDs remain in scene.json.

The UI includes orbit controls, selectable openings, plan, wall/column/room schedules, CSV export, and printable measurement sheets.
