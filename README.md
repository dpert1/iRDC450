# NE450-iRDC

Interactive Reference Data Card for NE450

General workflow to create it:
Take the RDC image as an svg and add named boxes to it in inkscape which are invisible but callable by html.
The main page is the index.html (static website). It loads the svg and equations.json and makes every box whose id starts with `prc-` clickable.
Each entry in equations.json is keyed by the box id and holds the popup content (title, equations, variables, description) and an orientation (left or right) based on position in the RDC.
Then when you click on a box, it builds the little callout from that entry.

To add a new equation card:
1. Draw a box over the equation in inkscape and give it an id starting with `prc-` (e.g. `prc-45`).
2. Add an entry with the same `id` to equations.json.

The svg is minified for size (svgo, keeping all ids). The original inkscape file, with layer names and metadata, is in the git history before the minification commit.

The popup engine is `irdc.js` (with `irdc.css`). Both files are identical in all four card repos (iRDC300, iRDC450, iFNEK, iFNEK_C): make a change in one and copy the file unchanged to the other three. Each index.html only sets the card's SVG and data file names (`window.IRDC = { svg: ..., data: ... }`) and any card-specific popup styles.
Hotspots can be reached with Tab and opened with Enter; Esc or a click outside closes the popup. On phones the card scrolls sideways at full size and the popup appears along the bottom of the screen.
