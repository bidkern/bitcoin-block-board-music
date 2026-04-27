# OBS + X Live Setup

## 1. Start the local broadcast scene

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\launch-broadcast-scene.ps1
```

Or double-click:

```text
Bitcoin Block Music Broadcast.cmd
```

That launches the stream-ready scene on port `4174` by default and copies the OBS browser-source URL to your clipboard:

```text
http://127.0.0.1:4174/stream.html?obs=1
```

## 2. Add it to OBS

In OBS:

1. Create a new scene.
2. Add a **Browser Source**.
3. Use the copied URL above.
4. Set **Width** to `1920` and **Height** to `1080`.
5. Turn on **Control audio via OBS**.
6. Leave **Shutdown source when not visible** off.
7. Leave **Refresh browser when scene becomes active** off.
8. Right-click the source in the OBS preview, choose **Transform > Fit to Screen**.
9. If it still looks zoomed, cropped, or shifted, right-click the source and choose **Transform > Reset Transform**, then **Transform > Fit to Screen** again.

The browser source and OBS canvas should both be `16:9`. Recommended OBS video settings:

- **Base (Canvas) Resolution**: `1920x1080`
- **Output (Scaled) Resolution**: `1920x1080` or `1280x720`
- **Browser Source Width/Height**: `1920x1080`

Right-click the Browser Source, choose **Interact**, and click **Start broadcast scene** once. After that the scene keeps rotating blocks every 30 seconds, switching to the newest mined block when one appears during the interval and otherwise choosing a random block.

You can also click the small physical button on the CRT monitor bezel in the scene to toggle the broadcast music on/off. The regular browser preview and the OBS Browser Source use a local sync command, so clicking start/stop in one should tell the other one to follow after both pages are refreshed.

If OBS does not react after a code change, right-click the Browser Source and choose **Refresh** once.

If the browser source is not `1920x1080`, the scene still works, but the overlay proportions will not match the intended broadcast framing.

## 3. Connect OBS to X

X currently limits Media Studio access to verified subscribers. If your account has access:

1. Go to `https://studio.x.com`.
2. Open **Producer**.
3. Create an **RTMP** source.
4. Copy the **RTMP URL** and **RTMP Stream Key**.
5. In OBS, open **Settings > Stream**.
6. Set **Service** to **Custom**.
7. Paste the RTMP URL into **Server** and the stream key into **Stream Key**.

## 4. Encoder settings that match X's help docs

- Video codec: `H.264/AVC`
- Audio codec: `AAC-LC`
- Audio bitrate: `128 kbps` max
- Resolution / frame rate:
  - `1280x720 @ 60 fps` recommended by X
  - `1920x1080 @ 30 fps` maximum
- Video bitrate:
  - `9 Mbps` recommended
  - `12 Mbps` maximum
- Keyframe interval in OBS: `3 seconds`

If you want the safest starting point, use `1920x1080 @ 30 fps`, CBR around `9000 kbps`, AAC `128 kbps`, and keyframes every `3` seconds.
