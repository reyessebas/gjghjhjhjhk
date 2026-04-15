const introTitle = document.getElementById('introTitle');
const revealBtn = document.getElementById('revealBtn');
const intro = document.getElementById('intro');
const cursor = document.getElementById('cursor');
const body = document.body;
const introText = 'Eyy tu... ¿sabes qué día es hoy?, Así es, juanjito hoy es 18 de Abril, el gran día de tus Cumpleaños';

// Menú móvil hamburguesa
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', menuToggle.classList.contains('active'));
  });

  // Cerrar menú cuando se hace clic en un enlace
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Cerrar menú si se hace clic fuera del menú
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function createIntroEffects() {
  const fxLayer = document.createElement('div');
  fxLayer.className = 'intro-fx';

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  // Crear partículas en espiral para el fondo con profundidad 3D
  const spiralBgLayer = document.createElement('div');
  spiralBgLayer.className = 'intro-spiral-bg';
  const spiralCore = document.createElement('div');
  spiralCore.className = 'intro-spiral-core';
  spiralBgLayer.appendChild(spiralCore);

  const spiralColors = ['rgba(244, 211, 94, 0.3)', 'rgba(249, 199, 132, 0.25)', 'rgba(245, 225, 200, 0.28)', 'rgba(231, 211, 195, 0.22)'];
  const spiralCount = coarsePointer ? 140 : 220;
  for (let i = 0; i < spiralCount; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'spiral-particle';

    const angle = (i / spiralCount) * Math.PI * 14;
    const distance = 18 + (i / spiralCount) * (coarsePointer ? 420 : 520);
    const depth = -220 + Math.random() * 520;
    const alpha = 0.45 + Math.random() * 0.5;

    particle.style.setProperty('--angle', `${angle}rad`);
    particle.style.setProperty('--distance', `${distance}px`);
    particle.style.setProperty('--depth', `${depth.toFixed(1)}px`);
    particle.style.setProperty('--alpha', alpha.toFixed(2));
    particle.style.setProperty('--duration', `${7.4 + Math.random() * 7.8}s`);
    particle.style.setProperty('--delay', `${Math.random() * 4.5}s`);
    particle.style.setProperty('--color', spiralColors[i % spiralColors.length]);
    particle.style.setProperty('--size', `${1.2 + Math.random() * 4.2}px`);
    spiralBgLayer.appendChild(particle);
  }
  fxLayer.appendChild(spiralBgLayer);

  const confettiColors = ['#f4d35e', '#f9c784', '#f5e1c8', '#e7d3c3', '#d9d9d9', '#a8a8a8'];
  for (let index = 0; index < 36; index += 1) {
    const confetti = document.createElement('span');
    confetti.className = 'confetti-piece';
    confetti.style.setProperty('--x', `${Math.random() * 100}%`);
    confetti.style.setProperty('--y', `${24 + Math.random() * 40}%`);
    confetti.style.setProperty('--w', `${6 + Math.random() * 8}px`);
    confetti.style.setProperty('--h', `${10 + Math.random() * 16}px`);
    confetti.style.setProperty('--rot', `${Math.random() * 360}deg`);
    confetti.style.setProperty('--duration', `${3.8 + Math.random() * 3.4}s`);
    confetti.style.setProperty('--drift', `${-70 + Math.random() * 140}px`);
    confetti.style.setProperty('--color', confettiColors[index % confettiColors.length]);
    confetti.style.animationDelay = `${Math.random() * 4.2}s`;
    fxLayer.appendChild(confetti);
  }

  intro.appendChild(fxLayer);
}

createIntroEffects();

function typeWriter(element, text, speed = 42) {
  let index = 0;
  element.textContent = '';
  return new Promise((resolve) => {
    const tick = () => {
      element.innerHTML = text.slice(0, index).replace('Cumpleaños', '<span class="accent">Cumpleaños</span>');
      index += 1;
      if (index <= text.length) {
        window.setTimeout(tick, speed);
      } else {
        resolve();
      }
    };
    tick();
  });
}

async function runIntro() {
  await typeWriter(introTitle, introText, 42);
  window.setTimeout(() => {
    document.querySelector('.intro-actions').classList.add('is-visible');
  }, 420);
}

runIntro();

const featureVideo = document.querySelector('.sectionn-video video');
if (featureVideo) {
  let playCount = 0;
  const maxPlays = 3;

  featureVideo.addEventListener('ended', () => {
    playCount += 1;

    if (playCount < maxPlays) {
      featureVideo.currentTime = 0;
      featureVideo.play().catch(() => {});
      return;
    }

    featureVideo.pause();
    featureVideo.currentTime = 0;
  });

  featureVideo.addEventListener('play', () => {
    if (playCount >= maxPlays) {
      playCount = 0;
    }
  });
}

const storyVideos = document.querySelectorAll('.story-video');
storyVideos.forEach((video) => {
  const stopAtSeconds = 20;
  let reachedLimit = false;

  video.addEventListener('timeupdate', () => {
    if (reachedLimit || video.currentTime < stopAtSeconds) {
      return;
    }

    reachedLimit = true;
    video.currentTime = stopAtSeconds;
    video.pause();
  });

  // Si intentan reproducirlo de nuevo, se mantiene congelado en el segundo 20.
  video.addEventListener('play', () => {
    if (!reachedLimit) {
      return;
    }

    video.currentTime = stopAtSeconds;
    video.pause();
  });
});

