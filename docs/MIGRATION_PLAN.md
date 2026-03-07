# Plan de Migration - Fonctionnalités Mobile & Vidéo

> **Date:** Mars 2026  
> **Durée estimée:** 10 semaines  
> **Responsable:** Morpheus (Tech Lead)

---

## 📋 Vue d'ensemble

Ce plan détaille la migration progressive de l'application FEKM Training vers une architecture supportant :
- Upload de vidéos depuis mobile (fichier + caméra)
- Streaming vidéo adaptatif (HLS)
- Téléchargement offline des vidéos
- Système de notifications push
- Synchronisation progression offline → online

---

## 🗓️ Phases de Migration

### Phase 1: Fondations (Semaine 1-2)
**Objectif:** Préparer l'infrastructure de base

#### Tâches:
- [ ] **Jour 1-2:** Sauvegarde complète de la base de données
- [ ] **Jour 1-2:** Créer une branche Git `feature/mobile-video`
- [ ] **Jour 3-4:** Installer les dépendances serveur
  ```bash
  pnpm add web-push fluent-ffmpeg
  pnpm add -D @types/fluent-ffmpeg
  ```
- [ ] **Jour 3-4:** Installer les dépendances client
  ```bash
  pnpm add idb hls.js
  pnpm add -D workbox-cli
  ```
- [ ] **Jour 5-6:** Exécuter la migration Prisma
  ```bash
  pnpm prisma migrate dev --name add_mobile_video_features
  pnpm prisma generate
  ```
- [ ] **Jour 7-8:** Vérifier la cohérence des données migrées
- [ ] **Jour 9-10:** Tests de régression sur les fonctionnalités existantes

#### Livrables:
- Base de données mise à jour avec nouvelles tables
- Dépendances installées
- Tests passent

#### Risques:
- Migration de données longue → **Mitigation:** Tester sur copie de prod d'abord

---

### Phase 2: Upload & Traitement Vidéo (Semaine 3-4)
**Objectif:** Permettre l'upload multi-chunks et le transcodage

#### Tâches:

**Semaine 3 - Upload par Chunks:**
- [ ] Créer `src/lib/upload/chunked-upload.ts`
- [ ] Implémenter les endpoints:
  - `POST /api/videos/upload/init`
  - `POST /api/videos/upload/chunk`
  - `POST /api/videos/upload/complete`
- [ ] Créer le composant `VideoUploader` avec:
  - Sélection fichier
  - Accès caméra (getUserMedia)
  - Barre de progression
  - Reprise d'upload

**Semaine 4 - Transcodage:**
- [ ] Installer et configurer FFmpeg sur le serveur
- [ ] Créer `src/lib/video/transcode.ts`
- [ ] Implémenter le service de transcodage
- [ ] Créer les variants: 360p, 480p, 720p, 1080p
- [ ] Générer les manifests HLS
- [ ] Créer `GET /api/videos/[id]/status`
- [ ] Créer `POST /api/videos/[id]/process` (admin)

#### Livrables:
- Upload de vidéos fonctionnel (web + mobile)
- Transcodage automatique des vidéos
- API de statut de traitement

#### Risques:
- FFmpeg consommateur de ressources → **Mitigation:** Limiter les jobs simultanés

---

### Phase 3: Streaming Adaptatif (Semaine 5)
**Objectif:** Permettre le streaming avec adaptation de qualité

#### Tâches:
- [ ] Créer les endpoints HLS:
  - `GET /api/videos/[id]/manifest.m3u8`
  - `GET /api/videos/[id]/segment/[quality]/playlist.m3u8`
  - `GET /api/videos/[id]/segment/[quality]/[segment].ts`
- [ ] Créer le composant `AdaptiveVideoPlayer`:
  - Intégration hls.js
  - Détection Network Information API
  - Sélection qualité automatique
  - Buffer personnalisable
- [ ] Créer `GET /api/videos/[id]/stream` (fallback)
- [ ] Tests sur différentes connexions (3G/4G/WiFi)

#### Livrables:
- Lecteur vidéo adaptatif fonctionnel
- Streaming HLS opérationnel
- Tests de performance

#### Risques:
- Compatibilité navigateurs → **Mitigation:** Fallback MP4 direct

---

### Phase 4: Offline - Téléchargement (Semaine 6-7)
**Objectif:** Permettre le téléchargement et la lecture offline

#### Tâches:

**Semaine 6 - Service Worker & Cache:**
- [ ] Configurer Workbox
- [ ] Créer `src/sw.ts` (Service Worker)
- [ ] Implémenter la stratégie de cache pour les vidéos
- [ ] Créer `src/lib/offline/db.ts` (IndexedDB)
- [ ] Implémenter le cache LRU (2GB max)

**Semaine 7 - Interface Offline:**
- [ ] Créer les endpoints:
  - `POST /api/videos/[id]/download`
  - `GET /api/videos/[id]/download/[quality]`
  - `POST /api/offline/sync`
  - `GET /api/offline/status`
