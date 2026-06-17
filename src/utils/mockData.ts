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
  BalanceRecord,
} from '@/types';

const genId = () => Math.random().toString(36).substring(2, 10);

export const initialBarbers: Barber[] = [
  {
    id: 'b1',
    name: '阿明师傅',
    avatar: '💈',
    colorTag: '#D4AF37',
    workStartTime: '09:00',
    workEndTime: '21:00',
    workDays: ['1', '2', '3', '4', '5', '6'],
  },
  {
    id: 'b2',
    name: '小红老师',
    avatar: '✂️',
    colorTag: '#8D6E63',
    workStartTime: '10:00',
    workEndTime: '20:00',
    workDays: ['1', '2', '3', '4', '5', '6', '0'],
  },
];

export const initialRechargeRules: RechargeRule[] = [
  { id: 'r1', rechargeAmount: 200, bonusAmount: 30, isActive: true },
  { id: 'r2', rechargeAmount: 500, bonusAmount: 100, isActive: true },
  { id: 'r3', rechargeAmount: 1000, bonusAmount: 280, isActive: true },
];

export const initialServicePackages: ServicePackage[] = [
  { id: 's1', name: '精剪造型', category: '剪发', price: 68, pointsRequired: 0 },
  { id: 's2', name: '健康洗吹', category: '洗护', price: 38, pointsRequired: 500 },
  { id: 's3', name: '陶瓷烫', category: '烫发', price: 398, pointsRequired: 0 },
  { id: 's4', name: '韩式染发', category: '染发', price: 298, pointsRequired: 0 },
  { id: 's5', name: '烫染套餐', category: '烫染', price: 598, pointsRequired: 0 },
  { id: 's6', name: '护理SPA', category: '护理', price: 168, pointsRequired: 0 },
];

export const initialPointsRule: PointsRule = {
  pointsPerYuan: 1,
  expireRule: 'yearly',
  expireMonths: 12,
  exchangeItems: [
    { id: 'e1', name: '免费洗吹一次', pointsRequired: 500, type: 'service', icon: '💇' },
    { id: 'e2', name: '护发精油一瓶', pointsRequired: 800, type: 'gift', icon: '🧴' },
    { id: 'e3', name: '修眉服务一次', pointsRequired: 300, type: 'service', icon: '✨' },
    { id: 'e4', name: '精美梳子一把', pointsRequired: 200, type: 'gift', icon: '🪮' },
    { id: 'e5', name: '高级洗发水', pointsRequired: 1200, type: 'gift', icon: '🧴' },
  ],
};

const memberAvatars = ['👩', '👨', '👧', '🧑', '👱‍♀️', '👨‍🦱', '👩‍🦰', '🧔', '👩‍🦳', '👨‍🦳'];
const memberNames = [
  '张美丽', '李婷婷', '王芳芳', '刘小华', '陈晓东',
  '赵雅琴', '孙佳怡', '周建国', '吴雪梅', '郑海涛',
  '冯梦琪', '朱丽娜', '钱梓涵', '许文博', '何雨薇',
];

export const generateInitialMembers = (): Member[] => {
  const members: Member[] = [];
  for (let i = 0; i < 15; i++) {
    const balance = [0, 128, 356, 890, 1280, 2100][Math.floor(Math.random() * 6)];
    const points = balance > 0 ? Math.floor(balance * (0.8 + Math.random() * 0.5)) : 0;
    const levels: Member['level'][] = ['普通会员', '银卡会员', '金卡会员', '钻石会员'];
    const level = balance > 2000 ? '钻石会员' : balance > 800 ? '金卡会员' : balance > 300 ? '银卡会员' : '普通会员';
    members.push({
      id: `m${i + 1}`,
      name: memberNames[i],
      phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      avatar: memberAvatars[i % memberAvatars.length],
      balance,
      totalPoints: points + Math.floor(Math.random() * 200),
      availablePoints: points,
      level,
      noShowCount: i % 7 === 0 ? 2 : i % 5 === 0 ? 1 : 0,
      createdAt: dayjs().subtract(Math.floor(Math.random() * 365), 'day').format('YYYY-MM-DD'),
    });
  }
  return members;
};

