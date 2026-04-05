const state = {
  entries: [],
  currentEntry: null,
  currentSpeed: 1,
  isPlaying: false,
  mode: null,
  tts: {
    synth: window.speechSynthesis || null,
    utterance: null,
    voices: [],
    estimatedDuration: 0,
    elapsedSeconds: 0,
    progressTimer: null,
    restartOffset: 0,
  },
  audio: {
    element: document.getElementById("detailAudio"),
    broken: false,
    pendingPlay: false,
  },
};

const els = {
  navItems: Array.from(document.querySelectorAll(".nav-item")),
  views: Array.from(document.querySelectorAll(".view")),
  detailNr: document.getElementById("detailNr"),
  detailTitle: document.getElementById("detailTitle"),
  body: document.getElementById("feldnotizBody"),
  sources: document.getElementById("sourcesList"),
  entryList: document.getElementById("entryList"),
  entryEmpty: document.getElementById("entryEmpty"),
  playBtn: document.getElementById("playBtn"),
  progressTrack: document.getElementById("progressTrack"),
  progressFill: document.getElementById("progressFill"),
  playerTime: document.getElementById("playerTime"),
  playerStatus: document.getElementById("playerStatus"),
  statusText: document.getElementById("statusText"),
  voiceTag: document.getElementById("voiceTag"),
  ttsNotice: document.getElementById("ttsNotice"),
  waveform: document.getElementById("waveform"),
  speedButtons: Array.from(document.querySelectorAll(".speed-btn")),
};

const BAR_COUNT = 52;

function init() {
  buildWaveform();
  bindAudioEvents();
  bindSpeechVoices();
  setSpeed(1, els.speedButtons.find((button) => button.dataset.speed === "1"));

  if (document.body.dataset.pageType === "archive") {
    void loadArchiveEntries();
    return;
  }

  initTemplateEntry();
}

function buildWaveform() {
  if (!els.waveform) return;

  for (let index = 0; index < BAR_COUNT; index += 1) {
    const bar = document.createElement("div");
    const from = 10 + Math.random() * 30;
    const to = 40 + Math.random() * 60;
    const duration = 0.4 + Math.random() * 0.7;

    bar.className = "wave-bar";
    bar.style.setProperty("--h-from", `${from}%`);
    bar.style.setProperty("--h-to", `${to}%`);
    bar.style.setProperty("--dur", `${duration}s`);
    bar.style.height = `${from}%`;
    bar.style.animationDelay = `${Math.random() * 0.5}s`;
    els.waveform.appendChild(bar);
  }
}

async function loadArchiveEntries() {
  const url = document.body.dataset.entriesPath || "./data/entries.json";

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`entries request failed with ${response.status}`);
    }

    const parsed = await response.json();
    state.entries = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load entries.json", error);
    state.entries = [];
  }

  renderEntryList();
}

function renderEntryList() {
  if (!els.entryList) return;

  els.entryList.innerHTML = "";
  const hasEntries = state.entries.length > 0;
  els.entryList.hidden = !hasEntries;

  if (els.entryEmpty) {
    els.entryEmpty.hidden = hasEntries;
  }

  if (!hasEntries) {
    return;
  }

  state.entries.forEach((entry) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "entry-card";
    card.addEventListener("click", () => showDetail(entry));

    const sourceCount = Array.isArray(entry.sources) ? entry.sources.length : 0;
    const previewText = Array.isArray(entry.paragraphs) ? entry.paragraphs[0] || "" : "";

    card.innerHTML = `
      <div>
        <div class="entry-id">${escapeHtml(entry.nr || "FELDNOTIZ")}</div>
        <div class="entry-date">${escapeHtml(entry.date || "")}</div>
        <div class="entry-sources" style="margin-top:8px;">${sourceCount} Quellen</div>
      </div>
      <div class="entry-preview">${escapeHtml(truncate(previewText, 220))}</div>
      <div class="entry-action">Protokoll oeffnen -&gt;</div>
    `;

    els.entryList.appendChild(card);
  });
}

