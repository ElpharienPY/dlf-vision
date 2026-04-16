import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import Lenis from 'lenis';

// ── RENDERER ──
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
// scene.background null → canvas transparent, le CSS est visible derrière

// ── ENVIRONMENT (chrome reflections) ──
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0, 4);

// ── LIGHTS — setup pour fond blanc ──
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.8));

[
  { color: 0xffffff, intensity: 3,   pos: [ 4,  5,  4] },
  { color: 0xeeeeff, intensity: 1.5, pos: [-4,  3,  2] },
  { color: 0xffffff, intensity: 1,   pos: [ 0, -3,  3] },
  { color: 0xddddff, intensity: 0.8, pos: [ 3, -2, -3] },
].forEach(({ color, intensity, pos }) => {
  const l = new THREE.PointLight(color, intensity, 30);
  l.position.set(...pos);
  scene.add(l);
});

const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(3, 5, 3);
dir.castShadow = true;
scene.add(dir);

// ── MATERIAL — chrome métallique ──
const texLoader = new THREE.TextureLoader();
const colorMap  = texLoader.load('/TextureCR_Logo.webp');
const normalMap = texLoader.load('/TextureCR_LogoN.webp');

const mat = new THREE.MeshStandardMaterial({
  map:       colorMap,
  normalMap: normalMap,
  normalScale: new THREE.Vector2(1.5, 1.5),
  metalness: 0.9,
  roughness: 0.05,
  side: THREE.DoubleSide,
  transparent: true,
});

// ── TAGLINES ──
const taglines = [
  "L'instinct du terrain, l'art de la vision.",
  "Sublimer le réel, viser l'exception.",
  "L'esthétique pure, l'impact à la seconde.",
  "L'art de l'ombre, la clarté du crime.",
  "Le bitume, la plume, l'image qui prend.",
];

// ── ELEMENTS ──
const siteHeader   = document.getElementById('site-header');
const hud          = document.getElementById('hud');
const introBar     = document.getElementById('intro-bar');
const barFill      = document.getElementById('barFill');
const pctCounter   = document.getElementById('pctCounter');
const taglineEl    = document.getElementById('tagline');
const sectionProjets = document.getElementById('section-projets');
const contentBottom  = document.getElementById('content-bottom');
const marqueeBand    = document.getElementById('marquee-band');
// ── LENIS ──
const lenis = new Lenis({ duration: 1.4 });
lenis.stop(); // bloqué jusqu'à la fin de la phase d'intro

// scrollRange : distance pour l'animation 3D (200vh)
// Content phase : de 300vh à 400vh → contentProgress 0→1
let scrollRange = 2 * window.innerHeight;
let scrollRaw = 0;
let scrollProgress = 0;
let contentProgress = 0;

lenis.on('scroll', ({ scroll }) => {
  scrollRaw = scroll;
  scrollProgress = Math.max(0, Math.min(1, scroll / scrollRange));
  const contentStart    = scrollRange * 1.5; // 300vh
  const contentDuration = scrollRange * 0.5; // 100vh
  contentProgress = Math.max(0, Math.min(1, (scroll - contentStart) / contentDuration));
});

// ── ÉTAT ──
let lockedPhase = false;  // logo figé droit (après retour smooth)
let lockPending = false;  // en train de revenir doucement avant de se figer
let logoGroup = null;

// ── LOAD GLB ──
new GLTFLoader().load(
  '/Logo DLF Fixe Blanc.glb',
  (gltf) => {
    const root = gltf.scene;

    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    root.scale.setScalar(1.7 / Math.max(size.x, size.y, size.z));

    root.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.castShadow = true;
      }
    });

    logoGroup = root;
    scene.add(logoGroup);

    // 1. Afficher la scène + lancer la barre
    siteHeader.classList.add('on');
    hud.classList.add('on');
    setTimeout(() => {
      introBar.classList.add('on');
      runIntroBar();
    }, 600);
  },
  null,
  (err) => console.error('Erreur GLB :', err)
);

// ── BARRE D'INTRO ──
function runIntroBar() {
  let pct = 0;

  function tick() {
    pct += (100 - pct) * 0.018;

    barFill.style.width = pct + '%';
    pctCounter.textContent = Math.floor(pct) + '%';

    if (pct < 99.2) {
      requestAnimationFrame(tick);
    } else {
      barFill.style.width = '100%';
      pctCounter.textContent = '100%';

      // Scroll débloqué quand la barre est pleine
      document.body.classList.add('ready');
      lenis.start();

      // Cacher la barre, afficher la tagline
      setTimeout(() => {
        introBar.classList.remove('on');
        introBar.classList.add('out');
        taglineEl.textContent = taglines[Math.floor(Math.random() * taglines.length)];

        // Retour smooth vers la position droite, puis figer 5s
        lockPending = true;
        autoRot = false;
        returning = false;

        setTimeout(() => {
          lockPending = false;
          lockedPhase = false;
          autoRot = true;
        }, 5000);
      }, 400);
    }
  }

  requestAnimationFrame(tick);
}

