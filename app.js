const API_BASE = "https://mempool.space/api";
const API_V1_BASE = `${API_BASE}/v1`;
const FALLBACK_API_BASE = "https://blockstream.info/api";
const MAX_DETAILED_TXS = 100;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const DUTY_OPTIONS = [0.125, 0.25, 0.375, 0.5];
const SCALE_LIBRARY = [
  { name: "Aeolian", degrees: [0, 2, 3, 5, 7, 8, 10] },
  { name: "Dorian", degrees: [0, 2, 3, 5, 7, 9, 10] },
  { name: "Minor pentatonic", degrees: [0, 3, 5, 7, 10] },
  { name: "Suspended minor", degrees: [0, 3, 5, 7, 10] },
  { name: "Mixolydian", degrees: [0, 2, 4, 5, 7, 9, 10] },
];

const TRACK_DEFS = [
  { id: "drone", name: "Drone", role: "Reward + miner imprint", color: "#a6ba8d" },
  { id: "bass", name: "Bass", role: "Height + fee weight", color: "#6d906c" },
  { id: "lead", name: "Lead", role: "Transactions + fee bursts", color: "#e2c89b" },
  { id: "arp", name: "Pulse", role: "Merkle + template motion", color: "#c48765" },
  { id: "drums", name: "Noise", role: "Nonce + audit glitches", color: "#8fa59a" },
];
const TRACK_MIX = {
  drone: { trim: 1 },
  bass: { trim: 0.96 },
  lead: { trim: 0.72 },
  arp: { trim: 0.82 },
  drums: { trim: 0.9 },
};
const TRACK_LOOKUP = Object.fromEntries(TRACK_DEFS.map((track) => [track.id, track]));
const DEFAULT_SOUND_PROFILE_ID = "original";
const SOUND_PROFILES = {
  original: {
    id: "original",
    label: "Original",
    emptyDescriptor:
      "A darker, board-made digital score: minimal, synthetic, and shaped by the chain instead of a fixed song file.",
    dnaDetail: "Pulse, triangle, and noise voices stay close to the original board-made score.",
    mix: {
      masterGain: 0.8,
      filterFrequency: 8200,
      filterQ: 1,
      compressorThreshold: -18,
      compressorRatio: 2.5,
      delayTime: 0.16,
      feedbackGain: 0.2,
      delayMix: 0.16,
    },
  },
  "glass-club": {
    id: "glass-club",
    label: "Glass club",
    emptyDescriptor:
      "A cleaner alternate palette with glassy plucks, rounder low end, tight drums, and a wider delay tail.",
    dnaDetail: "Resonant plucks, bass bends, crisp hats, and clubbier delay reshape the same block data without heavy grit.",
    mix: {
      masterGain: 0.64,
      filterFrequency: 9600,
      filterQ: 0.82,
      compressorThreshold: -24,
      compressorRatio: 3.1,
      delayTime: 0.215,
      feedbackGain: 0.24,
      delayMix: 0.18,
    },
  },
};
const SOUND_PROFILE_ALIASES = {
  alt: "glass-club",
  alternate: "glass-club",
  club: "glass-club",
  glass: "glass-club",
  "glass club": "glass-club",
  glassclub: "glass-club",
  reel: "glass-club",
};
const SOUND_PROFILE_IDS = Object.keys(SOUND_PROFILES);
const DEFAULT_FX_SIGNATURE = {
  characterId: "neutral",
  label: "Neutral circuit",
  detail: "Balanced delay, clean filter, and steady drum tuning.",
  drive: 0.18,
  space: 0.28,
  motion: 0.2,
  grit: 0.12,
  sub: 0.36,
  air: 0.46,
  wobble: 0.18,
  gate: 0.34,
  snap: 0.42,
  leadWave: "sawtooth",
  arpWave: "pulse",
  droneWave: "triangle",
};
const FX_CHARACTER_LIBRARY = [
  {
    id: "dry",
    label: "Dry circuit",
    detail: "Short room, tight envelope, and mostly clean transients.",
    leadWave: "pulse",
    arpWave: "pulse",
    droneWave: "triangle",
  },
  {
    id: "wide",
    label: "Wide echo",
    detail: "Longer delay tails, softer edges, and wider stereo throws.",
    leadWave: "sine",
    arpWave: "triangle",
    droneWave: "sawtooth",
  },
  {
    id: "hot",
    label: "Hot drive",
    detail: "More saturation, sharper resonance, and harder drum fronts.",
    leadWave: "sawtooth",
    arpWave: "square",
    droneWave: "sawtooth",
  },
  {
    id: "sub",
    label: "Sub pressure",
    detail: "Lower kick bend, heavier bass support, and darker high end.",
    leadWave: "triangle",
    arpWave: "pulse",
    droneWave: "sine",
  },
  {
    id: "glass",
    label: "Glass top",
    detail: "Bright resonant plucks, extra air, and snappy metallic hats.",
    leadWave: "sine",
    arpWave: "sine",
    droneWave: "triangle",
  },
  {
    id: "warped",
    label: "Warped tape",
    detail: "More detune drift, uneven filter motion, and smeared echoes.",
    leadWave: "sawtooth",
    arpWave: "triangle",
    droneWave: "sawtooth",
  },
];

const els = {
  appShell: document.querySelector(".app-shell"),
  blockForm: document.querySelector("#blockForm"),
  blockInput: document.querySelector("#blockInput"),
  latestButton: document.querySelector("#latestButton"),
  playButton: document.querySelector("#playButton"),
  stopButton: document.querySelector("#stopButton"),
  exportWavButton: document.querySelector("#exportWavButton"),
  downloadButton: document.querySelector("#downloadButton"),
  loadButton: document.querySelector("#loadButton"),
  status: document.querySelector("#status"),
  transportState: document.querySelector("#transportState"),
  blockMeta: document.querySelector("#blockMeta"),
  liveReadout: document.querySelector("#liveReadout"),
  liveVoiceChips: document.querySelector("#liveVoiceChips"),
  liveNarrative: document.querySelector("#liveNarrative"),
  prevBeatButton: document.querySelector("#prevBeatButton"),
  nextBeatButton: document.querySelector("#nextBeatButton"),
  freezeMonitorButton: document.querySelector("#freezeMonitorButton"),
  dnaGrid: document.querySelector("#dnaGrid"),
  mappingList: document.querySelector("#mappingList"),
  transactionList: document.querySelector("#transactionList"),
  txSampleInfo: document.querySelector("#txSampleInfo"),
  sequencer: document.querySelector("#sequencer"),
  scoreCaption: document.querySelector("#scoreCaption"),
  clearSolosButton: document.querySelector("#clearSolosButton"),
  unmuteAllButton: document.querySelector("#unmuteAllButton"),
  heroDescriptor: document.querySelector("#heroDescriptor"),
  soundProfileSwitch: document.querySelector("#soundProfileSwitch"),
  soundProfileCurrentLabel: document.querySelector("#soundProfileCurrentLabel"),
  soundProfileNextLabel: document.querySelector("#soundProfileNextLabel"),
  soundProfileButtons: document.querySelectorAll("[data-sound-profile]"),
  presetButtons: document.querySelectorAll(".preset-button"),
};

const pageParams = new URLSearchParams(window.location.search);
const viewMode = pageParams.get("view");
const isMonitorView = viewMode === "monitor";
const isScreenView = viewMode === "screen";

function normalizeSoundProfileId(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (SOUND_PROFILES[normalized]) {
    return normalized;
  }

  return SOUND_PROFILE_ALIASES[normalized] || DEFAULT_SOUND_PROFILE_ID;
}

function getSoundProfile(value) {
  return SOUND_PROFILES[normalizeSoundProfileId(value)];
}

const state = {
  loading: false,
  exporting: false,
  blockPackage: null,
  composition: null,
  soundProfileId: normalizeSoundProfileId(pageParams.get("sound") || pageParams.get("profile")),
  currentStep: -1,
  liveMonitorFrozen: false,
  liveMonitorFrame: null,
  lastPlaybackFrame: null,
  lastSnapshotSignature: "",
};

let screenViewLayoutFrame = 0;

class BoardMusicEngine {
  constructor(onStepChange) {
    this.onStepChange = onStepChange;
    this.audioContext = null;
    this.renderState = null;
    this.schedulerId = null;
    this.finalizeId = null;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.playQueue = [];
    this.queueIndex = 0;
    this.loopQueue = true;
    this.isPlaying = false;
    this.mutedTracks = new Set();
    this.soloTracks = new Set();
  }

