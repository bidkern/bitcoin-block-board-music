const DEFAULT_ROTATION_INTERVAL_MS = 30_000;
const DEMO_ROTATION_INTERVAL_MS = 10_000;
const RECENT_HISTORY_LIMIT = 10;
const pageParams = new URLSearchParams(window.location.search);
const obsMode = pageParams.get("obs") === "1";
const demoMode = pageParams.get("demo") === "1";
const autoStartRequested = pageParams.get("autostart") === "1" && pageParams.get("allow-autostart") === "1";
const requestedIntervalSeconds = Number(pageParams.get("interval"));
const rotationIntervalMs =
  Number.isFinite(requestedIntervalSeconds) && requestedIntervalSeconds > 0
    ? Math.max(1, requestedIntervalSeconds) * 1000
    : demoMode
      ? DEMO_ROTATION_INTERVAL_MS
      : DEFAULT_ROTATION_INTERVAL_MS;
const randomOnlyRotation = demoMode || pageParams.get("random") === "1";
const localCommandSyncEnabled = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);

const els = {
  room: document.querySelector(".broadcast-room"),
  monitorFrame: document.querySelector("#monitorFrame"),
  currentBlockLabel: document.querySelector("#currentBlockLabel"),
  currentDescriptor: document.querySelector("#currentDescriptor"),
  rotationMode: document.querySelector("#rotationMode"),
  nextSwapLabel: document.querySelector("#nextSwapLabel"),
  queueDepthLabel: document.querySelector("#queueDepthLabel"),
  startOverlay: document.querySelector("#startOverlay"),
  startStatus: document.querySelector("#startStatus"),
  startBroadcastButton: document.querySelector("#startBroadcastButton"),
  monitorPowerButton: document.querySelector("#monitorPowerButton"),
  pausedOverlayButton: document.querySelector("#pausedOverlayButton"),
  nextBlockButton: document.querySelector("#nextBlockButton"),
  latestBlockButton: document.querySelector("#latestBlockButton"),
  pauseRotationButton: document.querySelector("#pauseRotationButton"),
  stopBroadcastButton: document.querySelector("#stopBroadcastButton"),
};

const requestedSoundProfile = pageParams.get("sound") || pageParams.get("profile");

if (requestedSoundProfile) {
  const monitorParams = new URLSearchParams({ view: "screen", sound: requestedSoundProfile });
  els.monitorFrame.src = `index.html?${monitorParams.toString()}`;
}

const state = {
  api: null,
  started: false,
  paused: false,
  busy: false,
  rotationPaused: false,
  audioEnabled: false,
  latestHeight: null,
  networkTipHeight: null,
  rotationBaselineTipHeight: null,
  currentSnapshot: null,
  rotationTimerId: null,
  countdownTimerId: null,
  commandPollTimerId: null,
  broadcastCommandRevision: 0,
  nextRotationAt: 0,
  recentHeights: [],
  startReady: false,
};

function setSceneRunning(isRunning) {
  els.room.classList.toggle("is-running", isRunning);
}

function setScenePaused(isPaused) {
  els.room.classList.toggle("is-paused", isPaused);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function setStartStatus(message) {
  els.startStatus.textContent = message;
}

async function fetchBroadcastCommand() {
  if (!localCommandSyncEnabled) {
    throw new Error("Local broadcast sync is only available on localhost.");
  }

  const response = await fetch("/api/broadcast-command", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not read the local broadcast command.");
  }

  return response.json();
}

async function sendBroadcastCommand(command) {
  if (!localCommandSyncEnabled) {
    return { revision: state.broadcastCommandRevision, command };
  }

  const response = await fetch("/api/broadcast-command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }),
  });

  if (!response.ok) {
    throw new Error("Could not send the local broadcast command.");
  }

  return response.json();
}

