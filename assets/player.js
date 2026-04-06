/* ── THEME ── */
function toggleTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

/* ── WAVEFORM ── */
document.addEventListener('DOMContentLoaded', () => {
  const waveformEl = document.getElementById('waveform');
  if (waveformEl) {
    for (let i = 0; i < 50; i++) {
      const b = document.createElement('div');
      b.className = 'wave-bar';
      const hf = 10 + Math.random() * 25;
      const ht = 45 + Math.random() * 55;
      b.style.height = hf + '%';
      b.style.setProperty('--hf', hf + '%');
      b.style.setProperty('--ht', ht + '%');
      b.style.setProperty('--dur', (0.4 + Math.random() * 0.7) + 's');
      b.style.animationDelay = (Math.random() * 0.4) + 's';
      waveformEl.appendChild(b);
    }
  }

  /* ── AUDIO ── */
  const audio = document.getElementById('feldnotiz-audio');
  if (!audio) return;

  let currentSpeed = 1;

  function setPlayState(playing) {
    const playBtn = document.getElementById('playBtn');
    const waveform = document.getElementById('waveform');
    const playerStatus = document.getElementById('playerStatus');
    const statusText = document.getElementById('statusText');

    if (playBtn) playBtn.textContent = playing ? '⏸' : '▶';
    if (waveform) waveform.classList.toggle('playing', playing);
    if (playerStatus) playerStatus.classList.toggle('playing', playing);
    if (statusText) statusText.textContent = playing ? 'Übertragung aktiv' : 'Pausiert';
  }

  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = pct + '%';
    const m = Math.floor(audio.currentTime / 60);
    const s = Math.floor(audio.currentTime % 60);
    const timeEl = document.getElementById('playerTime');
    if (timeEl) timeEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('ended', () => {
    setPlayState(false);
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = '100%';
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Übertragung abgeschlossen';
    const playerStatus = document.getElementById('playerStatus');
    if (playerStatus) playerStatus.classList.remove('playing');
  });

  audio.addEventListener('error', () => {
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = 'Audio nicht verfügbar';
  });

  window.togglePlay = function () {
    if (audio.paused) {
      audio.play();
      setPlayState(true);
    } else {
      audio.pause();
      setPlayState(false);
    }
  };

  window.seekTo = function (e) {
    if (!audio.duration) return;
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  };

  window.setSpeed = function (speed, btn) {
    currentSpeed = speed;
    audio.playbackRate = speed;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  };
});