  async ensureAudio() {
    if (!this.audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextCtor();
      this.renderState = this.createRenderState(this.audioContext, this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async suspendAudio() {
    this.stop();

    if (this.audioContext && this.audioContext.state === "running") {
      await this.audioContext.suspend();
    }
  }

  createRenderState(audioContext, destination) {
    const master = audioContext.createGain();
    master.gain.value = 0.8;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 8200;

    const drive = audioContext.createWaveShaper();
    drive.curve = this.createDriveCurve(0);
    drive.oversample = "2x";

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 2.5;

    const delay = audioContext.createDelay(0.4);
    delay.delayTime.value = 0.16;

    const feedback = audioContext.createGain();
    feedback.gain.value = 0.2;

    const delayMix = audioContext.createGain();
    delayMix.gain.value = 0.16;

    master.connect(drive);
    drive.connect(filter);
    filter.connect(compressor);
    compressor.connect(destination);
    compressor.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayMix);
    delayMix.connect(destination);

    return {
      audioContext,
      master,
      drive,
      filter,
      compressor,
      delay,
      feedback,
      delayMix,
      noiseBuffer: this.createNoiseBuffer(audioContext),
      waveCache: new Map(),
    };
  }

  createDriveCurve(amount = 0) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    const driveAmount = clamp(amount, 0, 1);
    const k = driveAmount * 90;

    for (let index = 0; index < samples; index += 1) {
      const x = (index * 2) / samples - 1;
      curve[index] = driveAmount < 0.001 ? x : ((1 + k) * x) / (1 + k * Math.abs(x));
    }

    return curve;
  }

  setAudioParam(param, value, time = 0) {
    if (!param || !Number.isFinite(value)) {
      return;
    }

    const safeTime = Math.max(0, time);
    if (typeof param.setTargetAtTime === "function") {
      param.setTargetAtTime(value, safeTime, 0.018);
    } else {
      param.value = value;
    }
  }

  configureRenderState(renderState, composition, time = 0) {
    const profile = getSoundProfile(composition?.soundProfileId);
    const fx = composition?.fx || DEFAULT_FX_SIGNATURE;
    const mix = profile.mix;
    const fxDepth = profile.id === "glass-club" ? 1 : 0.55;
    const driveAmount = clamp((profile.id === "glass-club" ? 0.012 : 0.006) + (fx.drive * 0.1 + fx.grit * 0.035) * fxDepth, 0, 0.18);
    const filterFrequency = clamp(mix.filterFrequency * (0.7 + fx.air * 0.42 + fx.motion * 0.08), 900, 12_500);
    const delayTime = clamp(mix.delayTime * (0.62 + fx.space * 1.08) + fx.motion * 0.02, 0.045, 0.31);
    const feedbackGain = clamp(mix.feedbackGain + (fx.space * 0.13 + fx.grit * 0.025) * fxDepth, 0.04, 0.42);
    const delayMix = clamp(mix.delayMix + fx.space * 0.12 * fxDepth, 0.035, 0.34);
    const signatureKey = [
      profile.id,
      fx.characterId,
      driveAmount.toFixed(3),
      filterFrequency.toFixed(1),
      delayTime.toFixed(3),
      feedbackGain.toFixed(3),
      delayMix.toFixed(3),
    ].join(":");

    if (renderState.fxSignatureKey !== signatureKey) {
      renderState.drive.curve = this.createDriveCurve(driveAmount);
      renderState.fxSignatureKey = signatureKey;
    }

    this.setAudioParam(renderState.master.gain, mix.masterGain * (1 - driveAmount * 0.08), time);
    this.setAudioParam(renderState.filter.frequency, filterFrequency, time);
    this.setAudioParam(renderState.filter.Q, mix.filterQ + (fx.motion * 0.9 + fx.grit * 0.45) * fxDepth, time);
    this.setAudioParam(renderState.compressor.threshold, mix.compressorThreshold - driveAmount * 3, time);
    this.setAudioParam(renderState.compressor.ratio, mix.compressorRatio + fx.drive * 0.45 * fxDepth, time);
    this.setAudioParam(renderState.delay.delayTime, delayTime, time);
    this.setAudioParam(renderState.feedback.gain, feedbackGain, time);
    this.setAudioParam(renderState.delayMix.gain, delayMix, time);
  }

  createNoiseBuffer(audioContext) {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1.5, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  getPulseWave(renderState, dutyCycle) {
    const key = dutyCycle.toFixed(3);

    if (!renderState.waveCache.has(key)) {
      const harmonics = 48;
      const real = new Float32Array(harmonics + 1);
      const imag = new Float32Array(harmonics + 1);

      for (let harmonic = 1; harmonic <= harmonics; harmonic += 1) {
        imag[harmonic] = (2 / (harmonic * Math.PI)) * Math.sin(harmonic * Math.PI * dutyCycle);
      }

      renderState.waveCache.set(key, renderState.audioContext.createPeriodicWave(real, imag));
    }

    return renderState.waveCache.get(key);
  }

  getCurrentItem() {
    return this.playQueue[this.queueIndex] || null;
  }

  isTrackMuted(trackId) {
    return this.mutedTracks.has(trackId);
  }

  setTrackMuted(trackId, muted) {
    if (!TRACK_LOOKUP[trackId]) {
      return;
    }

    if (muted) {
      this.mutedTracks.add(trackId);
    } else {
      this.mutedTracks.delete(trackId);
    }
  }

  toggleTrackMuted(trackId) {
    const nextMuted = !this.isTrackMuted(trackId);
    this.setTrackMuted(trackId, nextMuted);
    return nextMuted;
  }

  isTrackSoloed(trackId) {
    return this.soloTracks.has(trackId);
  }

  toggleTrackSolo(trackId) {
    if (!TRACK_LOOKUP[trackId]) {
      return false;
    }

    if (this.isTrackSoloed(trackId)) {
      this.soloTracks.delete(trackId);
      return false;
    }

    this.soloTracks.add(trackId);
    return true;
  }

  clearMutedTracks() {
    this.mutedTracks.clear();
  }

  hasMutedTracks() {
    return this.mutedTracks.size > 0;
  }

  clearSoloTracks() {
    this.soloTracks.clear();
  }

  hasSoloTracks() {
    return this.soloTracks.size > 0;
  }

  isTrackActiveInMix(trackId) {
    if (this.isTrackMuted(trackId)) {
      return false;
    }

    if (this.hasSoloTracks() && !this.isTrackSoloed(trackId)) {
      return false;
    }

    return true;
  }

  stop(notify = true) {
    if (this.schedulerId) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    if (this.finalizeId) {
      window.clearTimeout(this.finalizeId);
      this.finalizeId = null;
    }

    this.isPlaying = false;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.playQueue = [];
    this.queueIndex = 0;

    if (notify) {
      this.onStepChange({ step: -1, slotKey: null, composition: null, summary: null });
    }
  }

  async play(composition, options = {}) {
    if (!composition) {
      return;
    }

    await this.playSequence([{ composition, slotKey: options.slotKey || "a" }], {
      loop: options.loop ?? true,
    });
  }

  async playSequence(items, options = {}) {
    const queue = items.filter((item) => item?.composition);

    if (!queue.length) {
      return;
    }

    await this.ensureAudio();
    this.stop(false);
    this.playQueue = queue;
    this.queueIndex = 0;
    this.loopQueue = options.loop ?? queue.length === 1;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.audioContext.currentTime + 0.06;
    this.configureRenderState(this.renderState, queue[0].composition, this.audioContext.currentTime);
    this.schedulerId = window.setInterval(() => this.scheduler(), 25);
  }

  scheduler() {
    if (!this.isPlaying) {
      return;
    }

    const currentItem = this.getCurrentItem();
    if (!currentItem) {
      this.stop();
      return;
    }

    while (this.nextStepTime < this.audioContext.currentTime + 0.16) {
      const item = this.getCurrentItem();
      const composition = item?.composition;

      if (!composition) {
        this.stop();
        return;
      }

      const scheduledStep = this.currentStep;
      const swingOffset = scheduledStep % 2 === 1 ? composition.swing * composition.secondsPerStep : 0;
      const playTime = this.nextStepTime + swingOffset;
      this.configureRenderState(this.renderState, composition, playTime);
      this.scheduleStep(this.renderState, composition, scheduledStep, playTime);
      this.onStepChange(this.buildStepPayload(item, scheduledStep));
      this.currentStep += 1;
      this.nextStepTime += composition.secondsPerStep;

      if (this.currentStep >= composition.totalSteps) {
        this.currentStep = 0;

        if (this.queueIndex < this.playQueue.length - 1) {
          this.queueIndex += 1;
        } else if (this.loopQueue) {
          this.queueIndex = 0;
        } else {
          this.finishPlayback(composition.secondsPerStep);
          break;
        }
      }
    }
  }

  finishPlayback(stepSeconds) {
    if (this.schedulerId) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    const tailMs = Math.max(240, Math.ceil(stepSeconds * 1000 + 220));
    this.finalizeId = window.setTimeout(() => this.stop(), tailMs);
  }

  buildStepPayload(item, step) {
    return {
      step,
      slotKey: item.slotKey,
      composition: item.composition,
      summary: step >= 0 ? item.composition.stepSummaries?.[step] || null : null,
    };
  }

  scheduleComposition(renderState, composition, startTime = 0.05) {
    let nextStepTime = startTime;

    for (let step = 0; step < composition.totalSteps; step += 1) {
      const swingOffset = step % 2 === 1 ? composition.swing * composition.secondsPerStep : 0;
      this.scheduleStep(renderState, composition, step, nextStepTime + swingOffset);
      nextStepTime += composition.secondsPerStep;
    }

    return nextStepTime;
  }

  async renderWav(composition) {
    const OfflineAudioContextCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;

    if (!OfflineAudioContextCtor) {
      throw new Error("Offline audio export is not supported in this browser.");
    }

    const sampleRate = 44_100;
    const totalSeconds =
      composition.totalSteps * composition.secondsPerStep + composition.swing * composition.secondsPerStep + 1.3;
    const frameCount = Math.ceil((totalSeconds + 0.05) * sampleRate);
    const offlineContext = new OfflineAudioContextCtor(2, frameCount, sampleRate);
    const renderState = this.createRenderState(offlineContext, offlineContext.destination);
    this.configureRenderState(renderState, composition, 0);
    this.scheduleComposition(renderState, composition, 0.05);
    return offlineContext.startRendering();
  }

  scheduleStep(renderState, composition, step, time) {
    const events = composition.eventsByStep[step];
    for (const event of events) {
      if (!this.isTrackActiveInMix(event.trackId)) {
        continue;
      }

      if (event.trackId === "lead") {
        this.playLead(renderState, composition, event, time);
      } else if (event.trackId === "bass") {
        this.playBass(renderState, composition, event, time);
      } else if (event.trackId === "arp") {
        this.playArp(renderState, composition, event, time);
      } else if (event.trackId === "drone") {
        this.playDrone(renderState, composition, event, time);
      } else if (event.trackId === "drums") {
        this.playDrum(renderState, composition, event, time);
      }
    }
  }

  createVoice({
    renderState,
    composition,
    midi,
    time,
    duration,
    velocity,
    pan = 0,
    dutyCycle,
    wave = "triangle",
    detune = 0,
    filterCutoff = 2400,
    filterType = "lowpass",
    filterQ = 0.9,
    filterRampTo = null,
    pitchBend = 0,
    release = 0.08,
    attack = 0.002,
    trackId = null,
  }) {
    const { audioContext, master } = renderState;
    const trackTrim = TRACK_MIX[trackId]?.trim ?? 1;
    const fx = this.getFx(composition);
    const fxDepth = this.getFxDepth(composition);
    const trackMorph = {
      drone: 0.6,
      bass: 0.78,
      lead: 1,
      arp: 1.08,
    }[trackId] ?? 0.7;
    const cutoffScale = clamp(0.68 + fx.air * 0.46 + fx.motion * 0.1 - fx.sub * 0.06, 0.5, 1.28);
    const adjustedFilterCutoff = clamp(filterCutoff * cutoffScale, 45, 12_000);
    const adjustedFilterRampTo = Number.isFinite(filterRampTo)
      ? clamp(filterRampTo * cutoffScale * (0.9 + fx.gate * 0.16), 45, 12_000)
      : null;
    const adjustedFilterQ = clamp(filterQ + (fx.grit * 1.4 + fx.motion * 0.7) * fxDepth * trackMorph, 0.1, 6.5);
    const detuneDrift = ((fx.wobble - 0.5) * 8 + fx.motion * 2.5) * fxDepth * trackMorph;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const startFrequency = frequency * Math.pow(2, pitchBend / 12);
    const osc = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const amp = audioContext.createGain();
    const panner = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;

    if (wave === "pulse") {
      osc.setPeriodicWave(this.getPulseWave(renderState, dutyCycle ?? 0.25));
    } else {
      osc.type = wave;
    }

    osc.frequency.setValueAtTime(startFrequency, time);
    if (pitchBend) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, frequency), time + Math.min(0.14, duration * 0.55));
    }
    osc.detune.setValueAtTime(detune + detuneDrift, time);
    if (duration > 0.08 && fx.motion > 0.22) {
      osc.detune.linearRampToValueAtTime(detune - detuneDrift * (0.35 + fx.gate * 0.45), time + duration * 0.88);
    }
    filter.type = filterType;
    filter.frequency.setValueAtTime(adjustedFilterCutoff, time);
    if (Number.isFinite(adjustedFilterRampTo)) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, adjustedFilterRampTo),
        time + Math.max(attack + 0.01, duration * 0.68)
      );
    }
    filter.Q.value = adjustedFilterQ;

    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(velocity * trackTrim * (0.82 + fx.drive * 0.08), time + attack);
    amp.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, velocity * trackTrim * (0.54 + fx.gate * 0.34)),
      time + duration * 0.55
    );
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

    osc.connect(filter);
    if (panner) {
      panner.pan.setValueAtTime(pan, time);
      filter.connect(panner);
      panner.connect(master);
    } else {
      filter.connect(master);
    }

    osc.start(time);
    osc.stop(time + duration + release + 0.02);
  }

  usesGlassClub(composition) {
    return getSoundProfile(composition?.soundProfileId).id === "glass-club";
  }

  getFx(composition) {
    return composition?.fx || DEFAULT_FX_SIGNATURE;
  }

  getFxDepth(composition) {
    return this.usesGlassClub(composition) ? 1 : 0.58;
  }

  playNoiseBurst({
    renderState,
    time,
    duration,
    velocity,
    pan = 0,
    filterType = "highpass",
    frequency = 6200,
    filterQ = 1,
    attack = 0.001,
    trackId = "drums",
    composition = null,
  }) {
    const { audioContext, master, noiseBuffer } = renderState;
    const fx = this.getFx(composition);
    const fxDepth = this.getFxDepth(composition);
    const trackTrim = TRACK_MIX[trackId]?.trim ?? 1;
    const adjustedFrequency = clamp(frequency * (0.58 + fx.air * 0.48 + fx.grit * 0.06), 120, 10_500);
    const adjustedDuration = Math.max(0.008, duration * (0.5 + fx.gate * 0.46 + fx.space * 0.12));
    const adjustedVelocity = velocity * (0.48 + fx.snap * 0.16 + fx.drive * 0.05 * fxDepth);
    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const amp = audioContext.createGain();
    const panner = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;

    noise.buffer = noiseBuffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(adjustedFrequency, time);
    filter.Q.value = clamp(filterQ + fx.grit * 0.65 * fxDepth, 0.1, 5);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(adjustedVelocity * trackTrim, time + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + adjustedDuration);

    noise.connect(filter);
    filter.connect(amp);
    if (panner) {
      panner.pan.setValueAtTime(pan, time);
      amp.connect(panner);
      panner.connect(master);
    } else {
      amp.connect(master);
    }

    noise.start(time);
    noise.stop(time + adjustedDuration + 0.03);
  }

  playGlassClubLead(renderState, composition, event, time) {
    const fx = this.getFx(composition);
    const duration = event.duration * composition.secondsPerStep * 0.68;
    const cutoff = 1200 + composition.brightness * 2200 + event.velocity * 620 + fx.air * 1400 + fx.grit * 260;

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration,
      velocity: 0.032 + event.velocity * 0.078,
      pan: event.pan * 0.82,
      wave: fx.leadWave,
      detune: -5 + fx.wobble * 8,
      filterCutoff: cutoff,
      filterRampTo: 540 + composition.brightness * 800 + fx.gate * 420,
      filterQ: 1.7 + fx.grit * 1.8 + fx.motion * 0.8,
      release: 0.06 + fx.space * 0.18,
      attack: 0.001 + fx.gate * 0.004,
      trackId: "lead",
    });

    this.createVoice({
      renderState,
      composition,
      midi: event.midi + 12,
      time: time + 0.004,
      duration: duration * 0.72,
      velocity: 0.01 + event.velocity * 0.022,
      pan: event.pan * -0.45,
      dutyCycle: clamp(composition.dutyCycle * (0.48 + fx.gate * 0.55), 0.125, 0.5),
      wave: "pulse",
      detune: 2 + fx.motion * 6,
      filterCutoff: 2600 + composition.brightness * 1800 + fx.air * 2200,
      filterRampTo: 1300 + composition.brightness * 800 + fx.space * 520,
      filterQ: 1.2 + fx.grit * 1.2,
      release: 0.045 + fx.space * 0.13,
      attack: 0.001,
      trackId: "lead",
    });
  }

  playGlassClubBass(renderState, composition, event, time) {
    const fx = this.getFx(composition);
    const duration = event.duration * composition.secondsPerStep * 0.98;

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration,
      velocity: 0.095 + event.velocity * 0.17,
      pan: event.pan * 0.18,
      wave: "sine",
      pitchBend: (event.accent ? 3.6 : 1.8) + fx.sub * 3.2 + fx.drive,
      filterCutoff: 260 + fx.air * 260 + fx.drive * 160,
      filterQ: 0.8 + fx.sub * 0.8,
      release: 0.1 + fx.sub * 0.19 + fx.space * 0.08,
      attack: 0.001,
      trackId: "bass",
    });

    this.createVoice({
      renderState,
      composition,
      midi: event.midi + 12,
      time: time + 0.006,
      duration: duration * 0.58,
      velocity: 0.014 + event.velocity * 0.028,
      pan: -event.pan * 0.2,
      wave: fx.grit > 0.7 ? "square" : "sawtooth",
      filterCutoff: 420 + composition.brightness * 360 + fx.drive * 240,
      filterRampTo: 220 + composition.brightness * 260 + fx.sub * 120,
      filterQ: 1 + fx.grit * 1.2,
      release: 0.05 + fx.gate * 0.09,
      attack: 0.002,
      trackId: "bass",
    });
  }

  playGlassClubArp(renderState, composition, event, time) {
    const fx = this.getFx(composition);
    const duration = event.duration * composition.secondsPerStep * (0.22 + fx.gate * 0.34);

    this.createVoice({
      renderState,
      composition,
      midi: event.midi + (fx.air > 0.62 ? 12 : 0),
      time,
      duration,
      velocity: 0.026 + event.velocity * 0.048,
      pan: event.pan * 0.7,
      wave: fx.arpWave,
      filterCutoff: 2600 + fx.air * 3600 + fx.motion * 820,
      filterQ: 0.7 + fx.grit * 0.9,
      release: 0.04 + fx.space * 0.26,
      attack: 0.001,
      trackId: "arp",
    });

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time: time + 0.003,
      duration: duration * 0.84,
      velocity: 0.017 + event.velocity * 0.032,
      pan: event.pan * -0.52,
      dutyCycle: clamp(composition.dutyCycle * (0.34 + fx.gate * 0.68), 0.125, 0.5),
      wave: "pulse",
      filterCutoff: 1800 + composition.brightness * 1600 + fx.air * 1500,
      filterRampTo: 760 + composition.brightness * 780 + fx.motion * 460,
      filterQ: 1.3 + fx.grit * 1.4,
      release: 0.035 + fx.space * 0.12,
      attack: 0.001,
      trackId: "arp",
    });
  }

  playGlassClubDrone(renderState, composition, event, time) {
    const fx = this.getFx(composition);
    const duration = event.duration * composition.secondsPerStep;

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration,
      velocity: 0.024 + event.velocity * 0.045,
      pan: -0.18 + event.pan * 0.08,
      wave: fx.droneWave,
      detune: -6 + fx.wobble * 9,
      filterCutoff: 360 + composition.brightness * 420 + fx.air * 360,
      filterQ: 0.8 + fx.grit * 0.8,
      release: 0.28 + fx.space * 0.42,
      attack: 0.035 + fx.gate * 0.08,
      trackId: "drone",
    });

    this.createVoice({
      renderState,
      composition,
      midi: event.midi + 7,
      time: time + 0.018,
      duration,
      velocity: 0.016 + event.velocity * 0.028,
      pan: 0.18 - event.pan * 0.08,
      wave: "triangle",
      detune: 2 + fx.motion * 7,
      filterCutoff: 620 + composition.brightness * 560 + fx.air * 620,
      filterQ: 0.7 + fx.motion * 0.6,
      release: 0.3 + fx.space * 0.44,
      attack: 0.035 + fx.gate * 0.08,
      trackId: "drone",
    });
  }

  playGlassClubDrum(renderState, composition, event, time) {
    const { audioContext, master } = renderState;
    const fx = this.getFx(composition);
    const trackTrim = TRACK_MIX.drums?.trim ?? 1;

    if (event.type === "kick") {
      const osc = audioContext.createOscillator();
      const amp = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(92 + fx.sub * 52 + fx.drive * 18, time);
      osc.frequency.exponentialRampToValueAtTime(32 + fx.sub * 16, time + 0.065 + fx.gate * 0.05);
      osc.frequency.exponentialRampToValueAtTime(27 + fx.sub * 10, time + 0.16 + fx.space * 0.08);
      amp.gain.setValueAtTime((0.2 + event.velocity * 0.08 + fx.drive * 0.025) * trackTrim, time);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.16 + fx.sub * 0.18 + fx.space * 0.08);
      osc.connect(amp);
      amp.connect(master);
      osc.start(time);
      osc.stop(time + 0.22 + fx.sub * 0.2 + fx.space * 0.08);

      this.playNoiseBurst({
        renderState,
        time,
        duration: 0.024,
        velocity: 0.012 + event.velocity * 0.008,
        filterType: "highpass",
        frequency: 3200,
        filterQ: 0.55,
        composition,
      });
      return;
    }

    if (event.type === "snare") {
      this.playNoiseBurst({
        renderState,
        time,
        duration: 0.09,
        velocity: 0.065 + event.velocity * 0.055,
        pan: -0.05,
        filterType: "bandpass",
        frequency: 720 + fx.air * 1500 + fx.grit * 240,
        filterQ: 0.65 + fx.grit * 0.55,
        composition,
      });
      this.playNoiseBurst({
        renderState,
        time: time + 0.022,
        duration: 0.07,
        velocity: 0.026 + event.velocity * 0.025,
        pan: 0.13,
        filterType: "highpass",
        frequency: 1700 + fx.air * 2600,
        filterQ: 0.5,
        composition,
      });
      return;
    }

    this.playNoiseBurst({
      renderState,
      time,
      duration: event.type === "click" ? 0.018 : 0.028,
      velocity: event.type === "click" ? 0.018 + event.velocity * 0.018 : 0.016 + event.velocity * 0.024,
      pan: event.type === "click" ? 0.2 : -0.12,
      filterType: fx.grit > 0.82 && event.type !== "click" ? "bandpass" : "highpass",
      frequency: event.type === "click" ? 3400 + fx.air * 3700 : 3000 + fx.air * 3600,
      filterQ: event.type === "click" ? 0.7 + fx.grit * 0.7 : 0.45 + fx.grit * 0.55,
      composition,
    });
  }

  playLead(renderState, composition, event, time) {
    if (this.usesGlassClub(composition)) {
      this.playGlassClubLead(renderState, composition, event, time);
      return;
    }

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration: event.duration * composition.secondsPerStep * 0.84,
      velocity: 0.045 + event.velocity * 0.11,
      pan: event.pan * 0.75,
      dutyCycle: clamp(composition.dutyCycle * 0.88, 0.125, 0.5),
      wave: "pulse",
      filterCutoff: 850 + composition.brightness * 720 + event.velocity * 240,
      release: 0.045,
      attack: 0.01,
      trackId: "lead",
    });
  }

  playBass(renderState, composition, event, time) {
    if (this.usesGlassClub(composition)) {
      this.playGlassClubBass(renderState, composition, event, time);
      return;
    }

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration: event.duration * composition.secondsPerStep * 0.95,
      velocity: 0.1 + event.velocity * 0.2,
      pan: event.pan * 0.25,
      wave: "triangle",
      filterCutoff: 540 + composition.brightness * 420,
      release: 0.1,
      attack: 0.005,
      trackId: "bass",
    });
  }

  playArp(renderState, composition, event, time) {
    if (this.usesGlassClub(composition)) {
      this.playGlassClubArp(renderState, composition, event, time);
      return;
    }

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration: event.duration * composition.secondsPerStep * 0.5,
      velocity: 0.05 + event.velocity * 0.1,
      pan: event.pan * 0.55,
      dutyCycle: composition.dutyCycle * 0.9,
      wave: "pulse",
      filterCutoff: 1900 + composition.brightness * 1600,
      release: 0.025,
      attack: 0.003,
      trackId: "arp",
    });
  }

  playDrone(renderState, composition, event, time) {
    if (this.usesGlassClub(composition)) {
      this.playGlassClubDrone(renderState, composition, event, time);
      return;
    }

    this.createVoice({
      renderState,
      composition,
      midi: event.midi,
      time,
      duration: event.duration * composition.secondsPerStep,
      velocity: 0.05 + event.velocity * 0.1,
      pan: event.pan * 0.12,
      dutyCycle: 0.5,
      wave: "triangle",
      filterCutoff: 520 + composition.brightness * 280,
      release: 0.22,
      attack: 0.03,
      trackId: "drone",
    });

    this.createVoice({
      renderState,
      composition,
      midi: event.midi - 12,
      time,
      duration: event.duration * composition.secondsPerStep,
      velocity: 0.03 + event.velocity * 0.05,
      pan: -event.pan * 0.1,
      wave: "triangle",
      filterCutoff: 420 + composition.brightness * 200,
      release: 0.24,
      attack: 0.03,
      trackId: "drone",
    });
  }

  playDrum(renderState, composition, event, time) {
    if (this.usesGlassClub(composition)) {
      this.playGlassClubDrum(renderState, composition, event, time);
      return;
    }

    const { audioContext, master, noiseBuffer } = renderState;
    const fx = this.getFx(composition);
    const trackTrim = TRACK_MIX.drums?.trim ?? 1;

    if (event.type === "kick") {
      const osc = audioContext.createOscillator();
      const amp = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(78 + fx.sub * 34 + fx.drive * 10, time);
      osc.frequency.exponentialRampToValueAtTime(30 + fx.sub * 12, time + 0.055 + fx.gate * 0.04);
      amp.gain.setValueAtTime((0.17 + event.velocity * 0.06 + fx.drive * 0.018) * trackTrim, time);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.09 + fx.sub * 0.08 + fx.space * 0.04);
      osc.connect(amp);
      amp.connect(master);
      osc.start(time);
      osc.stop(time + 0.12 + fx.sub * 0.1);
      return;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = audioContext.createBiquadFilter();
    const amp = audioContext.createGain();

    if (event.type === "snare") {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900 + fx.air * 1400 + fx.grit * 220, time);
      filter.Q.value = 0.55 + fx.grit * 0.55;
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime((0.075 + event.velocity * 0.06 + fx.snap * 0.018) * trackTrim, time + 0.002);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.055 + fx.gate * 0.06 + fx.space * 0.025);
    } else {
      filter.type = fx.grit > 0.82 && event.type !== "click" ? "bandpass" : "highpass";
      filter.frequency.setValueAtTime(event.type === "click" ? 2600 + fx.air * 3400 : 3200 + fx.air * 3000, time);
      filter.Q.value = event.type === "click" ? 0.55 + fx.grit * 0.65 : 0.35 + fx.grit * 0.45;
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime((0.026 + event.velocity * 0.026 + fx.snap * 0.012) * trackTrim, time + 0.001);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + (event.type === "click" ? 0.018 + fx.gate * 0.025 : 0.016 + fx.gate * 0.024));
    }

    noise.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    noise.start(time);
    noise.stop(time + 0.2);
  }
}