function announceBroadcastCommand(command) {
  sendBroadcastCommand(command)
    .then((commandState) => {
      if (Number.isFinite(commandState.revision)) {
        state.broadcastCommandRevision = Math.max(state.broadcastCommandRevision, commandState.revision);
      }
    })
    .catch((error) => {
      console.warn("Could not announce broadcast command.", error);
    });
}

function rememberHeight(height) {
  if (!Number.isFinite(height)) {
    return;
  }

  state.recentHeights = [height, ...state.recentHeights.filter((item) => item !== height)].slice(0, RECENT_HISTORY_LIMIT);
}

function updateControls() {
  const canControl = state.started && !state.busy;
  els.startBroadcastButton.disabled = state.busy || (state.started ? true : !state.startReady);
  els.monitorPowerButton.disabled = state.busy || (!state.started && !state.paused && !state.startReady);
  els.monitorPowerButton.setAttribute("aria-pressed", state.started ? "true" : "false");
  els.pausedOverlayButton.disabled = state.busy || !state.paused;
  els.nextBlockButton.disabled = !canControl;
  els.latestBlockButton.disabled = !canControl;
  els.pauseRotationButton.disabled = !canControl;
  els.stopBroadcastButton.disabled = !canControl;
  els.pauseRotationButton.textContent = state.rotationPaused ? "Resume rotation" : "Hold block";
  els.stopBroadcastButton.textContent = state.started && !state.audioEnabled ? "Start audio" : "Pause audio";
}

function getRotationDescription() {
  const intervalSeconds = Math.round(rotationIntervalMs / 1000);

  if (randomOnlyRotation) {
    return `Every ${intervalSeconds}s: random historical block`;
  }

  return `Every ${intervalSeconds}s: new tip or random`;
}

function updateQueueDepth() {
  if (els.queueDepthLabel) {
    els.queueDepthLabel.textContent = state.started
      ? randomOnlyRotation
        ? "Random history"
        : "Tip first, else random"
      : "Standby";
  }
}

