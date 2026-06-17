import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import dayjs from 'dayjs';
import type {
  Barber,
  Member,
  Appointment,
  RechargeRecord,
  ConsumptionRecord,
  PointsRecord,
  ExchangeRecord,
  ServicePackage,
  RechargeRule,
  PointsRule,
  AppointmentStatus,
  MemberLevel,
  BalanceRecord,
  FollowUpRecord,
  MemberProfile,
} from '@/types';
import {
  initialBarbers,
  initialRechargeRules,
  initialServicePackages,
  initialPointsRule,
  generateInitialMembers,
  generateInitialAppointments,
  generateInitialRechargeRecords,
  generateInitialConsumptionRecords,
  generateInitialPointsRecords,
  generateInitialExchangeRecords,
  generateInitialBalanceRecords,
  generateInitialFollowUpRecords,
} from '@/utils/mockData';

const genId = () => Math.random().toString(36).substring(2, 10);

const calcExpireDate = (rule: PointsRule): string => {
  if (rule.expireRule === 'yearly') {
    return dayjs().endOf('year').format('YYYY-MM-DD');
  }
  return dayjs().add(rule.expireMonths, 'month').format('YYYY-MM-DD');
};

const initMembers = generateInitialMembers();
const initAppointments = generateInitialAppointments(initMembers, initialBarbers);
const initRechargeRecords = generateInitialRechargeRecords(initMembers);
const initConsumptionRecords = generateInitialConsumptionRecords(initMembers, initialServicePackages, initialBarbers);
const initPointsRecords = generateInitialPointsRecords(initMembers);
const initExchangeRecords = generateInitialExchangeRecords(initMembers, initialPointsRule.exchangeItems);
const initBalanceRecords = generateInitialBalanceRecords(initMembers, initRechargeRecords, initConsumptionRecords);
const initFollowUpRecords = generateInitialFollowUpRecords(initMembers);

interface AppState {
  barbers: Barber[];
  members: Member[];
  appointments: Appointment[];
  rechargeRecords: RechargeRecord[];
  consumptionRecords: ConsumptionRecord[];
  pointsRecords: PointsRecord[];
  exchangeRecords: ExchangeRecord[];
  balanceRecords: BalanceRecord[];
  followUpRecords: FollowUpRecord[];
  servicePackages: ServicePackage[];
  rechargeRules: RechargeRule[];
  pointsRule: PointsRule;

  addMember: (data: Omit<Member, 'id' | 'createdAt' | 'noShowCount' | 'totalPoints' | 'availablePoints' | 'balance' | 'level'>) => void;
  updateMember: (id: string, data: Partial<Member>) => void;