const engine = new BoardMusicEngine(handleStepChange);

if (isMonitorView) {
  document.body.classList.add("is-monitor-view");
}

if (isScreenView) {
  document.body.classList.add("is-screen-view");
}

function applyScreenViewLayout() {
  screenViewLayoutFrame = 0;

  if (!isScreenView || !els.appShell) {
    return;
  }

  const shell = els.appShell;
  shell.style.transform = "none";

  const baseWidth = shell.scrollWidth;
  const baseHeight = shell.scrollHeight;

  if (!baseWidth || !baseHeight) {
    return;
  }

  const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
  const offsetX = Math.max(0, (window.innerWidth - baseWidth * scale) / 2);
  const offsetY = Math.max(0, (window.innerHeight - baseHeight * scale) / 2);

  shell.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function scheduleScreenViewLayout() {
  if (!isScreenView || screenViewLayoutFrame) {
    return;
  }

  screenViewLayoutFrame = window.requestAnimationFrame(() => applyScreenViewLayout());
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatBtcFromSats(sats) {
  const btc = sats / 100_000_000;
  return `${btc.toLocaleString("en-US", {
    minimumFractionDigits: btc < 1 ? 4 : 2,
    maximumFractionDigits: 8,
  })} BTC`;
}

function formatShortHash(value) {
  if (!value) {
    return "n/a";
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPercent(ratio, digits = 2) {
  return `${(ratio * 100).toFixed(digits)}%`;
}

function formatSignedPercent(ratio, digits = 2) {
  const percentage = (ratio * 100).toFixed(digits);
  return `${ratio > 0 ? "+" : ""}${percentage}%`;
}

function formatPercentValue(value, digits = 2) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

function formatSatRate(value) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} sat/vB`;
}

function hexToBytes(hex) {
  const clean = (hex || "").replace(/[^a-f0-9]/gi, "");
  const bytes = [];

  for (let index = 0; index < clean.length; index += 2) {
    bytes.push(parseInt(clean.slice(index, index + 2), 16));
  }

  return bytes;
}

function normalizeArray(values) {
  const max = Math.max(...values, 1);
  return values.map((value) => value / max);
}

function sampleDistributed(items, count) {
  if (!items.length) {
    return [];
  }

  if (items.length === 1) {
    return Array.from({ length: count }, () => items[0]);
  }

  return Array.from({ length: count }, (_, index) => {
    const position = Math.round((index / Math.max(1, count - 1)) * (items.length - 1));
    return items[position];
  });
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function textSeed(value) {
  const text = String(value || "");
  let seed = 0;

  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) >>> 0;
  }

  return seed;
}

function blockSubsidy(height) {
  const halvings = Math.floor(height / 210000);

  if (halvings >= 33) {
    return 0;
  }

  return Math.floor((50 * 100_000_000) / 2 ** halvings);
}

function sumOutputValue(tx) {
  return (tx?.vout || []).reduce((sum, output) => sum + (output.value || 0), 0);
}

function midiToNoteName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[mod(midi, 12)]}${octave}`;
}

function byteAt(bytes, index, fallback = 0) {
  if (!bytes?.length) {
    return fallback;
  }

  return bytes[mod(index, bytes.length)] ?? fallback;
}

function byteUnit(bytes, index, fallback = 0.5) {
  return byteAt(bytes, index, Math.round(fallback * 255)) / 255;
}

function buildBlockFxSignature(block, analysis, blockBytes, merkleBytes, previousBytes) {
  const characterSeed =
    byteAt(blockBytes, 2) +
    byteAt(blockBytes, 19) +
    byteAt(merkleBytes, 11) +
    byteAt(previousBytes, 31) +
    analysis.poolSeed;
  const character = FX_CHARACTER_LIBRARY[mod(characterSeed, FX_CHARACTER_LIBRARY.length)];
  const feeHeat = clamp(Math.log2(analysis.maxFeeRate + analysis.medianFeeRate + 2) / 8.5, 0, 1);
  const driftHeat = clamp(
    Math.abs(analysis.feeDeltaRatio) * 5 +
      Math.abs(analysis.weightDeltaRatio) * 5 +
      Math.abs(analysis.txDeltaRatio) * 4 +
      analysis.discrepancyRatio * 4,
    0,
    1
  );
  const nonceUnit = mod(Number(block.nonce || 0), 997) / 996;
  const versionUnit = mod(Math.abs(Number(block.version || 0)), 1021) / 1020;
  const weightUnit = clamp(block.weight / 4_000_000, 0, 1);
  const densityUnit = clamp(Math.log2(block.tx_count + 1) / 13, 0, 1);

  const raw = {
    drive: clamp(byteUnit(blockBytes, 5) * 0.48 + feeHeat * 0.34 + driftHeat * 0.18, 0, 1),
    space: clamp(byteUnit(merkleBytes, 9) * 0.62 + byteUnit(previousBytes, 21) * 0.26 + analysis.healthRatio * 0.12, 0, 1),
    motion: clamp(byteUnit(previousBytes, 17) * 0.42 + byteUnit(merkleBytes, 29) * 0.32 + driftHeat * 0.26, 0, 1),
    grit: clamp(byteUnit(blockBytes, 23) * 0.5 + versionUnit * 0.2 + driftHeat * 0.3, 0, 1),
    sub: clamp(weightUnit * 0.52 + byteUnit(previousBytes, 3) * 0.3 + feeHeat * 0.18, 0, 1),
    air: clamp(byteUnit(merkleBytes, 4) * 0.45 + byteUnit(blockBytes, 37) * 0.28 + densityUnit * 0.27, 0, 1),
    wobble: clamp(byteUnit(blockBytes, 41) * 0.42 + nonceUnit * 0.36 + byteUnit(previousBytes, 9) * 0.22, 0, 1),
    gate: clamp(byteUnit(merkleBytes, 47) * 0.5 + byteUnit(blockBytes, 13) * 0.28 + (1 - analysis.healthRatio) * 0.22, 0, 1),
    snap: clamp(byteUnit(blockBytes, 53) * 0.54 + byteUnit(merkleBytes, 6) * 0.24 + feeHeat * 0.22, 0, 1),
  };
  const characterShape = {
    dry: { drive: -0.08, space: -0.2, motion: -0.08, gate: 0.18, snap: 0.12 },
    wide: { drive: -0.04, space: 0.3, motion: 0.06, air: 0.1, gate: -0.08 },
    hot: { drive: 0.28, space: -0.04, grit: 0.24, snap: 0.15 },
    sub: { drive: 0.02, space: -0.08, sub: 0.3, air: -0.14, snap: -0.04 },
    glass: { drive: -0.02, space: 0.08, grit: -0.08, air: 0.3, snap: 0.18 },
    warped: { drive: 0.08, space: 0.18, motion: 0.32, wobble: 0.28, gate: -0.08 },
  }[character.id] || {};
  const shaped = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, clamp(value + (characterShape[key] || 0), 0, 1)])
  );

  return {
    ...character,
    ...shaped,
  };
}

function buildFingerprint(txids, totalSteps, scaleLength) {
  const stepEnergy = Array(totalSteps).fill(0);
  const accentEnergy = Array(totalSteps).fill(0);
  const degreeBias = Array(scaleLength).fill(0);

  txids.forEach((txid, index) => {
    const bytes = hexToBytes(txid);
    const primary = mod((bytes[0] || 0) + (bytes[11] || 0) + index, totalSteps);
    const secondary = mod(primary + 3 + ((bytes[3] || 0) % 9), totalSteps);
    const accent = mod((bytes[5] || 0) + index * 5, totalSteps);
    const degree = mod((bytes[7] || 0) + (bytes[15] || 0) + index, scaleLength);

    stepEnergy[primary] += 1 + (bytes[1] || 0) / 255;
    stepEnergy[secondary] += 0.32 + (bytes[2] || 0) / 520;
    accentEnergy[accent] += 0.4 + (bytes[9] || 0) / 255;
    degreeBias[degree] += 1;
  });

  return {
    stepEnergy: normalizeArray(stepEnergy),
    accentEnergy: normalizeArray(accentEnergy),
    degreeBias: normalizeArray(degreeBias),
  };
}