// ── CONTROLS ──
let drag = false;
let px = 0, py = 0;
let rotX = 0.1, rotY = 0;
const initRotX = 0.1, initRotY = 0;
let panX = 0, panY = 0;
let zoom = 4;
let camY = 0;       // décalage vertical caméra pour cibler l'iris
let autoRot = true;
let autoRotTimer = null;
let rotSpeed = 0;
let returning = false;

const el = renderer.domElement;
const canvasZone = document.getElementById('canvas-zone');

function inZone(x, y) {
  const r = canvasZone.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

el.addEventListener('pointerdown', (e) => {
  if (lockedPhase || scrollProgress > 0.01) return;
  if (!inZone(e.clientX, e.clientY)) return;
  if (e.button === 2) return;
  drag = true; autoRot = false; returning = false; clearTimeout(autoRotTimer);
  px = e.clientX; py = e.clientY;
  el.setPointerCapture(e.pointerId);
});
window.addEventListener('pointerup', () => {
  if (drag) {
    autoRotTimer = setTimeout(() => {
      rotY = ((rotY + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      returning = true;
    }, 800);
  }
  drag = false;
});
window.addEventListener('pointermove', (e) => {
  if (lockedPhase || scrollProgress > 0.01) return;
  const dx = e.clientX - px, dy = e.clientY - py;
  if (drag) {
    rotY += dx * 0.007;
    rotX += dy * 0.007;
    rotX = Math.max(-1.3, Math.min(1.3, rotX));
  }
  px = e.clientX; py = e.clientY;
});
el.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch
el.addEventListener('touchstart', (e) => {
  if (lockedPhase || scrollProgress > 0.01) return;
  if (e.touches.length === 1) {
    if (!inZone(e.touches[0].clientX, e.touches[0].clientY)) return;
    drag = true; autoRot = false; returning = false;
    px = e.touches[0].clientX; py = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    drag = false;
  }
}, { passive: true });
el.addEventListener('touchmove', (e) => {
  if (lockedPhase || scrollProgress > 0.01) return;
  if (e.touches.length === 1 && drag) {
    const dx = e.touches[0].clientX - px, dy = e.touches[0].clientY - py;
    rotY += dx * 0.007; rotX += dy * 0.007;
    rotX = Math.max(-1.3, Math.min(1.3, rotX));
    px = e.touches[0].clientX; py = e.touches[0].clientY;
  }
}, { passive: true });
el.addEventListener('touchend', () => {
  if (drag) { autoRotTimer = setTimeout(() => { autoRot = true; }, 500); }
  drag = false;
});

// ── ANIMATE ──
let t = 0;
function animate(time = 0) {
  requestAnimationFrame(animate);
  lenis.raf(time);
  t += 0.012;

  if (logoGroup) {
    if (lockPending) {
      // Retour smooth vers la position droite
      rotX += (initRotX - rotX) * 0.035;
      rotY += (initRotY - rotY) * 0.035;
      panX += (0 - panX) * 0.035;
      panY += (0 - panY) * 0.035;
      rotSpeed = 0;
      if (Math.abs(rotX - initRotX) < 0.001 && Math.abs(rotY - initRotY) < 0.001) {
        rotX = initRotX; rotY = initRotY;
        lockedPhase = true; // figer seulement quand c'est arrivé
      }
    } else if (lockedPhase) {
      // Logo parfaitement droit et immobile
      rotX = initRotX; rotY = initRotY;
      rotSpeed = 0; panX = 0; panY = 0;
    } else if (scrollProgress > 0.01) {
      // Pendant le scroll : logo se met face caméra (rotX → 0 pour aligner le tunnel)
      rotX += (0 - rotX) * 0.08;
      rotY += (initRotY - rotY) * 0.08;
      panX += (0 - panX) * 0.08;
      panY += (0 - panY) * 0.08;
      returning = false;
      autoRot = false;
    } else if (returning) {
      rotX += (initRotX - rotX) * 0.025;
      rotY += (initRotY - rotY) * 0.025;
      panX += (0 - panX) * 0.025;
      panY += (0 - panY) * 0.025;
      if (Math.abs(rotX - initRotX) < 0.001 && Math.abs(rotY - initRotY) < 0.001) {
        rotX = initRotX; rotY = initRotY;
        returning = false; autoRot = true;
      }
    } else {
      // Quand on revient en haut, relancer la rotation si personne ne drag
      if (!drag) autoRot = true;
      rotSpeed += ((autoRot ? 0.004 : 0) - rotSpeed) * 0.04;
      rotY += rotSpeed;
    }

    logoGroup.rotation.x = rotX;
    logoGroup.rotation.y = rotY;
    const floatAmp = Math.max(0, 0.012 - scrollProgress * 0.06);
    logoGroup.position.x = panX;
    logoGroup.position.y = panY + Math.sin(t * 0.5) * floatAmp;
  }

  // Zoom caméra : traverse le logo de z=4 → z=-3
  // + légère montée en Y pour viser le centre de l'iris DLF
  const Y_IRIS = 0.22;
  const CAM_X = -0.03; // décalage gauche pour compenser l'offset du modèle
  const targetZ = 4 - scrollProgress * 7;
  const targetCamY = scrollProgress * Y_IRIS;
  zoom += (targetZ - zoom) * 0.06;
  camY += (targetCamY - camY) * 0.06;
  camera.position.x = CAM_X;
  camera.position.z = zoom;
  camera.position.y = camY;
  camera.lookAt(CAM_X, camY, 0);

  // Logo visible seulement quand la caméra est clairement devant (z > 0.8)
  // Basé sur zoom (position Z réelle) → pas de glitch en remontant
  mat.opacity = Math.max(0, Math.min(1, (zoom - 0.8) / 2.0));

  // Tagline s'efface au scroll
  if (!lockedPhase) {
    const fadeOut = Math.max(0, 1 - scrollProgress * 5);
    taglineEl.style.opacity = fadeOut;
  }

  // Clips : fade in dès que le logo disparaît (0.5 → 1.0), slide up au content scroll
  const clipsOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.5) / 0.5));
  sectionProjets.style.opacity = clipsOpacity;
  sectionProjets.style.pointerEvents = (clipsOpacity > 0 && contentProgress < 0.9) ? 'all' : 'none';
  sectionProjets.style.transform = `translateY(${-contentProgress * 100}vh)`;

  // Marquee footer : visible dès que les clips apparaissent, reste visible
  if (clipsOpacity > 0.1) marqueeBand.classList.add('on');

  // Contact : slide in du bas
  contentBottom.style.opacity = String(contentProgress);
  contentBottom.style.transform = `translateY(${(1 - contentProgress) * 100}vh)`;
  contentBottom.style.pointerEvents = contentProgress > 0.5 ? 'all' : 'none';

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// ── RESIZE ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  scrollRange = 2 * window.innerHeight;
});

