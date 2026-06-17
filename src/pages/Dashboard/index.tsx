import { Card } from 'antd';
import {
  CalendarCheck2, Users, Gift, TrendingUp, Plus, Wallet, Coins,
  Clock, ChevronRight, AlertTriangle, Sparkles,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';

dayjs.extend(isBetween);

const WDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-walnut-100 text-walnut-700',
  confirmed: 'bg-gold-100 text-gold-700',
  no_show: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};
const STATUS_TEXT: Record<string, string> = {
  completed: '已完成', confirmed: '已确认', no_show: '未到店', cancelled: '已取消',
};
const CARD_CLS = '!rounded-2xl shadow-gold hover:shadow-gold-lg transition-all duration-300 !border-gold-100';

export default function Dashboard() {
  const nav = useNavigate();
  const { appointments, consumptionRecords, barbers, getExpiringPointsMembers, getMonthlyRevenue } = useAppStore();

  const today = dayjs().format('YYYY-MM-DD');
  const mon = dayjs().format('YYYY-MM');
  const ws = dayjs().startOf('week');
  const we = dayjs().endOf('week');

  const todayApts = appointments.filter(a => a.date === today).length;
  const inStore = appointments.filter(a => a.date === today && (a.status === 'confirmed' || a.status === 'completed')).length;
  const expMem = getExpiringPointsMembers();
  const mRev = consumptionRecords.filter(r => r.createdAt.startsWith(mon)).reduce((s, r) => s + r.amount, 0);
  const revData = getMonthlyRevenue();

  const wkApts = appointments
    .filter(a => dayjs(a.date).isBetween(ws, we, null, '[]'))
    .sort((a, b) => dayjs(a.date + ' ' + a.startTime).valueOf() - dayjs(b.date + ' ' + b.startTime).valueOf());
  const grouped = wkApts.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {} as Record<string, typeof wkApts>);
  const barberName = (id: string) => barbers.find(b => b.id === id)?.name || '未分配';

  const stats = [
    { t: '今日预约数', v: todayApts, u: '单', i: CalendarCheck2, g: 'from-gold-400 to-gold-600', bg: 'bg-gold-50', b: 'border-gold-200' },
    { t: '在店客户数', v: inStore, u: '人', i: Users, g: 'from-walnut-400 to-walnut-600', bg: 'bg-walnut-50', b: 'border-walnut-200' },
    { t: '待提醒积分数', v: expMem.length, u: '人', i: Gift, g: 'from-mocha to-walnut-500', bg: 'bg-ivory', b: 'border-walnut-200' },
    { t: '本月营业额', v: mRev, u: '元', i: TrendingUp, g: 'from-gold-500 to-gold-700', bg: 'bg-gradient-to-br from-gold-50 to-ivory', b: 'border-gold-300', m: true },
  ];
  const actions = [
    { l: '新建预约', i: Plus, p: '/appointments', c: 'from-gold-400 to-gold-600' },
    { l: '会员充值', i: Wallet, p: '/members', c: 'from-walnut-400 to-walnut-600' },
    { l: '积分兑换', i: Coins, p: '/points', c: 'from-mocha to-walnut-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => {
          const Icon = s.i;
          return (
            <Card key={i} className={`!border ${s.b} ${CARD_CLS} hover:-translate-y-1 ${s.bg} overflow-hidden`} styles={{ body: { padding: 0 } }}>
              <div className="p-5 relative">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.g} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-sm font-medium text-walnut-600">{s.t}</span>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center shadow-md`}>
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-walnut-800">
                      {s.m ? '¥' : ''}{s.v.toLocaleString()}
                    </span>
                    <span className="text-sm text-walnut-500 font-medium">{s.u}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={<div className="flex items-center gap-2"><TrendingUp size={18} className="text-gold-500" /><span className="font-serif font-bold text-walnut-800">本月收入趋势</span></div>}
          className={`${CARD_CLS} lg:col-span-2`}
          styles={{ body: { paddingTop: 8 } }}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DF" />
                <XAxis dataKey="month" stroke="#8D6E63" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8D6E63" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `¥${v}`} />
                <Tooltip
                  contentStyle={{ background: '#FFF8E7', border: '1px solid #D4AF37', borderRadius: '12px', boxShadow: '0 4px 14px rgba(212,175,55,0.25)' }}
                  labelStyle={{ color: '#3E2723', fontWeight: 600 }}
                  formatter={(v: number) => [`¥${v.toLocaleString()}`, '营业额']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3}
                  dot={{ fill: '#D4AF37', strokeWidth: 2, r: 5, stroke: '#FFF8E7' }}
                  activeDot={{ r: 7, fill: '#B8941F', stroke: '#FFF8E7', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><Sparkles size={18} className="text-gold-500" /><span className="font-serif font-bold text-walnut-800">快捷操作</span></div>}
          className={CARD_CLS}
        >
          <div className="space-y-3">
            {actions.map((a, i) => {
              const Icon = a.i;
              return (
                <button key={i} onClick={() => nav(a.p)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-walnut-50 to-ivory border border-walnut-100 hover:border-gold-300 hover:shadow-gold transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.c} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="font-semibold text-walnut-700">{a.l}</span>
                  </div>
                  <ChevronRight size={18} className="text-walnut-400 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={<div className="flex items-center gap-2"><Clock size={18} className="text-gold-500" /><span className="font-serif font-bold text-walnut-800">本周预约一览</span></div>}
          className={`${CARD_CLS} lg:col-span-2`}
          styles={{ body: { padding: '12px 24px 24px' } }}
        >
          <div className="max-h-80 overflow-y-auto space-y-5 pr-2">
            {Object.keys(grouped).length === 0 ? (
              <div className="py-12 text-center text-walnut-400">
                <CalendarCheck2 size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">本周暂无预约</p>
              </div>
            ) : (
              Object.entries(grouped).map(([d, as]) => (
                <div key={d}>
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-ivory py-2 z-10">
                    <div className="w-1 h-6 bg-gradient-to-b from-gold-400 to-gold-600 rounded-full" />
                    <span className="font-semibold text-walnut-700">
                      {dayjs(d).format('MM月DD日')}<span className="ml-2 text-sm text-walnut-400 font-normal">{WDAY[dayjs(d).day()]}</span>
                    </span>
                    <span className="ml-auto text-xs text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">{as.length} 单</span>
                  </div>
                  <div className="ml-3 border-l-2 border-dashed border-walnut-200 pl-5 space-y-3">
                    {as.map(a => (
                      <div key={a.id} className="relative p-3 rounded-xl bg-gradient-to-r from-walnut-50 to-transparent border border-walnut-100 hover:border-gold-300 hover:shadow-gold transition-all duration-200">
                        <div className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 border-2 border-ivory shadow-sm" />
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-walnut-800">{a.customerName}</div>
                            <div className="text-sm text-walnut-500 mt-0.5">{a.startTime} - {a.endTime} · {barberName(a.barberId)}</div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[a.status]}`}>{STATUS_TEXT[a.status]}</span>
                        </div>
                        <div className="text-sm text-mocha mt-1.5">{a.serviceType}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card
          title={<div className="flex items-center gap-2"><AlertTriangle size={18} className="text-gold-500" /><span className="font-serif font-bold text-walnut-800">积分即将过期</span></div>}
          extra={<span className="text-xs text-gold-600 cursor-pointer hover:underline" onClick={() => nav('/points')}>查看全部</span>}
          className={CARD_CLS}
        >
          <div className="space-y-3">
            {expMem.slice(0, 3).length === 0 ? (
              <div className="py-10 text-center text-walnut-400">
                <Gift size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无即将过期的积分</p>
              </div>
            ) : (
              expMem.slice(0, 3).map((it, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-gradient-to-r from-gold-50 to-transparent border border-gold-100 hover:border-gold-300 hover:shadow-gold transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-walnut-400 to-walnut-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {it.member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-walnut-800">{it.member.name}</div>
                        <div className="text-xs text-walnut-500">{it.member.phone}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      it.daysLeft <= 7 ? 'bg-red-100 text-red-600' : it.daysLeft <= 15 ? 'bg-gold-100 text-gold-700' : 'bg-walnut-100 text-walnut-700'
                    }`}>{it.daysLeft}天后过期</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gold-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><Coins size={14} className="text-gold-500" /><span className="text-sm text-walnut-600">即将过期</span></div>
                    <span className="font-bold text-gold-600">{it.expiringPoints} 积分</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