function buildHarmonicComposition(blockPackage, soundProfileId = DEFAULT_SOUND_PROFILE_ID) {
  const { block, txids, txs } = blockPackage;
  const totalSteps = chooseStepCount(block);
  const analysis = analyzeBlockPackage(blockPackage, totalSteps);
  const soundProfile = getSoundProfile(soundProfileId);
  const scale = SCALE_LIBRARY[
    mod(block.height + block.version + block.bits + analysis.poolSeed + Math.round(analysis.health), SCALE_LIBRARY.length)
  ];
  const rootMidi = 35 + mod(block.height + analysis.poolSeed, 9);
  const weightRatio = clamp(block.weight / 4_000_000, 0, 1);
  const txDensity = clamp(Math.log2(block.tx_count + 1) / 13, 0.22, 0.98);
  const feeHeat = clamp(Math.log2(analysis.medianFeeRate + analysis.maxFeeRate + 2) / 8, 0.12, 0.98);
  const auditTension = clamp(
    analysis.discrepancyRatio * 2 +
      Math.abs(analysis.feeDeltaRatio) * 6 +
      Math.abs(analysis.weightDeltaRatio) * 6 +
      Math.abs(analysis.txDeltaRatio) * 5,
    0,
    1
  );
  const brightness = clamp(
    (Math.log10(block.difficulty || 1) - 10.5) / 6 + feeHeat * 0.1 - (1 - analysis.healthRatio) * 0.05,
    0.16,
    0.8
  );
  const dutyCycle =
    DUTY_OPTIONS[
      mod(block.bits + block.version + block.nonce + analysis.poolSeed + Math.round(analysis.segwitRatio * 10), DUTY_OPTIONS.length)
    ];
  const tempo = Math.round(66 + weightRatio * 12 + txDensity * 8 + feeHeat * 11 + analysis.healthRatio * 5 + auditTension * 4);
  const swing = clamp(
    0.008 + ((block.nonce & 255) / 255) * 0.028 + auditTension * 0.03 + Math.abs(analysis.feeDeltaRatio) * 0.02,
    0.008,
    0.08
  );
  const previousBytes = hexToBytes(block.previousblockhash || block.id);
  const merkleBytes = hexToBytes(block.merkle_root || block.id);
  const blockBytes = hexToBytes(block.id);
  const fx = buildBlockFxSignature(block, analysis, blockBytes, merkleBytes, previousBytes);
  const fingerprint = buildFingerprint(txids, totalSteps, scale.degrees.length);
  const harmonyPlan = buildHarmonyPlan(totalSteps, scale, rootMidi, block, analysis, fingerprint, previousBytes);
  const samples = buildDetailedSamples(txids, txs, totalSteps);
  const eventsByStep = Array.from({ length: totalSteps }, () => []);

  const leadEvents = [];
  const bassEvents = [];
  const arpEvents = [];
  const droneEvents = [];
  const drumEvents = [];
  const highlightEvents = [];

  const maxSampleFee = Math.max(...txs.map((tx) => tx.fee || 0), 1);
  const maxSampleValue = Math.max(...txs.map(sumOutputValue), 1);

  let lastLeadStep = -99;
  for (let step = 0; step < totalSteps; step += 1) {
    const sample = samples[step];
    const tx = sample.tx;
    const txid = sample.txid;
    const txBytes = hexToBytes(txid);
    const chord = harmonyPlan.steps[step];
    const outputs = tx?.vout?.length || 1 + ((txBytes[0] || 0) % 5);
    const inputs = tx?.vin?.length || 1 + ((txBytes[1] || 0) % 3);
    const totalOut = sumOutputValue(tx) || ((txBytes[2] || 0) + 1) * 12000;
    const fee = tx?.fee || ((txBytes[3] || 0) + 1) * 20;
    const activity = fingerprint.stepEnergy[step];
    const accent = fingerprint.accentEnergy[step];
    const templateEnergy = analysis.templateFingerprint.energy[step];
    const templatePressure = analysis.templateFingerprint.pressure[step];
    const targetMidi = 57 + (totalOut > maxSampleValue * 0.55 ? 9 : 0) + (fee > maxSampleFee * 0.5 ? 3 : 0);
    const leadThreshold = 0.68 - txDensity * 0.1 - feeHeat * 0.04 + (step % 4 === 0 ? -0.03 : 0.07);

    if (
      (step % 2 === 0 || templatePressure > 0.78) &&
      activity + accent * 0.18 + templateEnergy * 0.16 + templatePressure * 0.12 + ((txBytes[4] || 0) / 255) * 0.16 >
        leadThreshold &&
      step - lastLeadStep > (templatePressure > 0.84 ? 1 : 2)
    ) {
      const midi = nearestMidi(targetMidi, chordCandidates(rootMidi, chord, [12, 24, 36], true), 50, 82);
      const duration = templatePressure > 0.7 || outputs > 4 ? 1 : 2;
      const velocity = clamp(0.22 + fee / maxSampleFee * 0.18 + accent * 0.06 + templatePressure * 0.07, 0.18, 0.56);
      const event = {
        trackId: "lead",
        step,
        duration,
        midi,
        velocity,
        pan: (((txBytes[7] || 0) / 255) - 0.5) * 0.5,
        accent: fee > maxSampleFee * 0.55,
        txid,
        totalOut,
        fee,
        outputs,
        inputs,
      };
      leadEvents.push(event);
      lastLeadStep = step;

      if (highlightEvents.length < 8) {
        highlightEvents.push(event);
      }
    }
  }

  const leadStepSet = new Set(leadEvents.map((event) => event.step));

  for (let step = 0; step < totalSteps; step += 4) {
    const sourceBytes = hexToBytes(samples[step].txid);
    const chord = harmonyPlan.steps[step];
    const useFifth = step % 16 !== 0 && ((sourceBytes[8] || 0) % 3 === 0);
    const target = useFifth ? rootMidi + chord.tones[2] - 12 : rootMidi + chord.tones[0] - 12;

    bassEvents.push({
      trackId: "bass",
      step,
      duration: step % 16 === 0 ? 4 : 3,
      midi: nearestMidi(target, chordCandidates(rootMidi, chord, [-12, 0], false), 26, 55),
      velocity: 0.28 + fingerprint.stepEnergy[step] * 0.16 + analysis.templateFingerprint.contour[step] * 0.1,
      pan: (((sourceBytes[10] || 0) / 255) - 0.5) * 0.18,
      accent: step % 16 === 0,
    });
  }

  for (let step = 1; step < totalSteps; step += 2) {
    if (leadStepSet.has(step)) {
      continue;
    }

    const txid = samples[step].txid;
    const txBytes = hexToBytes(txid);
    const chord = harmonyPlan.steps[step];
    const templateEnergy = analysis.templateFingerprint.energy[step];
    const templatePressure = analysis.templateFingerprint.pressure[step];
    const merkleByte = merkleBytes[step % merkleBytes.length] || 0;
    const patternIndex = mod(Math.floor(step / 2) + analysis.poolSeed + (merkleByte % 3), chord.tones.length);
    const target = rootMidi + chord.tones[patternIndex] + (step % 8 === 1 ? 24 : 12);

    if (templateEnergy + fingerprint.stepEnergy[step] < 0.42) {
      continue;
    }

    arpEvents.push({
      trackId: "arp",
      step,
      duration: 1,
      midi: nearestMidi(target, chordCandidates(rootMidi, chord, [12, 24, 36], false), 58, 88),
      velocity: 0.16 + templateEnergy * 0.08,
      pan: (((txBytes[13] || 0) / 255) - 0.5) * 0.7,
      accent: templatePressure > 0.78,
    });
  }

  for (let measure = 0; measure < harmonyPlan.measures.length; measure += 1) {
    const step = measure * harmonyPlan.measureLength;
    const chord = harmonyPlan.measures[measure];
    const droneTarget = rootMidi + chord.tones[0] - 12;

    droneEvents.push({
      trackId: "drone",
      step,
      duration: 12 + Math.round(analysis.healthRatio * 4),
      midi: nearestMidi(droneTarget, chordCandidates(rootMidi, chord, [-12, 0], false), 24, 48),
      velocity: 0.24 + clamp(analysis.totalFees / Math.max(analysis.reward, 1), 0, 1) * 0.16,
      pan: 0,
      accent: step === 0,
    });
  }

  for (let step = 0; step < totalSteps; step += 1) {
    const blockByte = blockBytes[step % blockBytes.length] || 0;
    const activity = fingerprint.stepEnergy[step];
    const accent = fingerprint.accentEnergy[step];
    const pressure = analysis.templateFingerprint.pressure[step];
    const contour = analysis.templateFingerprint.contour[step];

    if (step % 8 === 0 || activity > 0.88 || pressure > 0.84) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "kick",
        velocity: 0.28 + activity * 0.18 + pressure * 0.08,
        accent: true,
      });
    }

    if (step % 16 === 8 || accent > 0.86 || pressure > 0.9) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "snare",
        velocity: 0.24 + accent * 0.14 + pressure * 0.08,
        accent: true,
      });
    }

    if (step % 2 === mod(block.nonce + analysis.poolSeed, 2) && activity + pressure > 0.52) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "hat",
        velocity: 0.12 + activity * 0.08 + pressure * 0.05,
        accent: blockByte > 205 || contour > 0.76,
      });
    }
  }

  const anomalyMarks = [
    { count: analysis.acceleratedCount, offset: 11, velocity: 0.24 },
    { count: analysis.fullrbfCount, offset: 13, velocity: 0.2 },
  ];

  for (const mark of anomalyMarks) {
    const pulses = Math.min(mark.count, 3);

    for (let index = 0; index < pulses; index += 1) {
      drumEvents.push({
        trackId: "drums",
        step: mod(index * mark.offset + analysis.poolSeed, totalSteps),
        duration: 1,
        type: "click",
        velocity: mark.velocity + auditTension * 0.05,
        accent: true,
      });
    }
  }

  const allTracks = {
    drone: droneEvents,
    bass: bassEvents,
    lead: leadEvents,
    arp: arpEvents,
    drums: drumEvents,
  };

  for (const event of [...droneEvents, ...bassEvents, ...leadEvents, ...arpEvents, ...drumEvents]) {
    eventsByStep[event.step].push(event);
  }

  const secondsPerBeat = 60 / tempo;
  const secondsPerStep = secondsPerBeat / 4;
  const keyLabel = `${NOTE_NAMES[rootMidi % 12]} ${scale.name}`;
  const tonalBias = fingerprint.degreeBias
    .map((value, index) => ({ value, degree: scale.degrees[index] }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((entry) => midiToNoteName(rootMidi + entry.degree))
    .join(" / ");

  const metadataCards = [
    { label: "Block", value: `#${formatNumber(block.height)}`, detail: formatShortHash(block.id) },
    { label: "Timestamp", value: formatDate(block.timestamp), detail: `${formatNumber(block.tx_count)} transactions` },
    { label: "Miner", value: analysis.poolName, detail: `${formatPercentValue(analysis.health)} block health` },
    { label: "Fee span", value: `${formatSatRate(analysis.minFeeRate)} - ${formatSatRate(analysis.maxFeeRate)}`, detail: `${formatSatRate(analysis.medianFeeRate)} median` },
    { label: "Total fees", value: formatBtcFromSats(analysis.totalFees), detail: `${formatNumber(analysis.totalFees)} sats paid` },
    { label: "Reward", value: formatBtcFromSats(analysis.reward), detail: `${formatBtcFromSats(analysis.subsidy)} subsidy + fees` },
    { label: "Sound", value: soundProfile.label, detail: soundProfile.dnaDetail },
    { label: "FX character", value: fx.label, detail: fx.detail },
    { label: "Harmony frame", value: harmonyPlan.cadenceName, detail: "Block-derived chord path keeping the voices aligned" },
    { label: "Template drift", value: `${formatSignedPercent(analysis.txDeltaRatio)} tx delta`, detail: `${analysis.addedCount} added / ${analysis.missingCount} missing / ${analysis.unseenCount} unseen` },
  ];

  const dnaCards = [
    { label: "Tempo", value: `${tempo} BPM`, detail: "Weight, fee heat, and audit tension set the pace." },
    { label: "Key center", value: keyLabel, detail: `Height and miner imprint grounded the piece on ${NOTE_NAMES[rootMidi % 12]}.` },
    { label: "Harmony", value: harmonyPlan.cadenceName, detail: "Every pitched voice is quantized to the same moving chord frame." },
    { label: "Pulse width", value: `${Math.round(dutyCycle * 100)}% duty`, detail: "Bits, nonce, pool signature, and segwit mix color the chip timbre." },
    { label: "Sound palette", value: soundProfile.label, detail: soundProfile.dnaDetail },
    { label: "Block FX", value: fx.label, detail: `${formatPercent(fx.drive)} drive / ${formatPercent(fx.space)} space / ${formatPercent(fx.motion)} motion.` },
    { label: "Texture", value: `${Math.round(txDensity * 100)}% density`, detail: `${formatPercent(analysis.segwitRatio)} segwit share widens the grid.` },
    { label: "Fee market", value: `${formatSatRate(analysis.medianFeeRate)} median`, detail: `${formatSatRate(analysis.maxFeeRate)} top rate influences accents without breaking the harmony.` },
    { label: "Audit tension", value: formatPercent(auditTension), detail: `${analysis.acceleratedCount} accelerated / ${analysis.fullrbfCount} full-RBF txs add restrained glitch percussion.` },
    { label: "Tonal pull", value: tonalBias, detail: "Txids still bias the mode, but now inside a consonant harmonic frame." },
  ];

  const mappings = [
    {
      label: "Shared harmonic frame",
      copy: "The app now builds a block-derived chord path first, and then the lead, arp, bass, and drone all pick notes from that same frame so the result feels more musical and less collision-prone.",
    },
    {
      label: "Height and miner",
      copy: `The block height and ${analysis.poolName} still seed the mode and progression, but now they define a stable harmonic bed instead of separate competing note choices.`,
    },
    {
      label: "Fee market",
      copy: `The fee span from ${formatSatRate(analysis.minFeeRate)} to ${formatSatRate(analysis.maxFeeRate)} shapes brightness, emphasis, and urgency more than raw dissonance.`,
    },
    {
      label: "Block effect fingerprint",
      copy: `This block is rendered as ${fx.label}: ${fx.detail} Its hash, merkle root, previous block hash, fee heat, and audit drift push the drive, delay space, filter resonance, detune wobble, and drum tuning.`,
    },
    {
      label: "Transactions and template",
      copy: `Transaction data still controls rhythm, dynamics, and melodic activity, but individual note choices are snapped to chord tones so high-activity blocks stay coherent.`,
    },
    {
      label: "Expected vs actual block",
      copy: "Audit drift still matters, but it now mostly affects percussion and micro-tension rather than forcing pitched voices into clashing intervals.",
    },
    {
      label: "Reward and subsidy",
      copy: "Subsidy plus fees reinforce the drone and bass, making the harmonic foundation feel weighted instead of chaotic.",
    },
  ];

  const contextHighlights = [
    {
      label: "Harmonic frame",
      copy: `This block now follows a block-derived cadence of ${harmonyPlan.cadenceName}, which keeps the lead, arp, bass, and drone in the same tonal story even when transaction activity gets busy.`,
      meta: [keyLabel, `${tempo} BPM`, `${totalSteps} steps`],
    },
    {
      label: "Fee market pressure",
      copy: `This block ranged from ${formatSatRate(analysis.minFeeRate)} to ${formatSatRate(analysis.maxFeeRate)} with a ${formatSatRate(analysis.medianFeeRate)} median, so the composition gets more intensity and motion without losing consonance.`,
      meta: [formatBtcFromSats(analysis.totalFees), `${formatNumber(block.tx_count)} txs`, `${formatSatRate(analysis.avgFeeRate)} avg`],
    },
    {
      label: "FX character",
      copy: `${fx.label} gives this block ${formatPercent(fx.drive)} drive, ${formatPercent(fx.space)} delay space, ${formatPercent(fx.air)} top-end air, and ${formatPercent(fx.wobble)} pitch wobble before any notes are scheduled.`,
      meta: [`${formatPercent(fx.grit)} grit`, `${formatPercent(fx.sub)} sub`, `${formatPercent(fx.snap)} snap`],
    },
  ];

  const leadHighlights = highlightEvents.map((event, index) => ({
    label: `Lead event ${index + 1}`,
    copy: `${formatShortHash(event.txid)} resolved to ${midiToNoteName(event.midi)} inside the active chord, using ${formatBtcFromSats(event.totalOut)} across ${event.outputs} outputs and a ${formatNumber(event.fee)} sat fee as its energy source.`,
    meta: [`step ${event.step + 1}`, `${event.inputs} in`, `${event.outputs} out`, `${midiToNoteName(event.midi)}`],
  }));

  const descriptor =
    soundProfile.id === "glass-club"
      ? `A punchier glass-club block score at ${tempo} BPM in ${keyLabel}, generated from block #${formatNumber(block.height)} as ${fx.label}, with resonant plucks, heavier bass, ${analysis.poolName}'s miner imprint, and a ${formatSatRate(analysis.medianFeeRate)} median fee market.`
      : `A more harmonic machine score at ${tempo} BPM in ${keyLabel}, generated from block #${formatNumber(block.height)} as ${fx.label}, with a shared chord frame, ${analysis.poolName}'s miner imprint, and a ${formatSatRate(analysis.medianFeeRate)} median fee market.`;
  const stepSummaries = buildStepSummaries(totalSteps, eventsByStep, harmonyPlan, samples, rootMidi);

  return {
    block,
    txids,
    txs,
    analysis,
    totalSteps,
    tempo,
    swing,
    dutyCycle,
    brightness,
    fx,
    soundProfileId: soundProfile.id,
    soundProfileLabel: soundProfile.label,
    secondsPerStep,
    eventsByStep,
    metadataCards,
    dnaCards,
    mappings,
    highlights: [...contextHighlights, ...leadHighlights],
    highlightCaption: `${formatNumber(txs.length)} detailed transactions plus live mempool audit data are shaping this block's texture inside a shared harmonic frame`,
    descriptor,
    keyLabel,
    cadenceName: harmonyPlan.cadenceName,
    scoreCaption: `${formatNumber(txids.length)} txids, fee-market stats, and expected-vs-actual block audit data mapped into five voices with chord-aware note selection.`,
    trackStates: TRACK_DEFS.map((trackDef) => ({
      ...trackDef,
      cells: buildTrackCells(totalSteps, allTracks[trackDef.id]),
    })),
    stepSummaries,
    downloadPayload: {
      block,
      analysis,
      harmony: {
        cadence: harmonyPlan.cadenceName,
        key: keyLabel,
      },
      sonicDna: {
        tempo,
        swing,
        dutyCycle,
        brightness,
        key: keyLabel,
        totalSteps,
        soundProfile: soundProfile.id,
        fx,
      },
      soundProfile: {
        id: soundProfile.id,
        label: soundProfile.label,
      },
      mappings,
      highlights: [...contextHighlights, ...leadHighlights],
    },
  };
}

function buildDetailedSamples(txids, txs, totalSteps) {
  const detailedTxs = sampleDistributed(txs, Math.min(totalSteps, txs.length));
  const sampledIds = sampleDistributed(txids, totalSteps);

  return Array.from({ length: totalSteps }, (_, index) => {
    const rich = detailedTxs[index % Math.max(1, detailedTxs.length)] || null;
    const txid = rich?.txid || sampledIds[index];
    return {
      txid,
      tx: rich?.txid === txid ? rich : rich || { txid },
    };
  });
}

function chooseStepCount(block) {
  if (block.tx_count > 2200 || block.weight > 3_700_000) {
    return 64;
  }

  if (block.tx_count > 800) {
    return 48;
  }

  return 32;
}

function buildTrackCells(totalSteps, events) {
  const cells = Array.from({ length: totalSteps }, () => ({
    active: false,
    sustain: false,
    accent: false,
  }));

  for (const event of events) {
    cells[event.step].active = true;
    cells[event.step].accent = event.accent || false;

    const sustainLength = Math.max(0, (event.duration || 1) - 1);
    for (let offset = 1; offset <= sustainLength; offset += 1) {
      const index = event.step + offset;
      if (index < totalSteps) {
        cells[index].sustain = true;
      }
    }
  }

  return cells;
}

function chordQuality(chord) {
  const intervals = chord.tones.map((tone) => mod(tone - chord.tones[0], 12)).join(",");

  if (intervals === "0,4,7") {
    return "";
  }

  if (intervals === "0,3,7") {
    return "m";
  }

  if (intervals === "0,3,6") {
    return "dim";
  }

  if (intervals === "0,4,8") {
    return "aug";
  }

  if (intervals === "0,5,7") {
    return "sus4";
  }

  if (intervals === "0,2,7") {
    return "sus2";
  }

  return " modal";
}

function formatChordName(rootMidi, chord) {
  const chordRoot = NOTE_NAMES[mod(rootMidi + chord.tones[0], 12)];
  return `${chordRoot}${chordQuality(chord)}`;
}

function formatDrumName(type) {
  if (type === "hat") {
    return "Hat";
  }

  if (type === "kick") {
    return "Kick";
  }

  if (type === "snare") {
    return "Snare";
  }

  if (type === "click") {
    return "Click";
  }

  return "Noise";
}

function buildStepSummaries(totalSteps, eventsByStep, harmonyPlan, samples, rootMidi) {
  return Array.from({ length: totalSteps }, (_, step) => {
    const summaryEvents = eventsByStep[step];
    const chord = harmonyPlan.steps[step];
    const sample = samples[step];
    const sampleTx = sample?.tx || {};
    const pitchedEvents = summaryEvents.filter((event) => Number.isFinite(event.midi));
    const drumEvents = summaryEvents.filter((event) => event.trackId === "drums");

    return {
      step,
      measure: Math.floor(step / harmonyPlan.measureLength) + 1,
      measureStep: mod(step, harmonyPlan.measureLength) + 1,
      beat: Math.floor(mod(step, harmonyPlan.measureLength) / 4) + 1,
      chordName: formatChordName(rootMidi, chord),
      chordNotes: chord.tones.map((tone) => midiToNoteName(rootMidi + tone)),
      activeNotes: pitchedEvents.map((event) => `${TRACK_LOOKUP[event.trackId].name} ${midiToNoteName(event.midi)}`),
      rhythmNotes: drumEvents.map((event) => formatDrumName(event.type)),
      activeTracks: summaryEvents.map((event) => TRACK_LOOKUP[event.trackId]?.name || event.trackId),
      txid: sample?.txid || null,
      txShort: sample?.txid ? formatShortHash(sample.txid) : "n/a",
      fee: sampleTx?.fee || 0,
      totalOut: sumOutputValue(sampleTx),
      eventCount: summaryEvents.length,
    };
  });
}

function scaleTone(scale, degreeIndex) {
  const degreeCount = scale.degrees.length;
  const octaveOffset = Math.floor(degreeIndex / degreeCount);
  return scale.degrees[mod(degreeIndex, degreeCount)] + octaveOffset * 12;
}

function buildChord(scale, degreeIndex) {
  return {
    rootDegree: mod(degreeIndex, scale.degrees.length),
    tones: [scaleTone(scale, degreeIndex), scaleTone(scale, degreeIndex + 2), scaleTone(scale, degreeIndex + 4)],
    extensions: [
      scaleTone(scale, degreeIndex),
      scaleTone(scale, degreeIndex + 2),
      scaleTone(scale, degreeIndex + 4),
      scaleTone(scale, degreeIndex + 6),
    ],
  };
}

function chordCandidates(rootMidi, chord, octaveOffsets, includeExtensions = false) {
  const toneSet = includeExtensions ? chord.extensions : chord.tones;
  const candidates = [];

  for (const octaveOffset of octaveOffsets) {
    for (const tone of toneSet) {
      candidates.push(rootMidi + tone + octaveOffset);
    }
  }

  return [...new Set(candidates)].sort((left, right) => left - right);
}

function nearestMidi(target, candidates, min, max) {
  const inRange = candidates.filter((candidate) => candidate >= min && candidate <= max);
  const pool = inRange.length ? inRange : candidates;

  return pool.reduce((closest, candidate) => {
    if (closest === null) {
      return candidate;
    }

    return Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest;
  }, null);
}

function buildHarmonyPlan(totalSteps, scale, rootMidi, block, analysis, fingerprint, previousBytes) {
  const measureLength = 16;
  const measureCount = Math.max(2, Math.ceil(totalSteps / measureLength));
  const cadenceShapes = [
    [0, 5, 3, 4],
    [0, 3, 5, 4],
    [0, 5, 6, 4],
    [0, 4, 3, 5],
  ];
  const topBiasDegree = fingerprint.degreeBias.indexOf(Math.max(...fingerprint.degreeBias));
  const cadence = cadenceShapes[mod(block.height + analysis.poolSeed + topBiasDegree, cadenceShapes.length)];
  const measures = [];

  for (let measure = 0; measure < measureCount; measure += 1) {
    const previousByte = previousBytes[measure % previousBytes.length] || 0;
    const baseDegree = cadence[measure % cadence.length];
    const degreeShift = measure === 0 ? 0 : previousByte % 2 === 0 ? 0 : 1;
    const chord = buildChord(scale, baseDegree + degreeShift);
    const inversion = mod(previousByte + analysis.poolSeed + measure, 3);
    measures.push({
      ...chord,
      inversion,
      labelRoot: formatChordName(rootMidi, chord),
    });
  }

  const steps = Array.from({ length: totalSteps }, (_, step) => measures[Math.floor(step / measureLength)]);

  return {
    measureLength,
    measures,
    steps,
    cadenceName: measures.map((measure) => measure.labelRoot).join(" / "),
  };
}

function buildTemplateFingerprint(template, totalSteps) {
  const energy = Array(totalSteps).fill(0);
  const pressure = Array(totalSteps).fill(0);
  const contour = Array(totalSteps).fill(0);

  for (let index = 0; index < template.length; index += 1) {
    const entry = template[index];
    const rate = entry?.rate || 0;
    const fee = entry?.fee || 0;
    const vsize = entry?.vsize || 0;
    const flags = entry?.flags || 0;

    const primaryStep = mod(index * 5 + Math.round(rate * 2) + Math.round(vsize / 18), totalSteps);
    const echoStep = mod(primaryStep + 2 + (Math.round(rate) % 11), totalSteps);
    const contourStep = mod(index * 3 + Math.round(vsize / 40) + (flags & 7), totalSteps);

    energy[primaryStep] += clamp(rate / 15, 0.08, 18);
    pressure[echoStep] += clamp(fee / 2500, 0.06, 16);
    contour[contourStep] += clamp(vsize / 280, 0.04, 14);
  }

  return {
    energy: normalizeArray(energy),
    pressure: normalizeArray(pressure),
    contour: normalizeArray(contour),
  };
}

function analyzeBlockPackage(blockPackage, totalSteps) {
  const { block, txs, audit } = blockPackage;
  const extras = block.extras || {};
  const feeRange = extras.feeRange || [];
  const feePercentiles = extras.feePercentiles || [];
  const totalFees = extras.totalFees ?? txs.reduce((sum, tx) => sum + (tx.fee || 0), 0);
  const reward = extras.reward ?? blockSubsidy(block.height) + totalFees;
  const subsidy = Math.max(0, reward - totalFees);
  const poolName = extras.pool?.name || "Unknown miner";
  const poolSeed = textSeed(extras.pool?.slug || poolName);
  const medianFeeRate = extras.medianFee ?? feePercentiles[3] ?? average(txs.map((tx) => tx.fee || 0));
  const avgFeeRate = extras.avgFeeRate ?? average(txs.map((tx) => (tx.fee || 0) / Math.max(1, (tx.weight || 0) / 4)));
  const minFeeRate = feeRange[0] ?? medianFeeRate;
  const maxFeeRate = feeRange[feeRange.length - 1] ?? medianFeeRate;
  const feeSpan = Math.max(0, maxFeeRate - minFeeRate);
  const health = audit?.matchRate ?? extras.matchRate ?? 100;
  const expectedFees = audit?.expectedFees ?? extras.expectedFees ?? totalFees;
  const expectedWeight = audit?.expectedWeight ?? extras.expectedWeight ?? block.weight;
  const expectedTxCount = audit?.template?.length ?? block.tx_count;
  const feeDeltaRatio = expectedFees ? (totalFees - expectedFees) / expectedFees : 0;
  const weightDeltaRatio = expectedWeight ? (block.weight - expectedWeight) / expectedWeight : 0;
  const txDeltaRatio = expectedTxCount ? (block.tx_count - expectedTxCount) / expectedTxCount : 0;
  const segwitRatio = extras.segwitTotalTxs ? extras.segwitTotalTxs / Math.max(1, block.tx_count) : 0;
  const totalInputs = extras.totalInputs ?? 0;
  const totalOutputs = extras.totalOutputs ?? 0;
  const inputOutputRatio = totalInputs ? totalOutputs / totalInputs : 1;
  const utxoSetChange = extras.utxoSetChange ?? Math.max(0, totalOutputs - totalInputs);
  const avgTxSize = extras.avgTxSize ?? block.size / Math.max(1, block.tx_count);
  const addedCount = audit?.addedTxs?.length || 0;
  const missingCount = audit?.missingTxs?.length || 0;
  const unseenCount = audit?.unseenTxs?.length || 0;
  const acceleratedCount = audit?.acceleratedTxs?.length || 0;
  const fullrbfCount = audit?.fullrbfTxs?.length || 0;
  const discrepancyRatio =
    (addedCount + missingCount + unseenCount + acceleratedCount + fullrbfCount) /
    Math.max(1, block.tx_count);
  const template = audit?.template || [];
  const templateFingerprint = buildTemplateFingerprint(template, totalSteps);
  const giantTemplateShare = template.length
    ? template.filter((entry) => (entry?.vsize || 0) > 1000).length / template.length
    : 0;

  return {
    extras,
    feeRange,
    feePercentiles,
    totalFees,
    reward,
    subsidy,
    poolName,
    poolSeed,
    medianFeeRate,
    avgFeeRate,
    minFeeRate,
    maxFeeRate,
    feeSpan,
    health,
    healthRatio: clamp(health / 100, 0, 1),
    expectedFees,
    expectedWeight,
    expectedTxCount,
    feeDeltaRatio,
    weightDeltaRatio,
    txDeltaRatio,
    segwitRatio,
    inputOutputRatio,
    totalInputs,
    totalOutputs,
    utxoSetChange,
    avgTxSize,
    addedCount,
    missingCount,
    unseenCount,
    acceleratedCount,
    fullrbfCount,
    discrepancyRatio,
    template,
    templateFingerprint,
    giantTemplateShare,
  };
}

function buildComposition(blockPackage, soundProfileId = DEFAULT_SOUND_PROFILE_ID) {
  return buildHarmonicComposition(blockPackage, soundProfileId);

  const { block, txids, txs } = blockPackage;
  const totalSteps = chooseStepCount(block);
  const analysis = analyzeBlockPackage(blockPackage, totalSteps);
  const scale = SCALE_LIBRARY[
    mod(block.height + block.version + block.bits + analysis.poolSeed + Math.round(analysis.health), SCALE_LIBRARY.length)
  ];
  const rootMidi = 34 + mod(block.height + analysis.poolSeed, 15);
  const weightRatio = clamp(block.weight / 4_000_000, 0, 1);
  const txDensity = clamp(Math.log2(block.tx_count + 1) / 13, 0.2, 0.98);
  const feeHeat = clamp(Math.log2(analysis.medianFeeRate + analysis.maxFeeRate + 2) / 8, 0.12, 0.98);
  const auditTension = clamp(
    analysis.discrepancyRatio * 2.4 +
      Math.abs(analysis.feeDeltaRatio) * 8 +
      Math.abs(analysis.weightDeltaRatio) * 8 +
      Math.abs(analysis.txDeltaRatio) * 6,
    0,
    1
  );
  const brightness = clamp(
    (Math.log10(block.difficulty || 1) - 10.5) / 5.6 + feeHeat * 0.16 - (1 - analysis.healthRatio) * 0.04,
    0.18,
    0.98
  );
  const dutyCycle =
    DUTY_OPTIONS[
      mod(block.bits + block.version + block.nonce + analysis.poolSeed + Math.round(analysis.segwitRatio * 10), DUTY_OPTIONS.length)
    ];
  const tempo = Math.round(70 + weightRatio * 14 + txDensity * 10 + feeHeat * 16 + analysis.healthRatio * 5 + auditTension * 8);
  const swing = clamp(
    0.01 + ((block.nonce & 255) / 255) * 0.045 + auditTension * 0.05 + Math.abs(analysis.feeDeltaRatio) * 0.04,
    0.01,
    0.14
  );
  const previousBytes = hexToBytes(block.previousblockhash || block.id);
  const merkleBytes = hexToBytes(block.merkle_root || block.id);
  const blockBytes = hexToBytes(block.id);
  const fingerprint = buildFingerprint(txids, totalSteps, scale.degrees.length);
  const samples = buildDetailedSamples(txids, txs, totalSteps);
  const eventsByStep = Array.from({ length: totalSteps }, () => []);

  const leadEvents = [];
  const bassEvents = [];
  const arpEvents = [];
  const droneEvents = [];
  const drumEvents = [];
  const highlightEvents = [];

  const maxSampleFee = Math.max(...txs.map((tx) => tx.fee || 0), 1);
  const maxSampleValue = Math.max(...txs.map(sumOutputValue), 1);

  let lastLeadStep = -99;
  for (let step = 0; step < totalSteps; step += 1) {
    const sample = samples[step];
    const tx = sample.tx;
    const txid = sample.txid;
    const txBytes = hexToBytes(txid);
    const outputs = tx?.vout?.length || 1 + ((txBytes[0] || 0) % 5);
    const inputs = tx?.vin?.length || 1 + ((txBytes[1] || 0) % 3);
    const totalOut = sumOutputValue(tx) || ((txBytes[2] || 0) + 1) * 12000;
    const fee = tx?.fee || ((txBytes[3] || 0) + 1) * 20;
    const activity = fingerprint.stepEnergy[step];
    const accent = fingerprint.accentEnergy[step];
    const templateEnergy = analysis.templateFingerprint.energy[step];
    const templatePressure = analysis.templateFingerprint.pressure[step];
    const templateContour = analysis.templateFingerprint.contour[step];
    const leadThreshold = 0.56 - txDensity * 0.18 - feeHeat * 0.06 + (step % 4 === 0 ? -0.05 : 0.04);

    if (
      activity +
        accent * 0.25 +
        templateEnergy * 0.22 +
        templatePressure * 0.18 +
        ((txBytes[4] || 0) / 255) * 0.22 >
        leadThreshold &&
      step - lastLeadStep > (auditTension > 0.45 ? 0 : 1)
    ) {
      const preferredDegree = fingerprint.degreeBias.indexOf(Math.max(...fingerprint.degreeBias));
      const degreeSeed = mod(
        preferredDegree +
          outputs +
          Math.floor(totalOut / 100_000) +
          Math.round(analysis.medianFeeRate) +
          Math.floor(templateContour * 6) +
          (txBytes[6] || 0),
        scale.degrees.length
      );
      const octaveLift =
        totalOut > maxSampleValue * 0.55 ? 24 : totalOut > maxSampleValue * 0.12 || fee > maxSampleFee * 0.5 ? 12 : 0;
      const midi = clamp(rootMidi + 12 + scale.degrees[degreeSeed] + octaveLift, 49, 86);
      const duration = templatePressure > 0.68 || outputs > 4 ? 1 : analysis.inputOutputRatio > 1.25 ? 2 : 1;
      const velocity = clamp(
        0.28 + fee / maxSampleFee * 0.35 + accent * 0.1 + templatePressure * 0.15 + auditTension * 0.08,
        0.22,
        0.95
      );
      const event = {
        trackId: "lead",
        step,
        duration,
        midi,
        velocity,
        pan: ((txBytes[7] || 0) / 127.5) - 1,
        accent: fee > maxSampleFee * 0.45 || templatePressure > 0.78,
        txid,
        totalOut,
        fee,
        outputs,
        inputs,
      };
      leadEvents.push(event);
      lastLeadStep = step;

      if (highlightEvents.length < 8) {
        highlightEvents.push(event);
      }
    }
  }

  for (let step = 0; step < totalSteps; step += 4) {
    const sourceBytes = hexToBytes(samples[step].txid);
    const weightedDegrees = [0, 0, 2, 3, 4, 5, 1];
    const chosenDegree = weightedDegrees[
      mod(
        (sourceBytes[8] || 0) + step + block.height + analysis.poolSeed + Math.round(analysis.segwitRatio * 12),
        weightedDegrees.length
      )
    ];

    bassEvents.push({
      trackId: "bass",
      step,
      duration: step % 16 === 0 ? 4 : analysis.giantTemplateShare > 0.05 ? 2 : 3,
      midi: clamp(rootMidi - 12 + scale.degrees[mod(chosenDegree, scale.degrees.length)], 26, 55),
      velocity:
        0.32 +
        fingerprint.stepEnergy[step] * 0.24 +
        analysis.templateFingerprint.contour[step] * 0.2 +
        clamp(analysis.totalFees / Math.max(analysis.reward, 1), 0, 1) * 0.15,
      pan: (((sourceBytes[10] || 0) / 255) - 0.5) * 0.24,
      accent: step % 16 === 0,
    });
  }

  for (let step = 0; step < totalSteps; step += 1) {
    const txid = samples[step].txid;
    const txBytes = hexToBytes(txid);
    const merkleByte = merkleBytes[step % merkleBytes.length] || 0;
    const templateEnergy = analysis.templateFingerprint.energy[step];
    const templatePressure = analysis.templateFingerprint.pressure[step];
    const active =
      (step % 2 === 1 || fingerprint.stepEnergy[step] > 0.68 || templateEnergy > 0.7) &&
      merkleByte / 255 + fingerprint.accentEnergy[step] + templatePressure * 0.7 > 0.55 - feeHeat * 0.1;

    if (active) {
      const degree = mod(
        Math.floor((merkleByte + (txBytes[12] || 0) + step + Math.round(analysis.feeSpan * 3)) / 17),
        scale.degrees.length
      );

      arpEvents.push({
        trackId: "arp",
        step,
        duration: 1,
        midi: clamp(rootMidi + 17 + scale.degrees[degree] + (step % 8 === 1 ? 12 : 0), 58, 92),
        velocity: 0.24 + (merkleByte / 255) * 0.25 + templateEnergy * 0.18,
        pan: ((txBytes[13] || 0) / 127.5) - 1,
        accent: merkleByte > 180 || templatePressure > 0.75,
      });
    }
  }

  for (let step = 0; step < totalSteps; step += 16) {
    const previousByte = previousBytes[(step / 16) % previousBytes.length] || 0;
    const intervalPalette = [0, 3, 5, 7, 10];
    const interval = intervalPalette[mod(previousByte + analysis.poolSeed + Math.round(analysis.health), intervalPalette.length)];

    droneEvents.push({
      trackId: "drone",
      step,
      duration: 10 + (previousByte % 4) + Math.round(analysis.healthRatio * 4),
      midi: clamp(rootMidi - 6 + interval, 24, 52),
      velocity: 0.34 + (previousByte / 255) * 0.18 + clamp(analysis.totalFees / Math.max(analysis.reward, 1), 0, 1) * 0.25,
      pan: ((previousByte / 255) - 0.5) * 0.2,
      accent: step === 0,
    });
  }

  for (let step = 0; step < totalSteps; step += 1) {
    const blockByte = blockBytes[step % blockBytes.length] || 0;
    const activity = fingerprint.stepEnergy[step];
    const accent = fingerprint.accentEnergy[step];
    const pressure = analysis.templateFingerprint.pressure[step];
    const contour = analysis.templateFingerprint.contour[step];

    if (step % 8 === 0 || activity > 0.86 || pressure > 0.82) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "kick",
        velocity: 0.32 + activity * 0.24 + pressure * 0.12,
        accent: true,
      });
    }

    if (step % 16 === 8 || accent > 0.82 || pressure > 0.88) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "snare",
        velocity: 0.28 + accent * 0.18 + pressure * 0.14,
        accent: true,
      });
    }

    if (step % 2 === mod(block.nonce + analysis.poolSeed, 2) || activity + pressure > 0.72) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "hat",
        velocity: 0.16 + activity * 0.1 + pressure * 0.08,
        accent: blockByte > 190 || contour > 0.7,
      });
    }

    if (step % 4 === 2 && (blockByte > 160 || contour > 0.7 || auditTension > 0.35)) {
      drumEvents.push({
        trackId: "drums",
        step,
        duration: 1,
        type: "click",
        velocity: 0.14 + (blockByte / 255) * 0.08 + contour * 0.06 + auditTension * 0.06,
        accent: false,
      });
    }
  }

  const anomalyMarks = [
    { count: analysis.addedCount, offset: 3, velocity: 0.28 },
    { count: analysis.missingCount, offset: 5, velocity: 0.3 },
    { count: analysis.unseenCount, offset: 7, velocity: 0.26 },
    { count: analysis.acceleratedCount, offset: 11, velocity: 0.34 },
    { count: analysis.fullrbfCount, offset: 13, velocity: 0.22 },
  ];

  for (const mark of anomalyMarks) {
    const pulses = Math.min(mark.count, 6);

    for (let index = 0; index < pulses; index += 1) {
      drumEvents.push({
        trackId: "drums",
        step: mod(index * mark.offset + analysis.poolSeed, totalSteps),
        duration: 1,
        type: "click",
        velocity: mark.velocity + auditTension * 0.1,
        accent: true,
      });
    }
  }

  const allTracks = {
    drone: droneEvents,
    bass: bassEvents,
    lead: leadEvents,
    arp: arpEvents,
    drums: drumEvents,
  };

  for (const event of [...droneEvents, ...bassEvents, ...leadEvents, ...arpEvents, ...drumEvents]) {
    eventsByStep[event.step].push(event);
  }

  const secondsPerBeat = 60 / tempo;
  const secondsPerStep = secondsPerBeat / 4;
  const keyLabel = `${NOTE_NAMES[rootMidi % 12]} ${scale.name}`;
  const tonalBias = fingerprint.degreeBias
    .map((value, index) => ({ value, degree: scale.degrees[index] }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((entry) => midiToNoteName(rootMidi + entry.degree))
    .join(" / ");

  const metadataCards = [
    { label: "Block", value: `#${formatNumber(block.height)}`, detail: formatShortHash(block.id) },
    { label: "Timestamp", value: formatDate(block.timestamp), detail: `${formatNumber(block.tx_count)} transactions` },
    { label: "Miner", value: analysis.poolName, detail: `${formatPercentValue(analysis.health)} block health` },
    { label: "Fee span", value: `${formatSatRate(analysis.minFeeRate)} - ${formatSatRate(analysis.maxFeeRate)}`, detail: `${formatSatRate(analysis.medianFeeRate)} median` },
    { label: "Total fees", value: formatBtcFromSats(analysis.totalFees), detail: `${formatNumber(analysis.totalFees)} sats paid` },
    { label: "Reward", value: formatBtcFromSats(analysis.reward), detail: `${formatBtcFromSats(analysis.subsidy)} subsidy + fees` },
    { label: "Weight", value: `${formatNumber(block.weight)} wu`, detail: `${formatSignedPercent(analysis.weightDeltaRatio)} vs expected` },
    { label: "Template drift", value: `${formatSignedPercent(analysis.txDeltaRatio)} tx delta`, detail: `${analysis.addedCount} added / ${analysis.missingCount} missing / ${analysis.unseenCount} unseen` },
  ];

  const dnaCards = [
    { label: "Tempo", value: `${tempo} BPM`, detail: "Weight, fee heat, and audit tension set the pace." },
    { label: "Key center", value: keyLabel, detail: `Height and miner imprint grounded the piece on ${NOTE_NAMES[rootMidi % 12]}.` },
    { label: "Pulse width", value: `${Math.round(dutyCycle * 100)}% duty`, detail: "Bits, nonce, pool signature, and segwit mix color the chip timbre." },
    { label: "Texture", value: `${Math.round(txDensity * 100)}% density`, detail: `${formatPercent(analysis.segwitRatio)} segwit share widens the grid.` },
    { label: "Fee market", value: `${formatSatRate(analysis.medianFeeRate)} median`, detail: `${formatSatRate(analysis.maxFeeRate)} top rate pushes sharper accents.` },
    { label: "Audit tension", value: formatPercent(auditTension), detail: `${analysis.acceleratedCount} accelerated / ${analysis.fullrbfCount} full-RBF txs turn into glitch percussion.` },
    { label: "Tonal pull", value: tonalBias, detail: "All txids and template pressure bias the modal degrees." },
    { label: "Palette", value: "Pulse / triangle / noise", detail: "Board-made synthesis, no sampled instruments." },
  ];

  const mappings = [
    {
      label: "Height and miner",
      copy: `The block height still anchors the form, but ${analysis.poolName} now also seeds the mode choice, low drone intervals, and some of the rhythmic placement so the miner leaves a musical fingerprint too.`,
    },
    {
      label: "Fee market",
      copy: `The fee span from ${formatSatRate(analysis.minFeeRate)} to ${formatSatRate(analysis.maxFeeRate)} controls brightness, lead-note intensity, and how sharp the upper pulse line feels.`,
    },
    {
      label: "Median and total fees",
      copy: `Median fee rate and total fees shape tempo, accent strength, and the low-end weight of the score, so expensive blocks feel tighter and more urgent.`,
    },
    {
      label: "Expected vs actual block",
      copy: `The audit comparison now matters directly: added, missing, unseen, accelerated, and full-RBF transactions create extra glitch clicks, syncopation, and tension in the drum layer.`,
    },
    {
      label: "Transactions and template",
      copy: `All ${formatNumber(txids.length)} transaction ids still build the overall rhythmic fingerprint, while the mempool template distribution shapes contour, pressure, and note density across the grid.`,
    },
    {
      label: "Reward and subsidy",
      copy: `Subsidy plus fees reinforce the drone and bass, so the miner reward influences how grounded and heavy the piece feels.`,
    },
    {
      label: "Segwit and UTXO change",
      copy: `${formatPercent(analysis.segwitRatio)} segwit share plus a ${formatNumber(analysis.utxoSetChange)} UTXO shift affect note sustain, width, and how much movement happens in the midrange.`,
    },
    {
      label: "Merkle root and previous block hash",
      copy: "The merkle root still drives the upper motion, and the previous block hash still keeps the drone chained to block history instead of sounding like a disconnected loop.",
    },
  ];

  const contextHighlights = [
    {
      label: "Fee market pressure",
      copy: `This block ranged from ${formatSatRate(analysis.minFeeRate)} to ${formatSatRate(analysis.maxFeeRate)} with a ${formatSatRate(analysis.medianFeeRate)} median, so the composition leans brighter and more urgent than a flatter-fee block.`,
      meta: [formatBtcFromSats(analysis.totalFees), `${formatNumber(block.tx_count)} txs`, `${formatSatRate(analysis.avgFeeRate)} avg`],
    },
    {
      label: "Miner imprint",
      copy: `${analysis.poolName} mined the block, and that pool signature now seeds parts of the key choice, the drone intervals, and some timing offsets so miners don't all sound the same.`,
      meta: [analysis.poolName, `${formatPercentValue(analysis.health)} health`, `${formatPercent(analysis.segwitRatio)} segwit`],
    },
    {
      label: "Expected vs actual drift",
      copy: `The audit expected about ${formatNumber(analysis.expectedTxCount)} transactions and ${formatBtcFromSats(analysis.expectedFees)} in fees. The actual block landed at ${formatSignedPercent(analysis.txDeltaRatio)} transactions and ${formatSignedPercent(analysis.feeDeltaRatio)} fee delta, which now adds glitch percussion and extra motion.`,
      meta: [`${analysis.addedCount} added`, `${analysis.missingCount} missing`, `${analysis.acceleratedCount} accelerated`],
    },
  ];

  const leadHighlights = highlightEvents.map((event, index) => ({
    label: `Lead event ${index + 1}`,
    copy: `${formatShortHash(event.txid)} pushed the lead to ${midiToNoteName(event.midi)} with ${formatBtcFromSats(event.totalOut)} across ${event.outputs} outputs and a ${formatNumber(event.fee)} sat fee.`,
    meta: [`step ${event.step + 1}`, `${event.inputs} in`, `${event.outputs} out`, `${midiToNoteName(event.midi)}`],
  }));

  const descriptor = `A darker machine score at ${tempo} BPM in ${keyLabel}, generated from block #${formatNumber(block.height)} with ${analysis.poolName}'s miner imprint, a ${formatSatRate(analysis.medianFeeRate)} median fee market, and ${formatPercentValue(analysis.health)} template health.`;
  const stepSummaries = buildStepSummaries(totalSteps, eventsByStep, harmonyPlan, samples, rootMidi);
  const trackStates = TRACK_DEFS.map((trackDef) => ({
    ...trackDef,
    cells: buildTrackCells(totalSteps, allTracks[trackDef.id]),
  }));

  return {
    block,
    txids,
    txs,
    analysis,
    totalSteps,
    tempo,
    swing,
    dutyCycle,
    brightness,
    secondsPerStep,
    eventsByStep,
    metadataCards,
    dnaCards,
    mappings,
    highlights: [...contextHighlights, ...leadHighlights],
    highlightCaption: `${formatNumber(txs.length)} detailed transactions plus live mempool audit data are shaping this block's texture`,
    descriptor,
    keyLabel,
    cadenceName: harmonyPlan.cadenceName,
    scoreCaption: `${formatNumber(txids.length)} txids, mempool fee-market stats, and expected-vs-actual block audit data mapped into five generated voices.`,
    trackStates,
    stepSummaries,
    downloadPayload: {
      block,
      analysis,
      sonicDna: {
        tempo,
        swing,
        dutyCycle,
        brightness,
        key: keyLabel,
        totalSteps,
      },
      mappings,
      highlights: [...contextHighlights, ...leadHighlights],
    },
  };
}

async function fetchText(path, base = API_BASE) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) {
    throw new Error(`Bitcoin API error ${response.status}`);
  }

  return response.text();
}

