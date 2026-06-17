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
  tags?: string[];
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
  consumptionId?: string;
  followUpNote?: string;
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
  appointmentId?: string;
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

export type BalanceRecordType = 'recharge' | 'consume' | 'bonus' | 'adjust';

export interface BalanceRecord {
  id: string;
  memberId: string;
  type: BalanceRecordType;
  amount: number;
  balanceAfter: number;
  description: string;
  relatedId?: string;
  createdAt: string;
}

export interface FollowUpRecord {
  id: string;
  memberId: string;
  type: 'marketing' | 'care' | 'callback';
  content: string;
  contactedAt: string;
  operator?: string;
}

export interface MemberProfile {
  memberId: string;
  frequentServices: { name: string; count: number }[];
  lastVisitDate: string;
  daysSinceLastVisit: number;
  visitCount: number;
  avgSpend: number;
  totalSpend: number;
  spendLevel: '低消费' | '中消费' | '高消费';
  freqLevel: '偶尔' | '一般' | '常客' | '忠实';
  suggestedTags: string[];
}

export type LifecycleSegment = 'new' | 'active' | 'sleeping' | 'high_value';

export interface LifecycleGroup {
  key: LifecycleSegment;
  name: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
  suggestions: string[];
}

export type CampaignMemberStatus = 'pending' | 'contacted' | 'visited' | 'consumed' | 'lost';

export interface CampaignMember {
  memberId: string;
  status: CampaignMemberStatus;
  contactedAt?: string;
  note?: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  filters: {
    levels?: MemberLevel[];
    minBalance?: number;
    maxBalance?: number;
    minDaysNotVisited?: number;
    maxDaysNotVisited?: number;
    segments?: LifecycleSegment[];
  };
  members: CampaignMember[];
  createdAt: string;
}

export interface ReviewStats {
  period: string;
  appointmentTotal: number;
  appointmentCompleted: number;
  appointmentNoShow: number;
  appointmentCancelled: number;
  completionRate: number;
  noShowRate: number;
  newMembers: number;
  activeMembers: number;
  totalRevenue: number;
  memberRevenue: number;
  memberRevenueRatio: number;
  avgOrderValue: number;
  campaignCount: number;
  campaignContacted: number;
  campaignConverted: number;
  campaignConversionRate: number;
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
