# Home102 — Blender v413

Updated scene snapshot, 15 October 2026 (Asia/Bangkok). Changes since 8 October are listed at the end.

- Blender source: `บ้านชั้นเดียว_3ห้องนอน_v413.blend`
- Portable model: `home102-viewer/assets/house-stable-v413.glb`
- Export manifest and source SHA-256: `home102-viewer/assets/model-info-v413.json`
- Electrical device quantities: `ELECTRICAL-DEVICES-v413.md`

Includes 37 light points (9 dome lights, 13 downlights including six in the front-yard ceiling, 8 wall lights including two beside the main door, 2 linear bars, 2 bedroom pendants and a 3-head dining pendant), eleven switch panels with 28 controls, outlets and TV antenna point, dedicated connection boxes, CCTV power boxes at P2/P3, and an 18-branch-circuit consumer-unit enclosure with its center 2.20 m above the room floor. The planned allocation uses 16 circuits and reserves two. Enclosure dimensions, cable sizes and protection ratings are preliminary.

Electrical routing now uses shared service corridors towards the bedrooms, kitchen and front/TV wall, with accessible covered local wireways and short concealed wall drops. The previous two electrical route collections were deleted. Circuits retain separate L/N/PE designations. Concealed services and viewport helper lines are hidden in the Blender inspection view. The model shows routing intent, not installed wiring or a construction-approved design.

The kitchen sink remains 1.20 m long, was moved and reversed so its bowls are on the right when facing the counter, has a new faucet, and the former countertop opening was closed. Outdoor water points are the washer, P2, the bedroom-window edge near C3, and the right side near C14 (the kitchen-window and C1 faucets were removed on 13 October). Water supply mains follow ground level beside the perimeter beams; indoor branches feed the kitchen sink and both bathrooms.

Wastewater branches serve each bathroom basin, floor drain beside the toilet and shower zone. They exit the wall, drop straight into the ground and end behind the house, awaiting a separate treatment/disposal design. The kitchen wastewater exits the wall and drops straight into the ground, with its temporary endpoint to the right. These endpoints are not connected to a completed treatment system.

Sanitary equipment includes a buried septic-tank model and soakaway, provisional toilet drains, an external cleanout, two exterior bathroom vent risers and a separate provisional tank vent extending above the roof. Verify pipe slopes, traps, vent connections, actual tank ports, treatment capacity and soil conditions before construction.

Other equipment includes a 1000 L / 1.8 m clean-water tank, two filters and pump, washing machine, and two-tier altar. The GLB includes hidden services, furniture and roofs for a complete portable snapshot. Blender switch drivers remain in the source file and are not interactive controls in GLB. The main index now loads the v413 snapshot and scene metadata, with independent visibility controls for furniture, kitchen, appliances, bathroom fixtures, lights, electrical devices, water equipment and service routes. Concealed service routes start hidden. The alternate index2 viewer remains on v412.

## Changes on 13-14 October 2026

- Ceilings added for the covered terraces at C3-P3-C9-C10 (8.65 m2) and C11-C12-C14-P4 (6.05 m2) at +3.49 m; their east edge stops at x = 12.73 where the roof soffit meets that level.
- Windows W7, W8 and W10 are 1.10 m high (sill 1.00 m, head unchanged at +2.10 m above the floor).
- Kitchen-window and C1 outdoor faucets removed, together with the C2-C1 water pipe that only fed C1.
- Dining pendant added: three smoked-glass heads on a 1.10 m black canopy over the dining table, fed from the dining-light reserve box.
- Living-room dome lights 1 and 3 moved to x = 8.25 (y = 7.20 and 10.75), midway between the downlights; their conduits and drops were re-routed.
- Bedroom 2 air-conditioner junction box moved above the 2.00 m east window (W8), right-hand end, and its feed re-routed.
- TV antenna added on the east eave edge in line with post P4: UHF Yagi (1.50 m boom, 13 elements) on a bent black 42 mm pipe clamped to the roof edge; RG6 coax (about 11.4 m) runs through the pipe, under the roof edge, up through the terrace ceiling and above the ceilings to the TV antenna point in the living-room south wall. Earthing and lightning protection are not modelled.
- Bathroom 2 light switch moved outside the bathroom (living-room side) and a second switch added on the bedroom 2 side, wired as two-way control of the same lights.
- Drawings (drawings_v413), BOQ (BOQ_ปริมาณงาน_v413.xlsx) and the 3D overview documents (house_overview_v413) were regenerated from this state.
- Known model issue: the dining table, benches and sofa float about 0.2-0.3 m above the finished floor.

## Changes on 15 October 2026

- Front-yard lighting: the two yard dome lights were replaced by six downlights on the ceiling centreline (3 + 3 groups); the yard ceiling is now a wood-look ribbed ceiling (WPC / metal sheet, planks running east-west) 4.03 x 9.04 m (about 36.4 m2), extended to the bedroom-1 wall.
- Two black rectangular up/down wall lights (12 W per face) added on the yard side of the main double door, one each side.
- The 3-button switch beside C15 (inside) now has a matching 3-button two-way switch outside on the front wall, above the yard outlet (weatherproof IP55); all three buttons are two-way. Button 1/2 = yard downlights (3 + 3), button 3 = wall lights (P1, P2, south wall, beside the door).
- Gable vents removed from the west and south gables (all four). Copies are kept in `backups/gable_vents_removed_reusable.blend` (append to restore).
- Drawings (A-00 to A-10), BOQ and the 3D overview documents regenerated; `scripts/export_model_data_v413.py` re-exports the drawing data from the open Blender file. The GLB snapshot was not re-exported.
- Dining pendant (3 heads) is now switched by button 3 of the 3-button switch outside the storage room (previously its lights were wrongly driven by the bedroom-1 button 3, and that button was marked spare). `drawings_v413` sheet A-11 shows each switch button with the lights it controls.

## Web snapshot and BOQ publication - 15 October 2026

Both index and overview now use a fresh export of the scene actually open in Blender. The export manifest records the source and snapshot hashes. Three updated windows are 1.10 m high; installation metadata was measured from the same snapshot. `boq.html` uses 99 recalculated rows from the latest local BOQ summary, with the unchanged source workbook available for download. Purchase checks are browser-local.