- [ ] Créer le composant `OfflineVideoManager`:
  - Liste des vidéos téléchargées
  - Bouton télécharger/supprimer
  - Indicateur espace utilisé
- [ ] Implémenter Background Fetch API

#### Livrables:
- Téléchargement offline fonctionnel
- Gestion du cache automatique
- Interface de gestion

#### Risques:
- Espace stockage limité → **Mitigation:** Limite 2GB + LRU

---

### Phase 5: Sync Progression (Semaine 8)
**Objectif:** Synchroniser la progression offline → online

#### Tâches:
- [ ] Créer les endpoints:
  - `POST /api/progress/sync`
  - `GET /api/progress/pending`
- [ ] Implémenter Background Sync API
- [ ] Créer `src/lib/sync/progress-sync.ts`
- [ ] Gérer les conflits (dernier écrase premier)
- [ ] Créer l'indicateur "sync en cours"
- [ ] Tests avec perte de connexion simulée

#### Livrables:
- Synchronisation progression automatique
- Gestion des conflits
- Indicateurs visuels

#### Risques:
- Conflits de données → **Mitigation:** Stratégie "dernier gagne" + logs

---

### Phase 6: Notifications Push (Semaine 9)
**Objectif:** Implémenter le système de notifications

#### Tâches:
- [ ] Générer les clés VAPID
  ```bash
  npx web-push generate-vapid-keys
  ```
- [ ] Ajouter les variables d'environnement:
  ```
  VAPID_PUBLIC_KEY=
  VAPID_PRIVATE_KEY=
  ```
- [ ] Créer les endpoints:
  - `POST /api/notifications/subscribe`
  - `POST /api/notifications/unsubscribe`
  - `POST /api/notifications/test`
- [ ] Créer `src/lib/notifications/push.ts`
- [ ] Implémenter la demande de permission
- [ ] Créer les templates de notification
- [ ] Tests sur iOS Safari et Android Chrome

#### Livrables:
- Inscription aux notifications fonctionnelle
- Envoi de notifications test
- Templates créés

#### Risques:
- Support iOS limité → **Mitigation:** Vérifier iOS 16.4+

---

### Phase 7: Optimisation & Tests (Semaine 10)
**Objectif:** Stabiliser et optimiser

#### Tâches:
- [ ] Tests de charge (k6 ou Artillery)
- [ ] Tests E2E avec Playwright
- [ ] Optimisation des performances:
  - Lazy loading vidéos
  - Compression images
  - Code splitting
- [ ] Audit Lighthouse (objectif: >90)
- [ ] Documentation utilisateur
- [ ] Créer les tickets pour la Phase 2 (Cloud)

#### Livrables:
- Application stable et performante
- Documentation complète
- Plan Phase 2

---

## 🔄 Rollback Plan

### En cas de problème:

1. **Restauration base de données:**
   ```bash
   # Restaurer depuis la sauvegarde
   pg_restore -d fekm_backup backup_pre_migration.sql
   ```

2. **Revert code:**
   ```bash
   git checkout main
   git branch -D feature/mobile-video
   ```

3. **Points de rollback possibles:**
   - Fin Phase 1 (si migration échoue)
   - Fin Phase 3 (si streaming instable)
   - Avant merge sur main (toujours testé sur staging)

---

## 📊 Checklist de Validation

### Avant chaque phase:
- [ ] Tests unitaires passent
- [ ] Tests E2E passent
- [ ] Pas de régression fonctionnelle
- [ ] Performance acceptable (Lighthouse >80)

### À la fin:
- [ ] Toutes les features fonctionnent sur mobile
- [ ] Upload vidéo < 2 min pour 50MB
- [ ] Streaming démarre en < 2s
- [ ] Sync progression < 5s
- [ ] Notifications reçues en < 10s

---

## 🚨 Communication

### Stakeholders à tenir informés:
- **Daily:** Équipe dev (standup)
- **Hebdo:** Product Owner (démo)
- **Milestone:** Direction (go/no-go)

### Canaux:
- Slack #dev-fekm
- Email hebdomadaire de progrès
- Démo chaque vendredi à 16h

---

## 📈 Métriques de Succès

| Métrique | Cible | Actuel | Phase cible |
|----------|-------|--------|-------------|
| Temps upload 50MB | < 2 min | N/A | Phase 2 |
| Temps transcodage | < 2x durée | N/A | Phase 2 |
| Démarrage streaming | < 2s | N/A | Phase 3 |
| Taux succès sync | > 99% | N/A | Phase 5 |
| Score Lighthouse | > 90 | 75 | Phase 7 |

---

## 📝 Notes

- **Ne pas merger sur main** avant validation complète
- Maintenir la branche `feature/mobile-video` à jour avec `main`
- Documenter les problèmes rencontrés dans `docs/MIGRATION_NOTES.md`
- Prévoir une semaine de buffer pour imprévus

---

*Plan créé par Morpheus - Tech Lead FEKM Training*
