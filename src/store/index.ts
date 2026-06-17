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
} from '@/utils/mockData';

const genId = () => Math.random().toString(36).substring(2, 10);

const initMembers = generateInitialMembers();
const initAppointments = generateInitialAppointments(initMembers, initialBarbers);
const initRechargeRecords = generateInitialRechargeRecords(initMembers);
const initConsumptionRecords = generateInitialConsumptionRecords(initMembers, initialServicePackages, initialBarbers);
const initPointsRecords = generateInitialPointsRecords(initMembers);
const initExchangeRecords = generateInitialExchangeRecords(initMembers, initialPointsRule.exchangeItems);

interface AppState {
  barbers: Barber[];
  members: Member[];
  appointments: Appointment[];
  rechargeRecords: RechargeRecord[];
  consumptionRecords: ConsumptionRecord[];
  pointsRecords: PointsRecord[];
  exchangeRecords: ExchangeRecord[];
  servicePackages: ServicePackage[];
  rechargeRules: RechargeRule[];
  pointsRule: PointsRule;

  addMember: (data: Omit<Member, 'id' | 'createdAt' | 'noShowCount' | 'totalPoints' | 'availablePoints' | 'balance' | 'level'>) => void;
  updateMember: (id: string, data: Partial<Member>) => void;

  addAppointment: (data: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  markNoShow: (id: string) => void;

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
        const expireDate = dayjs().add(get().pointsRule.expireMonths, 'month').format('YYYY-MM-DD');
        set((state) => {
          const member = state.members.find((m) => m.id === memberId);
          if (!member) return state;
          const newBalance = member.balance + amount + bonus;
          const newLevel: MemberLevel =
            newBalance > 2000 ? '钻石会员' : newBalance > 800 ? '金卡会员' : newBalance > 300 ? '银卡会员' : '普通会员';
          return {
            members: state.members.map((m) =>
              m.id === memberId ? { ...m, balance: newBalance, level: newLevel } : m
            ),
            rechargeRecords: [
              {
                id: genId(),
                memberId,
                rechargeAmount: amount,
                bonusAmount: bonus,
                ruleId,
                createdAt: now,
              },
              ...state.rechargeRecords,
            ],
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
        const pointsPerYuan = get().pointsRule.pointsPerYuan;
        const pointsEarned = Math.floor(amount * pointsPerYuan);
        const expireDate = dayjs().add(get().pointsRule.expireMonths, 'month').format('YYYY-MM-DD');

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
                id: genId(),
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
    }),
    {
      name: 'barbershop-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
