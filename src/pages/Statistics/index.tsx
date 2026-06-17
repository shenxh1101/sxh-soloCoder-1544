import { useState, useMemo } from 'react';
import { Card, Select, Table, Typography } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import dayjs from 'dayjs';
import {
  DollarSign,
  Users,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store';

const { Title, Text } = Typography;

const PIE_COLORS = ['#D4AF37', '#8D6E63', '#B8941F', '#9C7A56', '#5D3A1A', '#E8C547'];
const WARM_COLORS = ['#F6D45F', '#D4AF37', '#E8A838', '#C49B6B', '#8D6E63', '#B8860B'];

export default function Statistics() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const getMonthlyStatistics = useAppStore((s) => s.getMonthlyStatistics);
  const getMonthlyRevenue = useAppStore((s) => s.getMonthlyRevenue);

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 5; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month');
      options.push({
        value: m.format('YYYY-MM'),
        label: m.format('YYYY年MM月'),
      });
    }
    return options;
  }, []);

  const stats = useMemo(() => getMonthlyStatistics(selectedMonth), [selectedMonth, getMonthlyStatistics]);
  const revenueTrend = useMemo(() => getMonthlyRevenue(), [getMonthlyRevenue]);

  const totalRevenue = stats.barberStats.reduce((s, b) => s + b.revenue, 0);
  const totalCustomers = stats.barberStats.reduce((s, b) => s + b.customerCount, 0);
  const avgPrice = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const permColorStats = useMemo(() => {
    const permRev = stats.packageStats
      .filter((p) => p.category === '烫染' || p.category === '烫发' || p.category === '染发')
      .reduce((s, p) => s + p.revenue, 0);
    return totalRevenue > 0 ? (permRev / totalRevenue) * 100 : 0;
  }, [stats.packageStats, totalRevenue]);

  const categoryPieData = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    stats.packageStats.forEach((p) => {
      if (p.count > 0) {
        const cur = map.get(p.category) || { value: 0, count: 0 };
        cur.value += p.revenue;
        cur.count += p.count;
        map.set(p.category, cur);
      }
    });
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  }, [stats.packageStats]);

  const packagePieData = useMemo(
    () => stats.packageStats.filter((p) => p.count > 0).map((p) => ({ name: p.packageName, value: p.count, revenue: p.revenue })),
    [stats.packageStats]
  );

  const totalPackageCount = packagePieData.reduce((s, p) => s + p.value, 0);

  const sortedBarbers = useMemo(
    () => [...stats.barberStats].sort((a, b) => b.revenue - a.revenue),
    [stats.barberStats]
  );

  const sortedPackages = useMemo(() => {
    const list = stats.packageStats
      .filter((p) => p.count > 0)
      .map((p) => ({
        ...p,
        ratio: totalPackageCount > 0 ? ((p.count / totalPackageCount) * 100).toFixed(1) + '%' : '0%',
      }));
    return list.sort((a, b) => b.count - a.count);
  }, [stats.packageStats, totalPackageCount]);

  const statCards = [
    { icon: <DollarSign size={24} />, title: '总营业额', value: `¥${totalRevenue.toFixed(0)}`, sub: `较上月 ${(totalRevenue * 0.12).toFixed(0)}`, color: 'from-gold-400 to-gold-600', bg: 'bg-gold-50' },
    { icon: <Users size={24} />, title: '服务客户总数', value: totalCustomers.toString(), sub: '人次', color: 'from-walnut-400 to-walnut-600', bg: 'bg-walnut-50' },
    { icon: <Receipt size={24} />, title: '平均客单价', value: `¥${avgPrice.toFixed(0)}`, sub: '人均消费', color: 'from-mocha to-walnut-500', bg: 'bg-orange-50' },
    { icon: <Sparkles size={24} />, title: '烫染占比', value: `${permColorStats.toFixed(1)}%`, sub: '烫发+染发', color: 'from-gold-500 to-gold-700', bg: 'bg-amber-50' },
  ];

  const SectionCard = ({ title, subtitle, children, extra }: { title: string; subtitle?: string; children: React.ReactNode; extra?: React.ReactNode }) => (
    <Card
      className="shadow-sm border-0 !rounded-2xl overflow-hidden"
      style={{ background: '#FFFBF2', border: '1px solid rgba(141, 110, 99, 0.1)' }}
      title={
        <div>
          <Title level={5} className="!m-0 !text-walnut-800" style={{ fontFamily: 'serif' }}>{title}</Title>
          {subtitle && <Text type="secondary" className="!text-xs">{subtitle}</Text>}
        </div>
      }
      extra={extra}
    >
      {children}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={3} className="!m-0 !text-walnut-800" style={{ fontFamily: 'serif' }}>数据统计中心</Title>
          <Text type="secondary">全方位掌握门店经营状况</Text>
        </div>
        <Select
          value={selectedMonth}
          onChange={setSelectedMonth}
          options={monthOptions}
          style={{ width: 180 }}
          size="large"
          className="!rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c, i) => (
          <Card key={i} className="!rounded-2xl !border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ background: '#FFFBF2' }}>
            <div className="flex items-start justify-between">
              <div>
                <Text type="secondary" className="!text-sm">{c.title}</Text>
                <div className="text-3xl font-bold text-walnut-800 mt-2" style={{ fontFamily: 'serif' }}>{c.value}</div>
                <Text type="secondary" className="!text-xs mt-1 block">{c.sub}</Text>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-gold`}>
                {c.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionCard title="理发师业绩排行" subtitle={`${selectedMonth} 各理发师收入与客户数对比`}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barberStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DF" />
                <XAxis dataKey="barberName" tick={{ fill: '#5D3A1A', fontSize: 13 }} axisLine={{ stroke: '#D4C3B0' }} />
                <YAxis yAxisId="left" tick={{ fill: '#5D3A1A' }} axisLine={{ stroke: '#D4C3B0' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#5D3A1A' }} axisLine={{ stroke: '#D4C3B0' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #D4C3B0', background: '#FFFBF2' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="收入(元)" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="customerCount" name="客户数" fill="#8D6E63" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2">
            <Table
              size="small"
              pagination={false}
              dataSource={sortedBarbers.map((b, i) => ({ ...b, rank: i + 1 }))}
              rowKey="barberId"
              columns={[
                { title: '排名', dataIndex: 'rank', width: 50, render: (v: number) => <span className={`font-bold ${v === 1 ? 'text-gold-600' : v === 2 ? 'text-mocha' : v === 3 ? 'text-walnut-400' : 'text-walnut-500'}`}>{v}</span> },
                { title: '理发师', dataIndex: 'barberName', render: (v: string) => <span className="text-walnut-700 font-medium">{v}</span> },
                { title: '收入', dataIndex: 'revenue', render: (v: number) => <span className="text-gold-600 font-semibold">¥{v}</span> },
                { title: '客户', dataIndex: 'customerCount', render: (v: number) => <span className="text-walnut-500">{v}人</span> },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="套餐销量Top榜" subtitle="本月销量排名（含数量、收入、占比）">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={packagePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#D4C3B0' }}>
                    {packagePieData.map((_, i) => <Cell key={i} fill={WARM_COLORS[i % WARM_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #D4C3B0', background: '#FFFBF2' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Table
              size="small"
              pagination={false}
              dataSource={sortedPackages}
              rowKey="packageId"
              columns={[
                { title: '套餐', dataIndex: 'packageName', ellipsis: true, render: (v: string) => <span className="text-walnut-700 text-sm">{v}</span> },
                { title: '数量', dataIndex: 'count', width: 50, render: (v: number) => <span className="text-gold-600 font-semibold text-sm">{v}</span> },
                { title: '收入', dataIndex: 'revenue', width: 70, render: (v: number) => <span className="text-walnut-600 text-sm">¥{v}</span> },
                { title: '占比', dataIndex: 'ratio', width: 55, render: (v: string) => <span className="text-mocha text-sm">{v}</span> },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title="热门项目类别分布" subtitle="按项目类别汇总的销量分布">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, count }) => `${name}(${count})`}
                  labelLine={{ stroke: '#D4C3B0' }}
                >
                  {categoryPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #D4C3B0', background: '#FFFBF2' }}
                  formatter={(value: number) => [`¥${value}`, '收入']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="近6个月收入走势" subtitle="整体收入变化趋势分析">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DF" />
              <XAxis dataKey="month" tick={{ fill: '#5D3A1A', fontSize: 13 }} axisLine={{ stroke: '#D4C3B0' }} />
              <YAxis tick={{ fill: '#5D3A1A' }} axisLine={{ stroke: '#D4C3B0' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #D4C3B0', background: '#FFFBF2' }}
                formatter={(v: number) => [`¥${v}`, '收入']}
              />
              <Area type="monotone" dataKey="revenue" name="收入(元)" stroke="#D4AF37" strokeWidth={3} fill="url(#goldGrad)" dot={{ fill: '#D4AF37', r: 5, strokeWidth: 2, stroke: '#FFFBF2' }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="revenue" stroke="#8D6E63" strokeWidth={0} dot={{ r: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
