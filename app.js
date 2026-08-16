const guideSteps = [
  { icon: "🥛", label: "Ihalo sa tubig", time: 16.5 },
  { icon: "⏰", label: "Iwanan ng 8 oras", time: 25.5 },
  { icon: "🪣", label: "Dagdagan ng tubig", time: 34.5 },
  { icon: "🌾", label: "I-apply sa buto o ugat", time: 42.5 },
  { icon: "🌱", label: "Itanim", time: 49.5 }
];

const media = {
  "rice-seed": { title: "Palay: Buto", src: "assets/videos/rice-seed.mp4", steps: guideSteps },
  "rice-seedling": { title: "Palay: Dapog", src: "assets/videos/rice-seedling.mp4", steps: guideSteps },
  corn: { title: "Mais", src: "assets/videos/corn.mp4", steps: guideSteps },
  vegetables: { title: "Sibuyas", src: "assets/videos/vegetables-onion.mp4", steps: guideSteps }
};

const screens = [...document.querySelectorAll(".screen")];
const video = document.querySelector("#guide-video");
const cropVideo = document.querySelector("#crop-video");
const riceMethodVideo = document.querySelector("#rice-method-video");
const completeVideo = document.querySelector("#complete-video");
const missing = document.querySelector("#media-missing");
const fallbackNext = document.querySelector("#fallback-next");
let activeScreen = "welcome";
let previousSelection = "crop";
let currentVideo = null;
let lastCropVideo = null;
let narration = null;
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

function stopNarration() {
  if (!narration) return;
  narration.pause();
  narration.currentTime = 0;
  narration = null;
}

function playNarration(screen) {
  const path = screen.dataset.audio;
  if (!path) return;
  narration = new Audio(path);
  narration.play().catch(() => { narration = null; });
}

function showScreen(name, narrate = true) {
  stopNarration();
  if (name === "crop") {
    cropChosen = false;
    cropNudgeStarted = false;
    clearNudges();
    cropVideo.currentTime = 0;
    cropVideo.removeAttribute("muted");
    cropVideo.defaultMuted = false;
    cropVideo.muted = false;
    cropVideo.play().catch(() => {
      cropVideo.controls = true;
      cropVideo.setAttribute("aria-label", "Play crop question video with sound");
    });
  } else {
    cropVideo.pause();
    cropVideo.currentTime = 0;
    clearNudges();
  }
  if (name === "rice-method") {
    riceMethodVideo.currentTime = 0;
    riceMethodVideo.removeAttribute("muted");
    riceMethodVideo.defaultMuted = false;
    riceMethodVideo.muted = false;
    riceMethodVideo.play().catch(() => {
      riceMethodVideo.controls = true;
      riceMethodVideo.setAttribute("aria-label", "Play rice question video with sound");
    });
    resetRiceCues();
  } else {
    riceMethodVideo.pause();
    riceMethodVideo.currentTime = 0;
  }
  if (name === "complete") {
    completeVideo.currentTime = 0;
    completeVideo.removeAttribute("muted");
    completeVideo.defaultMuted = false;
    completeVideo.muted = false;
    completeVideo.loop = false;
    completeVideo.play().catch(() => {
      completeVideo.controls = true;
      completeVideo.setAttribute("aria-label", "Play completion video with sound");
    });
    completeActionChosen = false;
    startCompleteNudgeLoop();
    if (videoWatchedFully) {
      spawnConfetti();
      showCelebration();
    }
  } else {
    completeVideo.pause();
    completeVideo.currentTime = 0;
    clearCompleteNudges();
  }
  if (name !== "video") { video.pause(); video.removeAttribute("src"); video.load(); }
  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === name));
  activeScreen = name;
  const next = screens.find(s => s.dataset.screen === name);
  if (narrate && next) playNarration(next);
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

let videoWatchedFully = false;

const videoLoading = document.querySelector("#video-loading");

function loadVideo(key) {
  stopNarration();
  currentVideo = key;
  lastCropVideo = key;
  videoWatchedFully = false;
  const item = media[key];
  document.querySelector("#video-title").textContent = item.title;
  document.querySelector("#missing-path").textContent = item.src;
  missing.hidden = true;
  fallbackNext.hidden = true;
  videoLoading.hidden = false;
  renderSteps(item.steps);
  video.src = item.src;
  video.load();
  showScreen("video", false);
  video.play().catch(() => {});
}

function mediaUnavailable() {
  missing.hidden = false;
  fallbackNext.hidden = false;
  fallbackNext.textContent = "Complete guide →";
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
  if (step) { video.currentTime = Number(step.dataset.time); video.play().catch(() => {}); }
});

cropVideo.addEventListener("timeupdate", () => {
  if (activeScreen !== "crop" || cropNudgeStarted) return;
  if (cropVideo.currentTime >= 2) {
    cropNudgeStarted = true;
    startNudgeLoop();
  }
});

cropVideo.addEventListener("ended", () => {
  if (activeScreen !== "crop") return;
  cropVideo.currentTime = 0;
  cropVideo.play().catch(() => {});
});

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

riceMethodVideo.addEventListener("timeupdate", () => {
  if (activeScreen !== "rice-method") return;
  const t = riceMethodVideo.currentTime;
  if (t >= 2 && !riceCues.dapog) { riceCues.dapog = true; bounceOnce(dapogBtn, "nudge"); }
  if (t >= 4 && !riceCues.buto) { riceCues.buto = true; bounceOnce(butoBtn, "nudge"); }
  if (t >= 7 && !riceCues.both) {
    riceCues.both = true;
    bounceOnce(dapogBtn, "nudge-minimal");
    bounceOnce(butoBtn, "nudge-minimal");
  }
});

riceMethodVideo.addEventListener("ended", () => {
  if (activeScreen !== "rice-method") return;
  resetRiceCues();
  riceMethodVideo.currentTime = 0;
  riceMethodVideo.play().catch(() => {});
});

video.addEventListener("error", mediaUnavailable);
video.addEventListener("ended", () => { videoWatchedFully = true; showScreen("complete", false); });
video.addEventListener("timeupdate", () => {
  document.querySelector("#progress").value = video.duration ? (video.currentTime / video.duration) * 100 : 0;
  document.querySelector("#time").textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  updateActiveStep(media[currentVideo]?.steps, video.currentTime);
});
video.addEventListener("play", () => document.querySelector("#play").textContent = "❚❚");
video.addEventListener("pause", () => document.querySelector("#play").textContent = "▶");
video.addEventListener("waiting", () => { videoLoading.hidden = false; });
video.addEventListener("playing", () => { videoLoading.hidden = true; });
video.addEventListener("canplay", () => { videoLoading.hidden = true; });

document.querySelector("#play").addEventListener("click", () => video.paused ? video.play() : video.pause());
document.querySelector("#progress").addEventListener("input", e => { if (video.duration) video.currentTime = video.duration * e.target.value / 100; });
document.querySelector("#mute").addEventListener("click", event => { video.muted = !video.muted; event.currentTarget.textContent = video.muted ? "×" : "♩"; });
document.querySelector("#fullscreen").addEventListener("click", () => document.querySelector(".player-shell").requestFullscreen?.());
fallbackNext.addEventListener("click", () => showScreen("complete", false));
document.querySelector("#kasunod-btn").addEventListener("click", () => showScreen("complete", false));
document.querySelector("#repeat-video").addEventListener("click", () => { completeActionChosen = true; clearCompleteNudges(); if (lastCropVideo) loadVideo(lastCropVideo); });
document.querySelector("#finish-guide").addEventListener("click", () => { completeActionChosen = true; clearCompleteNudges(); showScreen("welcome"); });

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
