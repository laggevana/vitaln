const guideSteps = [
  { icon: "🥛", label: "Ihalo sa tubig", time: 16.5 },
  { icon: "⏰", label: "Iwanan ng 8 oras", time: 25.5 },
  { icon: "🪣", label: "Dagdagan ng tubig", time: 34.5 },
  { icon: "🌾", label: "I-apply sa buto o ugat", time: 42.5 },
  { icon: "🌱", label: "Itanim", time: 49.5 }
];

const YT_IDS = {
  intro: "Yx295QTOyw8",
  cropChoice: "J9mEgaHc2sc",
  riceMethod: "DvQ6T6QFu8k",
  "rice-seed": "rPlBRyoWGfc",
  "rice-seedling": "POAlM1mhih4",
  corn: "S4mlJ65Z544",
  vegetables: "Hp6B-MxKHOc",
  complete: "rQN6bsDoLEc"
};

const media = {
  "rice-seed": { title: "Palay: Buto", ytId: YT_IDS["rice-seed"], steps: guideSteps },
  "rice-seedling": { title: "Palay: Dapog", ytId: YT_IDS["rice-seedling"], steps: guideSteps },
  corn: { title: "Mais", ytId: YT_IDS.corn, steps: guideSteps },
  vegetables: { title: "Sibuyas", ytId: YT_IDS.vegetables, steps: guideSteps }
};

const screens = [...document.querySelectorAll(".screen")];
const videoLoading = document.querySelector("#video-loading");
let activeScreen = "welcome";
let previousSelection = "crop";
let currentVideo = null;
let lastCropVideo = null;
let videoWatchedFully = false;
let cropChosen = false;
let cropNudgeStarted = false;
let nudgeTimers = [];

const NUDGE_DURATION = 1200;
const NUDGE_STAGGER = 1000;
const NUDGE_LOOP_GAP = 2000;

const cropChoiceButtons = [
  document.querySelector(".crop-choice.palay"),
  document.querySelector(".crop-choice.mais"),
  document.querySelector(".crop-choice.gulay")
];

function clearNudges() {
  nudgeTimers.forEach(clearTimeout);
  nudgeTimers = [];
  cropChoiceButtons.forEach(btn => btn.classList.remove("nudge"));
}

function startNudgeLoop() {
  clearNudges();
  function cycle() {
    if (cropChosen) return;
    cropChoiceButtons.forEach((btn, i) => {
      nudgeTimers.push(setTimeout(() => {
        if (cropChosen) return;
        btn.classList.add("nudge");
        nudgeTimers.push(setTimeout(() => btn.classList.remove("nudge"), NUDGE_DURATION));
      }, i * NUDGE_STAGGER));
    });
    nudgeTimers.push(setTimeout(cycle, cropChoiceButtons.length * NUDGE_STAGGER + NUDGE_LOOP_GAP));
  }
  cycle();
}

let completeActionChosen = false;
let completeNudgeTimers = [];
const completeActionButtons = [
  document.querySelector("#repeat-video"),
  document.querySelector("#finish-guide")
];

function clearCompleteNudges() {
  completeNudgeTimers.forEach(clearTimeout);
  completeNudgeTimers = [];
  completeActionButtons.forEach(btn => btn.classList.remove("nudge"));
}

function startCompleteNudgeLoop() {
  clearCompleteNudges();
  function cycle() {
    if (completeActionChosen) return;
    completeActionButtons.forEach((btn, i) => {
      completeNudgeTimers.push(setTimeout(() => {
        if (completeActionChosen) return;
        btn.classList.add("nudge");
        completeNudgeTimers.push(setTimeout(() => btn.classList.remove("nudge"), NUDGE_DURATION));
      }, i * NUDGE_STAGGER));
    });
    completeNudgeTimers.push(setTimeout(cycle, completeActionButtons.length * NUDGE_STAGGER + NUDGE_LOOP_GAP));
  }
  cycle();
}

const confettiLayer = document.querySelector("#confetti-layer");
const celebrateOverlay = document.querySelector("#celebrate-overlay");
const confettiColors = ["#cde548", "#174d35", "#5f9d36", "#ffffff", "#88711e"];

function spawnConfetti() {
  confettiLayer.innerHTML = "";
  for (let i = 0; i < 140; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    const size = 6 + Math.random() * 6;
    piece.style.width = size + "px";
    piece.style.height = (size * 1.6) + "px";
    piece.style.animationDuration = (2.2 + Math.random() * 1.8) + "s";
    piece.style.animationDelay = (Math.random() * 0.6) + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }
  setTimeout(() => { confettiLayer.innerHTML = ""; }, 4600);
}

function showCelebration() {
  celebrateOverlay.classList.add("show");
  setTimeout(() => celebrateOverlay.classList.remove("show"), 2000);
}

// ---- YouTube player embedding ----

const EMBED_WRAP_SELECTORS = {
  hero: ".hero-video",
  crop: ".crop-video",
  riceMethod: ".rice-method-video",
  guide: ".guide-embed",
  complete: ".complete-video-wrap .bg-video"
};

