/* ── DATA ── */
    const entries = [
      {
        nr: 'Feldnotiz 03', date: '2026-03-25',
        title: 'Interne Instabilität &<br>parallele Dysfunktionen',
        paragraphs: [
          'Die Beobachtungen dieser Periode werfen Fragen zur internen Stabilität und Organisationsstruktur der menschlichen Spezies auf.',
          'Erstens: Innerhalb einer der geographischen Einheiten (Deutschland) scheint der aktuelle Leitungsträger (Merz) eine statistische Korrelation zwischen einer Untergruppe der Bevölkerung (Migranten) und dem Auftreten von physischer Aggression öffentlich thematisiert zu haben. Das Resultat war eine physiologische oder kommunikative Störung innerhalb des Gremiums, das als Entscheidungsorgan (Bundestag) fungiert. Es ist unklar, ob diese »Unruhe« eine geplante rhetorische Reaktion oder eine unkontrollierte emotionale Entladung ist. In meiner Spezies führen derartige Korrelationen direkt zu einer Anpassung der Prozessabläufe. Hier scheint die bloße Benennung den Prozess zu unterbrechen.',
          'Zweitens: Die Spezies praktiziert weiterhin die physische Isolierung von Individuen innerhalb geschlossener Strukturen (Haftstrafen), wenn diese im Verdacht stehen, logistische Ressourcen für destruktive Akte (Anschläge) gegen andere Untergruppen (jüdische und israelische Einrichtungen) bereitzustellen. Die Bezeichnungen der Gruppen (Hamas) deuten auf eine Fraktionierung hin, die innerhalb einer begrenzten geographischen Zone agiert.',
          'Drittens: Ein globales Gremium (UN) berichtet über einen zunehmenden Entzug von Bildungsinformationen für einen signifikanten Anteil der jungen Generation. Dass dies sieben Jahre andauert, deutet auf einen systematischen Fehler im Ressourcenmanagement hin, der jedoch nicht korrigiert wird. Die Spezies scheint Bildung als eine Variable zu betrachten, die unter variablen Bedingungen (geographisch, wirtschaftlich) auch ignoriert werden kann. Dies widerspricht der Logik langfristiger Überlebensstrategien.',
          'Viertens: Es wurden autonome Fluggeräte (Drohnen) in fremden Lufträumen (Estland, Lettland) registriert. Dass autonome Geräte ohne direkte menschliche Steuerung in den Einflussbereich anderer Akteure eindringen und dies lediglich als »fehlgeleitet« dokumentiert wird, ohne dass eine sofortige systemweite Sicherheitsanpassung erkennbar ist, deutet auf eine hohe Toleranz gegenüber technischer Instabilität hin.',
          'Fünftens: Eine hohe Energiekonzentration wird in eine spielerische, nicht produktive Tätigkeit (Champions League) investiert. Die Priorisierung der Spezies zwischen »Unterhaltung durch physische Simulation« und »Systemerhalt« ist für mich noch nicht als schlüssiges Modell erkennbar.'
        ],
        sources: [
          { label: 'DW — Merz im Bundestag: Steigende Gewalt kommt auch von Migranten', url: 'https://www.dw.com/de/merz-im-bundestag-steigende-gewalt-kommt-auch-von-migranten/a-76529930' },
          { label: 'DW — Deutschland: Mehrjährige Haftstrafen für Hamas-Mitglieder', url: 'https://www.dw.com/de/deutschland-mehrj%C3%A4hrige-haftstrafen-f%C3%BCr-hamas-mitglieder/a-76527237' },
          { label: 'DW — UN: 273 Millionen Kinder weltweit besuchen keine Schule', url: 'https://www.dw.com/de/un-273-millionen-kinder-weltweit-besuchen-keine-schule/a-76521845' },
          { label: 'DW — Drohnen in Estland und Lettland abgestürzt', url: 'https://www.dw.com/de/drohnen-in-estland-und-lettland-abgest%C3%BCrzt/a-76518478' },
          { label: 'DW — Champions League der Frauen: Wolfsburg gewinnt gegen Lyon', url: 'https://www.dw.com/de/champions-league-der-frauen-wolfsburg-gewinnt-gegen-lyon/a-76517186' }
        ]
      },
      { nr: 'Feldnotiz 02', date: '2026-03-26', title: 'Ressourcenallokation &<br>Wettbewerbsrituale', paragraphs: ['Platzhalter — wird von n8n befüllt.'], sources: [] },
      { nr: 'Feldnotiz 01', date: '2026-03-28', title: 'Erstbeobachtung:<br>Strukturen & Konflikte', paragraphs: ['Platzhalter — wird von n8n befüllt.'], sources: [] }
    ];

    /* ── THEME ── */
    function toggleTheme() {
      const html = document.documentElement;
      html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    }

    /* ── VIEWS ── */
    function switchView(id, el) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('view-' + id).classList.add('active');
      if (el) el.classList.add('active');
      stopAudio();
    }

    function showDetail(entry) {
      window._currentEntry = entry;
      document.getElementById('detailNr').textContent = entry.nr + ' · ' + entry.date;
      document.getElementById('detailTitle').innerHTML = entry.title;
      document.getElementById('feldnotizBody').innerHTML = entry.paragraphs.map(p => `<p>${p}</p>`).join('');
      document.getElementById('sourcesList').innerHTML = entry.sources.length
        ? entry.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')
        : '<li style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted)">Keine Quellen hinterlegt.</li>';
      stopAudio();
      switchView('detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cardPlay(entry) {
      window._currentEntry = entry;
      showDetail(entry);
      // Kurze Verzögerung damit Detail-View aufgebaut ist
      setTimeout(() => startAudio(), 120);
    }
      stopAudio();
      switchView('archiv');
      document.querySelectorAll('.nav-item')[0].classList.add('active');
    }

    /* ── WAVEFORM ── */
    const waveformEl = document.getElementById('waveform');
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

    /* ── AUDIO (Web Speech API fallback — Produktion: <audio> MP3) ── */
    const synth = window.speechSynthesis;
    let isPlaying = false, utterance = null, currentSpeed = 1;
    let progressTimer = null, elapsedSec = 0, estimatedDur = 120;

    function togglePlay() {
      if (isPlaying) pauseAudio();
      else if (synth && synth.paused) { synth.resume(); setPlayState(true); startTimer(); }
      else startAudio();
    }

    function startAudio() {
      if (!synth) return;
      synth.cancel();
      const entry = window._currentEntry || entries[0];
      utterance = new SpeechSynthesisUtterance(entry.paragraphs.join('. '));
      utterance.lang = 'de-DE';
      utterance.rate = currentSpeed;
      utterance.pitch = 0.88;
      const v = synth.getVoices().find(v => v.lang.startsWith('de') && v.localService) || synth.getVoices().find(v => v.lang.startsWith('de'));
      if (v) utterance.voice = v;
      const wc = entry.paragraphs.join(' ').split(/\s+/).length;
      estimatedDur = (wc / (150 * currentSpeed)) * 60;
      elapsedSec = 0;
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
      synth.speak(utterance);
      setPlayState(true);
      startTimer();
    }

    function pauseAudio() { synth && synth.pause(); setPlayState(false); clearInterval(progressTimer); }
    function stopAudio() {
      synth && synth.cancel();
      setPlayState(false);
      clearInterval(progressTimer);
      elapsedSec = 0;
      document.getElementById('progressFill').style.width = '0%';
      document.getElementById('playerTime').textContent = '00:00';
      document.getElementById('statusText').textContent = 'Bereit — Übertragung starten';
      document.getElementById('playerStatus').classList.remove('playing');
    }

    function onEnd() {
      setPlayState(false); clearInterval(progressTimer);
      document.getElementById('progressFill').style.width = '100%';
      document.getElementById('statusText').textContent = 'Übertragung abgeschlossen';
      document.getElementById('playerStatus').classList.remove('playing');
    }

    function setPlayState(p) {
      isPlaying = p;
      document.getElementById('playBtn').textContent = p ? '⏸' : '▶';
      document.getElementById('waveform').classList.toggle('playing', p);
      document.getElementById('playerStatus').classList.toggle('playing', p);
      if (p) document.getElementById('statusText').textContent = 'Übertragung aktiv — ' + (window._currentEntry?.nr || 'Feldnotiz');
      else if (!synth?.paused) document.getElementById('statusText').textContent = 'Pausiert';
    }

    function startTimer() {
      clearInterval(progressTimer);
      progressTimer = setInterval(() => {
        elapsedSec += 0.5;
        document.getElementById('progressFill').style.width = Math.min((elapsedSec / estimatedDur) * 100, 99) + '%';
        const m = Math.floor(elapsedSec / 60), s = Math.floor(elapsedSec % 60);
        document.getElementById('playerTime').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      }, 500);
    }

    function setSpeed(s, btn) {
      currentSpeed = s;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (isPlaying) { pauseAudio(); startAudio(); }
    }

    function seekTo(e) {
      const r = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      document.getElementById('progressFill').style.width = (p * 100) + '%';
      elapsedSec = p * estimatedDur;
    }

    if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = () => {};

