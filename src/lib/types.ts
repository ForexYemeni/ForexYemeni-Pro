export interface SignalTarget {
  id: string;
  signalId: string;
  order: number;
  price: number;
  status: string;
  percentage: number;
}

export interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  pair: string;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  stopLossType: string;
  riskPercent: number;
  riskAmount: number;
  lotSize: number;
  lotType: string;
  balance: number;
  stars: number;
  mtfTrend: string;
  smcStructure: string;
  status: 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'CLOSED';
  tpReached: number;
  alertText: string;
  // حقول إضافية من المؤشر
  alertStyle: string;     // normal / enhanced (عراقي)
  tpMode: string;         // ATR / RR / Fibonacci / Swings
  planName: string;
  contractSize: number;
  createdAt: string;
  updatedAt: string;
  targets: SignalTarget[];
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
}

export interface LicenseKey {
  id: string;
  code: string;
  plan: string;
  isActive: boolean;
  usedBy: string | null;
  createdAt: string;
}

export interface Stats {
  totalTrades: number;
  closedTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  activeSignals: number;
}

export type AppView = 'user' | 'admin-login' | 'admin-dashboard';
