(() => {
  'use strict';
  const config = window.LOVE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const welcome = $('#welcome');
  const mainSite = $('#mainSite');
  let seenReasons = new Set([0]);
  let lastFocused = null;
  let finalTimer = null;
  let heartClicks = 0;

  // Personalization
  $$('[data-my-name]').forEach(el => { el.textContent = config.myName || 'твой любимый Илья'; });
  const letterBody = $('#letterBody');
  (config.letter || '').split('\n').forEach(line => {
    const p = document.createElement('p');
    p.textContent = line || '\u00a0';
    letterBody.appendChild(p);
  });
  $('#backgroundMusic').src = config.musicPath || '';
  $('#secretText').textContent = config.secretMessage || 'Ты очень дорога мне, зая. ♡';

  // Open the gift
  $('#openGift').addEventListener('click', () => {
    welcome.classList.add('welcome-exit');
    window.setTimeout(() => {
      welcome.hidden = true;
      mainSite.classList.remove('hidden');
      mainSite.classList.add('site-enter');
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
      revealObserver.observeAll?.();
      sprinkleHearts(18);
      setTimeout(() => mainSite.focus({ preventScroll: true }), 100);
    }, reducedMotion() ? 0 : 550);
  });
  $('#whyButton').addEventListener('click', () => $('#reasons').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }));

  // Reasons: never repeat until the user resets the list.
  const reasons = Array.isArray(config.reasons) ? config.reasons : [];
  const reasonText = $('#reasonText');
  function renderReason(index) {
    reasonText.classList.remove('reason-pop');
    void reasonText.offsetWidth;
    reasonText.textContent = reasons[index] || 'Просто за то, что ты есть. ♡';
    reasonText.classList.add('reason-pop');
    $('#reasonCounter').textContent = `${String(seenReasons.size).padStart(2, '0')} / ${String(reasons.length).padStart(2, '0')}`;
    const dots = $('#reasonDots');
    dots.replaceChildren();
    for (let i = 0; i < Math.min(reasons.length, 12); i++) {
      const dot = document.createElement('span');
      if (seenReasons.has(i)) dot.classList.add('active');
      dots.appendChild(dot);
    }
    const done = seenReasons.size >= reasons.length;
    $('#anotherReason').hidden = done;
    $('#resetReasons').hidden = !done;
  }
  $('#anotherReason').addEventListener('click', () => {
    const remaining = reasons.map((_, i) => i).filter(i => !seenReasons.has(i));
    if (!remaining.length) return;
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    seenReasons.add(next);
    renderReason(next);
  });
  $('#resetReasons').addEventListener('click', () => {
    seenReasons = new Set([0]); renderReason(0);
  });
  renderReason(0);

  // Letter reveal
  $('#readLetter').addEventListener('click', () => {
    $('#letterStage').classList.add('letter-opened');
    $('#letterContent').hidden = false;
    $('#readLetter').textContent = 'Письмо открыто ♡';
    $('#readLetter').disabled = true;
    window.setTimeout(() => $('#letterContent').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }), reducedMotion() ? 0 : 450);
  });

  // Little surprises
  const surpriseCopy = {
    hug: 'Обнимаю тебя крепко-крепко, даже если сейчас я не рядом 🫂 Представь, что я укутал тебя в самое тёплое объятие и никуда не тороплюсь.',
    kiss: 'Целую тебя миллион раз 😘 Один поцелуй в лоб, один в щёчку, один в носик… и ещё бесконечно много просто потому, что это ты!',
    secret: config.secretMessage || 'Ты — одно из самых нежных чудес в моей жизни. И это наш маленький секрет. ♡',
    love: 'Ой-ой, поймал(а)! 🥹 Теперь официально назначаю тебе миллион обнимашек, триста поцелуев и пожизненное право на мою нежность. Отказ не принимается… только если ты не хочешь чай и печеньку вместо этого 💗'
  };
  $$('[data-surprise]').forEach(button => button.addEventListener('click', () => {
    const kind = button.dataset.surprise;
    if (kind === 'secret') { openSecret(); return; }
    $('#surpriseMessage').textContent = surpriseCopy[kind] || 'Ты очень-очень любима. ♡';
    $('#surpriseResult').hidden = false;
    $('#surpriseResult').classList.remove('result-pop'); void $('#surpriseResult').offsetWidth; $('#surpriseResult').classList.add('result-pop');
    sprinkleHearts(kind === 'kiss' ? 24 : 12);
    $('#surpriseResult').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }));
  $('#closeSurprise').addEventListener('click', () => { $('#surpriseResult').hidden = true; });
  const secretModal = $('#secretModal');
  function openSecret() { lastFocused = document.activeElement; secretModal.hidden = false; document.body.classList.add('modal-open'); $('#secretOkay').focus(); sprinkleHearts(10); }
  function closeSecret() { secretModal.hidden = true; document.body.classList.remove('modal-open'); lastFocused?.focus?.(); }
  $('#closeSecret').addEventListener('click', closeSecret); $('#secretOkay').addEventListener('click', closeSecret);
  secretModal.addEventListener('click', e => { if (e.target === secretModal) closeSecret(); });
  $('#tinyHeart').addEventListener('click', () => {
    heartClicks++;
    $('#tinyHeart').classList.remove('tiny-heart-pulse'); void $('#tinyHeart').offsetWidth; $('#tinyHeart').classList.add('tiny-heart-pulse');
    $('#tinyHeartCaption').textContent = heartClicks < 3 ? ['ой, щекотно! ♡', 'ещё раз — и я покраснею 💗'][heartClicks - 1] || 'мне нравится твоё внимание ♡' : 'ладно, признаюсь: я бьюсь только для тебя ♥';
    sprinkleHearts(heartClicks > 2 ? 15 : 5);
  });

  // Final reveal and restart
  const finalQuestion = $('#finalQuestion'); const finalAnswer = $('#finalAnswer');
  const finalObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && finalAnswer.hidden) {
      finalTimer = window.setTimeout(() => { finalAnswer.hidden = false; finalAnswer.classList.add('final-answer-show'); sprinkleHearts(12); }, reducedMotion() ? 0 : 900);
    }
  }, { threshold: 0.35 });
  finalObserver.observe(finalQuestion);
  $('#restart').addEventListener('click', () => {
    if (finalTimer) clearTimeout(finalTimer);
    welcome.hidden = false; welcome.classList.remove('welcome-exit'); mainSite.classList.add('hidden'); mainSite.classList.remove('site-enter');
    seenReasons = new Set([0]); renderReason(0); $('#letterStage').classList.remove('letter-opened'); $('#letterContent').hidden = true;
    $('#readLetter').disabled = false; $('#readLetter').innerHTML = 'Прочитать письмо <span>↗</span>';
    $('#surpriseResult').hidden = true; finalAnswer.hidden = true; finalAnswer.classList.remove('final-answer-show'); heartClicks = 0; $('#tinyHeartCaption').textContent = 'P.S. это сердечко тоже хочет внимания';
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); $('#openGift').focus();
  });

  // Music only starts after a click; absent file fails quietly.
  const audio = $('#backgroundMusic'); const musicToggle = $('#musicToggle');
  musicToggle.addEventListener('click', async () => {
    if (!audio.getAttribute('src')) { showToast('Добавь свой MP3 в assets/music/our-song.mp3 ♡'); return; }
    if (audio.paused) {
      try { await audio.play(); musicToggle.setAttribute('aria-pressed', 'true'); musicToggle.setAttribute('aria-label', 'Выключить фоновую музыку'); $('#musicLabel').textContent = 'Выключить'; }
      catch (_) { showToast('Не удалось включить музыку. Проверь файл assets/music/our-song.mp3.'); }
    } else { audio.pause(); musicToggle.setAttribute('aria-pressed', 'false'); musicToggle.setAttribute('aria-label', 'Включить фоновую музыку'); $('#musicLabel').textContent = 'Музыка'; }
  });
  audio.addEventListener('error', () => { /* Missing optional music is not a site error. */ });

  // Reveal-on-scroll with fallback.
  const revealObserver = (() => {
    const nodes = $$('.reveal');
    if (!('IntersectionObserver' in window)) { nodes.forEach(n => n.classList.add('is-visible')); return { observeAll: () => {} }; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    nodes.forEach(n => observer.observe(n));
    return { observeAll: () => nodes.forEach(n => observer.observe(n)) };
  })();
  // Add a few decorative stars without heavy animation.
  const stars = $('.universe-stars');
  for (let i = 0; i < 36; i++) { const star = document.createElement('i'); star.className = 'sky-star'; star.style.left = `${(i * 37 + 11) % 100}%`; star.style.top = `${(i * 53 + 7) % 100}%`; star.style.animationDelay = `${(i % 7) * -0.6}s`; stars.appendChild(star); }
  function sprinkleHearts(count) {
    const layer = $('#toastLayer');
    if (reducedMotion()) { showToast('♡'); return; }
    const symbols = ['♡', '♥', '✦', '✧', '💗'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span'); el.className = 'particle'; el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.left = `${Math.random() * 100}%`; el.style.setProperty('--drift', `${Math.round(Math.random() * 180 - 90)}px`); el.style.animationDuration = `${1.8 + Math.random() * 1.8}s`; el.style.fontSize = `${12 + Math.random() * 17}px`; layer.appendChild(el); setTimeout(() => el.remove(), 3900);
    }
  }
  function showToast(message) {
    const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message; $('#toastLayer').appendChild(toast); setTimeout(() => toast.remove(), 3200);
  }
  function reducedMotion() { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !secretModal.hidden) closeSecret(); });
})();