function initTemplateEntry() {
  const root = document.getElementById("entryTemplateData");
  if (!root) {
    updateStatus("BEREIT - UEBERTRAGUNG STARTEN");
    return;
  }

  const paragraphRoot = document.getElementById("entryTemplateParagraphs");
  const sourceRoot = document.getElementById("entryTemplateSources");

  const paragraphs = paragraphRoot
    ? Array.from(paragraphRoot.querySelectorAll("p")).map((node) => node.innerHTML.trim()).filter(Boolean)
    : [];

  const sources = sourceRoot
    ? Array.from(sourceRoot.querySelectorAll("li")).map((item) => {
        const link = item.querySelector("a");
        return {
          label: (link || item).textContent.trim(),
          url: link ? link.getAttribute("href") || "" : "",
        };
      }).filter((source) => source.label || source.url)
    : [];

  const entry = {
    nr: root.dataset.nr || "FELDNOTIZ",
    date: root.dataset.date || "",
    title: root.dataset.title || "",
    paragraphs,
    sources,
    audio: root.dataset.audio || "",
  };

  state.currentEntry = entry;
  prepareAudio(entry);
  updateStatus("BEREIT - UEBERTRAGUNG STARTEN");
  updateVoiceTag();
}

function switchView(id, el) {
  els.views.forEach((view) => view.classList.remove("active"));
  els.navItems.forEach((item) => item.classList.remove("active"));

  const nextView = document.getElementById(`view-${id}`);
  if (nextView) {
    nextView.classList.add("active");
  }

  if (el) {
    el.classList.add("active");
  }

  stopAudio();
}

function showDetail(entry) {
  state.currentEntry = entry;
  populateDetail(entry);
  prepareAudio(entry);
  stopAudio();
  switchView("detail");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateDetail(entry) {
  if (els.detailNr) {
    els.detailNr.textContent = `${entry.nr || "FELDNOTIZ"} - ${entry.date || ""}`;
  }

  if (els.detailTitle) {
    els.detailTitle.innerHTML = entry.title || "";
  }

  if (els.body) {
    const paragraphs = Array.isArray(entry.paragraphs) ? entry.paragraphs : [];
    els.body.innerHTML = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
  }

  if (els.sources) {
    const sources = Array.isArray(entry.sources) ? entry.sources : [];
    els.sources.innerHTML = sources.length
      ? sources
          .map(
            (source) =>
              `<li><a href="${source.url}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a></li>`,
          )
          .join("")
      : '<li style="font-family: var(--font-ui); font-size: 9px; color: var(--text-dim); letter-spacing: 0.1em;">Keine Quellen fuer diesen Eintrag hinterlegt.</li>';
  }
}

function backToArchiv() {
  stopAudio();
  switchView("archiv");

  if (els.navItems[0]) {
    els.navItems[0].classList.add("active");
  }
}

function bindAudioEvents() {
  const audio = state.audio.element;
  if (!audio) return;

  audio.addEventListener("loadedmetadata", () => {
    state.audio.broken = false;
    updateProgressFromAudio();
  });

  audio.addEventListener("timeupdate", () => {
    if (state.mode === "audio") {
      updateProgressFromAudio();
    }
  });

  audio.addEventListener("ended", () => {
    state.audio.pendingPlay = false;
    onPlaybackEnded();
  });

  audio.addEventListener("error", () => {
    state.audio.pendingPlay = false;
    state.audio.broken = true;
    if (state.currentEntry && canUseTts()) {
      startTts(state.currentEntry, 0);
    } else {
      stopAudio();
    }
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended && state.mode === "audio") {
      setPlayingState(false, "PAUSIERT");
    }
  });

  audio.addEventListener("play", () => {
    state.mode = "audio";
    setPlayingState(true, activeStatusLabel());
  });
}

