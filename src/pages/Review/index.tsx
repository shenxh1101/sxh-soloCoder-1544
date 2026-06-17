import { useState } from 'react';
import {
  Card, Segmented, Row, Col, Progress, Statistic, Table, Tag, Button, Space, Tooltip, Empty,
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  ChevronLeft, ChevronRight, CalendarCheck, XCircle, Users, Wallet, TrendingUp, Target,
  UserCheck, ShoppingBag, Sparkles,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { ReviewStats } from '@/types';

const COLORS = ['#D4AF37', '#8B5E3C', '#A0522D', '#DEB887', '#6B4423', '#CD853F'];

export default function Review() {
  const s = useAppStore();
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [offset, setOffset] = useState(0);

  const stats: ReviewStats = s.getReviewStats(period, offset);
  const lifecycleStats = s.getLifecycleStats();
  const lifecycleGroups = s.getLifecycleGroups();

  const lifecycleData = lifecycleGroups.map(g => ({
    name: g.name,
    value: lifecycleStats[g.key],
    color: g.key === 'high_value' ? '#D4AF37' : g.key === 'active' ? '#F97316' : g.key === 'sleeping' ? '#8B5CF6' : '#22C55E',
  }));

  const trendData = Array.from({ length: period === 'week' ? 6 : 6 }, (_, i) => {
    const idx = (period === 'week' ? 5 - i : 5 - i);
    const st = s.getReviewStats(period, idx);
    return {
      name: st.period,
      预约数: st.appointmentTotal,
      完成数: st.appointmentCompleted,
      收入: Math.round(st.totalRevenue),
    };
  }).reverse();

  const statCards: { key: string; title: string; value: any; icon: any; color: string; tip?: string; suffix?: string }[] = [
    { key: 'total', title: '预约总数', value: stats.appointmentTotal, icon: CalendarCheck, color: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700', tip: '本期全部预约' },
    { key: 'rate', title: '完成率', value: `${(stats.completionRate * 100).toFixed(1)}%`, icon: Target, color: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700', tip: '已完成 / 预约总数' },
    { key: 'noshow', title: '爽约率', value: `${(stats.noShowRate * 100).toFixed(1)}%`, icon: XCircle, color: 'from-rose-50 to-red-50 border-rose-200 text-rose-700', tip: '爽约 / 预约总数' },
    { key: 'new', title: '新增会员', value: stats.newMembers, icon: Users, color: 'from-violet-50 to-purple-50 border-violet-200 text-violet-700' },
    { key: 'active', title: '活跃会员', value: stats.activeMembers, icon: UserCheck, color: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-700' },
    { key: 'revenue', title: '营业收入', value: `¥${stats.totalRevenue}`, icon: Wallet, color: 'from-gold-50 to-amber-50 border-gold-200 text-gold-700', suffix: '' },
    { key: 'aver', title: '客单价', value: `¥${stats.avgOrderValue.toFixed(0)}`, icon: ShoppingBag, color: 'from-orange-50 to-amber-50 border-orange-200 text-orange-700' },
    { key: 'ratio', title: '会员贡献', value: `${(stats.memberRevenueRatio * 100).toFixed(0)}%`, icon: Sparkles, color: 'from-teal-50 to-cyan-50 border-teal-200 text-teal-700', tip: '会员消费 / 总营收' },
  ];

  const campaignColumns = [
    { title: '营销任务', dataIndex: 'name', width: 180 },
    { title: '创建时间', dataIndex: 'createdAt', width: 150 },
    {
      title: '名单数', width: 80, align: 'center' as const,
      render: (_: any, r: any) => r.members.length,
    },
    {
      title: '待联系', width: 80, align: 'center' as const,
      render: (_: any, r: any) => <Tag color="orange">{r.members.filter((m: any) => m.status === 'pending').length}</Tag>,
    },
    {
      title: '已联系', width: 80, align: 'center' as const,
      render: (_: any, r: any) => <Tag color="blue">{r.members.filter((m: any) => m.status === 'contacted').length}</Tag>,
    },
    {
      title: '已到店/消费', width: 110, align: 'center' as const,
      render: (_: any, r: any) => <Tag color="green">{r.members.filter((m: any) => m.status === 'visited' || m.status === 'consumed').length}</Tag>,
    },
    {
      title: '转化率', width: 100, align: 'center' as const,
      render: (_: any, r: any) => {
        const contacted = r.members.filter((m: any) => m.status !== 'pending').length;
        const converted = r.members.filter((m: any) => m.status === 'visited' || m.status === 'consumed').length;
        if (contacted === 0) return <span className="text-walnut-400">-</span>;
        return <span className="font-bold text-emerald-600">{(converted / contacted * 100).toFixed(0)}%</span>;
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Card className="!rounded-2xl !shadow-sm" styles={{ body: { padding: 20 } }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-walnut-800 m-0 flex items-center gap-2">
              <TrendingUp className="text-gold-500" />经营复盘
            </h2>
            <p className="text-walnut-500 text-sm m-0 mt-1">统计周期：{stats.period}</p>
          </div>
          <Space>
            <Button icon={<ChevronLeft />} onClick={() => setOffset(o => o + 1)}>上一期</Button>
            <Segmented
              value={period}
              onChange={v => { setPeriod(v as any); setOffset(0); }}
              options={[
                { label: '按周', value: 'week' },
                { label: '按月', value: 'month' },
              ]}
            />
            <Button onClick={() => setOffset(0)} type={offset === 0 ? 'primary' : 'default'} disabled={offset === 0}>本期</Button>
            <Button icon={<ChevronRight />} onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}>下一期</Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map(sc => {
          const Icon = sc.icon;
          return (
            <Col xs={12} sm={8} lg={6} key={sc.key}>
              <Tooltip title={sc.tip}>
                <Card className={`!rounded-2xl !shadow-sm bg-gradient-to-br ${sc.color} border`} styles={{ body: { padding: 16 } }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-walnut-600 font-medium">{sc.title}</div>
                      <div className="text-2xl font-bold mt-2">{sc.value}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/60">
                      <Icon size={20} />
                    </div>
                  </div>
                </Card>
              </Tooltip>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<span className="font-semibold">预约完成与爽约</span>} className="!rounded-2xl !shadow-sm">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-walnut-600">预约完成率</span>
                  <span className="font-bold text-emerald-600">{(stats.completionRate * 100).toFixed(1)}%</span>
                </div>
                <Progress percent={+(stats.completionRate * 100).toFixed(1)} strokeColor="#22C55E" showInfo={false} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-walnut-600">爽约率</span>
                  <span className="font-bold text-rose-600">{(stats.noShowRate * 100).toFixed(1)}%</span>
                </div>
                <Progress percent={+(stats.noShowRate * 100).toFixed(1)} strokeColor="#EF4444" showInfo={false} />
              </div>
              <Row gutter={16} className="pt-2">
                <Col span={6}>
                  <Statistic title="预约总数" value={stats.appointmentTotal} valueStyle={{ color: '#6B4423', fontSize: 18 }} />
                </Col>
                <Col span={6}>
                  <Statistic title="已完成" value={stats.appointmentCompleted} valueStyle={{ color: '#22C55E', fontSize: 18 }} />
                </Col>
                <Col span={6}>
                  <Statistic title="爽约" value={stats.appointmentNoShow} valueStyle={{ color: '#EF4444', fontSize: 18 }} />
                </Col>
                <Col span={6}>
                  <Statistic title="已取消" value={stats.appointmentCancelled} valueStyle={{ color: '#94A3B8', fontSize: 18 }} />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span className="font-semibold">会员生命周期分布</span>} className="!rounded-2xl !shadow-sm">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={lifecycleData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                  label={(entry) => `${entry.name} ${entry.value}`}
                >
                  {lifecycleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              {lifecycleGroups.map(g => (
                <div key={g.key} className="flex items-center gap-1.5 text-sm">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: lifecycleData.find(d => d.name === g.name)?.color }} />
                  <span className="text-walnut-600">{g.icon} {g.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title={<span className="font-semibold">近期趋势（近6期）</span>} className="!rounded-2xl !shadow-sm">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DF" />
            <XAxis dataKey="name" stroke="#8B5E3C" />
            <YAxis stroke="#8B5E3C" />
            <RTooltip />
            <Legend />
            <Line type="monotone" dataKey="预约数" stroke="#6B4423" strokeWidth={2} dot={{ fill: '#6B4423' }} />
            <Line type="monotone" dataKey="完成数" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E' }} />
            <Line type="monotone" dataKey="收入" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title={<span className="font-semibold">营销任务转化追踪</span>}
        extra={<span className="text-sm text-walnut-500">本期创建 {stats.campaignCount} 个任务，已联系 {stats.campaignContacted} 人，转化 {stats.campaignConverted} 人（转化率 {(stats.campaignConversionRate * 100).toFixed(0)}%）</span>}
        className="!rounded-2xl !shadow-sm"
      >
        {s.marketingCampaigns.length === 0 ? (
          <Empty description="暂无营销任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            size="small"
            dataSource={s.marketingCampaigns}
            columns={campaignColumns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<span className="font-semibold">会员消费贡献分析</span>} className="!rounded-2xl !shadow-sm">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-walnut-600">会员消费</span>
                  <span className="font-bold text-lg text-gold-600">¥{stats.memberRevenue}</span>
                </div>
                <Progress percent={+(stats.memberRevenueRatio * 100).toFixed(1)} strokeColor="#D4AF37" showInfo={false} className="!mt-2" />
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-walnut-50 border border-walnut-200">
                <div className="flex justify-between items-center">
                  <span className="text-walnut-600">非会员消费</span>
                  <span className="font-bold text-lg text-walnut-700">¥{stats.totalRevenue - stats.memberRevenue}</span>
                </div>
                <Progress percent={+((1 - stats.memberRevenueRatio) * 100).toFixed(1)} strokeColor="#8B5E3C" showInfo={false} className="!mt-2" />
              </div>
              <div className="p-3 rounded-xl bg-walnut-50 text-sm text-walnut-600">
                <p className="m-0 flex items-center gap-2">
                  <Sparkles size={14} className="text-gold-500" />
                  建议：提升会员办卡率与消费频次，可进一步提高会员收入占比
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span className="font-semibold">生命周期经营建议</span>} className="!rounded-2xl !shadow-sm">
            <div className="space-y-3">
              {lifecycleGroups.map(g => (
                <div key={g.key} className={`p-3 rounded-xl bg-gradient-to-r ${g.bg} border`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-walnut-800">{g.icon} {g.name}（{lifecycleStats[g.key]}人）</span>
                    <span className="text-xs text-walnut-500">{g.description}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.suggestions.map(sug => <Tag key={sug} color="gold" className="!text-xs !border-0">{sug}</Tag>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
