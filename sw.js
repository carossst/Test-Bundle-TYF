// Service Worker pour "Test Your French Quiz" - Version 2.2.0 (11/04/2025)
// Met en cache les ressources principales et les données de thème pour le mode hors ligne.
// Améliorations: Gestion optimisée du cache audio, structure modulaire JSON

const CACHE_NAME = 'french-quiz-cache-v2.2.0';
const APP_SHELL_CACHE = 'app-shell-cache-v2.2.0';
const DATA_CACHE = 'data-cache-v2.2.0';
const AUDIO_CACHE = 'audio-cache-v2.2.0';

// Liste des ressources essentielles de l'application
const APP_SHELL_RESOURCES = [
  '/', // Important pour la racine
  'index.html',
  'style.css',
  'manifest.json',
  // Fichiers JavaScript modulaires
  'js/main.js',
  'js/resourceManager.js',
  'js/themeController.js',
  'js/quizManager.js',
  'js/ui.js',
  'js/storage.js',
  // Métadonnées
  'js/data/metadata.json',
  // Icônes principales
  'icons/icon-72x72.png',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  // CDN externe (Font Awesome)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Liste des fichiers audio courants à précacher
const AUDIO_RESOURCES_TO_PRECACHE = [
  'audio/TYF_Lead_6.mp3',
  'audio/TYF_Lead_7.mp3',
  'audio/TYF_Lead_80.mp3',
  'audio/TYF_Lead_Phone.mp3'
  // Les autres fichiers audio seront mis en cache à la volée
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation de la version 2.2.0...');
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      // Cache de l'application shell
      caches.open(APP_SHELL_CACHE).then(cache => {
        console.log('[Service Worker] Mise en cache des ressources app shell');
        return cache.addAll(APP_SHELL_RESOURCES)
          .catch(err => {
            console.error('[Service Worker] Erreur de cache app shell:', err);
            throw err;
          });
      }),
      
      // Cache des fichiers audio principaux
      caches.open(AUDIO_CACHE).then(cache => {
        console.log('[Service Worker] Mise en cache des fichiers audio prioritaires');
        return Promise.allSettled(
          AUDIO_RESOURCES_TO_PRECACHE.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[Service Worker] Échec mise en cache audio ${url}:`, err);
            })
          )
        );
      })
    ])
    .then(() => {
      console.log('[Service Worker] Installation terminée!');
    })
  );
});

// Activation du Service Worker et nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation de la version 2.2.0...');
  
  // Liste des caches à conserver
  const currentCaches = [APP_SHELL_CACHE, DATA_CACHE, AUDIO_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !currentCaches.includes(cacheName))
          .map(cacheName => {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activation terminée, prise de contrôle des clients');
      return self.clients.claim();
    })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non GET et les extensions Chrome
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Stratégie différente selon le type de fichier
  if (event.request.url.includes('/audio/')) {
    // ===== Stratégie pour les fichiers AUDIO : Cache First avec mise à jour =====
    event.respondWith(handleAudioRequest(event.request));
  } else if (event.request.url.includes('/js/data/')) {
    // ===== Stratégie pour les DONNÉES JSON : Network First avec fallback cache =====
    event.respondWith(handleDataRequest(event.request));
  } else {
    // ===== Stratégie pour les ressources APP : Cache First avec fallback réseau =====
    event.respondWith(handleAppRequest(event.request));
  }
});

/**
 * Gère les requêtes pour les fichiers audio
 * Stratégie: Cache First avec mise à jour du cache en arrière-plan
 */
async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);
  
  // Vérifier le cache d'abord
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Mise à jour du cache en arrière-plan
    updateAudioCache(request, cache);
    return cachedResponse;
  }
  
  // Pas dans le cache, aller au réseau
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // Mettre en cache la nouvelle réponse
      await cache.put(request, networkResponse.clone());
      console.log(`[Service Worker] Mise en cache du fichier audio: ${request.url}`);
    }
    return networkResponse;
  } catch (error) {
    console.error(`[Service Worker] Erreur de chargement audio: ${request.url}`, error);
    // Fallback: réponse d'erreur
    return new Response('Erreur de chargement du fichier audio.', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Met à jour le cache audio en arrière-plan 
 * sans bloquer la réponse
 */
function updateAudioCache(request, cache) {
  // Ne pas attendre cette promesse pour accélérer la réponse
  fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse);
        console.log(`[Service Worker] Cache audio mis à jour: ${request.url}`);
      }
    })
    .catch(error => {
      console.warn(`[Service Worker] Échec de mise à jour du cache audio: ${request.url}`, error);
    });
}

/**
 * Gère les requêtes pour les données JSON
 * Stratégie: Network First avec fallback cache
 */
async function handleDataRequest(request) {
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // Mettre en cache la réponse réseau fraîche
      const cache = await caches.open(DATA_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not OK');
  } catch (error) {
    console.warn(`[Service Worker] Erreur réseau pour données, utilisation du cache: ${request.url}`, error);
    
    // Fallback au cache 
    const cache = await caches.open(DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Aucune donnée disponible, renvoyer un message d'erreur formaté en JSON
    return new Response(JSON.stringify({
      error: true,
      message: "Données non disponibles hors ligne et non trouvées dans le cache."
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Gère les requêtes pour les ressources de l'application
 * Stratégie: Cache First avec fallback réseau
 */
async function handleAppRequest(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  
  // Vérifier le cache d'abord
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Pas dans le cache, aller au réseau
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache les ressources d'application réussies
    if (networkResponse && networkResponse.status === 200 &&
        (request.url.includes('/js/') || 
         request.url.includes('/css/') || 
         request.url.includes('/icons/'))) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`[Service Worker] Erreur de chargement pour ${request.url}`, error);
    
    // Si c'est une navigation, rediriger vers la page hors ligne
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('index.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Fallback par défaut
    return new Response('Ressource non disponible hors ligne.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Gestion des messages
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Message pour vérifier les mises à jour
  if (event.data && event.data.action === 'checkForUpdates') {
    console.log('[Service Worker] Vérification des mises à jour...');
    self.registration.update();
  }
  
  // Message pour précharger certains fichiers audio
  if (event.data && event.data.action === 'preloadAudio' && event.data.urls) {
    preloadAudioFiles(event.data.urls);
  }
});

/**
 * Précharge une liste de fichiers audio en arrière-plan
 * @param {Array} urls - Liste des URLs de fichiers audio à précharger
 */
async function preloadAudioFiles(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  
  const cache = await caches.open(AUDIO_CACHE);
  
  urls.forEach(url => {
    fetch(url)
      .then(response => {
        if (response && response.status === 200) {
          cache.put(new Request(url), response);
          console.log(`[Service Worker] Audio préchargé: ${url}`);
        }
      })
      .catch(error => {
        console.warn(`[Service Worker] Échec de préchargement audio: ${url}`, error);
      });
  });
}