async function fetchJson(path, base = API_BASE) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) {
    throw new Error(`Bitcoin API error ${response.status}`);
  }

  return response.json();
}

async function fetchJsonOrNull(path, base = API_BASE) {
  try {
    return await fetchJson(path, base);
  } catch {
    return null;
  }
}

async function fetchTextWithFallback(path) {
  try {
    return await fetchText(path, API_BASE);
  } catch {
    return fetchText(path, FALLBACK_API_BASE);
  }
}

async function fetchBlockWithExtras(blockId) {
  try {
    return await fetchJson(`/block/${blockId}`, API_V1_BASE);
  } catch {
    return fetchJson(`/block/${blockId}`, FALLBACK_API_BASE);
  }
}

async function resolveBlockId(input) {
  const query = (input || "").trim();

  if (!query) {
    return (await fetchTextWithFallback("/blocks/tip/hash")).trim();
  }

  if (/^\d+$/.test(query)) {
    return (await fetchTextWithFallback(`/block-height/${query}`)).trim();
  }

  if (/^[a-fA-F0-9]{64}$/.test(query)) {
    return query.toLowerCase();
  }

  throw new Error("Enter a block height or a 64-character block hash.");
}

async function fetchDetailedTransactions(blockId, txCount) {
  const limit = Math.min(txCount, MAX_DETAILED_TXS);
  const pages = [];

  for (let start = 0; start < limit; start += 25) {
    const path = `/block/${blockId}/txs/${start}`;
    pages.push(fetchJson(path));
  }

  const results = await Promise.all(pages);
  return results.flat().slice(0, limit);
}

