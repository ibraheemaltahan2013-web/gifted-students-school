let swRegistration = null;
let messaging = null;
let fcmStatus = 'pending';
let fcmToken = null;

const firebaseConfig = {
  apiKey: "AIzaSyCZ96xboz9eUe3q_nHFDFEeFRRlHFLMdEw",
  authDomain: "idk-600fe.firebaseapp.com",
  projectId: "idk-600fe",
  storageBucket: "idk-600fe.firebasestorage.app",
  messagingSenderId: "819250367613",
  appId: "1:819250367613:web:ac508090dd98a9c2a3b514"
};

const VAPID_KEY = 'BJ0qn3onKmUhTxRi-n-3ZUfVndA46BA8RKprO9OxQPcOxfRgIS4HWM4ILNTelXN8Tmy1vz-hN2bUqByMKLy4MQw';

function waitForFirebase(maxWait = 15000) {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined') return resolve(true);
    const start = Date.now();
    const check = setInterval(() => {
      if (typeof firebase !== 'undefined' || Date.now() - start > maxWait) {
        clearInterval(check);
        resolve(typeof firebase !== 'undefined');
      }
    }, 300);
  });
}

async function saveToken(token) {
  try {
    const res = await fetch('https://nineveh-api.vercel.app/api/notifications/token', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    fcmStatus = 'saved';
    fcmToken = token;
    return data;
  } catch (e) {
    fcmStatus = 'save-error';
    console.error('Save token error:', e);
  }
}

async function initFCM(reg) {
  try {
    if (!('Notification' in window)) { fcmStatus = 'no-notification-api'; return; }
    if (Notification.permission !== 'granted') { fcmStatus = 'permission-' + Notification.permission; return; }

    fcmStatus = 'loading-firebase';
    const loaded = await waitForFirebase(15000);
    if (!loaded) { fcmStatus = 'firebase-not-loaded'; return; }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    messaging = firebase.messaging();
    fcmStatus = 'getting-token';
    const token = await messaging.getToken({ serviceWorkerRegistration: reg, vapidKey: VAPID_KEY });
    if (token) {
      fcmStatus = 'token-obtained';
      await saveToken(token);
    } else {
      fcmStatus = 'token-null';
    }

    try {
      if (messaging.onTokenRefresh) {
        messaging.onTokenRefresh(async () => {
          try {
            const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });
            if (newToken) await saveToken(newToken);
          } catch {}
        });
      }
    } catch {}
  } catch (e) {
    fcmStatus = 'error-' + (e.message || e).substring(0, 100);
    console.error('FCM init error:', e);
  }
}

export function getFcmStatus() { return fcmStatus; }
export function getFcmToken() { return fcmToken ? fcmToken.substring(0, 30) + '...' : null; }

export async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) { fcmStatus = 'no-sw-support'; return null; }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    swRegistration = reg;
    initFCM(reg);
    return reg;
  } catch (e) {
    fcmStatus = 'sw-register-error';
    console.error('SW error:', e);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function showBrowserNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = swRegistration || await navigator.serviceWorker.ready;
    if (reg && reg.active) {
      reg.active.postMessage({ title, body, tag });
      return;
    }
  } catch {}
  try { new Notification(title, { body, icon: '/school-logo.jpg', tag }); } catch {}
}
