# Bitcoin Block Board Music

A zero-dependency browser app that turns Bitcoin blocks into board-generated music.

## Run it

```bash
npm start
```

Then open `http://localhost:4173`.

The app defaults to the original sound. Use the Sound buttons in the composer,
or open `http://localhost:4173/?sound=glass-club`, to try the alternate
clubbier palette without replacing the original.

## Broadcast scene

Open `http://localhost:4173/stream.html` for a stream-ready room scene with the
generator embedded inside a vintage CRT monitor on a wooden desk.

For the broadcast scene with the alternate palette, open
`http://localhost:4173/stream.html?sound=glass-club`.

Click once on the scene to unlock browser audio, then capture that window in
your streaming software.

## OBS launch

Run:

```bash
npm run broadcast
```

Or double-click `Bitcoin Block Music Broadcast.cmd`.

That opens the OBS-ready scene on `http://127.0.0.1:4174/stream.html?obs=1`
and copies the URL to your clipboard so you can drop it straight into an OBS
Browser Source.

Detailed setup steps live in `OBS_SETUP.md`.

## Desktop launch

Double-click `Bitcoin Block Music.vbs` for the cleanest app-style launch on Windows.

If you want a visible console while it starts, double-click `Bitcoin Block Music.cmd` instead.

## What maps into the sound

- Block height sets the tonal center and form.
- Transaction ids create the overall rhythmic fingerprint.
- Detailed transaction data drives lead-note pitch, accents, note length, and dynamics.
- Weight and size shape density and tempo.
- Nonce adds swing and stereo drift.
- Merkle root drives the fast pulse line.
- Previous block hash drives the drone intervals.
- Bits and difficulty color the synthetic timbre.

## Sound direction

The synth engine does not use prerecorded samples. It generates pulse, triangle, and noise voices directly in the browser to keep the result closer to board-made digital synthesis than a video-game pastiche.
