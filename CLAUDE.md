# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm install       # première fois
npm run dev       # serveur Vite sur http://localhost:5173
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
```

Ne jamais utiliser Live Server — les imports ES modules (`three`, `lenis`, GLTFLoader) nécessitent Vite.

## Architecture

```
/
├── index.html              # Point d'entrée unique — tout le HTML est ici
├── src/
│   ├── main.js             # Toute la logique : Three.js, Lenis, scroll, animations, UI
│   ├── style.css           # Tout le CSS : layout, HUD, nav, sections, responsive
│   ├── fonts/
│   │   └── Anton-Regular.woff2
│   └── assets/             # Médias sources (non servis directement en prod)
│       ├── *.mp4            # Clips preview et full
│       ├── *.png            # Miniatures
│       └── Logo DLF Fixe Blanc.glb  # Copie locale (version servie = public/)
└── public/                 # Servis statiquement par Vite à la racine
    ├── Logo DLF Fixe Blanc.glb
    ├── TextureCR_Logo.webp     # Color map du matériau chrome
    ├── TextureCR_LogoN.webp    # Normal map du matériau chrome
    ├── favicon.svg
    └── transition.js           # Script de transition inter-pages (non-module, chargé avant main.js)
```

## Stack

- **Vite** — bundler/dev server
- **Three.js 0.183** — rendu 3D WebGL
- **Lenis** — smooth scroll (inertie)
- **GLTFLoader + RoomEnvironment** — chargement GLB et IBL pour les reflets
- Pas de framework CSS, pas de TypeScript, pas de tests

## Flux d'exécution de `src/main.js`

1. Setup Three.js (renderer, scene, camera, lumières, PMREMGenerator pour les reflets IBL)
2. Chargement du GLB (`/Logo DLF Fixe Blanc.glb`) + textures chrome (`/TextureCR_Logo.webp`, `/TextureCR_LogoN.webp`) via `MeshStandardMaterial`
3. À la fin du chargement : header/HUD fade in → `runIntroBar()` (barre décorative easing `0.018`) → tagline aléatoire fade in
4. Scroll débloqué (`lenis.start()`) quand la barre atteint 100%
5. Boucle `animate()` : gère rotation/flottement du logo + scroll-driven camera zoom + transitions sections

## Scroll-driven animations (5 phases)

Le scroll est géré via Lenis. `scrollRange = 2 * window.innerHeight` (200vh).

| Phase | Déclencheur | Effet |
|---|---|---|
| `scrollProgress` 0→1 | scroll 0→200vh | Caméra traverse le logo (z: 4→-3), logo devient transparent |
| `scrollProgress` 0.5→1 | scroll 100→200vh | `#section-projets` fade in |
| `contentProgress` 0→1 | scroll 300→400vh | Projets slident vers le haut, `#content-bottom` (contact) monte |
| Toujours | dès clipsOpacity > 0.1 | `#marquee-band` apparaît |

`#scroll-space` (500vh) crée l'espace de scroll nécessaire. Toutes les sections sont en `position: fixed`.

## Système de transition inter-pages

`public/transition.js` est un script vanilla (non-module) chargé en premier. Il gère :
- **Entrée** : l'overlay `#page-transition` (inline `transform:translateY(0)`) glisse vers le haut au `DOMContentLoaded`
- **Sortie** : au clic sur un lien interne, l'overlay couvre l'écran puis navigue après 750ms

## Gestion des vidéos

- **Hover** : `.projet-media` swipe entre `.projet-cover` (miniature) et `.projet-video` (preview MP4 muted/loop)
- **Modal** : clic sur le 1er clip ouvre `#video-modal` avec un iframe Gumlet embedé dynamiquement (l'iframe est injecté/supprimé à l'ouverture/fermeture pour stopper la lecture)

## Assets à connaître

- Le GLB **doit** être dans `public/` pour être servi à `/Logo DLF Fixe Blanc.glb` — la copie dans `src/assets/` n'est pas utilisée en prod
- Les textures chrome (`TextureCR_Logo.webp`, `TextureCR_LogoN.webp`) sont aussi dans `public/`
- La police Anton est auto-hébergée via `@font-face` dans `style.css`
- Les previews vidéo (`.mp4` suffixés `PREVIEW`) sont dans `src/assets/` et référencés directement depuis `index.html`
