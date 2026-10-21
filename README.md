# SAUTI — site statique

L'accueil raconte le film SAUTI en animation pilotée par le scroll : le point orange du logo traverse toute la page et se transforme (point final du titre, grand cercle, repère de la liste, cœur de la méthode, bouton, puis logo).

## Lancer en local

```bash
cd chemin/vers/le/dossier && python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Publier sur GitHub Pages

1. Déposer tous les fichiers à la racine du dépôt.
2. Settings > Pages > Deploy from a branch > main > / (root).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| index.html | Accueil : histoire au scroll, studio, partenaires, rendez-vous |
| partenariats.html | Ascenda et Sport Vision Agency |
| style.css | Styles des deux pages |
| script.js | Animation au scroll, menu mobile, couleur de la barre de navigation |
| logo-dark.png / logo-cream.png | Logo pour fond clair / fond sombre |
| logo-word-dark.png | Mot « Sauti » seul, sur lequel le point vient se poser à la fin de l'animation |
| inter-400/500/600/700.woff2 | Police Inter (sur Mac et iPhone, la police système SF Pro est utilisée) |
| favicon.png, apple-touch-icon.png, og-image.jpg | Icônes et image de partage |

## Réglages

- Longueur de l'animation : `--story` dans style.css (820svh par défaut).
- Moments de l'animation : tableaux `windows` et `track` dans script.js (valeurs de 0 à 1).
- Si le visiteur a activé « réduire les animations », les scènes s'affichent les unes sous les autres, sans animation.