function bindSpeechVoices() {
  if (!canUseTts()) {
    updateVoiceTag();
    return;
  }

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function loadVoices() {
  state.tts.voices = state.tts.synth.getVoices();
  updateVoiceTag();
}

function updateVoiceTag() {
  if (!els.voiceTag) return;

  if (hasUsableAudio()) {
    els.voiceTag.textContent = "QUELLE: LOKALE AUDIODATEI";
    return;
  }

  const voice = findGermanVoice();
  els.voiceTag.textContent = voice
    ? `STIMME: ${voice.name.toUpperCase().slice(0, 18)}`
    : "STIMME: WEB SPEECH FALLBACK";
}

function prepareAudio(entry) {
  const audio = state.audio.element;
  if (!audio) return;

  const nextSrc = entry.audio || entry.audioPath || entry.audio_src || "";
  state.audio.broken = false;
  state.audio.pendingPlay = false;
  audio.pause();
  audio.currentTime = 0;

  if (audio.getAttribute("src") !== nextSrc) {
    if (nextSrc) {
      audio.setAttribute("src", nextSrc);
    } else {
      audio.removeAttribute("src");
    }
    audio.load();
  }

  updateVoiceTag();
}

function hasUsableAudio() {
  const audio = state.audio.element;
  if (!audio) return false;
  return Boolean(audio.getAttribute("src")) && !state.audio.broken;
}

function canUseTts() {
  return Boolean(state.tts.synth);
}

function togglePlay() {
  if (state.isPlaying) {
    pauseAudio();
    return;
  }

  const entry = state.currentEntry || state.entries[0];
  if (!entry) {
    updateStatus("KEINE FELDNOTIZ VERFUEGBAR");
    return;
  }

  if (hasUsableAudio()) {
    startHtmlAudio();
    return;
  }

  if (canUseTts()) {
    startTts(entry, state.tts.restartOffset);
    return;
  }

  if (els.playBtn) {
    els.playBtn.disabled = true;
    els.playBtn.style.opacity = "0.3";
  }

  if (els.ttsNotice) {
    els.ttsNotice.style.display = "block";
    els.ttsNotice.textContent = "Keine lokale Audioquelle gefunden und Web Speech API ist nicht verfuegbar.";
  }

  updateStatus("KEINE AUDIOAUSGABE VERFUEGBAR");
}

function startHtmlAudio() {
  const audio = state.audio.element;
  if (!audio) return;

  stopTtsOnly();
  state.mode = "audio";
  audio.playbackRate = state.currentSpeed;
  state.audio.pendingPlay = true;

  audio
    .play()
    .then(() => {
      state.audio.pendingPlay = false;
      if (els.ttsNotice) {
        els.ttsNotice.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("HTML audio playback failed", error);
      state.audio.pendingPlay = false;
      state.audio.broken = true;
      if (state.currentEntry && canUseTts()) {
        startTts(state.currentEntry, 0);
      } else {
        updateStatus("AUDIO KONNTE NICHT GELADEN WERDEN");
      }
    });
}

function startTts(entry, offsetSeconds) {
  if (!canUseTts()) return;

  stopHtmlAudioOnly();
  stopTtsOnly();
  state.mode = "tts";
  state.tts.elapsedSeconds = 0;

  const paragraphs = Array.isArray(entry.paragraphs) ? entry.paragraphs : [];
  const fullText = paragraphs.join(". ");
  const resumeOffset = Math.max(0, Math.floor(offsetSeconds));
  const text = resumeOffset > 0 ? fullText.slice(charOffsetForSeconds(fullText, resumeOffset)) : fullText;

  state.tts.utterance = new SpeechSynthesisUtterance(text);
  state.tts.utterance.lang = "de-DE";
  state.tts.utterance.rate = state.currentSpeed;
  state.tts.utterance.pitch = 0.88;

  const voice = findGermanVoice();
  if (voice) {
    state.tts.utterance.voice = voice;
  }

  state.tts.estimatedDuration = estimateDurationSeconds(fullText, state.currentSpeed);
  state.tts.restartOffset = resumeOffset;

  state.tts.utterance.onend = onPlaybackEnded;
  state.tts.utterance.onerror = onPlaybackEnded;
  state.tts.synth.speak(state.tts.utterance);

  if (els.ttsNotice) {
    els.ttsNotice.style.display = "block";
    els.ttsNotice.textContent = "Lokale Audiodatei fehlt oder konnte nicht geladen werden. Wiedergabe erfolgt per Web Speech API.";
  }

  setPlayingState(true, activeStatusLabel());
  startTtsProgressTimer();
}

function pauseAudio() {
  if (state.mode === "audio" && state.audio.element) {
    state.audio.element.pause();
    return;
  }

  if (state.mode === "tts" && canUseTts()) {
    state.tts.synth.cancel();
    clearInterval(state.tts.progressTimer);
    state.tts.restartOffset += state.tts.elapsedSeconds;
    state.tts.elapsedSeconds = 0;
    setPlayingState(false, "PAUSIERT");
  }
}

function stopAudio() {
  stopHtmlAudioOnly();
  stopTtsOnly();
  state.mode = null;
  state.audio.pendingPlay = false;
  state.tts.restartOffset = 0;
  resetProgress();
  setPlayingState(false, "BEREIT - UEBERTRAGUNG STARTEN");
}

function stopHtmlAudioOnly() {
  const audio = state.audio.element;
  if (!audio) return;

  audio.pause();
  if (!Number.isNaN(audio.currentTime)) {
    audio.currentTime = 0;
  }
}

function stopTtsOnly() {
  if (canUseTts()) {
    state.tts.synth.cancel();
  }
  clearInterval(state.tts.progressTimer);
  state.tts.utterance = null;
  state.tts.elapsedSeconds = 0;
}

function onPlaybackEnded() {
  clearInterval(state.tts.progressTimer);
  state.tts.elapsedSeconds = 0;
  state.tts.restartOffset = 0;
  state.mode = null;
  setPlayingState(false, "UEBERTRAGUNG ABGESCHLOSSEN");

  if (els.progressFill) {
    els.progressFill.style.width = "100%";
  }
}

function setPlayingState(playing, statusLabel) {
  state.isPlaying = playing;

  if (els.playBtn) {
    els.playBtn.textContent = playing ? "II" : ">";
  }

  if (els.waveform) {
    els.waveform.classList.toggle("playing", playing);
  }

  if (els.playerStatus) {
    els.playerStatus.classList.toggle("playing", playing);
  }

  updateStatus(statusLabel);
}

function updateStatus(label) {
  if (els.statusText) {
    els.statusText.textContent = label;
  }
}

function activeStatusLabel() {
  return `UEBERTRAGUNG AKTIV - ${(state.currentEntry && state.currentEntry.nr) || "FELDNOTIZ"}`;
}

function startTtsProgressTimer() {
  clearInterval(state.tts.progressTimer);
  state.tts.progressTimer = window.setInterval(() => {
    state.tts.elapsedSeconds += 0.5;
    const elapsed = state.tts.restartOffset + state.tts.elapsedSeconds;
    const pct = Math.min((elapsed / Math.max(state.tts.estimatedDuration, 1)) * 100, 99);

    if (els.progressFill) {
      els.progressFill.style.width = `${pct}%`;
    }

    if (els.playerTime) {
      els.playerTime.textContent = formatTime(elapsed);
    }
  }, 500);
}

function updateProgressFromAudio() {
  const audio = state.audio.element;
  if (!audio) return;

  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
  const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (els.progressFill) {
    els.progressFill.style.width = `${Math.min(percent, 100)}%`;
  }

  if (els.playerTime) {
    els.playerTime.textContent = formatTime(currentTime);
  }
}

function resetProgress() {
  if (els.progressFill) {
    els.progressFill.style.width = "0%";
  }

  if (els.playerTime) {
    els.playerTime.textContent = "00:00";
  }
}

function setSpeed(speed, btn) {
  state.currentSpeed = speed;

  els.speedButtons.forEach((button) => {
    button.classList.toggle("active", button === btn || button.dataset.speed === String(speed));
  });

  if (state.audio.element) {
    state.audio.element.playbackRate = speed;
  }

  if (state.mode === "tts" && state.currentEntry) {
    startTts(state.currentEntry, state.tts.restartOffset + state.tts.elapsedSeconds);
  }
}

function seekTo(event) {
  const track = els.progressTrack;
  if (!track) return;

  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

  if (state.mode === "audio" && state.audio.element && Number.isFinite(state.audio.element.duration)) {
    state.audio.element.currentTime = pct * state.audio.element.duration;
    updateProgressFromAudio();
    return;
  }

  if (state.currentEntry && canUseTts()) {
    const nextOffset = pct * Math.max(state.tts.estimatedDuration, 1);
    state.tts.restartOffset = nextOffset;
    state.tts.elapsedSeconds = 0;

    if (els.progressFill) {
      els.progressFill.style.width = `${pct * 100}%`;
    }

    if (els.playerTime) {
      els.playerTime.textContent = formatTime(nextOffset);
    }

    if (state.isPlaying) {
      startTts(state.currentEntry, nextOffset);
    }
  }
}

function findGermanVoice() {
  return (
    state.tts.voices.find((voice) => voice.lang && voice.lang.startsWith("de") && voice.localService) ||
    state.tts.voices.find((voice) => voice.lang && voice.lang.startsWith("de")) ||
    null
  );
}

function estimateDurationSeconds(text, speed) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (words / (150 * speed)) * 60;
}

function charOffsetForSeconds(text, seconds) {
  const estimated = estimateDurationSeconds(text, state.currentSpeed);
  if (estimated <= 0) return 0;
  return Math.floor((seconds / estimated) * text.length);
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

window.switchView = switchView;
window.showDetail = showDetail;
window.backToArchiv = backToArchiv;
window.togglePlay = togglePlay;
window.setSpeed = setSpeed;
window.seekTo = seekTo;

init();
