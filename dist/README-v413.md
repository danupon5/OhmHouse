# Home102 — Blender v413

Updated scene snapshot, 8 October 2026 (Asia/Bangkok).

- Blender source: `บ้านชั้นเดียว_3ห้องนอน_v413.blend`
- Portable model: `home102-viewer/assets/house-stable-v413.glb`
- Export manifest and source SHA-256: `home102-viewer/assets/model-info-v413.json`
- Electrical device quantities: `ELECTRICAL-DEVICES-v413.md`

Includes 28 light fixtures, nine switch panels with 23 controls including one dining-light reserve, outlets and TV antenna point, dedicated connection boxes, CCTV power boxes at P2/P3, and an 18-branch-circuit consumer-unit enclosure with its center 2.20 m above the room floor. The planned allocation uses 16 circuits and reserves two. Enclosure dimensions, cable sizes and protection ratings are preliminary.

Electrical routing now uses shared service corridors towards the bedrooms, kitchen and front/TV wall, with accessible covered local wireways and short concealed wall drops. The previous two electrical route collections were deleted. Circuits retain separate L/N/PE designations. Concealed services and viewport helper lines are hidden in the Blender inspection view. The model shows routing intent, not installed wiring or a construction-approved design.

The kitchen sink remains 1.20 m long, was moved and reversed so its bowls are on the right when facing the counter, has a new faucet, and the former countertop opening was closed. Outdoor water points include the washer, kitchen, C1, P2, the bedroom-window edge near C3, and the right side near C14. Water supply mains follow ground level beside the perimeter beams; indoor branches feed the kitchen sink and both bathrooms.

Wastewater branches serve each bathroom basin, floor drain beside the toilet and shower zone. They exit the wall, drop straight into the ground and end behind the house, awaiting a separate treatment/disposal design. The kitchen wastewater exits the wall and drops straight into the ground, with its temporary endpoint to the right. These endpoints are not connected to a completed treatment system.

Sanitary equipment includes a buried septic-tank model and soakaway, provisional toilet drains, an external cleanout, two exterior bathroom vent risers and a separate provisional tank vent extending above the roof. Verify pipe slopes, traps, vent connections, actual tank ports, treatment capacity and soil conditions before construction.

Other equipment includes a 1000 L / 1.8 m clean-water tank, two filters and pump, washing machine, and two-tier altar. The GLB includes hidden services, furniture and roofs for a complete portable snapshot. Blender switch drivers remain in the source file and are not interactive controls in GLB. The main index in dist now loads the v413 snapshot and scene metadata, with independent visibility controls for furniture, kitchen, appliances, bathroom fixtures, lights, electrical devices, water equipment and service routes. Concealed service routes start hidden. The alternate index2 viewer remains on v412.
