self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    const target = event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/countdown'

    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) {
          try {
            await client.navigate(target)
          }
          catch {}
        }
        return
      }
    }

    if (self.clients.openWindow)
      await self.clients.openWindow(target)
  })())
})
