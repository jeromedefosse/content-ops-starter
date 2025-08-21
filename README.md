# Portail RAAC – Polyclinique Côte Basque Sud

Ce dépôt contient le site Web utilisé pour accompagner le programme de Réhabilitation
Améliorée Après Chirurgie (RAAC) de la Polyclinique Côte Basque Sud. Il fournit des
interfaces dédiées aux patients, aux chirurgiens et aux administrateurs afin de
suivre les questionnaires, partager des documents et exporter des statistiques.

## Fonctionnalités principales

- **Espace patients** : identification par nom, chirurgien et type d’intervention,
  rappels automatiques des questionnaires, suivi de progression et accès aux
  documents et synthèses graphiques.
- **Espace chirurgiens** : consultation des résultats des patients, dépôt de
  documents, communication par e‑mail et export des données au format CSV.
- **Espace administration** : création et gestion des comptes, supervision des
  questionnaires avec alertes visuelles, envoi de mails et extractions filtrées
  en CSV.
- **Charte graphique** : logo officiel et palette de couleurs de la clinique
  intégrés à l’interface.

## Développement

Prérequis : Node.js 18 ou version supérieure.

```bash
npm install
npm run dev
```

L’application est accessible sur `http://localhost:3000`.

## Construction pour la production

```bash
npm run build
```

## Licence

Ce projet est diffusé sous licence [MIT](LICENSE).