// ── HOVER VIDÉO PROJET ──
document.querySelectorAll('.projet-media').forEach(media => {
  const video = media.querySelector('.projet-video');
  if (!video) return;
  media.addEventListener('mouseenter', () => video.play());
  media.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
});

// ── MODAL VIDÉO PROJET (1er clip uniquement) ──
const videoModal      = document.getElementById('video-modal');
const videoModalFrame = document.getElementById('video-modal-frame');
const videoModalClose = document.getElementById('video-modal-close');

const GUMLET_EMBED = `<div style="position:relative;aspect-ratio:16/9;">
  <iframe
    loading="lazy" title="Gumlet video player"
    src="https://play.gumlet.io/embed/69d5381715722ddd136fab63?background=false&autoplay=false&loop=false&disable_player_controls=true&player_color=%23000000"
    style="border:none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
    referrerpolicy="origin"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;clipboard-write;">
  </iframe>
</div>`;

function openVideoModal() {
  videoModalFrame.innerHTML = GUMLET_EMBED;
  videoModal.classList.add('open');
}

function closeVideoModal() {
  videoModal.classList.remove('open');
  videoModalFrame.innerHTML = '';
}

const firstMedia = document.querySelector('.projet-media');
if (firstMedia) firstMedia.addEventListener('click', openVideoModal);
videoModalClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeVideoModal();
});

// ── CURSEUR CUSTOM ──
const cursorEl = document.getElementById('cursor');
let curX = -100, curY = -100; // hors écran au départ
let aimX = -100, aimY = -100;

window.addEventListener('mousemove', (e) => {
  aimX = e.clientX;
  aimY = e.clientY;
  cursorEl.classList.remove('hidden');
});

window.addEventListener('mouseleave', () => cursorEl.classList.add('hidden'));
window.addEventListener('mouseenter', () => cursorEl.classList.remove('hidden'));
window.addEventListener('mousedown', () => cursorEl.classList.add('clicking'));
window.addEventListener('mouseup', () => cursorEl.classList.remove('clicking'));

// Pointer state sur les éléments interactifs
document.querySelectorAll('a, button, [data-cursor="pointer"]').forEach(el => {
  el.addEventListener('mouseenter', () => cursorEl.classList.add('pointer'));
  el.addEventListener('mouseleave', () => cursorEl.classList.remove('pointer'));
});

function tickCursor() {
  curX += (aimX - curX) * 0.12;
  curY += (aimY - curY) * 0.12;
  cursorEl.style.left = curX + 'px';
  cursorEl.style.top  = curY + 'px';
  requestAnimationFrame(tickCursor);
}
tickCursor();