async function fetchBlockPackage(input) {
  const blockId = await resolveBlockId(input);
  const [block, txids, audit] = await Promise.all([
    fetchBlockWithExtras(blockId),
    fetchJson(`/block/${blockId}/txids`),
    fetchJsonOrNull(`/block/${blockId}/audit-summary`, API_V1_BASE),
  ]);
  const txs = await fetchDetailedTransactions(blockId, block.tx_count);
  return { block, txids, txs, audit };
}

async function fetchLatestTipHeight() {
  const tipHeight = Number((await fetchTextWithFallback("/blocks/tip/height")).trim());

  if (!Number.isFinite(tipHeight)) {
    throw new Error("Could not resolve the latest Bitcoin block height.");
  }

  return tipHeight;
}

function setStatus(message, stateName = "idle") {
  els.status.textContent = message;
  els.status.dataset.state = stateName;
}

const DEFAULT_DESCRIPTOR = els.heroDescriptor.textContent.trim();

function getActiveSoundProfile() {
  return getSoundProfile(state.soundProfileId);
}

function getNextSoundProfileId(currentId = state.soundProfileId) {
  const normalizedCurrentId = normalizeSoundProfileId(currentId);
  const currentIndex = SOUND_PROFILE_IDS.indexOf(normalizedCurrentId);

  if (currentIndex === -1 || SOUND_PROFILE_IDS.length <= 1) {
    return normalizedCurrentId;
  }

  return SOUND_PROFILE_IDS[(currentIndex + 1) % SOUND_PROFILE_IDS.length];
}