// Crear destellos cuando el mouse se mueve en la intro
let sparkleTimeout;
function createSparkle(x, y) {
  const sparkle = document.createElement('div');
  sparkle.className = 'intro-sparkle';
  const size = 4 + Math.random() * 6;
  sparkle.style.width = size + 'px';
  sparkle.style.height = size + 'px';
  sparkle.style.left = x + 'px';
  sparkle.style.top = y + 'px';
  intro.appendChild(sparkle);
  window.setTimeout(() => sparkle.remove(), 800);
}

intro.addEventListener('mousemove', (event) => {
  if (intro.classList.contains('is-launch')) return;

  const fxLayer = intro.querySelector('.intro-fx');
  if (fxLayer && window.matchMedia('(pointer: fine)').matches) {
    const x = (event.clientX / window.innerWidth - 0.5) * 30;
    const y = (event.clientY / window.innerHeight - 0.5) * 22;
    fxLayer.style.setProperty('--mx', `${x.toFixed(2)}px`);
    fxLayer.style.setProperty('--my', `${y.toFixed(2)}px`);
  }
  
  clearTimeout(sparkleTimeout);
  sparkleTimeout = window.setTimeout(() => {
    if (Math.random() > 0.64) {
      createSparkle(event.clientX, event.clientY);
    }
  }, 50);
});

revealBtn.addEventListener('click', () => {
  if (intro.classList.contains('is-launch')) {
    return;
  }

  const fxLayer = intro.querySelector('.intro-fx');
  if (fxLayer) {
    fxLayer.style.animation = 'none';
    fxLayer.offsetHeight;
    fxLayer.style.animation = 'introTravel 0.7s ease-out forwards';
  }

  revealBtn.classList.add('is-firing');
  intro.classList.add('is-launch');

  const rect = revealBtn.getBoundingClientRect();
  intro.style.setProperty('--fx-x', `${rect.left + rect.width / 2}px`);
  intro.style.setProperty('--fx-y', `${rect.top + rect.height / 2}px`);

  window.setTimeout(() => {
    intro.classList.add('is-hidden');
    body.classList.add('is-ready');
  }, 380);
  window.setTimeout(() => {
    intro.remove();
  }, 1100);
});

const revealItems = document.querySelectorAll('.reveal, .timeline-item, .memory-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

revealItems.forEach((item) => observer.observe(item));

const finePointer = window.matchMedia('(pointer: fine)').matches;
if (finePointer) {
  body.classList.add('has-custom-cursor');
  cursor.classList.add('is-active');
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  const animateCursor = () => {
    currentX += (targetX - currentX) * 0.24;
    currentY += (targetY - currentY) * 0.24;
    cursor.style.left = `${currentX}px`;
    cursor.style.top = `${currentY}px`;
    window.requestAnimationFrame(animateCursor);
  };

  window.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  window.addEventListener('blur', () => cursor.classList.remove('is-down'));

  window.requestAnimationFrame(animateCursor);

  document.querySelectorAll('a, button, [data-tilt], [data-audio-player]').forEach((item) => {
    item.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    item.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });
}

const journeyStage = document.getElementById('journeyStage');
const stars = document.getElementById('stars');
const parallaxLayers = journeyStage ? journeyStage.querySelectorAll('[data-depth]') : [];

function updateParallax() {
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));

  if (stars) {
    stars.style.transform = `translate3d(0, ${progress * -60}px, 0)`;
  }

  parallaxLayers.forEach((layer) => {
    const depth = Number(layer.dataset.depth || 0.2);
    const shift = (progress - 0.35) * depth * 120;
    layer.style.transform = `translate3d(0, ${shift}px, 0) rotate(${(progress - 0.5) * depth * 4}deg)`;
  });
}

window.addEventListener('scroll', updateParallax, { passive: true });
updateParallax();

const players = document.querySelectorAll('[data-audio-player]');

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

players.forEach((player) => {
  const audio = player.querySelector('audio');
  const button = player.querySelector('.play-btn');
  const progressFill = player.querySelector('.progress span');
  const current = player.querySelector('.current');
  const duration = player.querySelector('.duration');

  audio.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progressFill.style.width = ratio + '%';
    current.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('play', () => {
    player.classList.add('is-playing');
  });

  audio.addEventListener('pause', () => {
    player.classList.remove('is-playing');
  });

  audio.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    progressFill.style.width = '0%';
    current.textContent = '0:00';
  });

  button.addEventListener('click', async () => {
    const isPlaying = !audio.paused;

    players.forEach((otherPlayer) => {
      if (otherPlayer !== player) {
        const otherAudio = otherPlayer.querySelector('audio');
        otherAudio.pause();
      }
    });

    if (isPlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      console.warn('No se pudo iniciar la reproducción automáticamente.', error);
    }
  });
});

document.querySelectorAll('[data-tilt]').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.transform = `perspective(1200px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-2px)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) translateY(0)';
  });
});

const navSectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const navSections = [...navSectionLinks]
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function setActiveNavLink(id) {
  navSectionLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-current', isCurrent);
  });
}

if (navSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveNavLink(entry.target.id);
      }
    });
  }, {
    rootMargin: '-35% 0px -45% 0px',
    threshold: 0.1,
  });

  navSections.forEach((section) => sectionObserver.observe(section));

  const initialId = (window.location.hash || '#inicio').replace('#', '');
  setActiveNavLink(initialId);
}
