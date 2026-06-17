import { useState, useMemo } from 'react';
import {
  Input, Select, Button, Card, Tag, Modal, Drawer, Table, Form, InputNumber,
  Avatar, Space, message, Divider, Tabs
} from 'antd';
import { Search, Plus, Wallet, ShoppingBag, Eye, UserPlus, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Member, MemberLevel } from '@/types';

const LEVEL_COLORS: Record<MemberLevel, string> = { '普通会员': 'default', '银卡会员': 'blue', '金卡会员': 'gold', '钻石会员': 'purple' };
const AVATARS = ['👩', '👨', '👧', '🧑', '👱‍♀️', '👨‍🦱', '👩‍🦰', '🧔'];
const GOLD_BTN = { style: { background: 'linear-gradient(135deg, #D4AF37, #B8941F)' } };

export default function Members() {
  const s = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<MemberLevel | undefined>();
  const [rechargeModal, setRechargeModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [consumeModal, setConsumeModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [createModal, setCreateModal] = useState(false);
  const [rechargeForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [selectedRuleId, setSelectedRuleId] = useState<string | undefined>();
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  const filteredMembers = useMemo(() => s.members.filter((m) =>
    (!searchText || m.name.includes(searchText) || m.phone.includes(searchText)) &&
    (!levelFilter || m.level === levelFilter)
  ), [s.members, searchText, levelFilter]);

  const calcRecharge = () => {
    const rule = s.rechargeRules.find((r) => r.id === selectedRuleId);
    const amount = rule ? rule.rechargeAmount : customAmount || 0;
    const bonus = rule ? rule.bonusAmount : 0;
    return { amount, bonus, total: amount + bonus };
  };
  const { amount: rechargeAmt, bonus: rechargeBonus, total: rechargeTotal } = calcRecharge();

  const openRecharge = (member: Member) => {
    setSelectedRuleId(undefined); setCustomAmount(null);
    rechargeForm.resetFields(); setRechargeModal({ open: true, member });
  };

  const confirmRecharge = () => {
    const { member } = rechargeModal; if (!member) return;
    const { amount, bonus } = calcRecharge();
    if (amount <= 0) { message.warning('请选择充值档位或输入自定义金额'); return; }
    s.rechargeMember(member.id, selectedRuleId, amount, bonus);
    message.success('充值成功！'); setRechargeModal({ open: false });
  };

  const openConsume = (member: Member) => { consumeForm.resetFields(); setConsumeModal({ open: true, member }); };

  const confirmConsume = async () => {
    try {
      const values = await consumeForm.validateFields();
      const { member } = consumeModal; if (!member) return;
      const pkg = s.servicePackages.find((p) => p.id === values.packageId);
      const amount = pkg?.price || 0;
      if (member.balance < amount) { message.error('余额不足，请先充值'); return; }
      s.consumeMember(member.id, values.barberId, values.packageId, amount, pkg?.name);
      message.success('消费成功！'); setConsumeModal({ open: false });
    } catch {}
  };

  const confirmCreate = async () => {
    try {
      const values = await createForm.validateFields();
      s.addMember({ name: values.name, phone: values.phone, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] });
      message.success('会员创建成功！'); createForm.resetFields(); setCreateModal(false);
    } catch {}
  };

  const selectedPkg = s.servicePackages.find((p) => p.id === consumeForm.getFieldValue('packageId'));
  const pointsEarned = selectedPkg?.price || 0;
  const newBalance = (consumeModal.member?.balance || 0) - (selectedPkg?.price || 0);
  const getMemberRecords = (id: string) => ({
    recharge: s.rechargeRecords.filter((r) => r.memberId === id),
    consume: s.consumptionRecords.filter((r) => r.memberId === id),
    points: s.pointsRecords.filter((r) => r.memberId === id),
  });

  const AVATAR_BG = { background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' };
  const CARD_STYLE = { body: { padding: 20 } };
  const TABLE_PG = { pageSize: 5 };

  return (
    <div className="space-y-6">
      <Card className="!rounded-2xl !shadow-sm" styles={CARD_STYLE}>
        <div className="flex flex-wrap items-center gap-4">
          <Input prefix={<Search size={18} className="text-walnut-400" />} placeholder="搜索姓名或电话..."
            value={searchText} onChange={(e) => setSearchText(e.target.value)} className="!w-72" allowClear />
          <Select placeholder="等级筛选" allowClear value={levelFilter} onChange={setLevelFilter} className="!w-44"
            options={['普通会员', '银卡会员', '金卡会员', '钻石会员'].map((v) => ({ value: v, label: v }))} />
          <div className="flex-1" />
          <Button type="primary" icon={<Plus size={18} />} onClick={() => setCreateModal(true)}
            className="!h-10 !px-5 !font-semibold" {...GOLD_BTN}>新建会员</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((m) => (
          <Card key={m.id} className="!rounded-2xl !shadow-sm hover:!shadow-md transition-all" styles={CARD_STYLE}>
            <div className="flex items-start gap-4">
              <Avatar size={56} className="!text-3xl !rounded-xl" style={AVATAR_BG}>{m.avatar}</Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-walnut-800 m-0 truncate">{m.name}</h3>
                  <Tag color={LEVEL_COLORS[m.level]} className="!border-0 !font-medium">{m.level}</Tag>
                </div>
                <p className="text-sm text-walnut-500 m-0 mt-1">{m.phone}</p>
                {m.noShowCount > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                    <AlertTriangle size={12} />
                    <span>爽约 {m.noShowCount} 次{m.noShowCount >= 2 ? '（需关注）' : ''}</span>
                  </div>
                )}
              </div>
            </div>
            <Divider className="!my-4" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                <div className="text-xs text-walnut-500">账户余额</div>
                <div className="text-xl font-bold text-gold-600 mt-1">¥{m.balance}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                <div className="text-xs text-walnut-500">可用积分</div>
                <div className="text-xl font-bold text-purple-600 mt-1">{m.availablePoints}</div>
              </div>
            </div>
            <Space className="!w-full">
              <Button icon={<Wallet size={16} />} onClick={() => openRecharge(m)} className="!flex-1 !h-9">充值</Button>
              <Button icon={<ShoppingBag size={16} />} onClick={() => openConsume(m)} className="!flex-1 !h-9">消费</Button>
              <Button type="primary" ghost icon={<Eye size={16} />} onClick={() => setDetailDrawer({ open: true, member: m })} className="!flex-1 !h-9">详情</Button>
            </Space>
          </Card>
        ))}
      </div>

      <Modal title={<div className="flex items-center gap-2"><UserPlus size={20} className="text-gold-500" /><span className="font-bold">新建会员</span></div>}
        open={createModal} onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        onOk={confirmCreate} okText="确认创建" okButtonProps={GOLD_BTN}>
        <Form form={createForm} layout="vertical" className="pt-2">
          <Form.Item name="name" label="会员姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入电话' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={<div className="flex items-center gap-2"><Wallet size={20} className="text-gold-500" /><span className="font-bold">会员充值 - {rechargeModal.member?.name}</span></div>}
        open={rechargeModal.open} onCancel={() => setRechargeModal({ open: false })}
        onOk={confirmRecharge} okText="确认充值" okButtonProps={GOLD_BTN}>
        <Form form={rechargeForm} layout="vertical" className="pt-2">
          <Form.Item label="选择充值档位">
            <Space className="!w-full !flex-wrap">
              {s.rechargeRules.filter((r) => r.isActive).map((r) => (
                <Button key={r.id} type={selectedRuleId === r.id ? 'primary' : 'default'}
                  onClick={() => { setSelectedRuleId(r.id); setCustomAmount(null); }}
                  className="!h-14 !px-5 !rounded-xl !text-left"
                  style={selectedRuleId === r.id ? GOLD_BTN.style : {}}>
                  <div className="font-bold text-base">充 ¥{r.rechargeAmount}</div>
                  <div className="text-xs opacity-80">送 ¥{r.bonusAmount}</div>
                </Button>
              ))}
            </Space>
          </Form.Item>
          <Form.Item label="自定义金额">
            <InputNumber min={0} step={10} prefix="¥" value={customAmount}
              onChange={(v) => { setCustomAmount(v); if (v) setSelectedRuleId(undefined); }}
              className="!w-full !h-10" placeholder="输入自定义金额，无赠送" />
          </Form.Item>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
            <div className="flex justify-between text-sm text-walnut-600 mb-2"><span>充值本金</span><span>¥{rechargeAmt}</span></div>
            <div className="flex justify-between text-sm text-walnut-600 mb-2"><span>赠送金额</span><span className="text-emerald-600">+¥{rechargeBonus}</span></div>
            <Divider className="!my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-walnut-700">到账总额</span>
              <span className="text-2xl font-bold text-gold-600">¥{rechargeTotal}</span>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal title={<div className="flex items-center gap-2"><ShoppingBag size={20} className="text-gold-500" /><span className="font-bold">会员消费 - {consumeModal.member?.name}</span></div>}
        open={consumeModal.open} onCancel={() => setConsumeModal({ open: false })}
        onOk={confirmConsume} okText="确认消费" okButtonProps={GOLD_BTN}>
        <Form form={consumeForm} layout="vertical" className="pt-2">
          <Form.Item name="packageId" label="选择服务套餐" rules={[{ required: true, message: '请选择套餐' }]}>
            <Select placeholder="请选择服务套餐" options={s.servicePackages.map((p) => ({ value: p.id, label: `${p.name} - ¥${p.price}` }))} />
          </Form.Item>
          <Form.Item name="barberId" label="选择理发师" rules={[{ required: true, message: '请选择理发师' }]}>
            <Select placeholder="请选择理发师" options={s.barbers.map((b) => ({ value: b.id, label: `${b.avatar} ${b.name}` }))} />
          </Form.Item>
          <div className="p-4 rounded-xl bg-gradient-to-br from-stone-50 to-zinc-50 border border-stone-200 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-walnut-500">消费金额</span><span className="font-semibold text-walnut-800">¥{selectedPkg?.price || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-walnut-500">获得积分</span><span className="font-semibold text-purple-600">+{pointsEarned}</span></div>
            <Divider className="!my-2" />
            <div className="flex justify-between text-sm"><span className="text-walnut-500">消费后余额</span><span className={`font-bold ${newBalance < 0 ? 'text-red-600' : 'text-gold-600'}`}>¥{Math.max(0, newBalance)}</span></div>
          </div>
        </Form>
      </Modal>

      <Drawer title={<div className="flex items-center gap-2"><Eye size={20} className="text-gold-500" /><span className="font-bold text-lg">会员详情</span></div>}
        open={detailDrawer.open} onClose={() => setDetailDrawer({ open: false })} width={720}>
        {detailDrawer.member && (() => {
          const m = detailDrawer.member;
          const records = getMemberRecords(m.id);
          return (
            <div className="space-y-5">
              <Card className="!rounded-2xl" styles={CARD_STYLE}>
                <div className="flex items-center gap-4">
                  <Avatar size={68} className="!text-4xl !rounded-2xl" style={AVATAR_BG}>{m.avatar}</Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h2 className="font-bold text-xl m-0">{m.name}</h2><Tag color={LEVEL_COLORS[m.level]} className="!border-0 !font-medium">{m.level}</Tag></div>
                    <p className="text-walnut-500 m-0 mt-1">{m.phone}</p>
                    <p className="text-xs text-walnut-400 m-0 mt-1">注册时间：{m.createdAt}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="p-3 rounded-xl bg-amber-50 text-center"><div className="text-xs text-walnut-500">余额</div><div className="text-xl font-bold text-gold-600 mt-1">¥{m.balance}</div></div>
                  <div className="p-3 rounded-xl bg-violet-50 text-center"><div className="text-xs text-walnut-500">可用积分</div><div className="text-xl font-bold text-purple-600 mt-1">{m.availablePoints}</div></div>
                  <div className="p-3 rounded-xl bg-rose-50 text-center"><div className="text-xs text-walnut-500">累计积分</div><div className="text-xl font-bold text-rose-600 mt-1">{m.totalPoints}</div></div>
                </div>
              </Card>
              <Tabs items={[
                { key: 'recharge', label: `充值记录 (${records.recharge.length})`, children: (
                  <Table size="small" dataSource={records.recharge} rowKey="id" pagination={TABLE_PG} columns={[
                    { title: '时间', dataIndex: 'createdAt', width: 160 },
                    { title: '充值金额', dataIndex: 'rechargeAmount', render: (v) => `¥${v}` },
                    { title: '赠送', dataIndex: 'bonusAmount', render: (v) => <span className="text-emerald-600">+¥{v}</span> },
                    { title: '到账', render: (_, r) => <span className="font-bold text-gold-600">¥{r.rechargeAmount + r.bonusAmount}</span> },
                  ]} />
                )},
                { key: 'consume', label: `消费记录 (${records.consume.length})`, children: (
                  <Table size="small" dataSource={records.consume} rowKey="id" pagination={TABLE_PG} columns={[
                    { title: '时间', dataIndex: 'createdAt', width: 160 },
                    { title: '项目', dataIndex: 'note' },
                    { title: '理发师', dataIndex: 'barberId', render: (v) => s.barbers.find((b) => b.id === v)?.name || '-' },
                    { title: '金额', dataIndex: 'amount', render: (v) => <span className="text-walnut-700">¥{v}</span> },
                    { title: '积分', dataIndex: 'pointsEarned', render: (v) => <span className="text-purple-600">+{v}</span> },
                  ]} />
                )},
                { key: 'points', label: `积分记录 (${records.points.length})`, children: (
                  <Table size="small" dataSource={records.points} rowKey="id" pagination={TABLE_PG} columns={[
                    { title: '时间', dataIndex: 'createdAt', width: 160 },
                    { title: '类型', dataIndex: 'type', render: (v) => v === 'earn' ? <Tag color="green">获得</Tag> : <Tag color="orange">兑换</Tag> },
                    { title: '描述', dataIndex: 'description' },
                    { title: '积分', dataIndex: 'points', render: (v) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v > 0 ? '+' : ''}{v}</span> },
                    { title: '有效期', dataIndex: 'expireDate', render: (v) => v || '-' },
                  ]} />
                )},
              ]} />
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