  addAppointment: (data: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  markNoShow: (id: string) => void;
  rescheduleAppointment: (id: string, data: { date: string; startTime: string; endTime: string; barberId: string }) => boolean;

  rechargeMember: (memberId: string, ruleId: string | undefined, amount: number, bonus: number) => void;
  consumeMember: (memberId: string, barberId: string | undefined, packageId: string | undefined, amount: number, note?: string) => void;

  exchangePoints: (memberId: string, rewardId: string, rewardName: string, pointsUsed: number) => void;
  addExchangeItem: (item: Omit<PointsRule['exchangeItems'][number], 'id'>) => void;
  removeExchangeItem: (id: string) => void;
  updatePointsRule: (rule: Partial<PointsRule>) => void;

  addRechargeRule: (data: Omit<RechargeRule, 'id'>) => void;
  updateRechargeRule: (id: string, data: Partial<RechargeRule>) => void;
  removeRechargeRule: (id: string) => void;

  updateBarber: (id: string, data: Partial<Barber>) => void;

  getExpiringPointsMembers: () => { member: Member; expiringPoints: number; expireDate: string; daysLeft: number }[];
  getMonthlyStatistics: (month: string) => {
    barberStats: { barberId: string; barberName: string; customerCount: number; revenue: number }[];
    packageStats: { packageId: string; packageName: string; category: string; count: number; revenue: number }[];
  };
  getMonthlyRevenue: () => { month: string; revenue: number }[];
  getMemberBalanceRecords: (memberId: string) => BalanceRecord[];

  getMemberProfile: (memberId: string) => MemberProfile;
  addFollowUpRecord: (data: Omit<FollowUpRecord, 'id' | 'contactedAt'>) => void;
  getFollowUpRecords: (memberId: string) => FollowUpRecord[];
  linkAppointmentConsumption: (appointmentId: string, consumptionId: string, followUpNote?: string) => void;
  adjustMemberBalance: (memberId: string, amount: number, description: string) => boolean;
  filterMarketingMembers: (filters: {
    levels?: MemberLevel[];
    minBalance?: number;
    maxBalance?: number;
    minDaysNotVisited?: number;
    maxDaysNotVisited?: number;
    tags?: string[];
  }) => Member[];
  addMemberTag: (memberId: string, tag: string) => void;
  removeMemberTag: (memberId: string, tag: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      barbers: initialBarbers,
      members: initMembers,
      appointments: initAppointments,
      rechargeRecords: initRechargeRecords,
      consumptionRecords: initConsumptionRecords,
      pointsRecords: initPointsRecords,
      exchangeRecords: initExchangeRecords,
      balanceRecords: initBalanceRecords,
      followUpRecords: initFollowUpRecords,
      servicePackages: initialServicePackages,
      rechargeRules: initialRechargeRules,
      pointsRule: initialPointsRule,

      addMember: (data) =>
        set((state) => ({
          members: [
            ...state.members,
            {
              ...data,
              id: genId(),
              balance: 0,
              totalPoints: 0,
              availablePoints: 0,
              level: '普通会员' as MemberLevel,
              noShowCount: 0,
              createdAt: dayjs().format('YYYY-MM-DD'),
            },
          ],
        })),

      updateMember: (id, data) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),

      addAppointment: (data) =>
        set((state) => ({
          appointments: [
            ...state.appointments,
            {
              ...data,
              id: genId(),
              status: 'confirmed',
            },
          ],
        })),

      updateAppointment: (id, data) =>
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      updateAppointmentStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      markNoShow: (id) => {
        const state = get();
        const appt = state.appointments.find((a) => a.id === id);
        if (!appt) return;
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: 'no_show' as AppointmentStatus } : a)),
          members: appt.memberId
            ? s.members.map((m) =>
                m.id === appt.memberId ? { ...m, noShowCount: Math.min(m.noShowCount + 1, 9) } : m
              )
            : s.members,
        }));
      },

      rechargeMember: (memberId, ruleId, amount, bonus) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm');
        const expireDate = calcExpireDate(get().pointsRule);
        const rechargeRecId = genId();
        set((state) => {
          const member = state.members.find((m) => m.id === memberId);
          if (!member) return state;
          const newBalance = member.balance + amount + bonus;
          const newLevel: MemberLevel =
            newBalance > 2000 ? '钻石会员' : newBalance > 800 ? '金卡会员' : newBalance > 300 ? '银卡会员' : '普通会员';
          const newBalanceRecords: BalanceRecord[] = [
            {
              id: genId(),
              memberId,
              type: 'recharge',
              amount,
              balanceAfter: member.balance + amount,
              description: `充值 ¥${amount}`,
              relatedId: rechargeRecId,
              createdAt: now,
            },
          ];
          if (bonus > 0) {
            newBalanceRecords.push({
              id: genId(),
              memberId,
              type: 'bonus',
              amount: bonus,
              balanceAfter: newBalance,
              description: `充值赠送 ¥${bonus}`,
              relatedId: rechargeRecId,
              createdAt: now,
            });
          }
          return {
            members: state.members.map((m) =>
              m.id === memberId ? { ...m, balance: newBalance, level: newLevel } : m
            ),
            rechargeRecords: [
              {
                id: rechargeRecId,
                memberId,
                rechargeAmount: amount,
                bonusAmount: bonus,
                ruleId,
                createdAt: now,
              },
              ...state.rechargeRecords,
            ],
            balanceRecords: [...newBalanceRecords, ...state.balanceRecords],
            pointsRecords:
              bonus > 0
                ? [
                    {
                      id: genId(),
                      memberId,
                      type: 'earn',
                      points: 0,
                      expireDate,
                      description: '充值赠送',
                      createdAt: now,
                    },
                    ...state.pointsRecords,
                  ]
                : state.pointsRecords,
          };
        });
      },

      consumeMember: (memberId, barberId, packageId, amount, note) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm');
        const rule = get().pointsRule;
        const pointsPerYuan = rule.pointsPerYuan;
        const pointsEarned = Math.floor(amount * pointsPerYuan);
        const expireDate = calcExpireDate(rule);
        const consumeRecId = genId();

        set((state) => {
          const member = state.members.find((m) => m.id === memberId);
          if (!member) return state;
          const newBalance = Math.max(0, member.balance - amount);
          const newLevel: MemberLevel =
            newBalance > 2000 ? '钻石会员' : newBalance > 800 ? '金卡会员' : newBalance > 300 ? '银卡会员' : '普通会员';
          return {
            members: state.members.map((m) =>
              m.id === memberId
                ? {
                    ...m,
                    balance: newBalance,
                    availablePoints: m.availablePoints + pointsEarned,
                    totalPoints: m.totalPoints + pointsEarned,
                    level: newLevel,
                  }
                : m
            ),
            consumptionRecords: [
              {
                id: consumeRecId,
                memberId,
                barberId,
                packageId,
                amount,
                pointsEarned,
                createdAt: now,
                note,
              },
              ...state.consumptionRecords,
            ],
            balanceRecords: [
              {
                id: genId(),
                memberId,
                type: 'consume',
                amount: -amount,
                balanceAfter: newBalance,
                description: `消费「${note || '服务项目'}」`,
                relatedId: consumeRecId,
                createdAt: now,
              },
              ...state.balanceRecords,
            ],
            pointsRecords: [
              {
                id: genId(),
                memberId,
                type: 'earn',
                points: pointsEarned,
                expireDate,
                description: note || `消费 ¥${amount}`,
                createdAt: now,
              },
              ...state.pointsRecords,
            ],
          };
        });
      },

      exchangePoints: (memberId, rewardId, rewardName, pointsUsed) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm');
        set((state) => ({
          members: state.members.map((m) =>
            m.id === memberId ? { ...m, availablePoints: Math.max(0, m.availablePoints - pointsUsed) } : m
          ),
          exchangeRecords: [
            {
              id: genId(),
              memberId,
              rewardId,
              rewardName,
              pointsUsed,
              createdAt: now,
            },
            ...state.exchangeRecords,
          ],
          pointsRecords: [
            {
              id: genId(),
              memberId,
              type: 'exchange',
              points: -pointsUsed,
              description: `兑换：${rewardName}`,
              createdAt: now,
            },
            ...state.pointsRecords,
          ],
        }));
      },

      addExchangeItem: (item) =>
        set((state) => ({
          pointsRule: {
            ...state.pointsRule,
            exchangeItems: [...state.pointsRule.exchangeItems, { ...item, id: genId() }],
          },
        })),

      removeExchangeItem: (id) =>
        set((state) => ({
          pointsRule: {
            ...state.pointsRule,
            exchangeItems: state.pointsRule.exchangeItems.filter((i) => i.id !== id),
          },
        })),

      updatePointsRule: (rule) =>
        set((state) => ({
          pointsRule: { ...state.pointsRule, ...rule },
        })),

      addRechargeRule: (data) =>
        set((state) => ({
          rechargeRules: [...state.rechargeRules, { ...data, id: genId() }],
        })),

      updateRechargeRule: (id, data) =>
        set((state) => ({
          rechargeRules: state.rechargeRules.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      removeRechargeRule: (id) =>
        set((state) => ({
          rechargeRules: state.rechargeRules.filter((r) => r.id !== id),
        })),

      updateBarber: (id, data) =>
        set((state) => ({
          barbers: state.barbers.map((b) => (b.id === id ? { ...b, ...data } : b)),
        })),

      getExpiringPointsMembers: () => {
        const state = get();
        const now = dayjs();
        const result: { member: Member; expiringPoints: number; expireDate: string; daysLeft: number }[] = [];

        state.members.forEach((member) => {
          let expiringPoints = 0;
          let earliestExpire = '';
          let minDays = 999;

          state.pointsRecords
            .filter((p) => p.memberId === member.id && p.type === 'earn' && p.expireDate)
            .forEach((p) => {
              const daysLeft = dayjs(p.expireDate!).diff(now, 'day');
              if (daysLeft >= 0 && daysLeft <= 30) {
                expiringPoints += p.points;
                if (daysLeft < minDays) {
                  minDays = daysLeft;
                  earliestExpire = p.expireDate!;
                }
              }
            });

          if (expiringPoints > 0) {
            result.push({
              member,
              expiringPoints,
              expireDate: earliestExpire,
              daysLeft: minDays,
            });
          }
        });

        return result.sort((a, b) => a.daysLeft - b.daysLeft);
      },

      getMonthlyStatistics: (month) => {
        const state = get();
        const monthRecords = state.consumptionRecords.filter((r) => r.createdAt.startsWith(month));

        const barberMap = new Map<string, { customerCount: number; revenue: number }>();
        state.barbers.forEach((b) => barberMap.set(b.id, { customerCount: 0, revenue: 0 }));

        const packageMap = new Map<string, { count: number; revenue: number }>();
        state.servicePackages.forEach((p) => packageMap.set(p.id, { count: 0, revenue: 0 }));

        monthRecords.forEach((r) => {
          if (r.barberId && barberMap.has(r.barberId)) {
            const bs = barberMap.get(r.barberId)!;
            bs.customerCount += 1;
            bs.revenue += r.amount;
          }
          if (r.packageId && packageMap.has(r.packageId)) {
            const ps = packageMap.get(r.packageId)!;
            ps.count += 1;
            ps.revenue += r.amount;
          }
        });

        return {
          barberStats: state.barbers.map((b) => ({
            barberId: b.id,
            barberName: b.name,
            ...barberMap.get(b.id)!,
          })),
          packageStats: state.servicePackages.map((p) => ({
            packageId: p.id,
            packageName: p.name,
            category: p.category,
            ...packageMap.get(p.id)!,
          })),
        };
      },

      getMonthlyRevenue: () => {
        const state = get();
        const result: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const month = dayjs().subtract(i, 'month').format('YYYY-MM');
          const revenue = state.consumptionRecords
            .filter((r) => r.createdAt.startsWith(month))
            .reduce((sum, r) => sum + r.amount, 0);
          result.push({ month: dayjs().subtract(i, 'month').format('MM月'), revenue });
        }
        return result;
      },

      rescheduleAppointment: (id, data) => {
        const state = get();
        const { date, startTime, endTime, barberId } = data;
        const T2I = (t: string) => { const [h, m] = t.split(':').map(Number); return (h - 9) * 2 + (m >= 30 ? 1 : 0); };
        const startIdx = T2I(startTime);
        const endIdx = T2I(endTime);

        const hasConflict = state.appointments.some((a) => {
          if (a.id === id) return false;
          if (a.barberId !== barberId || a.date !== date || a.status === 'cancelled') return false;
          const aStart = T2I(a.startTime);
          const aEnd = T2I(a.endTime);
          return !(startIdx >= aEnd || endIdx <= aStart);
        });

        if (hasConflict) return false;

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, date, startTime, endTime, barberId } : a
          ),
        }));
        return true;
      },

      getMemberBalanceRecords: (memberId) => {
        return get().balanceRecords
          .filter((r) => r.memberId === memberId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },

      getMemberProfile: (memberId) => {
        const state = get();
        const consumptions = state.consumptionRecords.filter(r => r.memberId === memberId);
        const appoints = state.appointments.filter(a => a.memberId === memberId && a.status === 'completed');
        const all = [...consumptions, ...appoints.map(a => ({ createdAt: `${a.date} ${a.startTime}` }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const lastVisit = all[0]?.createdAt?.substring(0, 10) || state.members.find(m => m.id === memberId)?.createdAt?.substring(0, 10) || '-';
        const daysSince = lastVisit !== '-' ? dayjs().diff(dayjs(lastVisit), 'day') : 9999;
        const totalSpend = consumptions.reduce((s, r) => s + r.amount, 0);
        const visitCount = Math.max(consumptions.length, appoints.length);
        const avgSpend = visitCount > 0 ? Math.round(totalSpend / visitCount) : 0;

        const svcCount: Record<string, number> = {};
        consumptions.forEach(c => {
          const name = c.note || state.servicePackages.find(p => p.id === c.packageId)?.name || '其他服务';
          svcCount[name] = (svcCount[name] || 0) + 1;
        });
        const frequentServices = Object.entries(svcCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));

        const spendLevel: MemberProfile['spendLevel'] = totalSpend >= 2000 ? '高消费' : totalSpend >= 800 ? '中消费' : '低消费';
        const freqLevel: MemberProfile['freqLevel'] = visitCount >= 12 ? '忠实' : visitCount >= 6 ? '常客' : visitCount >= 3 ? '一般' : '偶尔';

        const tags: string[] = [];
        if (freqLevel === '忠实' || freqLevel === '常客') tags.push('老客');
        if (spendLevel === '高消费') tags.push('高价值');
        if (frequentServices.some(s => s.name.includes('烫') || s.name.includes('染'))) tags.push('烫染客');
        if (frequentServices.some(s => s.name.includes('护'))) tags.push('护理客');
        if (daysSince > 30) tags.push('久未到店');

        return {
          memberId,
          frequentServices,
          lastVisitDate: lastVisit,
          daysSinceLastVisit: daysSince,
          visitCount,
          avgSpend,
          totalSpend,
          spendLevel,
          freqLevel,
          suggestedTags: tags,
        };
      },

      addFollowUpRecord: (data) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm');
        set(state => ({
          followUpRecords: [{ ...data, id: genId(), contactedAt: now }, ...state.followUpRecords],
        }));
      },

      getFollowUpRecords: (memberId) => {
        return get().followUpRecords.filter(r => r.memberId === memberId).sort((a, b) => b.contactedAt.localeCompare(a.contactedAt));
      },

      linkAppointmentConsumption: (appointmentId, consumptionId, followUpNote) => {
        set(state => ({
          appointments: state.appointments.map(a =>
            a.id === appointmentId ? { ...a, consumptionId, followUpNote: followUpNote || a.followUpNote } : a
          ),
        }));
      },

      adjustMemberBalance: (memberId, amount, description) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm');
        let success = false;
        set(state => {
          const member = state.members.find(m => m.id === memberId);
          if (!member) return state;
          const newBalance = member.balance + amount;
          if (newBalance < 0) return state;
          success = true;
          return {
            members: state.members.map(m => m.id === memberId ? { ...m, balance: newBalance } : m),
            balanceRecords: [
              {
                id: genId(),
                memberId,
                type: 'adjust',
                amount,
                balanceAfter: newBalance,
                description,
                createdAt: now,
              },
              ...state.balanceRecords,
            ],
          };
        });
        return success;
      },

      filterMarketingMembers: (filters) => {
        const state = get();
        return state.members.filter(m => {
          if (filters.levels && filters.levels.length > 0 && !filters.levels.includes(m.level)) return false;
          if (filters.minBalance !== undefined && m.balance < filters.minBalance) return false;
          if (filters.maxBalance !== undefined && m.balance > filters.maxBalance) return false;
          if (filters.tags && filters.tags.length > 0) {
            const profile = state.getMemberProfile(m.id);
            const allTags = [...(m.tags || []), ...profile.suggestedTags];
            if (!filters.tags.some(t => allTags.includes(t))) return false;
          }
          if (filters.minDaysNotVisited !== undefined || filters.maxDaysNotVisited !== undefined) {
            const profile = state.getMemberProfile(m.id);
            if (filters.minDaysNotVisited !== undefined && profile.daysSinceLastVisit < filters.minDaysNotVisited) return false;
            if (filters.maxDaysNotVisited !== undefined && profile.daysSinceLastVisit > filters.maxDaysNotVisited) return false;
          }
          return true;
        });
      },

      addMemberTag: (memberId, tag) => {
        set(state => ({
          members: state.members.map(m =>
            m.id === memberId ? { ...m, tags: Array.from(new Set([...(m.tags || []), tag])) } : m
          ),
        }));
      },

      removeMemberTag: (memberId, tag) => {
        set(state => ({
          members: state.members.map(m =>
            m.id === memberId ? { ...m, tags: (m.tags || []).filter(t => t !== tag) } : m
          ),
        }));
      },
    }),
    {
      name: 'barbershop-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
