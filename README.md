# MONTAGE EXPRESS

MONTAGE EXPRESS website renewal project.

## Seasonal updates

MONTAGE changes its exhibition information twice a year. To avoid editing page markup for every event, the seasonal content is centralized in `site-data.js`.

For each new exhibition, update only the relevant values in `site-data.js`:

- `seasonLabel` — e.g. `37th`
- `themeName` / `themeNameDisplay` — e.g. `Micro Values`
- `themeTagline`
- `eventDateLabel`
- `venueName` / `venueNameShort`
- `venueAddress`
- `conceptLead` / `conceptBody`
- `schedule`
- `themeVisual` — path to the current theme artwork

Theme artwork lives under `assets/`. The layout, animation and responsive behavior should remain unchanged when these values are replaced.

## Current season

- Exhibition: 37th
- Theme: `Micro Values`
- Dates: 2027.02.24 WED - 02.26 FRI
- Venue: Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F
