# SpiralCactus : photos et vidéos sur le site existant

## Architecture (pas de reconstruction du site)

- Site public : GitHub Pages sur https://spiralcactus.be
- Fichiers multimédia : Cloudflare R2, un dossier par événement
- API sécurisée : Cloudflare Worker, source media-worker/src/index.js
- Administration : https://spiralcactus.be/media-admin.html
- Galerie existante : images historiques et nouveaux médias ensemble
- Photos : 2 versions stockées dans R2 (aperçu WebP optimisé + original HD téléchargeable)
- ZIP : extraction locale progressive, sans ajout du ZIP dans GitHub
- Vidéos : envoi multipart par blocs de 8 Mo; lecture via byte ranges

Tant que media-config.js a apiBase vide, le site conserve exactement
son comportement précédent et la galerie existante reste opérationnelle.

## Activer le stockage (une seule fois)

1. Créer ou ouvrir https://dash.cloudflare.com/
2. Storage & databases > R2 > Overview > Activer R2.
   Un moyen de paiement peut être demandé; vérifier la facturation.
3. Create bucket : nom exact spiralcactus-media, classe Standard.
4. Garder le bucket PRIVE : seul le Worker expose les photos publiées.

## Déployer le Worker

1. Cloudflare > Workers & Pages > Create application > GitHub.
2. Sélectionner le dépôt spiralcactus-brussels/spiral-cactus.
3. Root directory = media-worker
4. Worker name = spiralcactus-media (doit correspondre à wrangler.toml)
5. Deploy command = npx wrangler deploy
6. La liaison R2 dans wrangler.toml est déjà définie :
   MEDIA_BUCKET -> spiralcactus-media
7. Une fois le déploiement réussi, ouvrir :
   https://spiralcactus-media.VOTRE-SOUS-DOMAINE.workers.dev/health
   La réponse doit inclure ok: true.
8. Worker > Settings > Variables and Secrets > Add :
   nom exact SC_MEDIA_ADMIN_TOKEN, type Secret.
   Valeur : mot de passe aléatoire d'au moins 32 caractères.
   Ne pas communiquer ce secret dans le chat ou sur GitHub.
9. Valider la nouvelle version du Worker si le tableau de bord
   demande un déploiement après l'ajout du secret.

## Relier le Worker à la galerie publique

Modifier UNE FOIS le fichier racine media-config.js de GitHub :

    window.SC_MEDIA_CONFIG = {
      apiBase: "https://spiralcactus-media.VOTRE-SOUS-DOMAINE.workers.dev"
    };

Ce paramètre est une URL publique, pas une clé secrète.
AUCUNE modification DNS OVH, du domaine ou de l'hébergement GitHub nécessaire.

## Publier ensuite les événements

1. https://spiralcactus.be/media-admin.html
2. Renseigner l'adresse du Worker et le mot de passe (resté secret).
3. Cliquer Tester la connexion.
4. Choisir la soirée (28 août, Acid Edition, ou tout nouvel événement
   enregistré dans content/events.json via Pages CMS).
5. Glisser-déposer des fichiers images, MP4/WebM/MOV, ou un ZIP.
6. Cliquer Publier. Garder l'onglet ouvert jusqu'à la fin.
7. Voir la galerie sur https://spiralcactus.be/gallery.html

Les fichiers ne passent PAS dans le dépôt GitHub.

## Limites et compatibilité

- Aperçus photos : 1920px max, WebP, orientation corrigée, EXIF supprimé.
- Originaux HD : octets originaux conservés sans recompression, disponibles via Télécharger HD.
  ATTENTION : certains originaux contiennent encore des métadonnées EXIF ou GPS.
  Supprimez les informations de géolocalisation sensibles avant publication.
- ZIP : extraction une photo à la fois, compatible jusqu'à 2000 éléments
  reconnus; les vidéos de plus de 200 Mo dans un ZIP doivent être
  sélectionnées directement à côté du ZIP.
- Vidéos directes : upload multipart de 8 Mo, adapté aux gros fichiers.
- Format vidéo recommandé : MP4 H.264 avec audio AAC. MOV/HEVC peut
  ne pas être lisible dans tous les navigateurs sans transcodage.
- L'API R2 ne convertit PAS les codecs vidéo. Pour streaming adaptatif
  universel, Cloudflare Stream ou Bunny Stream sont des extensions payantes.
- Décompression d'un ZIP de 324 Mo dans le navigateur : cela dépend
  de la mémoire disponible; au besoin importer plusieurs archives.

## Référence coûts Cloudflare R2 Standard

- 10 Go-mois/mois gratuits
- Au-delà : 0,015 USD par Go-mois
- 1 million d'opérations Class A et 10 millions Class B gratuites par mois
- Pas de frais de sortie réseau pour les données R2
- https://developers.cloudflare.com/r2/pricing/

## Test end-to-end obligatoire

- Test syntaxe GitHub Actions Prelaunch QA
- Test /health du Worker et bouton Tester la connexion dans l'admin
- Test 1 photo : vérifier l'aperçu WebP et le téléchargement HD original
- Test 1 vidéo MP4 : vérifier la lecture et le téléchargement
- Vérifier l'affichage mobile et le filtre d'événement
- Puis importer Reel selection .zip dans le même album

## Sécurité

Ne JAMAIS mettre SC_MEDIA_ADMIN_TOKEN dans GitHub, media-config.js
ou un message. La page d'administration n'est pas secrète par son URL,
mais toutes les actions sensibles exigent le secret côté Worker.
Les médias publiés dans les albums sont publics et accessibles aux visiteurs.
