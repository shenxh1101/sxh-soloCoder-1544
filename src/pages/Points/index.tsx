import { useState, useMemo } from 'react';
import {
  Tabs, Card, Row, Col, InputNumber, Button, Modal, Select, Table, Tag,
  Statistic, Space, Typography, message, Avatar,
} from 'antd';
import {
  GiftOutlined, PhoneOutlined, CheckOutlined, BellOutlined,
  TrophyOutlined, WalletOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { Member, ExchangeItem } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Points() {
  const store = useAppStore();
  const { pointsRule, members, exchangeRecords, updatePointsRule, exchangePoints, getExpiringPointsMembers } = store;
  const [modalOpen, setModalOpen] = useState(false);
  const [selItem, setSelItem] = useState<ExchangeItem | null>(null);
  const [selMbr, setSelMbr] = useState<string | undefined>();
  const [notified, setNotified] = useState<Record<string, boolean>>({});

  const expiring = useMemo(() => getExpiringPointsMembers(), [getExpiringPointsMembers]);
  const mbrMap = useMemo(() => Object.fromEntries(members.map(m => [m.id, m])), [members]) as Record<string, Member>;

  const stats = useMemo(() => {
    const m = dayjs().format('YYYY-MM');
    const monthCnt = exchangeRecords.filter(r => r.createdAt.startsWith(m)).length;
    const saved = Math.floor(exchangeRecords.reduce((s, r) => s + r.pointsUsed, 0) / 10);
    return { monthCnt, totalCnt: exchangeRecords.length, saved };
  }, [exchangeRecords]);

  const openExchange = (item: ReturnType<typeof EXCHANGE_ITEM>) => {
    setSelItem(item); setSelMbr(undefined); setModalOpen(true);
  };

  const confirmExchange = () => {
    if (!selMbr || !selItem) return message.warning('请选择会员');
    if (mbrMap[selMbr].availablePoints < selItem.pointsRequired) return message.error('积分不足');
    exchangePoints(selMbr, selItem.id, selItem.name, selItem.pointsRequired);
    message.success(`兑换成功：${selItem.name}`);
    setModalOpen(false);
  };

  const copyPhone = (p: string) => { navigator.clipboard.writeText(p); message.success('手机号已复制'); };
  const toggleNtf = (k: string) => setNotified(p => ({ ...p, [k]: !p[k] }));
  const daysColor = (d: number) => d <= 7 ? 'error' : d <= 15 ? 'warning' : 'warning';
  const daysBg = (d: number) => d <= 7 ? 'bg-red-50' : d <= 15 ? 'bg-orange-50' : 'bg-yellow-50';
  const goldBtn = { backgroundColor: '#D4AF37', borderColor: '#D4AF37' };

  const Tab1 = () => (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-walnut-200 shadow-gold" title={<Space><WalletOutlined className="text-gold-500" /><span className="text-walnut-700">积分规则设置</span></Space>}>
        <Row gutter={[32, 16]}>
          <Col xs={24} md={12}>
            <Space align="center" size={12}>
              <Text className="text-walnut-600 min-w-[120px]">消费1元得积分：</Text>
              <InputNumber min={1} max={100} value={pointsRule.pointsPerYuan} onChange={v => updatePointsRule({ pointsPerYuan: v ?? 1 })} className="w-32" style={{ borderColor: '#D4AF37' }} />
              <Text type="secondary" className="text-walnut-400">分</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space align="center" size={12}>
              <Text className="text-walnut-600 min-w-[120px]">积分有效期：</Text>
              <InputNumber min={1} max={60} value={pointsRule.expireMonths} onChange={v => updatePointsRule({ expireMonths: v ?? 12 })} className="w-32" style={{ borderColor: '#D4AF37' }} />
              <Text type="secondary" className="text-walnut-400">个月</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="border-walnut-200 shadow-gold" title={<Space><GiftOutlined className="text-gold-500" /><span className="text-walnut-700">兑换项目</span></Space>}>
        <Row gutter={[16, 16]}>
          {pointsRule.exchangeItems.map(item => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card hoverable className="h-full border-walnut-100 transition-all hover:shadow-gold-lg hover:-translate-y-1" styles={{ body: { padding: '20px' } }}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="text-5xl w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200">{item.icon}</div>
                  <div>
                    <div className="font-semibold text-walnut-700">{item.name}</div>
                    <Tag color="gold" className="mt-2 border-0" style={{ backgroundColor: '#FFF3C4', color: '#927315' }}>{item.pointsRequired} 积分</Tag>
                  </div>
                  <Button type="primary" size="small" onClick={() => openExchange(item)} style={goldBtn} className="hover:!bg-gold-600 hover:!border-gold-600 w-full">立即兑换</Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal title={<Space><GiftOutlined className="text-gold-500" /><span>积分兑换</span></Space>} open={modalOpen} onOk={confirmExchange} onCancel={() => setModalOpen(false)} okText="确认兑换" cancelText="取消" okButtonProps={{ style: goldBtn }}>
        {selItem && (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-gold-50 to-walnut-50 border border-gold-200">
              <div className="text-4xl">{selItem.icon}</div>
              <div>
                <div className="font-semibold text-walnut-700 text-lg">{selItem.name}</div>
                <div className="text-gold-600 font-medium">需要 {selItem.pointsRequired} 积分</div>
              </div>
            </div>
            <div className="space-y-2">
              <Text className="text-walnut-600">选择会员：</Text>
              <Select placeholder="请选择会员" className="w-full" value={selMbr} onChange={setSelMbr} options={members.map(m => ({ label: `${m.avatar} ${m.name} - ${m.phone}`, value: m.id }))} style={{ borderColor: '#D4AF37' }} />
            </div>
            {selMbr && mbrMap[selMbr] && (
              <div className="p-4 rounded-xl border-2 border-dashed border-gold-300 bg-gold-50">
                <div className="flex items-center space-x-3">
                  <Avatar size={48} style={{ backgroundColor: '#D4AF37' }}>{mbrMap[selMbr].avatar}</Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-walnut-700">
                      {mbrMap[selMbr].name}
                      <Tag style={{ marginLeft: 8 }} className={`border-0 ${mbrMap[selMbr].availablePoints >= selItem.pointsRequired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {mbrMap[selMbr].availablePoints >= selItem.pointsRequired ? '积分充足' : '积分不足'}
                      </Tag>
                    </div>
                    <div className="text-walnut-500 text-sm mt-1">可用积分：<span className="font-bold text-gold-600 text-lg ml-1">{mbrMap[selMbr].availablePoints}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );

  const Tab2 = () => (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-walnut-200 shadow-gold" title={<Space><BellOutlined className="text-gold-500" /><span className="text-walnut-700">积分过期提醒</span><Tag color="red" className="ml-2">{expiring.length} 位</Tag></Space>}>
        <Table dataSource={expiring} rowKey={r => r.member.id} pagination={{ pageSize: 10 }} rowClassName={r => daysBg(r.daysLeft)}
          columns={[
            { title: '会员', render: (_, r) => <Space><Avatar style={{ backgroundColor: '#D4AF37' }}>{r.member.avatar}</Avatar><div><div className="font-medium text-walnut-700">{r.member.name}</div><div className="text-walnut-400 text-xs">{r.member.phone}</div></div></Space> },
            { title: '过期积分', dataIndex: 'expiringPoints', align: 'center', render: v => <span className="font-bold text-lg text-red-500">{v.toLocaleString()}</span> },
            { title: '过期日期', dataIndex: 'expireDate', align: 'center', render: v => <span className="text-walnut-600">{v}</span> },
            { title: '剩余天数', dataIndex: 'daysLeft', align: 'center', render: v => <Tag color={daysColor(v)} className="font-semibold px-3 py-1">{v} 天</Tag> },
            { title: '操作', align: 'center', render: (_, r) => {
              const k = r.member.id, ntf = notified[k];
              return <Space>
                <Button size="small" icon={<PhoneOutlined />} onClick={() => copyPhone(r.member.phone)} style={{ borderColor: '#8B5A2B', color: '#8B5A2B' }}>电话提醒</Button>
                <Tag className={`cursor-pointer select-none px-3 py-1 ${ntf ? 'bg-green-100' : 'bg-gray-100'}`} color={ntf ? 'success' : 'default'} onClick={() => toggleNtf(k)}>{ntf && <CheckOutlined />} {ntf ? '已通知' : '标记已通知'}</Tag>
              </Space>;
            }},
          ]} />
      </Card>
    </div>
  );

  const Tab3 = () => (
    <div className="space-y-6 animate-fade-in">
      <Row gutter={16}>
        <Col xs={24} sm={8}><Card className="border-walnut-200 shadow-gold h-full"><Statistic title={<span className="text-walnut-600">本月兑换数</span>} value={stats.monthCnt} suffix="次" prefix={<TrophyOutlined className="text-gold-500" />} valueStyle={{ color: '#D4AF37' }} /></Card></Col>
        <Col xs={24} sm={8}><Card className="border-walnut-200 shadow-gold h-full"><Statistic title={<span className="text-walnut-600">累计兑换总数</span>} value={stats.totalCnt} suffix="次" prefix={<GiftOutlined className="text-gold-500" />} valueStyle={{ color: '#8B5A2B' }} /></Card></Col>
        <Col xs={24} sm={8}><Card className="border-walnut-200 shadow-gold h-full"><Statistic title={<span className="text-walnut-600">累计节省金额</span>} value={stats.saved} prefix="¥" suffix={<span className="text-walnut-400 text-sm">（估算）</span>} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
      <Card className="border-walnut-200 shadow-gold" title={<Space><TrophyOutlined className="text-gold-500" /><span className="text-walnut-700">兑换记录</span></Space>}>
        <Table dataSource={exchangeRecords} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: '会员', render: (_, r) => { const m = mbrMap[r.memberId]; if (!m) return '-'; return <Space><Avatar style={{ backgroundColor: '#D4AF37' }}>{m.avatar}</Avatar><div><div className="font-medium text-walnut-700">{m.name}</div><div className="text-walnut-400 text-xs">{m.phone}</div></div></Space>; } },
            { title: '兑换项目', dataIndex: 'rewardName', render: v => <span className="text-walnut-700">{v}</span> },
            { title: '消耗积分', dataIndex: 'pointsUsed', align: 'center', render: v => <span className="font-bold text-gold-600">-{v.toLocaleString()}</span> },
            { title: '兑换时间', dataIndex: 'createdAt', align: 'center', render: v => <span className="text-walnut-500">{v}</span> },
          ]} />
      </Card>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-walnut-50">
      <div className="mb-6">
        <Title level={3} style={{ color: '#5D3A1A' }} className="!mb-2">积分管理</Title>
        <Text type="secondary" className="text-walnut-400">管理会员积分规则、兑换项目和过期提醒</Text>
      </div>
      <Card className="border-walnut-200 shadow-gold overflow-hidden">
        <Tabs defaultActiveKey="1" size="large"
          style={{ '--ant-tabs-tab-active-color': '#8B5A2B', '--ant-tabs-ink-bar-color': '#D4AF37', '--ant-tabs-tab-hover-color': '#D4AF37' } as React.CSSProperties}
          items={[
            { key: '1', label: <Space><GiftOutlined />积分规则与兑换</Space>, children: <Tab1 /> },
            { key: '2', label: <Space><BellOutlined />过期提醒{expiring.length > 0 && <Badge count={expiring.length} />}</Space>, children: <Tab2 /> },
            { key: '3', label: <Space><TrophyOutlined />兑换记录</Space>, children: <Tab3 /> },
          ]} />
      </Card>
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full ml-1" style={{ minWidth: 18, height: 18, padding: '0 6px' }}>{count > 99 ? '99+' : count}</span>;
}
