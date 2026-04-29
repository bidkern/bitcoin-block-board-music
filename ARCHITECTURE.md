# Architecture

`Bitcoin Block Board Music` is a local-first creative coding project that turns
Bitcoin block data into a playable, inspectable music system inside the browser.

## System shape

1. `server.js`
   Serves the static app locally and exposes a small local-only broadcast command
   endpoint used by the OBS-style scene.

2. `app.js`
   Holds the main runtime:
   - block loading and normalization
   - musical fingerprint generation
   - sequencer and harmonic composition
   - synth voice scheduling
   - live monitor state
   - transport, keyboard shortcuts, mute/solo, and WAV export

3. `index.html` + `styles.css`
   The primary workstation UI where a block is loaded, interpreted, auditioned,
   and inspected beat by beat.

4. `stream.html` + `stream.js` + `stream.css`
   A presentation layer for the project. This wraps the core app inside a more
   cinematic "broadcast" scene so the project reads immediately as a demo, not
   just as a utility UI.

## Data-to-music pipeline

1. Fetch a Bitcoin block
   The app loads a block either by height, hash, or the latest tip.

2. Build a deterministic fingerprint
   The block is reduced into musical seeds derived from:
   - block height
   - transaction ids and counts
   - weight and size
   - nonce
   - merkle root
   - previous block hash
   - bits / difficulty
   - fee behavior and miner identity

3. Map fingerprint to composition
   Those seeds drive:
   - tonal center and mode
   - tempo and density
   - harmonic frame
   - rhythmic subdivisions
   - lead movement
   - pulse and drone behavior
   - swing, drift, accents, and timbral variation

4. Render with board-like synthesis
   The piece is generated directly in the browser rather than played from large
   prerecorded samples. The sound engine leans on simple synthetic building
   blocks so the result stays closer to hardware-era generated sound than a DAW
   track made from loops.

5. Expose the result for inspection
   The UI is not just a player. It is also an analysis surface:
   - per-track mute and solo
   - live monitor freeze
   - beat stepping
   - sequencer click-to-inspect
   - alternate sound profiles
   - WAV export

## Why the architecture matters

This project is interesting as a portfolio piece because it combines several
disciplines in one runnable system:

- creative coding
- deterministic generative design
- data visualization
- audio synthesis in the browser
- UI/UX for exploration rather than CRUD
- presentation-layer thinking for demos and storytelling

## Best way to show it

For review, the best path is usually:

1. Launch the local app.
2. Open `stream.html?demo=1` for the cinematic overview.
3. Open the main composer view to show the inspectable system behind it.
4. Pair that with a short screen recording or GIF so a recruiter can understand
   the project in seconds.
