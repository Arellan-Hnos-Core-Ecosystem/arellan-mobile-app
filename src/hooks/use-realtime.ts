"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { getAccessToken } from "@/lib/api"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export interface CashboxBlockedEvent {
  type: "CASHBOX_BLOCKED"
  description: string
  severity: "CRITICAL"
  sessionId: string
  userId?: string
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001"

export function useRealtime() {
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [cashboxBlocked, setCashboxBlocked] = useState<CashboxBlockedEvent | null>(null)
  const queryClient = useQueryClient()

  const connect = useCallback(() => {
    const token = typeof window !== "undefined" ? getAccessToken() : null
    if (!token) return
    if (socketRef.current?.connected) return

    setStatus("connecting")

    const socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    socket.on("connect", () => {
      setStatus("connected")
      socket.emit("dashboard:subscribe")
    })

    socket.on("disconnect", () => {
      setStatus("disconnected")
    })

    socket.on("connect_error", () => {
      setStatus("error")
    })

    socket.on("approval:requested", (data: {
      approvalId: string
      type: string
      amount: number
      requestedBy: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals-count"] })
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] })
      queryClient.invalidateQueries({ queryKey: ["executive-summary"] })
      void data
    })

    socket.on("alert:security", (_data: {
      type: string
      description: string
      severity: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["executive-summary"] })
    })

    socket.on("cashbox:closed", (_data: {
      sessionId: string
      status: string
      closedBy: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] })
    })

    socket.on("anomaly:detected", (data: {
      type: string
      description: string
      severity: string
      sessionId?: string
      userId?: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["executive-summary"] })
      if (data.type === "CASHBOX_BLOCKED" && data.sessionId) {
        setCashboxBlocked({
          type: "CASHBOX_BLOCKED",
          description: data.description,
          severity: "CRITICAL",
          sessionId: data.sessionId,
          userId: data.userId,
        })
      }
    })

    socketRef.current = socket
  }, [queryClient])

  const disconnect = useCallback(() => {
    socketRef.current?.removeAllListeners()
    socketRef.current?.disconnect()
    socketRef.current = null
    setStatus("disconnected")
  }, [])

  useEffect(() => {
    connect()
    return () => { disconnect() }
  }, [connect, disconnect])

  return {
    status,
    isConnected: status === "connected",
    reconnect: connect,
    disconnect,
    cashboxBlocked,
    clearCashboxBlocked: () => setCashboxBlocked(null),
  } as const
}
