# Bitcoin Block Board Music

A local-first creative coding project that turns Bitcoin blocks into playable,
board-generated music in the browser.

![Live demo scene](stream-running.png)

## What this is

This is not just a block explorer with sound effects attached to it. It is a
deterministic music system where block data becomes:

- harmony
- tempo
- rhythmic fingerprint
- lead phrasing
- drone movement
- timbre and texture

The result is part instrument, part sequencer, part data artwork.

## Fastest demo path

1. Run:

```bash
npm start
```

2. Open the cinematic local demo:

`http://localhost:4173/stream.html?demo=1`

3. Open the main composer / analysis view:

`http://localhost:4173`

The demo scene rotates through random historical Bitcoin blocks every 10
seconds. The main view is where you can inspect the score, freeze the live
monitor, step through beats, mute tracks, and export WAVs.

## Desktop launch

Double-click `Bitcoin Block Music.vbs` for the cleanest app-style launch on
Windows.

If you want a visible console while it starts, double-click
`Bitcoin Block Music.cmd` instead.

## Project architecture

The project is easiest to understand as a pipeline:

1. Load a Bitcoin block.
2. Derive a deterministic fingerprint from its metadata and transactions.
3. Map that fingerprint into form, harmony, rhythm, and per-track motion.
4. Render it with browser-side synthetic voices instead of large audio samples.
5. Expose the result through a UI built for auditioning and inspection.

Full notes live in [ARCHITECTURE.md](ARCHITECTURE.md).

## What maps into the sound

- Block height sets the tonal center and large-scale form.
- Transaction ids create the rhythmic fingerprint.
- Detailed transaction data drives lead-note pitch, accents, note length, and dynamics.
- Weight and size shape density and tempo.
- Nonce adds swing and stereo drift.
- Merkle root drives the fast pulse line.
- Previous block hash drives the drone intervals.
- Bits and difficulty color the synthetic timbre.

## Experience features

- Randomized live demo scene for quick portfolio review
- Main workstation UI for block-by-block exploration
- Per-track mute / solo controls
- Freezeable live monitor with beat stepping
- Alternate sound-profile switching
- WAV export
- OBS-style presentation scene

## Sound direction

The synth engine does not use large prerecorded phrases or loop packs. It
generates pulse, triangle, and noise-based voices directly in the browser so
the result stays closer to board-made digital synthesis than a video-game
pastiche.

## Optional OBS scene

If you want the presentational scene on its own:

```bash
npm run broadcast
```

That opens the OBS-ready version described in [OBS_SETUP.md](OBS_SETUP.md).
