export interface Barber {
  id: string;
  name: string;
  avatar: string;
  colorTag: string;
  workStartTime: string;
  workEndTime: string;
  workDays: string[];
}

export type MemberLevel = '普通会员' | '银卡会员' | '金卡会员' | '钻石会员';

export interface Member {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  balance: number;
  totalPoints: number;
  availablePoints: number;
  level: MemberLevel;
  noShowCount: number;
  createdAt: string;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'no_show' | 'cancelled';

export interface Appointment {
  id: string;
  memberId?: string;
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  status: AppointmentStatus;
  customerName: string;
  customerPhone: string;
  note?: string;
}

export interface RechargeRecord {
  id: string;
  memberId: string;
  rechargeAmount: number;
  bonusAmount: number;
  ruleId?: string;
  createdAt: string;
}

export interface ConsumptionRecord {
  id: string;
  memberId: string;
  barberId?: string;
  packageId?: string;
  amount: number;
  pointsEarned: number;
  createdAt: string;
  note?: string;
}

export type PointsType = 'earn' | 'exchange' | 'expire';

export interface PointsRecord {
  id: string;
  memberId: string;
  type: PointsType;
  points: number;
  expireDate?: string;
  description: string;
  createdAt: string;
}

export interface ExchangeRecord {
  id: string;
  memberId: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  createdAt: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  category: '剪发' | '洗护' | '烫发' | '染发' | '烫染' | '护理';
  price: number;
  pointsRequired: number;
}

export interface RechargeRule {
  id: string;
  rechargeAmount: number;
  bonusAmount: number;
  isActive: boolean;
}

export interface PointsRule {
  pointsPerYuan: number;
  expireRule: 'yearly' | 'custom';
  expireMonths: number;
  exchangeItems: ExchangeItem[];
}

export interface ExchangeItem {
  id: string;
  name: string;
  pointsRequired: number;
  type: 'service' | 'gift';
  icon: string;
}

export interface StatisticsData {
  barberStats: {
    barberId: string;
    barberName: string;
    customerCount: number;
    revenue: number;
  }[];
  packageStats: {
    packageId: string;
    packageName: string;
    category: string;
    count: number;
    revenue: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}