function replaceAppUrl(blockId = state.composition?.block?.id || null) {
  const params = new URLSearchParams();

  if (viewMode) {
    params.set("view", viewMode);
  }

  if (blockId) {
    params.set("block", blockId);
  }

  if (state.soundProfileId !== DEFAULT_SOUND_PROFILE_ID) {
    params.set("sound", state.soundProfileId);
  }

  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function syncSoundProfileControls() {
  const activeProfile = getActiveSoundProfile();
  const nextProfile = getSoundProfile(getNextSoundProfileId(activeProfile.id));

  if (els.soundProfileSwitch) {
    const currentIndex = SOUND_PROFILE_IDS.indexOf(activeProfile.id);
    const endIndex = Math.max(0, SOUND_PROFILE_IDS.length - 1);
    const soundPosition = currentIndex >= endIndex ? "end" : "start";
    const canToggleProfiles = SOUND_PROFILE_IDS.length > 1;

    els.soundProfileSwitch.disabled = state.loading || state.exporting || !canToggleProfiles;
    els.soundProfileSwitch.dataset.soundPosition = soundPosition;
    els.soundProfileSwitch.setAttribute(
      "aria-label",
      canToggleProfiles ? `Switch sound palette from ${activeProfile.label} to ${nextProfile.label}` : `${activeProfile.label} sound palette`
    );

    if (els.soundProfileCurrentLabel) {
      els.soundProfileCurrentLabel.textContent = activeProfile.label;
    }

    if (els.soundProfileNextLabel) {
      els.soundProfileNextLabel.textContent = nextProfile.label;
    }
  }

  els.soundProfileButtons.forEach((button) => {
    const isActive = normalizeSoundProfileId(button.dataset.soundProfile) === activeProfile.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.disabled = state.loading || state.exporting;
  });
}

async function applySoundProfile(profileId) {
  const nextProfileId = normalizeSoundProfileId(profileId);

  if (nextProfileId === state.soundProfileId) {
    syncSoundProfileControls();
    return state.composition;
  }

  const wasPlaying = engine.isPlaying;
  const profile = getSoundProfile(nextProfileId);

  if (wasPlaying) {
    engine.stop(false);
  }

  state.soundProfileId = nextProfileId;
  state.currentStep = -1;
  state.liveMonitorFrozen = false;
  state.liveMonitorFrame = null;
  state.lastPlaybackFrame = null;

  if (state.blockPackage) {
    state.composition = buildComposition(state.blockPackage, state.soundProfileId);
    renderComposition(state.composition);
    replaceAppUrl(state.composition.block.id);
    setStatus(`${profile.label} sound palette applied to block #${formatNumber(state.composition.block.height)}.`, "success");

    if (wasPlaying) {
      try {
        await engine.play(state.composition);
      } catch (error) {
        console.error(error);
        setStatus(`${profile.label} sound palette applied, but the browser blocked audio restart. Press Play.`, "error");
      }
    }
  } else {
    state.composition = null;
    renderEmptyState();
    replaceAppUrl(null);
    setStatus(`${profile.label} sound palette selected. Load a block to hear it.`, "success");
  }

  syncSoundProfileControls();
  updateTransportLabel();
  emitSnapshot(true);
  return state.composition;
}

function getCompositionDurationMs(composition) {
  if (!composition) {
    return 0;
  }

  const baseMs = Math.ceil(
    composition.totalSteps * composition.secondsPerStep * 1000 +
      composition.swing * composition.secondsPerStep * 1000
  );
  const tailMs = Math.max(240, Math.ceil(composition.secondsPerStep * 1000 + 220));
  return baseMs + tailMs;
}

function getPlaybackSnapshot() {
  const composition = state.composition;
  const block = composition?.block || null;

  return {
    ready: Boolean(composition),
    view: isMonitorView ? "monitor" : "default",
    loading: state.loading,
    exporting: state.exporting,
    playing: engine.isPlaying,
    liveMonitorFrozen: state.liveMonitorFrozen,
    blockHeight: block?.height ?? null,
    blockId: block?.id ?? null,
    descriptor: composition?.descriptor ?? null,
    keyLabel: composition?.keyLabel ?? null,
    tempo: composition?.tempo ?? null,
    totalSteps: composition?.totalSteps ?? null,
    soundProfileId: state.soundProfileId,
    soundProfileLabel: getSoundProfile(state.soundProfileId).label,
    durationMs: composition ? getCompositionDurationMs(composition) : 0,
  };
}

function emitSnapshot(force = false) {
  const snapshot = getPlaybackSnapshot();
  const signature = JSON.stringify({
    ready: snapshot.ready,
    view: snapshot.view,
    loading: snapshot.loading,
    exporting: snapshot.exporting,
    playing: snapshot.playing,
    liveMonitorFrozen: snapshot.liveMonitorFrozen,
    blockHeight: snapshot.blockHeight,
    blockId: snapshot.blockId,
    soundProfileId: snapshot.soundProfileId,
  });

  if (!force && signature === state.lastSnapshotSignature) {
    return snapshot;
  }

  state.lastSnapshotSignature = signature;
  window.dispatchEvent(new CustomEvent("bitcoin-block-music:snapshot", { detail: snapshot }));

  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: "bitcoin-block-music:snapshot", snapshot }, window.location.origin);
    } catch {
      // Ignore parent messaging errors and keep the app responsive.
    }
  }

  return snapshot;
}

function setLoading(isLoading) {
  state.loading = isLoading;
  updateControlStates();
  emitSnapshot();
}

function setExporting(isExporting) {
  state.exporting = isExporting;
  updateControlStates();
  emitSnapshot();
}

function updateControlStates() {
  const canPlay = !state.loading && !state.exporting && Boolean(state.composition);

  els.playButton.disabled = !canPlay;
  els.stopButton.disabled = !engine.isPlaying;
  els.exportWavButton.disabled = !canPlay;
  els.downloadButton.disabled = !canPlay;
  els.prevBeatButton.disabled = !state.composition;
  els.nextBeatButton.disabled = !state.composition;
  els.freezeMonitorButton.disabled = !state.composition;
  els.freezeMonitorButton.textContent = state.liveMonitorFrozen ? "Return to live" : "Freeze monitor";
  els.freezeMonitorButton.classList.toggle("is-active", state.liveMonitorFrozen);
  els.clearSolosButton.disabled = !state.composition || !engine.hasSoloTracks();
  els.unmuteAllButton.disabled = !state.composition || !engine.hasMutedTracks();
  els.latestButton.disabled = state.loading;
  els.loadButton.disabled = state.loading;
  syncSoundProfileControls();
}

function renderStatCards(target, cards) {
  target.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <div class="stat-label">${card.label}</div>
          <div class="stat-value">${card.value}</div>
          <div class="stat-detail">${card.detail}</div>
        </article>
      `
    )
    .join("");
}

function renderMappings(mappings) {
  els.mappingList.innerHTML = mappings
    .map(
      (mapping) => `
        <article class="mapping-item">
          <div class="mapping-label">${mapping.label}</div>
          <p class="mapping-copy">${mapping.copy}</p>
        </article>
      `
    )
    .join("");
}

function renderHighlights(highlights, caption) {
  els.txSampleInfo.textContent = caption;

  if (!highlights.length) {
    els.transactionList.innerHTML = `<p class="empty-state">This block did not produce any highlighted lead-note events yet.</p>`;
    return;
  }

  els.transactionList.innerHTML = highlights
    .map(
      (highlight) => `
        <article class="transaction-card">
          <div class="mapping-label">${highlight.label}</div>
          <p class="transaction-copy">${highlight.copy}</p>
          <div class="transaction-meta">${highlight.meta.map((entry) => `<span class="hash-chip">${entry}</span>`).join("")}</div>
        </article>
      `
    )
    .join("");
}

function renderLivePanel(frame = null) {
  if (!state.composition) {
    els.liveReadout.innerHTML = `
      <article class="stat-card">
        <div class="stat-label">Transport</div>
        <div class="stat-value">Idle</div>
        <div class="stat-detail">Load a block and press Space to start listening.</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Chord</div>
        <div class="stat-value">n/a</div>
        <div class="stat-detail">The current harmonic frame will show here.</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Voices</div>
        <div class="stat-value">n/a</div>
        <div class="stat-detail">Active layers and tx-driven notes appear during playback.</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Hotkeys</div>
        <div class="stat-value">Space / Esc / F / Arrows</div>
        <div class="stat-detail">Space plays, Esc stops, F freezes, and Left or Right nudge by beat.</div>
      </article>
    `;
    els.liveVoiceChips.innerHTML = `<span class="live-chip">Load a block to populate the monitor.</span>`;
    els.liveNarrative.textContent = "Mute and Solo controls will reshape the mix in real time once a score is loaded.";
    return;
  }

  const activeFrame = state.liveMonitorFrozen ? state.liveMonitorFrame : frame;
  const summaries = state.composition.stepSummaries || [];
  const summary = activeFrame?.summary || summaries[0];

  if (!summary) {
    els.liveReadout.innerHTML = `
      <article class="stat-card">
        <div class="stat-label">Transport</div>
        <div class="stat-value">Ready</div>
        <div class="stat-detail">This block loaded, but its live summary has not populated yet.</div>
      </article>
      <article class="stat-card">
        <div class="stat-label">Chord</div>
        <div class="stat-value">${state.composition.keyLabel || "n/a"}</div>
        <div class="stat-detail">The live monitor will populate once step summaries are available.</div>
      </article>
    `;
    els.liveVoiceChips.innerHTML = `<span class="live-chip is-muted">Live step details are warming up.</span>`;
    els.liveNarrative.textContent = "The score is loaded, but the live monitor does not have a step summary yet.";
    return;
  }

  const isFrozen = Boolean(state.liveMonitorFrozen && activeFrame && activeFrame.step >= 0);
  const isLive = !isFrozen && Boolean(activeFrame && activeFrame.step >= 0);
  const stepEvents = state.composition.eventsByStep[summary.step] || [];
  const audibleEvents = stepEvents.filter((event) => engine.isTrackActiveInMix(event.trackId));
  const audibleTrackIds = [...new Set(audibleEvents.map((event) => event.trackId))];
  const audibleTrackNames = audibleTrackIds.map((trackId) => TRACK_LOOKUP[trackId]?.name || trackId);
  const mutedCount = TRACK_DEFS.filter((track) => engine.isTrackMuted(track.id)).length;
  const soloCount = TRACK_DEFS.filter((track) => engine.isTrackSoloed(track.id)).length;
  const activeMixLabel = engine.hasSoloTracks()
    ? TRACK_DEFS.filter((track) => engine.isTrackSoloed(track.id))
        .map((track) => track.name)
        .join(", ")
    : "Full mix";

  renderStatCards(els.liveReadout, [
    {
      label: "Transport",
      value: isFrozen ? `Frozen ${summary.step + 1}/${state.composition.totalSteps}` : isLive ? `Step ${summary.step + 1}/${state.composition.totalSteps}` : "Ready",
      detail: isFrozen
        ? `Measure ${summary.measure}, beat ${summary.beat} pinned while playback keeps moving.`
        : isLive
          ? `Measure ${summary.measure}, beat ${summary.beat}`
          : "Press Space to play the current block.",
    },
    {
      label: "Chord",
      value: summary.chordName,
      detail: summary.chordNotes.join(" / "),
    },
    {
      label: "Voices",
      value: audibleTrackNames.length ? audibleTrackNames.join(", ") : "Rest",
      detail: `${audibleEvents.length}/${stepEvents.length} events audible on this step`,
    },
    {
      label: "Mix state",
      value: `${mutedCount} muted / ${soloCount} solo`,
      detail: activeMixLabel,
    },
  ]);

  if (stepEvents.length) {
    els.liveVoiceChips.innerHTML = stepEvents
      .map((event) => {
        const track = TRACK_LOOKUP[event.trackId];
        const isAudible = engine.isTrackActiveInMix(event.trackId);
        const classes = ["live-chip"];

        if (!isAudible) {
          classes.push("is-muted");
        }

        if (engine.isTrackSoloed(event.trackId)) {
          classes.push("is-solo");
        }

        const label =
          event.trackId === "drums" ? `${track.name} ${formatDrumName(event.type)}` : `${track.name} ${midiToNoteName(event.midi)}`;

        return `<span class="${classes.join(" ")}" style="--chip-accent: ${track.color};">${label}</span>`;
      })
      .join("");
  } else {
    els.liveVoiceChips.innerHTML = `<span class="live-chip is-muted">No notes firing on this step.</span>`;
  }

  els.liveNarrative.textContent = isFrozen
    ? `${summary.txShort} is frozen on ${summary.chordName}. The audio can keep running while the monitor stays locked to measure ${summary.measure}, beat ${summary.beat}. Press Left or Right to move by beat, click any grid cell to inspect it, or press F when you want the cursor to catch up.`
    : isLive
      ? `${summary.txShort} is currently shaping ${summary.chordName}. You are hearing ${audibleTrackNames.length ? audibleTrackNames.join(", ") : "a rest"} while Space, Esc, F, and the beat controls let you inspect the block in real time.`
      : `Previewing the opening harmony of ${state.composition.keyLabel}. Press Space to start, use Solo to isolate a layer, and Export WAV to capture the current mix.`;
}

function renderSequencer(composition) {
  els.scoreCaption.textContent = composition.scoreCaption;
  els.sequencer.innerHTML = composition.trackStates
    .map(
      (track) => `
        <div class="sequence-row ${engine.isTrackMuted(track.id) ? "is-muted" : ""} ${engine.hasSoloTracks() && !engine.isTrackSoloed(track.id) ? "is-dimmed" : ""}">
          <div class="sequence-label">
            <div class="sequence-head">
              <div class="sequence-name">${track.name}</div>
              <div class="sequence-actions">
                <button
                  type="button"
                  class="track-toggle ${engine.isTrackSoloed(track.id) ? "is-solo" : ""}"
                  data-track-solo="${track.id}"
                >
                  Solo
                </button>
                <button
                  type="button"
                  class="track-toggle ${engine.isTrackMuted(track.id) ? "is-muted" : ""}"
                  data-track-toggle="${track.id}"
                >
                  ${engine.isTrackMuted(track.id) ? "Unmute" : "Mute"}
                </button>
              </div>
            </div>
            <div class="sequence-role">${track.role}</div>
          </div>
          <div class="sequence-cells" style="--step-count: ${composition.totalSteps};">
            ${track.cells
              .map(
                (cell, index) => `
                  <span
                    class="sequence-cell ${cell.active ? "active" : ""} ${cell.sustain ? "sustain" : ""} ${cell.accent ? "accent" : ""} ${state.currentStep === index ? "current" : ""} ${index % 16 === 0 && index !== 0 ? "measure-start" : ""}"
                    data-track="${track.id}"
                    data-step="${index}"
                    style="--track-color: ${track.color};"
                  ></span>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
}

function renderComposition(composition) {
  renderStatCards(els.blockMeta, composition.metadataCards);
  renderStatCards(els.dnaGrid, composition.dnaCards);
  renderMappings(composition.mappings);
  renderHighlights(composition.highlights, composition.highlightCaption);
  renderSequencer(composition);
  renderLivePanel();
  els.heroDescriptor.textContent = composition.descriptor;
  updateControlStates();
  scheduleScreenViewLayout();
}

function renderEmptyState() {
  state.currentStep = -1;
  const activeProfile = getActiveSoundProfile();
  const emptyCards = [
    { label: "Awaiting block", value: "No score yet", detail: "Load a Bitcoin block to populate these metrics." },
    { label: "Synthesis", value: activeProfile.label, detail: activeProfile.dnaDetail },
    { label: "Direction", value: "Board-made, not sample-based", detail: "Closer to hardware synthesis than replayed audio clips." },
  ];

  renderStatCards(els.blockMeta, emptyCards);
  renderStatCards(els.dnaGrid, emptyCards);
  renderLivePanel();
  els.mappingList.innerHTML = `<p class="empty-state">Height, nonce, weight, merkle root, previous hash, fee span, miner identity, reward, health, and expected-vs-actual block drift will all map into the score once a block is loaded.</p>`;
  els.transactionList.innerHTML = `<p class="empty-state">Transaction highlights, fee-market pressure, and block-audit cues will appear here after the block has been analyzed.</p>`;
  els.sequencer.innerHTML = `<p class="empty-state">The step grid will render each generated voice here.</p>`;
  els.heroDescriptor.textContent = activeProfile.emptyDescriptor || DEFAULT_DESCRIPTOR;
  updateControlStates();
  scheduleScreenViewLayout();
}

function updateTransportLabel() {
  if (engine.isPlaying) {
    els.transportState.textContent = "Playing";
  } else if (state.exporting) {
    els.transportState.textContent = "Rendering WAV";
  } else {
    els.transportState.textContent = "Stopped";
  }

  updateControlStates();
  scheduleScreenViewLayout();
}

function syncCurrentStepHighlight(step) {
  document.querySelectorAll(".sequence-cell.current").forEach((cell) => cell.classList.remove("current"));

  if (step < 0) {
    return;
  }

  document.querySelectorAll(`.sequence-cell[data-step="${step}"]`).forEach((cell) => cell.classList.add("current"));
}

function buildMonitorFrame(step) {
  if (!state.composition) {
    return null;
  }

  return {
    step,
    composition: state.composition,
    summary: step >= 0 ? state.composition.stepSummaries?.[step] || null : null,
  };
}

function clampMonitorStep(step) {
  if (!state.composition) {
    return -1;
  }

  return clamp(step, 0, Math.max(0, state.composition.totalSteps - 1));
}

function inspectMonitorStep(step, options = {}) {
  if (!state.composition) {
    return null;
  }

  const targetStep = options.snapToBeat
    ? clamp(Math.floor(step / 4) * 4, 0, Math.floor((state.composition.totalSteps - 1) / 4) * 4)
    : clampMonitorStep(step);
  const frame = buildMonitorFrame(targetStep);

  if (!frame) {
    return null;
  }

  state.liveMonitorFrozen = options.freeze ?? true;
  state.liveMonitorFrame = state.liveMonitorFrozen ? frame : null;
  state.currentStep = frame.step;
  syncCurrentStepHighlight(frame.step);
  renderLivePanel(frame);
  updateTransportLabel();
  return frame;
}

function moveMonitorBeat(direction) {
  if (!state.composition) {
    return null;
  }

  const currentStep =
    (state.liveMonitorFrozen && state.liveMonitorFrame?.step >= 0
      ? state.liveMonitorFrame.step
      : state.lastPlaybackFrame?.step >= 0
        ? state.lastPlaybackFrame.step
        : state.currentStep >= 0
          ? state.currentStep
          : 0);
  const baseBeatStep = Math.floor(currentStep / 4) * 4;
  return inspectMonitorStep(baseBeatStep + direction * 4, { freeze: true, snapToBeat: true });
}

function toggleLiveMonitorFreeze() {
  if (!state.composition) {
    return false;
  }

  if (!state.liveMonitorFrozen) {
    const freezeFrame = inspectMonitorStep(
      state.lastPlaybackFrame?.step >= 0 ? state.lastPlaybackFrame.step : state.currentStep >= 0 ? state.currentStep : 0,
      { freeze: true }
    );

    if (!freezeFrame) {
      return false;
    }
    return true;
  }

  state.liveMonitorFrozen = false;
  state.liveMonitorFrame = null;

  const liveFrame = engine.isPlaying && state.lastPlaybackFrame?.step >= 0 ? state.lastPlaybackFrame : null;
  state.currentStep = liveFrame?.step ?? -1;
  syncCurrentStepHighlight(state.currentStep);
  renderLivePanel(liveFrame);
  updateTransportLabel();
  return false;
}

function handleStepChange(frame) {
  const normalizedFrame = typeof frame === "number" ? buildMonitorFrame(frame) : frame;
  const step = normalizedFrame?.step ?? -1;

  state.lastPlaybackFrame = normalizedFrame || buildMonitorFrame(step);

  if (state.liveMonitorFrozen) {
    updateTransportLabel();
    return;
  }

  state.currentStep = step;
  syncCurrentStepHighlight(step);

  if (step < 0 || !state.composition) {
    renderLivePanel();
    updateTransportLabel();
    return;
  }

  renderLivePanel(normalizedFrame);
  updateTransportLabel();
}

async function loadAndCompose(input) {
  setLoading(true);
  setStatus("Fetching block data and generating the score...", "idle");

  try {
    const blockPackage = await fetchBlockPackage(input);
    const composition = buildComposition(blockPackage, state.soundProfileId);
    const hadCustomMix = engine.hasMutedTracks() || engine.hasSoloTracks();

    engine.clearMutedTracks();
    engine.clearSoloTracks();

    state.blockPackage = blockPackage;
    state.composition = composition;
    state.currentStep = -1;
    state.liveMonitorFrozen = false;
    state.liveMonitorFrame = null;
    state.lastPlaybackFrame = null;

    renderComposition(composition);
    els.blockInput.value = blockPackage.block.height;
    replaceAppUrl(blockPackage.block.id);
    setStatus(
      `Block #${formatNumber(blockPackage.block.height)} is ready in ${composition.soundProfileLabel}${hadCustomMix ? " with the mix reset to full." : "."}`,
      "success"
    );

    if (engine.isPlaying) {
      await engine.play(composition);
    }

    return composition;
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Could not load that block.", "error");
    return null;
  } finally {
    setLoading(false);
    updateTransportLabel();
  }
}