function formatCountdown(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateCountdown() {
  if (!state.started) {
    els.nextSwapLabel.textContent = "--:--";
    return;
  }

  if (state.rotationPaused) {
    els.nextSwapLabel.textContent = "Held";
    return;
  }

  if (!state.nextRotationAt) {
    els.nextSwapLabel.textContent = "--:--";
    return;
  }

  els.nextSwapLabel.textContent = formatCountdown(state.nextRotationAt - Date.now());
}

function updateSceneCard(snapshot = state.currentSnapshot) {
  if (!snapshot?.ready) {
    els.currentBlockLabel.textContent = "Loading block...";
    els.currentDescriptor.textContent = "Warming up the generator and pulling in Bitcoin block data.";
  } else {
    els.currentBlockLabel.textContent = `Block #${formatNumber(snapshot.blockHeight)}`;
    els.currentDescriptor.textContent =
      snapshot.descriptor ||
      (snapshot.keyLabel && snapshot.tempo
        ? `${snapshot.keyLabel} at ${snapshot.tempo} BPM.`
        : "The monitor is ready to perform a block.");
  }

  if (!state.started) {
    if (els.rotationMode) {
      els.rotationMode.textContent = state.paused ? "Paused" : "Standby";
    }
  } else if (state.rotationPaused) {
    if (els.rotationMode) {
      els.rotationMode.textContent = "Holding current block";
    }
  } else {
    if (els.rotationMode) {
      els.rotationMode.textContent = getRotationDescription();
    }
  }

  updateQueueDepth();
  updateCountdown();
}

function clearRotationTimers() {
  if (state.rotationTimerId) {
    window.clearTimeout(state.rotationTimerId);
    state.rotationTimerId = null;
  }

  if (state.countdownTimerId) {
    window.clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }

  state.nextRotationAt = 0;
}

function clearCommandPolling() {
  if (state.commandPollTimerId) {
    window.clearInterval(state.commandPollTimerId);
    state.commandPollTimerId = null;
  }
}

async function handleBroadcastCommand(command) {
  if (command === "start" && !state.started && !state.busy) {
    await startBroadcastScene({ fromRemoteStart: true });
    return;
  }

  if (command === "pause" && state.started && !state.busy) {
    await pauseBroadcastScene({ statusMessage: "Paused from the synced controller." });
    return;
  }

  if (command === "stop" && state.started && !state.busy) {
    await stopBroadcastScene({ statusMessage: "Broadcast stopped from the synced controller." });
  }
}

async function pollBroadcastCommand() {
  try {
    const commandState = await fetchBroadcastCommand();

    if (!Number.isFinite(commandState.revision) || commandState.revision <= state.broadcastCommandRevision) {
      return;
    }

    state.broadcastCommandRevision = commandState.revision;
    await handleBroadcastCommand(commandState.command);
  } catch (error) {
    console.warn("Could not sync broadcast command.", error);
  }
}

async function initializeBroadcastCommandSync() {
  if (!localCommandSyncEnabled) {
    return;
  }

  try {
    const commandState = await fetchBroadcastCommand();
    state.broadcastCommandRevision = Number.isFinite(commandState.revision) ? commandState.revision : 0;
  } catch (error) {
    console.warn("Could not initialize broadcast command sync.", error);
  }

  clearCommandPolling();
  state.commandPollTimerId = window.setInterval(() => {
    pollBroadcastCommand().catch(() => {});
  }, 700);
}

function scheduleNextRotation() {
  clearRotationTimers();

  if (!state.started || state.rotationPaused) {
    updateCountdown();
    return;
  }

  state.nextRotationAt = Date.now() + rotationIntervalMs;
  updateCountdown();
  state.countdownTimerId = window.setInterval(updateCountdown, 250);
  state.rotationTimerId = window.setTimeout(() => {
    rotateToNextBlock().catch(handleSceneError);
  }, rotationIntervalMs);
}

function chooseRandomBlockHeight() {
  const upperBound = state.networkTipHeight ?? state.latestHeight;

  if (!Number.isFinite(upperBound) || upperBound < 0) {
    return 0;
  }

  const currentHeight = state.currentSnapshot?.blockHeight ?? null;
  let candidate = currentHeight ?? upperBound;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    candidate = Math.floor(Math.random() * (upperBound + 1));
    if (candidate !== currentHeight && !state.recentHeights.includes(candidate)) {
      return candidate;
    }
  }

  if (upperBound <= 1) {
    return upperBound;
  }

  return currentHeight === 0 ? 1 : 0;
}

async function getLatestTipHeightSafe(fallback = null) {
  try {
    if (state.api?.getLatestTipHeight) {
      const tipHeight = await state.api.getLatestTipHeight();

      if (Number.isFinite(tipHeight)) {
        state.networkTipHeight = tipHeight;
        state.latestHeight = Math.max(state.latestHeight ?? 0, tipHeight);
        return tipHeight;
      }
    }
  } catch (error) {
    console.warn("Could not refresh latest Bitcoin tip height.", error);
  }

  return fallback ?? state.networkTipHeight ?? state.latestHeight ?? state.currentSnapshot?.blockHeight ?? 0;
}

function setRotationBaselineTip(height) {
  if (Number.isFinite(height)) {
    state.rotationBaselineTipHeight = height;
  }
}

async function chooseNextBlockInput() {
  if (randomOnlyRotation) {
    return String(chooseRandomBlockHeight());
  }

  const observedTipHeight = await getLatestTipHeightSafe();
  const baselineTipHeight = state.rotationBaselineTipHeight ?? observedTipHeight;

  if (observedTipHeight > baselineTipHeight) {
    return "";
  }

  return String(chooseRandomBlockHeight());
}

function handleSceneError(error) {
  console.error(error);
  state.rotationPaused = true;
  clearRotationTimers();
  updateControls();
  updateSceneCard();
  setStartStatus(error?.message || "The broadcast scene hit a loading problem.");
}