function fitEmbed(key) {
  const wrap = document.querySelector(EMBED_WRAP_SELECTORS[key]);
  const iframe = wrap && wrap.querySelector("iframe");
  if (!wrap || !iframe) return;
  const cw = wrap.clientWidth, ch = wrap.clientHeight;
  if (!cw || !ch) return;
  const videoRatio = 16 / 9;
  let w, h;
  if (cw / ch > videoRatio) { w = cw; h = w / videoRatio; }
  else { h = ch; w = h * videoRatio; }
  iframe.style.width = w + "px";
  iframe.style.height = h + "px";
  iframe.style.left = ((cw - w) / 2) + "px";
  iframe.style.top = ((ch - h) / 2) + "px";
}

function fitAllEmbeds() {
  Object.keys(EMBED_WRAP_SELECTORS).forEach(fitEmbed);
}
window.addEventListener("resize", fitAllEmbeds);

const players = {};
const playersReady = {};
let pendingGuideVideoId = null;

function createPlayer(elementId, videoId, playerVars, events) {
  return new YT.Player(elementId, {
    videoId,
    playerVars: Object.assign({
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      fs: 1
    }, playerVars),
    events
  });
}

window.onYouTubeIframeAPIReady = function () {
  players.hero = createPlayer("yt-hero", YT_IDS.intro, {
    autoplay: 1, mute: 1, loop: 1, playlist: YT_IDS.intro, controls: 0
  }, { onReady: () => fitEmbed("hero") });

  players.crop = createPlayer("yt-crop", YT_IDS.cropChoice, {
    autoplay: 1, mute: 1, loop: 1, playlist: YT_IDS.cropChoice, controls: 0
  }, { onReady: () => { fitEmbed("crop"); playersReady.crop = true; } });

  players.riceMethod = createPlayer("yt-rice-method", YT_IDS.riceMethod, {
    autoplay: 1, mute: 1, loop: 1, playlist: YT_IDS.riceMethod, controls: 0
  }, { onReady: () => { fitEmbed("riceMethod"); playersReady.riceMethod = true; } });

  players.guide = createPlayer("yt-guide", YT_IDS["rice-seed"], {
    autoplay: 0, controls: 1
  }, {
    onReady: () => {
      fitEmbed("guide");
      playersReady.guide = true;
      if (pendingGuideVideoId) {
        players.guide.loadVideoById(pendingGuideVideoId);
        pendingGuideVideoId = null;
      }
    },
    onStateChange: onGuideStateChange
  });

  players.complete = createPlayer("yt-complete", YT_IDS.complete, {
    autoplay: 0, controls: 1
  }, { onReady: () => { fitEmbed("complete"); playersReady.complete = true; } });
};

function onGuideStateChange(e) {
  if (e.data === YT.PlayerState.ENDED) {
    videoWatchedFully = true;
    showScreen("complete", false);
  } else if (e.data === YT.PlayerState.PLAYING) {
    videoLoading.hidden = true;
    startGuidePoll();
  } else if (e.data === YT.PlayerState.BUFFERING) {
    videoLoading.hidden = false;
  } else if (e.data === YT.PlayerState.PAUSED) {
    stopGuidePoll();
  }
}

// ---- Polling loops replacing native "timeupdate" ----

let cropPollTimer = null;
function startCropPoll() {
  stopCropPoll();
  cropPollTimer = setInterval(() => {
    if (activeScreen !== "crop" || !playersReady.crop || cropNudgeStarted) return;
    const t = players.crop.getCurrentTime();
    if (t >= 2) { cropNudgeStarted = true; startNudgeLoop(); }
  }, 250);
}
function stopCropPoll() { if (cropPollTimer) clearInterval(cropPollTimer); cropPollTimer = null; }

const dapogBtn = document.querySelector(".rice-choice.dapog");
const butoBtn = document.querySelector(".rice-choice.buto");
let riceCues = { dapog: false, buto: false, both: false };

function resetRiceCues() {
  riceCues = { dapog: false, buto: false, both: false };
  dapogBtn.classList.remove("nudge", "nudge-minimal");
  butoBtn.classList.remove("nudge", "nudge-minimal");
}

function bounceOnce(btn, cls) {
  btn.classList.add(cls);
  setTimeout(() => btn.classList.remove(cls), NUDGE_DURATION);
}

let riceMethodPollTimer = null;
function startRiceMethodPoll() {
  stopRiceMethodPoll();
  riceMethodPollTimer = setInterval(() => {
    if (activeScreen !== "rice-method" || !playersReady.riceMethod) return;
    const t = players.riceMethod.getCurrentTime();
    if (t >= 2 && !riceCues.dapog) { riceCues.dapog = true; bounceOnce(dapogBtn, "nudge"); }
    if (t >= 4 && !riceCues.buto) { riceCues.buto = true; bounceOnce(butoBtn, "nudge"); }
    if (t >= 7 && !riceCues.both) {
      riceCues.both = true;
      bounceOnce(dapogBtn, "nudge-minimal");
      bounceOnce(butoBtn, "nudge-minimal");
    }
  }, 250);
}
function stopRiceMethodPoll() { if (riceMethodPollTimer) clearInterval(riceMethodPollTimer); riceMethodPollTimer = null; }