function downloadSonicDna() {
  if (!state.composition) {
    return;
  }

  const blob = new Blob([JSON.stringify(state.composition.downloadPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const profileSuffix = state.composition.soundProfileId === DEFAULT_SOUND_PROFILE_ID ? "" : `-${state.composition.soundProfileId}`;
  link.download = `block-${state.composition.block.height}${profileSuffix}-sonic-dna.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function audioBufferToWav(audioBuffer) {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const dataSize = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;

  writeAscii(view, offset, "RIFF");
  offset += 4;
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeAscii(view, offset, "WAVE");
  offset += 4;
  writeAscii(view, offset, "fmt ");
  offset += 4;
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numberOfChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, bytesPerSample * 8, true);
  offset += 2;
  writeAscii(view, offset, "data");
  offset += 4;
  view.setUint32(offset, dataSize, true);
  offset += 4;

  const channels = Array.from({ length: numberOfChannels }, (_, index) => audioBuffer.getChannelData(index));

  for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < numberOfChannels; channelIndex += 1) {
      const sample = clamp(channels[channelIndex][sampleIndex], -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

async function exportWav() {
  if (!state.composition) {
    return;
  }

  setExporting(true);
  setStatus("Rendering block to WAV...", "idle");
  updateTransportLabel();

  try {
    const renderedBuffer = await engine.renderWav(state.composition);
    const wavBuffer = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const profileSuffix = state.composition.soundProfileId === DEFAULT_SOUND_PROFILE_ID ? "" : `-${state.composition.soundProfileId}`;
    link.download = `block-${state.composition.block.height}${profileSuffix}.wav`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported block #${formatNumber(state.composition.block.height)} as a WAV file.`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Could not export that WAV file.", "error");
  } finally {
    setExporting(false);
    updateTransportLabel();
  }
}

async function startPlayback(options = {}) {
  if (!state.composition) {
    return null;
  }

  try {
    await engine.play(state.composition, options);
    updateTransportLabel();
    setStatus(`Playing block #${formatNumber(state.composition.block.height)}.`, "success");
    return state.composition;
  } catch (error) {
    console.error(error);
    setStatus("The browser blocked audio. Try pressing play again.", "error");
    return null;
  }
}

function exposePublicApi() {
  window.bitcoinBlockMusic = {
    async unlockAudio() {
      await engine.ensureAudio();
      return emitSnapshot(true);
    },
    async loadBlock(input) {
      const composition = await loadAndCompose(input);
      return composition ? emitSnapshot(true) : null;
    },
    async setSoundProfile(profileId) {
      const composition = await applySoundProfile(profileId);
      return composition ? emitSnapshot(true) : getPlaybackSnapshot();
    },
    async playCurrent(options = {}) {
      const composition = await startPlayback(options);
      return composition ? emitSnapshot(true) : null;
    },
    stop() {
      engine.stop();
      updateTransportLabel();
      return emitSnapshot(true);
    },
    async suspendAudio() {
      await engine.suspendAudio();
      updateTransportLabel();
      return emitSnapshot(true);
    },
    async getLatestTipHeight() {
      return fetchLatestTipHeight();
    },
    getSnapshot() {
      return getPlaybackSnapshot();
    },
  };
}

els.blockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadAndCompose(els.blockInput.value);
});

els.latestButton.addEventListener("click", async () => {
  await loadAndCompose("");
});

els.presetButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const block = button.dataset.block || "";
    await loadAndCompose(block);
  });
});

els.soundProfileButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await applySoundProfile(button.dataset.soundProfile);
  });
});

if (els.soundProfileSwitch) {
  els.soundProfileSwitch.addEventListener("click", async () => {
    await applySoundProfile(getNextSoundProfileId());
  });
}

els.playButton.addEventListener("click", async () => {
  await startPlayback();
});

document.addEventListener("keydown", async (event) => {
  if (event.repeat) {
    return;
  }

  const target = event.target;
  const isTypingTarget =
    target instanceof HTMLElement &&
    (target.matches("input, textarea, select, button") || target.isContentEditable);

  if (isTypingTarget || !state.composition) {
    return;
  }

  if (event.code === "Escape") {
    if (!engine.isPlaying) {
      return;
    }

    event.preventDefault();
    engine.stop();
    updateTransportLabel();
    setStatus("Playback stopped.", "idle");
    return;
  }

  if (event.code === "KeyF") {
    event.preventDefault();
    const isFrozen = toggleLiveMonitorFreeze();
    const summary = state.liveMonitorFrame?.summary;
    setStatus(
      isFrozen && summary
        ? `Live monitor frozen at step ${summary.step + 1}, measure ${summary.measure}, beat ${summary.beat}.`
        : "Live monitor returned to live playback.",
      "success"
    );
    return;
  }

  if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
    event.preventDefault();
    const frame = moveMonitorBeat(event.code === "ArrowLeft" ? -1 : 1);

    if (!frame?.summary) {
      return;
    }

    setStatus(`Inspecting step ${frame.summary.step + 1}, measure ${frame.summary.measure}, beat ${frame.summary.beat}.`, "success");
    return;
  }

  if (event.code !== "Space") {
    return;
  }

  event.preventDefault();

  if (engine.isPlaying) {
    engine.stop();
    updateTransportLabel();
    setStatus("Playback stopped.", "idle");
    return;
  }

  await startPlayback();
});

els.stopButton.addEventListener("click", () => {
  engine.stop();
  updateTransportLabel();
  setStatus("Playback stopped.", "idle");
});

els.downloadButton.addEventListener("click", downloadSonicDna);
els.exportWavButton.addEventListener("click", async () => exportWav());
els.prevBeatButton.addEventListener("click", () => {
  const frame = moveMonitorBeat(-1);

  if (!frame?.summary) {
    return;
  }

  setStatus(`Inspecting step ${frame.summary.step + 1}, measure ${frame.summary.measure}, beat ${frame.summary.beat}.`, "success");
});
els.nextBeatButton.addEventListener("click", () => {
  const frame = moveMonitorBeat(1);

  if (!frame?.summary) {
    return;
  }

  setStatus(`Inspecting step ${frame.summary.step + 1}, measure ${frame.summary.measure}, beat ${frame.summary.beat}.`, "success");
});
els.freezeMonitorButton.addEventListener("click", () => {
  if (!state.composition) {
    return;
  }

  const isFrozen = toggleLiveMonitorFreeze();
  const summary = state.liveMonitorFrame?.summary;
  setStatus(
    isFrozen && summary
      ? `Live monitor frozen at step ${summary.step + 1}, measure ${summary.measure}, beat ${summary.beat}.`
      : "Live monitor returned to live playback.",
    "success"
  );
});
els.sequencer.addEventListener("click", (event) => {
  const muteButton = event.target.closest("[data-track-toggle]");
  const soloButton = event.target.closest("[data-track-solo]");
  const stepCell = event.target.closest("[data-step]");

  if (!state.composition) {
    return;
  }

  if (soloButton) {
    const trackId = soloButton.dataset.trackSolo;

    if (!trackId) {
      return;
    }

    const isSoloed = engine.toggleTrackSolo(trackId);
    renderSequencer(state.composition);
    renderLivePanel();
    setStatus(`${TRACK_LOOKUP[trackId].name} ${isSoloed ? "soloed" : "unsoloed"}.`, "success");
    return;
  }

  if (muteButton) {
    const trackId = muteButton.dataset.trackToggle;

    if (!trackId) {
      return;
    }

    const isMuted = engine.toggleTrackMuted(trackId);
    renderSequencer(state.composition);
    renderLivePanel();
    setStatus(`${TRACK_LOOKUP[trackId].name} ${isMuted ? "muted" : "unmuted"}.`, "success");
    return;
  }

  if (stepCell) {
    const step = Number(stepCell.dataset.step);

    if (!Number.isFinite(step)) {
      return;
    }

    const frame = inspectMonitorStep(step, { freeze: true });

    if (!frame?.summary) {
      return;
    }

    setStatus(
      `Inspecting step ${frame.summary.step + 1}, measure ${frame.summary.measure}, beat ${frame.summary.beat}.`,
      "success"
    );
  }
});

els.clearSolosButton.addEventListener("click", () => {
  if (!state.composition || !engine.hasSoloTracks()) {
    return;
  }

  engine.clearSoloTracks();
  renderSequencer(state.composition);
  renderLivePanel();
  setStatus("All solo states cleared.", "success");
});

els.unmuteAllButton.addEventListener("click", () => {
  if (!state.composition || !engine.hasMutedTracks()) {
    return;
  }

  engine.clearMutedTracks();
  renderSequencer(state.composition);
  renderLivePanel();
  setStatus("All tracks unmuted.", "success");
});

async function bootstrap() {
  renderEmptyState();
  updateTransportLabel();

  const queryBlock = pageParams.get("block");
  await loadAndCompose(queryBlock || "");
  emitSnapshot(true);
  scheduleScreenViewLayout();
}

exposePublicApi();
bootstrap();

if (isScreenView) {
  window.addEventListener("resize", scheduleScreenViewLayout);
}
