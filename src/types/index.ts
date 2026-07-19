export type UserRole = 'OWNER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  mfaEnabled: boolean
}

export interface AuthTokens {
  accessToken: string
  // SEC-04: el refresh token ya no llega al JS del cliente — vive en cookie
  // HttpOnly del BFF. Solo el access token (15 min) se maneja en memoria.
  refreshToken?: string
  expiresIn?: number
}

export interface LoginRequest {
  email: string
  password: string
  totpCode?: string
}

export interface LoginResponse {
  mfaRequired: boolean
  mfaToken?: string
  user?: User
  tokens?: AuthTokens
}

export interface MFAVerifyRequest {
  mfaToken: string
  code: string
}

export interface MFAVerifyResponse {
  user: User
  tokens: AuthTokens
}

export interface ExecutiveSummary {
  todayRevenue: number
  yesterdayRevenue: number
  revenueChangePercent: number
  activeOrders: number
  pendingApprovals: number
  cashboxOpen: boolean
  cashboxBalance: number
  lastUpdated: string
}

export type {
  MechanicCycleTimeEntry,
  MechanicCycleTimeReport,
  QuoteConversionReport,
  CashMarginReport,
  InventoryValuationReport,
  ExecutiveSummaryReport,
} from '@arellan-hnos/business-intelligence-lab'

export interface ExpenseApproval {
  id: string
  amount: number
  category: string
  requesterName: string
  requesterRole: string
  description: string
  createdAt: string
  attachments: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface ApproveExpenseRequest {
  expenseId: string
  confirmationToken?: string
}

export interface RejectExpenseRequest {
  expenseId: string
  reason: string
}

export interface AlertItem {
  id: string
  type: 'CASH_DISCREPANCY' | 'GEOFENCE' | 'AFTER_HOURS' | 'CRITICAL_STOCK' | 'OTHER'
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  amount?: number
  createdAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  metadata?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface OrderSummary {
  id: string
  plate: string
  vehicle: string
  status: string
  mechanicName: string
  startedAt: string
  estimatedDelivery: string
}

export type BottomNavTab = 'dashboard' | 'approvals' | 'alerts' | 'profile'