export const generateInitialAppointments = (members: Member[], barbers: Barber[]): Appointment[] => {
  const appointments: Appointment[] = [];
  const serviceTypes = ['精剪造型', '健康洗吹', '陶瓷烫', '韩式染发', '烫染套餐', '护理SPA'];
  const statuses: Appointment['status'][] = ['confirmed', 'completed', 'completed', 'completed', 'no_show'];

  for (let dayOffset = -3; dayOffset <= 7; dayOffset++) {
    const date = dayjs().add(dayOffset, 'day').format('YYYY-MM-DD');
    const count = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < count; i++) {
      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      const startHour = 10 + Math.floor(Math.random() * 8);
      const startTime = `${String(startHour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;
      const endTime = `${String(startHour + 1).padStart(2, '0')}:${startTime.includes('30') ? '30' : '00'}`;
      const member = members[Math.floor(Math.random() * members.length)];
      const status = dayOffset < 0 ? statuses[Math.floor(Math.random() * statuses.length)] : 'confirmed';

      appointments.push({
        id: genId(),
        memberId: member.id,
        barberId: barber.id,
        date,
        startTime,
        endTime,
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        status,
        customerName: member.name,
        customerPhone: member.phone,
        note: Math.random() > 0.7 ? '老客户，喜欢咖啡' : undefined,
      });
    }
  }
  return appointments;
};

export const generateInitialRechargeRecords = (members: Member[]): RechargeRecord[] => {
  const records: RechargeRecord[] = [];
  const amounts = [200, 200, 500, 500, 1000];
  const bonuses = [30, 30, 100, 100, 280];

  members.forEach((member, idx) => {
    if (member.balance > 0) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const ruleIdx = Math.floor(Math.random() * amounts.length);
        records.push({
          id: genId(),
          memberId: member.id,
          rechargeAmount: amounts[ruleIdx],
          bonusAmount: bonuses[ruleIdx],
          createdAt: dayjs(member.createdAt).add(Math.floor(Math.random() * 180), 'day').format('YYYY-MM-DD HH:mm'),
        });
      }
    }
  });
  return records;
};

export const generateInitialConsumptionRecords = (
  members: Member[],
  packages: ServicePackage[],
  barbers: Barber[]
): ConsumptionRecord[] => {
  const records: ConsumptionRecord[] = [];
  members.forEach((member) => {
    if (member.totalPoints > 0) {
      const count = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < count; i++) {
        const pkg = packages[Math.floor(Math.random() * packages.length)];
        records.push({
          id: genId(),
          memberId: member.id,
          barberId: barbers[Math.floor(Math.random() * barbers.length)].id,
          packageId: pkg.id,
          amount: pkg.price,
          pointsEarned: pkg.price,
          createdAt: dayjs().subtract(Math.floor(Math.random() * 180), 'day').format('YYYY-MM-DD HH:mm'),
          note: pkg.name,
        });
      }
    }
  });
  return records;
};

export const generateInitialPointsRecords = (members: Member[]): PointsRecord[] => {
  const records: PointsRecord[] = [];
  members.forEach((member) => {
    if (member.totalPoints > 0) {
      records.push({
        id: genId(),
        memberId: member.id,
        type: 'earn',
        points: member.totalPoints,
        expireDate: dayjs().add(8, 'month').format('YYYY-MM-DD'),
        description: '消费累积积分',
        createdAt: dayjs().subtract(Math.floor(Math.random() * 60), 'day').format('YYYY-MM-DD'),
      });
    }
    if (member.id === 'm2' || member.id === 'm5') {
      records.push({
        id: genId(),
        memberId: member.id,
        type: 'earn',
        points: Math.floor(Math.random() * 200) + 100,
        expireDate: dayjs().add(20, 'day').format('YYYY-MM-DD'),
        description: '消费累积积分（即将过期）',
        createdAt: dayjs().subtract(340, 'day').format('YYYY-MM-DD'),
      });
    }
  });
  return records;
};

export const generateInitialExchangeRecords = (members: Member[], items: PointsRule['exchangeItems']): ExchangeRecord[] => {
  const records: ExchangeRecord[] = [];
  [members[0], members[3], members[7]].forEach((member) => {
    const item = items[Math.floor(Math.random() * items.length)];
    records.push({
      id: genId(),
      memberId: member.id,
      rewardId: item.id,
      rewardName: item.name,
      pointsUsed: item.pointsRequired,
      createdAt: dayjs().subtract(Math.floor(Math.random() * 60), 'day').format('YYYY-MM-DD HH:mm'),
    });
  });
  return records;
};

export const generateInitialBalanceRecords = (
  members: Member[],
  rechargeRecords: RechargeRecord[],
  consumptionRecords: ConsumptionRecord[]
): BalanceRecord[] => {
  const records: BalanceRecord[] = [];
  members.forEach((member) => {
    const mRecharges = rechargeRecords.filter((r) => r.memberId === member.id);
    const mConsumptions = consumptionRecords.filter((r) => r.memberId === member.id);
    const all: (BalanceRecord & { sortTime: string })[] = [];

    mRecharges.forEach((r) => {
      all.push({
        id: genId(),
        memberId: member.id,
        type: 'recharge',
        amount: r.rechargeAmount,
        balanceAfter: 0,
        description: `充值 ¥${r.rechargeAmount}`,
        relatedId: r.id,
        createdAt: r.createdAt,
        sortTime: r.createdAt,
      });
      if (r.bonusAmount > 0) {
        all.push({
          id: genId(),
          memberId: member.id,
          type: 'bonus',
          amount: r.bonusAmount,
          balanceAfter: 0,
          description: `充值赠送 ¥${r.bonusAmount}`,
          relatedId: r.id,
          createdAt: r.createdAt,
          sortTime: r.createdAt + '1',
        });
      }
    });

    mConsumptions.forEach((c) => {
      all.push({
        id: genId(),
        memberId: member.id,
        type: 'consume',
        amount: -c.amount,
        balanceAfter: 0,
        description: `消费「${c.note || '服务项目'}」`,
        relatedId: c.id,
        createdAt: c.createdAt,
        sortTime: c.createdAt,
      });
    });

    all.sort((a, b) => a.sortTime.localeCompare(b.sortTime));
    let running = 0;
    all.forEach((r) => {
      running += r.amount;
      r.balanceAfter = running;
      records.push({
        id: r.id,
        memberId: r.memberId,
        type: r.type,
        amount: r.amount,
        balanceAfter: r.balanceAfter,
        description: r.description,
        relatedId: r.relatedId,
        createdAt: r.createdAt,
      });
    });
  });
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
