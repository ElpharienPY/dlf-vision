import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ── RENDERER ──
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101010);

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
const mat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.05,
  envMapIntensity: 1.5,
  side: THREE.DoubleSide,
});

// ── LOAD GLB ──
const loader = document.getElementById('loader');
const hud = document.getElementById('hud');

let logoGroup = null;

new GLTFLoader().load(
  '/Logo_DLF_Fixe_Blanc.glb',
  (gltf) => {
    const root = gltf.scene;

    // Centrer et scaler
    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    root.scale.setScalar(1.7 / Math.max(size.x, size.y, size.z));

    // Appliquer matériau
    root.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.castShadow = true;
      }
    });

    logoGroup = root;
    scene.add(logoGroup);

    // Cacher loader
    loader.classList.add('out');
    setTimeout(() => { loader.style.display = 'none'; hud.classList.add('on'); }, 600);
  },
  null,
  (err) => console.error('Erreur GLB :', err)
);

// ── CONTROLS ──
let drag = false, rmb = false;
let px = 0, py = 0;
let rotX = 0.1, rotY = 0;
let panX = 0, panY = 0;
let zoom = 4;
let autoRot = true;
let autoRotTimer = null;
let rotSpeed = 0;

const el = renderer.domElement;

el.addEventListener('pointerdown', (e) => {
  if (e.button === 2) { rmb = true; }
  else { drag = true; autoRot = false; clearTimeout(autoRotTimer); }
  px = e.clientX; py = e.clientY;
  el.setPointerCapture(e.pointerId);
});
window.addEventListener('pointerup', () => {
  if (drag) { autoRotTimer = setTimeout(() => { autoRot = true; }, 500); }
  drag = false; rmb = false;
});
window.addEventListener('pointermove', (e) => {
  const dx = e.clientX - px, dy = e.clientY - py;
  if (drag) {
    rotY += dx * 0.007;
    rotX += dy * 0.007;
    rotX = Math.max(-1.3, Math.min(1.3, rotX));
  }
  if (rmb) { panX += dx * 0.003; panY -= dy * 0.003; }
  px = e.clientX; py = e.clientY;
});
el.addEventListener('wheel', (e) => { e.preventDefault(); }, { passive: false });
el.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch
el.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    drag = true; autoRot = false;
    px = e.touches[0].clientX; py = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    drag = false;
  }
}, { passive: true });
el.addEventListener('touchmove', (e) => {
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
function animate() {
  requestAnimationFrame(animate);
  t += 0.012;
  if (logoGroup) {
    rotSpeed += ((autoRot ? 0.004 : 0) - rotSpeed) * 0.04;
    rotY += rotSpeed;
    logoGroup.rotation.x = rotX;
    logoGroup.rotation.y = rotY;
    logoGroup.position.x = panX;
    logoGroup.position.y = panY + Math.sin(t * 0.5) * 0.012;
  }
  camera.position.z = zoom;
  renderer.render(scene, camera);
}
animate();

// ── RESIZE ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
