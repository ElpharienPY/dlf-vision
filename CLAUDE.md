# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Racine active

Le projet actif est dans le sous-dossier `test/`. Tous les fichiers sources, commandes et dépendances s'y trouvent. La racine du dépôt contient un `index.html` vide à ignorer.

## Commandes

```bash
cd test
npm install       # première fois
npm run dev       # serveur Vite sur http://localhost:5173
npm run build     # build de production dans test/dist/
npm run preview   # prévisualiser le build
```

Ne jamais utiliser Live Server — les imports ES modules (`three`, GLTFLoader) nécessitent Vite.

## Architecture

```
test/
├── index.html          # Point d'entrée unique
├── src/
│   ├── main.js         # Toute la logique : Three.js, chargement GLB, HUD, animations
│   └── style.css       # Tout le CSS : preloader, HUD, nav, tagline, equalizer
└── public/
    └── Logo_DLF_Fixe_Blanc.glb   # Modèle 3D du logo (servi statiquement par Vite)
```

**`main.js` — flux d'exécution :**
1. Setup Three.js (renderer, scene, camera, lights, PMREMGenerator pour les reflets chrome)
2. Chargement du GLB via `GLTFLoader` → matériau chrome appliqué (`MeshStandardMaterial`, metalness: 1, roughness: 0.05)
3. À la fin du chargement : HUD fade in → barre d'intro animée (`runIntroBar()`) → tagline aléatoire
4. Boucle `animate()` : rotation auto du logo + flottement sinusoïdal + contrôles drag/pan/touch

**Séquence d'intro (post-chargement, pas de preloader bloquant) :**
- Le logo 3D s'affiche directement dès que le GLB est prêt
- 600ms après : `#intro-bar` apparaît en bas avec une barre de progression décorative (easing `0.018`)
- À 100% : barre disparaît, tagline aléatoire fade in (2.5s)

## Stack

- **Vite 8** — bundler/dev server
- **Three.js 0.183** — rendu 3D WebGL
- **GLTFLoader + RoomEnvironment** — chargement GLB et IBL pour les reflets
- Pas de framework CSS, pas de TypeScript, pas de tests
