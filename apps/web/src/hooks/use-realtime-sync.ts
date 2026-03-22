import { Client } from '@stomp/stompjs'
import { useEffect } from 'react'

import { queryClient } from '../app/query-client'
import { useAuthStore } from '../store/auth-store'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'

export function useRealtimeSync() {
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) return

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 4000,
    })

    client.onConnect = () => {
      client.subscribe(`/topic/organizations/${user.organizationId}`, () => {
        void queryClient.invalidateQueries()
      })
    }

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [user])
}