async function waitForPlayerApi(timeoutMs = 30_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const api = els.monitorFrame.contentWindow?.bitcoinBlockMusic;
    if (api) {
      return api;
    }

    await sleep(125);
  }

  throw new Error("The embedded generator did not finish booting.");
}

async function waitForReadySnapshot(api, timeoutMs = 45_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const snapshot = api.getSnapshot();
    if (snapshot?.ready && !snapshot.loading) {
      return snapshot;
    }

    await sleep(200);
  }

  throw new Error("The generator took too long to fetch a Bitcoin block.");
}

async function ensureLoopingPlayback() {
  const liveSnapshot = state.api.getSnapshot();

  if (liveSnapshot?.ready && liveSnapshot.playing) {
    state.audioEnabled = true;
    state.currentSnapshot = liveSnapshot;
    updateSceneCard(liveSnapshot);
    return liveSnapshot;
  }

  const restarted = await state.api.playCurrent({ loop: true });
  state.audioEnabled = true;
  state.currentSnapshot = restarted || state.api.getSnapshot();
  updateSceneCard(state.currentSnapshot);
  return state.currentSnapshot;
}

async function loadBlockIntoScene(input) {
  const loadedSnapshot = await state.api.loadBlock(input);
  if (!loadedSnapshot?.ready) {
    throw new Error("The next Bitcoin block could not be loaded.");
  }

  state.currentSnapshot = loadedSnapshot;

  if (Number.isFinite(loadedSnapshot.blockHeight)) {
    state.latestHeight = Math.max(state.latestHeight ?? 0, loadedSnapshot.blockHeight);
    rememberHeight(loadedSnapshot.blockHeight);
  }

  updateSceneCard(loadedSnapshot);

  if (!state.audioEnabled) {
    return loadedSnapshot;
  }

  return ensureLoopingPlayback();
}

async function rotateToNextBlock(options = {}) {
  if (!state.started || state.busy) {
    return;
  }

  state.busy = true;
  clearRotationTimers();
  updateControls();

  try {
    const nextInput = options.latest ? "" : await chooseNextBlockInput();
    const snapshot = await loadBlockIntoScene(nextInput);

    if (nextInput === "" && Number.isFinite(snapshot?.blockHeight)) {
      state.networkTipHeight = snapshot.blockHeight;
      state.latestHeight = Math.max(state.latestHeight ?? 0, snapshot.blockHeight);
    }

    setRotationBaselineTip(await getLatestTipHeightSafe(snapshot?.blockHeight ?? null));

    if (!state.rotationPaused) {
      scheduleNextRotation();
    }

    updateSceneCard(snapshot);
  } finally {
    state.busy = false;
    updateControls();
  }
}

async function stopBroadcastScene(options = {}) {
  const { showOverlay = true, statusMessage = "Broadcast stopped. Audio is off." } = options;

  clearRotationTimers();
  state.started = false;
  state.paused = false;
  state.audioEnabled = false;
  state.rotationPaused = false;
  state.rotationBaselineTipHeight = null;
  setSceneRunning(false);
  setScenePaused(false);

  if (state.api?.suspendAudio) {
    await state.api.suspendAudio();
  } else if (state.api?.stop) {
    state.api.stop();
  }

  updateControls();
  updateSceneCard();

  if (showOverlay) {
    els.startBroadcastButton.disabled = false;
    els.startOverlay.classList.remove("is-hidden");
    setStartStatus(statusMessage);
  }
}

async function pauseBroadcastScene(options = {}) {
  const { statusMessage = "Broadcast paused. Click the center pause button or the CRT button to resume." } = options;

  clearRotationTimers();
  state.started = false;
  state.paused = true;
  state.audioEnabled = false;
  state.rotationPaused = false;
  state.rotationBaselineTipHeight = null;
  setSceneRunning(false);
  setScenePaused(true);

  if (state.api?.suspendAudio) {
    await state.api.suspendAudio();
  } else if (state.api?.stop) {
    state.api.stop();
  }

  els.startOverlay.classList.add("is-hidden");
  setStartStatus(statusMessage);
  updateControls();
  updateSceneCard();
}

