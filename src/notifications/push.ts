const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
        ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        : undefined,
    })

    return subscription
  } catch (error) {
    console.error('Error al registrar push notifications:', error)
    return null
  }
}

export async function unsubscribePushNotifications(subscription: PushSubscription): Promise<void> {
  try {
    await subscription.unsubscribe()
  } catch (error) {
    console.error('Error al desuscribir push notifications:', error)
  }
}

export function setupPushEventListeners() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        handlePushNotification(event.data.payload)
      }
    })
  }
}

function handlePushNotification(payload: {
  title: string
  body: string
  tag?: string
  data?: Record<string, unknown>
}) {
  if (document.hidden) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        icon: '/icons/icon-192x192.png',
        data: payload.data,
      })
    }
  }
}
