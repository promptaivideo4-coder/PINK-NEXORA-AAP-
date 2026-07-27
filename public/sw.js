const CACHE_NAME = 'nexora-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

let supabaseConfig = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_CONFIG') {
    supabaseConfig = event.data.config;
    console.log('SW: Config received', supabaseConfig);
  }
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background Sync Logic
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-supabase') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  const db = await openDB();
  const actions = await getQueue(db);
  
  if (actions.length === 0) return;

  console.log(`SW: Syncing ${actions.length} pending actions`);

  for (const action of actions) {
    try {
      await processAction(action);
      await removeFromQueue(db, action.id);
      console.log(`SW: Successfully synced action ${action.id}`);
    } catch (err) {
      console.error(`SW: Failed to sync action ${action.id}`, err);
      // If it fails, it stays in the queue for the next sync attempt
    }
  }
}

async function processAction(action) {
  if (!supabaseConfig) {
    throw new Error('Supabase config not available in SW');
  }

  const { url, key } = supabaseConfig;
  let endpoint = '';
  let method = 'POST';

  switch (action.type) {
    case 'CREATE_APPOINTMENT':
      endpoint = `${url}/rest/v1/appointments`;
      break;
    case 'CREATE_CLIENT':
      endpoint = `${url}/rest/v1/clients`;
      break;
    case 'UPDATE_PROFILE':
      endpoint = `${url}/rest/v1/profiles?id=eq.${action.data.id}`;
      method = 'PATCH';
      break;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(action.data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
  }
}

// Minimal IndexedDB helper for SW context
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexora-sync-db', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getQueue(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync-queue', 'readonly');
    const store = transaction.objectStore('sync-queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function removeFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync-queue', 'readwrite');
    const store = transaction.objectStore('sync-queue');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