async function enableAudioInRunningScene() {
  if (!state.started || state.busy || state.audioEnabled) {
    return;
  }

  state.busy = true;
  updateControls();

  try {
    setStartStatus("Unlocking audio...");
    await state.api.unlockAudio();
    await ensureLoopingPlayback();
    updateSceneCard(state.currentSnapshot);
  } finally {
    state.busy = false;
    updateControls();
  }
}

async function startBroadcastScene(options = {}) {
  const { fromAutoStart = false, fromRemoteStart = false, allowVisualOnly = false } = options;

  if (state.started || state.busy) {
    return;
  }

  state.busy = true;
  updateControls();
  els.startBroadcastButton.disabled = true;

  try {
    setStartStatus("Connecting to the embedded generator...");
    state.api = state.api || (await waitForPlayerApi());

    let audioReady = false;

    setStartStatus("Unlocking audio...");
    try {
      await state.api.unlockAudio();
      audioReady = true;
    } catch (error) {
      if (!fromRemoteStart && !allowVisualOnly) {
        throw error;
      }

      console.warn("Could not unlock audio immediately. Continuing with visuals only.", error);
      setStartStatus(
        fromRemoteStart
          ? "Starting synced visuals. Audio still needs a direct OBS interaction."
          : "Starting the live demo visuals. Click Start audio whenever you want to hear the block music."
      );
    }

    setStartStatus("Waiting for the first block to finish loading...");
    const initialSnapshot = await waitForReadySnapshot(state.api);
    state.currentSnapshot = initialSnapshot;
    state.latestHeight = initialSnapshot.blockHeight;
    rememberHeight(initialSnapshot.blockHeight);
    const initialTipHeight = await getLatestTipHeightSafe(initialSnapshot.blockHeight);
    setRotationBaselineTip(initialTipHeight);
    updateSceneCard(initialSnapshot);

    let liveSnapshot = initialSnapshot;

    if (audioReady) {
      setStartStatus("Starting the stream loop...");
      liveSnapshot = await ensureLoopingPlayback();
    } else {
      state.audioEnabled = false;
      liveSnapshot = state.api.getSnapshot() || initialSnapshot;
    }

    state.started = true;
    state.paused = false;
    state.rotationPaused = false;
    rememberHeight(liveSnapshot.blockHeight);
    setRotationBaselineTip(await getLatestTipHeightSafe(liveSnapshot.blockHeight));
    updateControls();
    updateSceneCard(liveSnapshot);
    setSceneRunning(true);
    setScenePaused(false);
    els.startOverlay.classList.add("is-hidden");
    scheduleNextRotation();
  } catch (error) {
    console.error(error);
    setStartStatus(
      fromAutoStart
        ? demoMode
          ? "The live demo loaded, but the browser still needs one click to enable audio."
          : "Auto-start needs one manual click. In OBS, right-click the browser source, choose Interact, and click Start broadcast scene once."
        : fromRemoteStart
          ? "Synced start reached this scene, but audio may need one direct OBS Interact click."
        : error?.message || "The broadcast scene could not start."
    );
    els.startBroadcastButton.disabled = false;
  } finally {
    state.busy = false;
    updateControls();
  }
}

function toggleRotationPause() {
  if (!state.started || state.busy) {
    return;
  }

  state.rotationPaused = !state.rotationPaused;
  updateControls();
  updateSceneCard();

  if (state.rotationPaused) {
    clearRotationTimers();
    return;
  }

  scheduleNextRotation();
}