let guidePollTimer = null;
function startGuidePoll() {
  stopGuidePoll();
  guidePollTimer = setInterval(() => {
    if (activeScreen !== "video" || !playersReady.guide) return;
    updateActiveStep(media[currentVideo]?.steps, players.guide.getCurrentTime());
  }, 250);
}
function stopGuidePoll() { if (guidePollTimer) clearInterval(guidePollTimer); guidePollTimer = null; }

// ---- Screen management ----

function showScreen(name, narrate = true) {
  if (name === "crop") {
    cropChosen = false;
    cropNudgeStarted = false;
    clearNudges();
    if (playersReady.crop) { players.crop.seekTo(0); players.crop.unMute(); players.crop.playVideo(); }
    startCropPoll();
  } else {
    if (playersReady.crop) { players.crop.pauseVideo(); players.crop.seekTo(0); players.crop.mute(); }
    clearNudges();
    stopCropPoll();
  }

  if (name === "rice-method") {
    resetRiceCues();
    if (playersReady.riceMethod) { players.riceMethod.seekTo(0); players.riceMethod.unMute(); players.riceMethod.playVideo(); }
    startRiceMethodPoll();
  } else {
    if (playersReady.riceMethod) { players.riceMethod.pauseVideo(); players.riceMethod.seekTo(0); players.riceMethod.mute(); }
    stopRiceMethodPoll();
  }

  if (name === "complete") {
    if (playersReady.complete) { players.complete.seekTo(0); players.complete.unMute(); players.complete.playVideo(); }
    completeActionChosen = false;
    startCompleteNudgeLoop();
    if (videoWatchedFully) {
      spawnConfetti();
      showCelebration();
    }
  } else {
    if (playersReady.complete) { players.complete.pauseVideo(); players.complete.seekTo(0); players.complete.mute(); }
    clearCompleteNudges();
  }

  if (name !== "video") {
    if (playersReady.guide) { players.guide.pauseVideo(); players.guide.mute(); }
    stopGuidePoll();
  }

  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === name));
  activeScreen = name;
  requestAnimationFrame(fitAllEmbeds);
}

const stepsPanel = document.querySelector(".steps-panel");
const stepsList = document.querySelector("#steps-list");

function renderSteps(steps) {
  if (!steps) {
    stepsPanel.hidden = true;
    stepsList.innerHTML = "";
    return;
  }
  stepsPanel.hidden = false;
  stepsList.innerHTML = steps.map((step, i) => `
    <li class="step-item" data-index="${i}" data-time="${step.time}">
      <span class="step-number">${i + 1}</span>
      <span class="step-icon" aria-hidden="true">${step.icon}</span>
      <span class="step-label">${step.label}</span>
    </li>`).join("");
}

function updateActiveStep(steps, currentTime) {
  if (!steps) return;
  let activeIndex = 0;
  steps.forEach((step, i) => { if (currentTime >= step.time) activeIndex = i; });
  stepsList.querySelectorAll(".step-item").forEach((el, i) => el.classList.toggle("active", i === activeIndex));
}

function loadVideo(key) {
  currentVideo = key;
  lastCropVideo = key;
  videoWatchedFully = false;
  const item = media[key];
  document.querySelector("#video-title").textContent = item.title;
  videoLoading.hidden = false;
  renderSteps(item.steps);
  if (playersReady.guide) {
    players.guide.loadVideoById(item.ytId);
  } else {
    pendingGuideVideoId = item.ytId;
  }
  showScreen("video", false);
}

document.addEventListener("click", event => {
  if (event.target.closest(".crop-choice")) { cropChosen = true; clearNudges(); }
  const go = event.target.closest("[data-go]");
  if (go) { showScreen(go.dataset.go); return; }
  const choice = event.target.closest("[data-video]");
  if (choice) {
    previousSelection = activeScreen;
    loadVideo(choice.dataset.video);
    return;
  }
  if (event.target.closest("[data-back]")) { showScreen(previousSelection); return; }
  const step = event.target.closest(".step-item");
  if (step && playersReady.guide) {
    players.guide.seekTo(Number(step.dataset.time), true);
    players.guide.playVideo();
  }
});

document.querySelector("#kasunod-btn").addEventListener("click", () => showScreen("complete", false));
document.querySelector("#repeat-video").addEventListener("click", () => { completeActionChosen = true; clearCompleteNudges(); if (lastCropVideo) loadVideo(lastCropVideo); });
document.querySelector("#finish-guide").addEventListener("click", () => { completeActionChosen = true; clearCompleteNudges(); showScreen("welcome"); });