function toggleBroadcastPlayback() {
  if (state.busy) {
    return;
  }

  if (state.started && !state.audioEnabled) {
    enableAudioInRunningScene().catch(handleSceneError);
    return;
  }

  if (state.started) {
    announceBroadcastCommand("pause");
    pauseBroadcastScene().catch(handleSceneError);
    return;
  }

  announceBroadcastCommand("start");
  startBroadcastScene().catch(handleSceneError);
}

function handleMessage(event) {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.type !== "bitcoin-block-music:snapshot") {
    return;
  }

  const snapshot = event.data.snapshot;
  if (!snapshot) {
    return;
  }

  state.currentSnapshot = snapshot;
  if (Number.isFinite(snapshot.blockHeight)) {
    state.latestHeight = Math.max(state.latestHeight ?? 0, snapshot.blockHeight);
    rememberHeight(snapshot.blockHeight);
  }
  updateSceneCard(snapshot);
}

function handlePageExit() {
  clearRotationTimers();
  clearCommandPolling();

  if (state.api?.suspendAudio) {
    const pending = state.api.suspendAudio();
    if (pending?.catch) {
      pending.catch(() => {});
    }
  } else if (state.api?.stop) {
    state.api.stop();
  }
}

async function bootstrapSceneCard() {
  try {
    setStartStatus("Waiting for the generator to finish loading.");
    state.api = await waitForPlayerApi();
    const snapshot = await waitForReadySnapshot(state.api);
    state.currentSnapshot = snapshot;
    state.latestHeight = snapshot.blockHeight;
    rememberHeight(snapshot.blockHeight);
    state.networkTipHeight = await getLatestTipHeightSafe(snapshot.blockHeight);
    setRotationBaselineTip(state.networkTipHeight);
    state.startReady = true;
    updateSceneCard(snapshot);
    updateControls();

    if (autoStartRequested) {
      setStartStatus("The generator is ready. Attempting to auto-start the broadcast scene...");
      startBroadcastScene({ fromAutoStart: true }).catch(handleSceneError);
      return;
    }

    if (demoMode) {
      setStartStatus("Starting the live demo visuals...");
      startBroadcastScene({ fromAutoStart: true, allowVisualOnly: true }).catch(handleSceneError);
      return;
    }

    setStartStatus("The generator is ready. Click to start the live demo.");
  } catch (error) {
    console.error(error);
    setStartStatus("The generator is still loading. You can try starting again in a moment.");
  }
}

window.addEventListener("message", handleMessage);
window.addEventListener("pagehide", handlePageExit);
window.addEventListener("beforeunload", handlePageExit);

els.startBroadcastButton.addEventListener("click", () => {
  announceBroadcastCommand("start");
  startBroadcastScene().catch(handleSceneError);
});
els.monitorPowerButton.addEventListener("click", toggleBroadcastPlayback);
els.pausedOverlayButton.addEventListener("click", toggleBroadcastPlayback);
els.nextBlockButton.addEventListener("click", () => {
  rotateToNextBlock().catch(handleSceneError);
});
els.latestBlockButton.addEventListener("click", () => {
  rotateToNextBlock({ latest: true }).catch(handleSceneError);
});
els.pauseRotationButton.addEventListener("click", toggleRotationPause);
els.stopBroadcastButton.addEventListener("click", () => {
  if (state.started && !state.audioEnabled) {
    enableAudioInRunningScene().catch(handleSceneError);
    return;
  }

  announceBroadcastCommand("pause");
  pauseBroadcastScene().catch(handleSceneError);
});

updateControls();
updateSceneCard();
document.body.classList.toggle("obs-mode", obsMode);
initializeBroadcastCommandSync().catch(() => {});

if (pageParams.get("preview") === "running") {
  els.startOverlay.classList.add("is-hidden");
  setSceneRunning(true);
} else if (pageParams.get("preview") === "paused") {
  els.startOverlay.classList.add("is-hidden");
  setScenePaused(true);
}

bootstrapSceneCard().catch(handleSceneError);
