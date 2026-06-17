import { useState, useMemo } from 'react';
import {
  Input, Select, Button, Card, Tag, Modal, Drawer, Table, Form, InputNumber,
  Avatar, Space, message, Divider, Tabs, Tooltip, Row, Col, Empty, Badge, App as AntApp, Alert,
} from 'antd';
import {
  Search, Plus, Wallet, ShoppingBag, Eye, UserPlus, AlertTriangle, Coins, Receipt, ChevronRight,
  Sparkles, PhoneCall, Heart, Megaphone, Target, TrendingUp, Clock, Star, Tag as TagIcon,
  MessageCircle, CalendarDays, Scissors, X, RefreshCw, UserCheck, Filter, Check, Wrench,
} from 'lucide-react';
import { useAppStore } from '@/store';
import dayjs from 'dayjs';
import type {
  Member, MemberLevel, BalanceRecord, BalanceRecordType, MemberProfile,
  FollowUpRecord, LifecycleSegment, LifecycleGroup, MarketingCampaign, CampaignMemberStatus,
} from '@/types';

const LEVEL_COLORS: Record<MemberLevel, string> = {
  '普通会员': 'default', '银卡会员': 'blue', '金卡会员': 'gold', '钻石会员': 'purple',
};
const AVATARS = ['👩', '👨', '👧', '🧑', '👱‍♀️', '👨‍🦱', '👩‍🦰', '🧔'];
const GOLD_BTN = { style: { background: 'linear-gradient(135deg, #D4AF37, #B8941F)' } };

export default function Members() {
  const s = useAppStore();
  const { message } = AntApp.useApp();
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<MemberLevel | undefined>();
  const [rechargeModal, setRechargeModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [consumeModal, setConsumeModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [createModal, setCreateModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [rechargeForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [followUpForm] = Form.useForm();
  const [selectedRuleId, setSelectedRuleId] = useState<string | undefined>();
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'lifecycle' | 'marketing' | 'campaigns'>('list');
  const [selectedSegment, setSelectedSegment] = useState<LifecycleSegment | null>(null);

  // 营销筛选条件
  const [mLevels, setMLevels] = useState<MemberLevel[]>([]);
  const [mMinBalance, setMMinBalance] = useState<number | null>(null);
  const [mMaxBalance, setMMaxBalance] = useState<number | null>(null);
  const [mMinDays, setMMinDays] = useState<number | null>(null);
  const [mMaxDays, setMMaxDays] = useState<number | null>(null);
  const [mTags, setMTags] = useState<string[]>([]);
  const [markedFollowed, setMarkedFollowed] = useState<Set<string>>(new Set());

  // 新建营销任务弹窗
  const [saveCampaignModal, setSaveCampaignModal] = useState(false);
  const [saveCampaignForm] = Form.useForm();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const filteredMembers = useMemo(() => s.members.filter((m) =>
    (!searchText || m.name.includes(searchText) || m.phone.includes(searchText)) &&
    (!levelFilter || m.level === levelFilter)
  ), [s.members, searchText, levelFilter]);

  const marketingMembers = useMemo(() => s.filterMarketingMembers({
    levels: mLevels.length ? mLevels : undefined,
    minBalance: mMinBalance ?? undefined,
    maxBalance: mMaxBalance ?? undefined,
    minDaysNotVisited: mMinDays ?? undefined,
    maxDaysNotVisited: mMaxDays ?? undefined,
    tags: mTags.length ? mTags : undefined,
  }), [s, mLevels, mMinBalance, mMaxBalance, mMinDays, mMaxDays, mTags]);

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

  const openConsume = (member: Member) => {
    consumeForm.resetFields();
    setConsumeModal({ open: true, member });
  };

  const selectedPkgId = Form.useWatch('packageId', consumeForm);
  const selectedPkg = useMemo(
    () => s.servicePackages.find((p) => p.id === selectedPkgId),
    [selectedPkgId, s.servicePackages]
  );
  const pointsPerYuan = s.pointsRule.pointsPerYuan;
  const consumeAmount = selectedPkg?.price || 0;
  const pointsEarned = Math.floor(consumeAmount * pointsPerYuan);
  const currentBalance = consumeModal.member?.balance || 0;
  const newBalance = currentBalance - consumeAmount;
  const balanceInsufficient = consumeModal.open && selectedPkgId && newBalance < 0;

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

  const confirmAdjust = async () => {
    try {
      const values = await adjustForm.validateFields();
      const { member } = adjustModal; if (!member) return;
      const ok = s.adjustMemberBalance(member.id, values.amount, values.note || '手动调整');
      if (ok) {
        message.success('余额调整成功');
        setAdjustModal({ open: false });
        adjustForm.resetFields();
      } else {
        message.error('余额不足，调整失败');
      }
    } catch {}
  };

  const confirmFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields();
      const { member } = followUpModal; if (!member) return;
      s.addFollowUpRecord({ memberId: member.id, type: values.type, content: values.content, operator: '店员' });
      setMarkedFollowed(prev => new Set(prev).add(member.id));
      message.success('已记录跟进');
      setFollowUpModal({ open: false });
      followUpForm.resetFields();
    } catch {}
  };

  const getMemberRecords = (id: string) => ({
    recharge: s.rechargeRecords.filter((r) => r.memberId === id),
    consume: s.consumptionRecords.filter((r) => r.memberId === id),
    points: s.pointsRecords.filter((r) => r.memberId === id),
  });

  const AVATAR_BG = { background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' };
  const CARD_STYLE = { body: { padding: 20 } };
  const TABLE_PG = { pageSize: 5 };

  const renderProfile = (profile: MemberProfile, member: Member) => {
    const allTags = Array.from(new Set([...(member.tags || []), ...profile.suggestedTags]));
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="text-xs text-walnut-500 flex items-center gap-1"><CalendarDays size={12} />最近到店</div>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              {profile.daysSinceLastVisit > 1000 ? '暂无' : `${profile.daysSinceLastVisit}天前`}
            </div>
            <div className="text-xs text-walnut-400">{profile.lastVisitDate}</div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
            <div className="text-xs text-walnut-500 flex items-center gap-1"><TrendingUp size={12} />消费频次</div>
            <div className="text-lg font-bold text-blue-700 mt-1">{profile.visitCount} 次</div>
            <div className="text-xs text-walnut-400">{profile.freqLevel}</div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
            <div className="text-xs text-walnut-500 flex items-center gap-1"><Star size={12} />客单价</div>
            <div className="text-lg font-bold text-amber-700 mt-1">¥{profile.avgSpend}</div>
            <div className="text-xs text-walnut-400">{profile.spendLevel}</div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
            <div className="text-xs text-walnut-500 flex items-center gap-1"><Coins size={12} />累计消费</div>
            <div className="text-lg font-bold text-rose-700 mt-1">¥{profile.totalSpend}</div>
            <div className="text-xs text-walnut-400">历史总额</div>
          </div>
        </div>

        {profile.frequentServices.length > 0 && (
          <div className="p-4 rounded-xl bg-walnut-50 border border-walnut-100">
            <div className="text-sm font-semibold text-walnut-700 mb-2 flex items-center gap-1">
              <Scissors size={14} className="text-gold-500" />常做项目（推荐依据）
            </div>
            <Space size={[8, 8]} wrap>
              {profile.frequentServices.map(svc => (
                <Tag key={svc.name} color="gold" className="!border-0 !px-3 !py-1 !text-sm !font-medium">
                  {svc.name} × {svc.count}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <div className="p-4 rounded-xl border border-dashed border-gold-300 bg-gradient-to-r from-amber-50/60 to-gold-50/60">
          <div className="text-sm font-semibold text-walnut-700 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1"><Sparkles size={14} className="text-gold-500" />经营标签</span>
            <span className="text-xs text-walnut-400">系统自动打标 + 手动维护</span>
          </div>
          {allTags.length === 0 ? (
            <Empty description="暂无标签" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space size={[8, 8]} wrap>
              {allTags.map(tag => {
                const isManual = (member.tags || []).includes(tag) && !profile.suggestedTags.includes(tag);
                const isSuggested = profile.suggestedTags.includes(tag) && !(member.tags || []).includes(tag);
                return (
                  <Badge key={tag} count={isSuggested ? 'AI' : 0} color="#D4AF37" offset={[-4, 4]}>
                    <Tag
                      color={isManual ? 'purple' : 'gold'}
                      closable={isManual}
                      onClose={(e) => { e.preventDefault(); s.removeMemberTag(member.id, tag); }}
                      className="!border-0 !px-3 !py-1 !text-sm !font-medium"
                    >
                      {tag}
                    </Tag>
                  </Badge>
                );
              })}
            </Space>
          )}
        </div>
      </div>
    );
  };

  const TYPE_META: Record<BalanceRecordType, { label: string; color: string; bg: string; icon: string }> = {
    recharge: { label: '充值', color: 'gold', bg: 'bg-amber-50', icon: '💰' },
    consume: { label: '消费', color: 'red', bg: 'bg-rose-50', icon: '🧾' },
    bonus: { label: '赠送', color: 'green', bg: 'bg-emerald-50', icon: '🎁' },
    adjust: { label: '调整', color: 'blue', bg: 'bg-blue-50', icon: '✏️' },
  };

  const renderBalanceTab = (member: Member) => {
    const [reconcileKey, setReconcileKey] = useState(0);
    const balanceRecords = s.getMemberBalanceRecords(member.id);
    const totalRecharge = balanceRecords.filter(r => r.type === 'recharge').reduce((s, r) => s + r.amount, 0);
    const totalBonus = balanceRecords.filter(r => r.type === 'bonus').reduce((s, r) => s + r.amount, 0);
    const totalConsume = -balanceRecords.filter(r => r.type === 'consume').reduce((s, r) => s + r.amount, 0);
    const totalAdjust = balanceRecords.filter(r => r.type === 'adjust').reduce((s, r) => s + r.amount, 0);
    const calculatedBalance = totalRecharge + totalBonus - totalConsume + totalAdjust;
    const isBalanced = Math.abs(calculatedBalance - member.balance) < 0.01;
    const records = getMemberRecords(member.id);

    const balanceColumns = [
      {
        title: '时间', dataIndex: 'createdAt', width: 160,
        render: (v: string) => <span className="text-walnut-600 text-sm">{v}</span>,
      },
      {
        title: '类型', dataIndex: 'type', width: 90,
        render: (v: BalanceRecordType) => {
          const meta = TYPE_META[v];
          return <Tag color={meta.color} className="!border-0 !font-medium">{meta.icon} {meta.label}</Tag>;
        },
      },
      {
        title: '变动', dataIndex: 'amount', width: 100, align: 'right' as const,
        render: (v: number) => (
          <span className={`font-bold ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {v >= 0 ? '+' : ''}¥{v}
          </span>
        ),
      },
      {
        title: '余额', dataIndex: 'balanceAfter', width: 100, align: 'right' as const,
        render: (v: number) => <span className="font-semibold text-gold-600">¥{v}</span>,
      },
      {
        title: '说明', dataIndex: 'description',
        render: (v: string, r: BalanceRecord) => {
          let detail = '';
          if (r.type === 'recharge' && r.relatedId) {
            const rec = records.recharge.find(x => x.id === r.relatedId);
            if (rec) detail = `（充¥${rec.rechargeAmount}送¥${rec.bonusAmount}）`;
          } else if (r.type === 'consume' && r.relatedId) {
            const rec = records.consume.find(x => x.id === r.relatedId);
            if (rec) {
              const barber = s.barbers.find(b => b.id === rec.barberId);
              detail = `（${barber?.name || '理发师'}服务）`;
              if (rec.appointmentId) {
                const appt = s.getAppointmentById(rec.appointmentId);
                if (appt) detail += ` · 预约来源：${dayjs(appt.date).format('MM-DD')} ${appt.startTime}`;
              }
            }
          } else if (r.type === 'bonus' && r.relatedId) {
            const rec = records.recharge.find(x => x.id === r.relatedId);
            if (rec) detail = `（对应充值¥${rec.rechargeAmount}）`;
          }
          return (
            <Tooltip title={v + detail}>
              <span className="text-walnut-700">{v}<span className="text-walnut-400 text-xs ml-1">{detail}</span></span>
            </Tooltip>
          );
        },
      },
    ];

    const handleReconcile = () => {
      const res = s.reconcileMemberBalance(member.id);
      if (res.fixed) message.success(`已自动补平，差异 ¥${res.diff} 已生成调整流水`);
      else message.info(res.balanced ? '账户余额一致，无需调整' : '补平操作失败');
      setReconcileKey(k => k + 1);
    };

    return (
      <div key={reconcileKey}>
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="text-xs text-walnut-500">累计充值</div>
            <div className="font-bold text-amber-700 text-lg">¥{totalRecharge}</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="text-xs text-walnut-500">累计赠送</div>
            <div className="font-bold text-emerald-700 text-lg">¥{totalBonus}</div>
          </div>
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
            <div className="text-xs text-walnut-500">累计消费</div>
            <div className="font-bold text-rose-700 text-lg">¥{totalConsume}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="text-xs text-walnut-500">手动调整</div>
            <div className={`font-bold text-lg ${totalAdjust >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {totalAdjust >= 0 ? '+' : ''}¥{totalAdjust}
            </div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${isBalanced ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="text-xs text-walnut-500 flex items-center gap-1">
              {isBalanced ? <Check size={12} className="text-green-600" /> : <AlertTriangle size={12} className="text-red-600" />}
              对账 {isBalanced ? '一致' : `不一致，差 ¥{(member.balance - calculatedBalance).toFixed(2)}`}
            </div>
            <div className="font-bold text-gold-700 text-lg">¥{member.balance}</div>
          </div>
        </div>

        <div className="mb-3 flex justify-between items-center gap-2 flex-wrap">
          <span className="text-sm text-walnut-500">
            <ChevronRight size={14} className="inline -mt-0.5" />
            按时间顺序从早到晚展示，最新在下方
          </span>
          <Space size="small">
            {!isBalanced && (
              <Button type="primary" size="small" danger icon={<Wrench size={14} />} onClick={handleReconcile}>
                一键对账补平
              </Button>
            )}
            <Button size="small" icon={<Wallet size={14} />} onClick={() => setAdjustModal({ open: true, member })}>
              手动调整余额
            </Button>
          </Space>
        </div>

        <Table
          size="small"
          dataSource={balanceRecords}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: true }}
          columns={balanceColumns}
          rowClassName={(r) => TYPE_META[r.type].bg}
          expandable={{
            expandedRowRender: (r: BalanceRecord) => {
              let extra: { label: string; value: string }[] = [];
              if (r.relatedId) {
                if (r.type === 'recharge' || r.type === 'bonus') {
                  const rec = records.recharge.find(x => x.id === r.relatedId);
                  if (rec) {
                    extra = [
                      { label: '充值单号', value: rec.id },
                      { label: '充值本金', value: `¥${rec.rechargeAmount}` },
                      { label: '赠送金额', value: `¥${rec.bonusAmount}` },
                      { label: '到账总额', value: `¥${rec.rechargeAmount + rec.bonusAmount}` },
                      { label: '记录时间', value: rec.createdAt },
                    ];
                  }
                } else if (r.type === 'consume') {
                  const rec = records.consume.find(x => x.id === r.relatedId);
                  if (rec) {
                    const barber = s.barbers.find(b => b.id === rec.barberId);
                    const pkg = s.servicePackages.find(p => p.id === rec.packageId);
                    extra = [
                      { label: '消费单号', value: rec.id },
                      { label: '服务项目', value: rec.note || pkg?.name || '-' },
                      { label: '理发师', value: barber ? `${barber.avatar} ${barber.name}` : '-' },
                      { label: '消费金额', value: `¥${rec.amount}` },
                      { label: '获得积分', value: `+${rec.pointsEarned}` },
                      { label: '记录时间', value: rec.createdAt },
                    ];
                  }
                }
              } else if (r.type === 'adjust') {
                extra = [
                  { label: '调整类型', value: r.amount >= 0 ? '余额补登' : '余额扣款' },
                  { label: '备注', value: r.description },
                  { label: '记录时间', value: r.createdAt },
                ];
              }
              if (extra.length === 0) return <p className="text-walnut-400 text-sm">无附加信息</p>;
              return (
                <div className="grid grid-cols-2 gap-2 py-1">
                  {extra.map(e => (
                    <div key={e.label} className="flex gap-2 text-sm">
                      <span className="text-walnut-400 min-w-[80px]">{e.label}：</span>
                      <span className="text-walnut-700 font-medium">{e.value}</span>
                    </div>
                  ))}
                </div>
              );
            },
            rowExpandable: (r: BalanceRecord) => !!r.relatedId || r.type === 'adjust',
          }}
        />
      </div>
    );
  };

  const renderFollowUpTab = (member: Member) => {
    const records = s.getFollowUpRecords(member.id);
    const typeMeta: Record<FollowUpRecord['type'], { label: string; color: string; icon: any }> = {
      marketing: { label: '营销推广', color: 'orange', icon: Megaphone },
      care: { label: '客户关怀', color: 'pink', icon: Heart },
      callback: { label: '服务回访', color: 'blue', icon: PhoneCall },
    };
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <span className="text-walnut-500 text-sm">共 {records.length} 条跟进记录</span>
          <Button
            type="primary"
            size="small"
            icon={<MessageCircle size={14} />}
            onClick={() => { followUpForm.resetFields(); setFollowUpModal({ open: true, member }); }}
            {...GOLD_BTN}
          >
            新增跟进
          </Button>
        </div>
        {records.length === 0 ? (
          <Empty description="暂无跟进记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="space-y-3">
            {records.map(r => {
              const meta = typeMeta[r.type];
              const Icon = meta.icon;
              return (
                <div key={r.id} className="p-4 rounded-xl border border-walnut-100 bg-walnut-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag color={meta.color} className="!border-0 !font-medium">
                        <Icon size={12} className="inline -mt-0.5 mr-1" />{meta.label}
                      </Tag>
                      <span className="text-xs text-walnut-400">{r.contactedAt}</span>
                    </div>
                    {r.operator && <span className="text-xs text-walnut-400">跟进人：{r.operator}</span>}
                  </div>
                  <p className="text-walnut-700 text-sm m-0">{r.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const marketingColumns = [
    { title: '会员', width: 140, render: (_: any, r: Member) => (
      <div className="flex items-center gap-2">
        <Avatar size={32} className="!text-lg" style={AVATAR_BG}>{r.avatar}</Avatar>
        <div>
          <div className="font-medium text-walnut-800">{r.name}</div>
          <div className="text-xs text-walnut-400">{r.phone}</div>
        </div>
      </div>
    )},
    { title: '等级', dataIndex: 'level', width: 100, render: (v: MemberLevel) => <Tag color={LEVEL_COLORS[v]}>{v}</Tag> },
    { title: '余额', dataIndex: 'balance', width: 100, align: 'right' as const, render: (v: number) => <span className="font-bold text-gold-600">¥{v}</span> },
    { title: '积分', dataIndex: 'availablePoints', width: 90, render: (v) => <span className="text-purple-600">{v}</span> },
    {
      title: '最近到店', width: 120,
      render: (_: any, r: Member) => {
        const p = s.getMemberProfile(r.id);
        return p.daysSinceLastVisit > 1000 ? <Tag>从未到店</Tag>
          : p.daysSinceLastVisit > 30 ? <Tag color="orange">{p.daysSinceLastVisit}天前</Tag>
          : <Tag color="green">{p.daysSinceLastVisit}天前</Tag>;
      },
    },
    {
      title: '经营标签', width: 180,
      render: (_: any, r: Member) => {
        const p = s.getMemberProfile(r.id);
        const tags = [...(r.tags || []), ...p.suggestedTags].slice(0, 3);
        return <Space size={[4, 4]} wrap>{tags.map(t => <Tag key={t} color="gold" className="!text-xs !py-0">{t}</Tag>)}</Space>;
      },
    },
    {
      title: '状态', width: 90,
      render: (_: any, r: Member) => markedFollowed.has(r.id)
        ? <Tag color="green" icon={<UserCheck size={12} />}>已跟进</Tag>
        : <Tag color="orange">待联系</Tag>,
    },
    {
      title: '操作', width: 180,
      render: (_: any, r: Member) => (
        <Space size="small">
          <Button size="small" icon={<PhoneCall size={12} />} onClick={() => { followUpForm.resetFields(); setFollowUpModal({ open: true, member: r }); }}>
            标记跟进
          </Button>
          <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailDrawer({ open: true, member: r })}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <Card className="!rounded-2xl !shadow-sm" styles={CARD_STYLE}>
        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as any)}
          items={[
            {
              key: 'list',
              label: <span className="flex items-center gap-1.5"><UserPlus size={16} />会员管理</span>,
              children: (
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Input
                    prefix={<Search size={18} className="text-walnut-400" />}
                    placeholder="搜索姓名或电话..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="!w-72"
                    allowClear
                  />
                  <Select
                    placeholder="等级筛选" allowClear
                    value={levelFilter} onChange={setLevelFilter}
                    className="!w-44"
                    options={['普通会员', '银卡会员', '金卡会员', '钻石会员'].map((v) => ({ value: v, label: v }))}
                  />
                  <div className="flex-1" />
                  <Button
                    type="primary" icon={<Plus size={18} />}
                    onClick={() => setCreateModal(true)}
                    className="!h-10 !px-5 !font-semibold"
                    {...GOLD_BTN}
                  >
                    新建会员
                  </Button>
                </div>
              ),
            },
            {
              key: 'marketing',
              label: (
                <span className="flex items-center gap-1.5">
                  <Target size={16} />营销跟进
                  <Badge count={marketingMembers.length} color="#D4AF37" />
                </span>
              ),
              children: (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-walnut-500 text-sm flex items-center gap-1"><Filter size={12} />筛选：</span>
                  <Select
                    mode="multiple"
                    placeholder="会员等级"
                    value={mLevels}
                    onChange={setMLevels}
                    className="!min-w-[160px]"
                    options={['普通会员', '银卡会员', '金卡会员', '钻石会员'].map(v => ({ label: v, value: v }))}
                  />
                  <InputNumber
                    placeholder="最小余额"
                    value={mMinBalance}
                    onChange={v => setMMinBalance(v as number | null)}
                    min={0}
                    prefix="¥"
                    className="!w-32"
                  />
                  <span className="text-walnut-400">-</span>
                  <InputNumber
                    placeholder="最大余额"
                    value={mMaxBalance}
                    onChange={v => setMMaxBalance(v as number | null)}
                    min={0}
                    prefix="¥"
                    className="!w-32"
                  />
                  <Divider type="vertical" />
                  <span className="text-walnut-500 text-sm">未到店天数：</span>
                  <InputNumber
                    placeholder="最少"
                    value={mMinDays}
                    onChange={v => setMMinDays(v as number | null)}
                    min={0}
                    className="!w-24"
                    addonAfter="天"
                  />
                  <span className="text-walnut-400">-</span>
                  <InputNumber
                    placeholder="最多"
                    value={mMaxDays}
                    onChange={v => setMMaxDays(v as number | null)}
                    min={0}
                    className="!w-24"
                    addonAfter="天"
                  />
                  <Select
                    mode="multiple"
                    placeholder="经营标签"
                    value={mTags}
                    onChange={setMTags}
                    className="!min-w-[200px]"
                    options={['老客', '高价值', '烫染客', '护理客', '久未到店'].map(v => ({ label: v, value: v }))}
                  />
                  <Button size="small" icon={<RefreshCw size={12} />} onClick={() => {
                    setMLevels([]); setMMinBalance(null); setMMaxBalance(null); setMMinDays(null); setMMaxDays(null); setMTags([]); setMarkedFollowed(new Set());
                  }}>
                    重置
                  </Button>
                  <div className="flex-1" />
                  <Button
                    type="primary"
                    size="small"
                    icon={<Megaphone size={14} />}
                    onClick={() => { saveCampaignForm.resetFields(); setSaveCampaignModal(true); }}
                    disabled={marketingMembers.length === 0}
                    {...GOLD_BTN}
                  >
                    保存为营销任务（{marketingMembers.length}人）
                  </Button>
                </div>
              ),
            },
            {
              key: 'lifecycle',
              label: <span className="flex items-center gap-1.5"><Sparkles size={16} />客户生命周期</span>,
              children: <div className="pt-2 text-sm text-walnut-500">点击下方卡片查看对应会员群体</div>,
            },
            {
              key: 'campaigns',
              label: <span className="flex items-center gap-1.5"><Megaphone size={16} />营销任务（{s.marketingCampaigns.length}）</span>,
              children: <div className="pt-2 text-sm text-walnut-500">查看历史营销任务及转化进度</div>,
            },
          ]}
        />
      </Card>

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => {
            const p = s.getMemberProfile(m.id);
            return (
              <Card
                key={m.id}
                className="!rounded-2xl !shadow-sm hover:!shadow-md transition-all"
                styles={CARD_STYLE}
              >
                <div className="flex items-start gap-4">
                  <Avatar size={56} className="!text-3xl !rounded-xl" style={AVATAR_BG}>
                    {m.avatar}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-walnut-800 m-0 truncate">{m.name}</h3>
                      <Tag color={LEVEL_COLORS[m.level]} className="!border-0 !font-medium">
                        {m.level}
                      </Tag>
                      <Tag color={s.getMemberLifecycle(m.id) === 'high_value' ? 'gold' : s.getMemberLifecycle(m.id) === 'active' ? 'orange' : s.getMemberLifecycle(m.id) === 'sleeping' ? 'purple' : 'green'} className="!text-xs !border-0">
                        {s.getLifecycleGroups().find(g => g.key === s.getMemberLifecycle(m.id))?.name}
                      </Tag>
                    </div>
                    <p className="text-sm text-walnut-500 m-0 mt-1">{m.phone}</p>
                    {m.noShowCount > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                        <AlertTriangle size={12} />
                        <span>爽约 {m.noShowCount} 次{m.noShowCount >= 2 ? '（需关注）' : ''}</span>
                      </div>
                    )}
                    {(m.tags?.length || p.suggestedTags.length) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[...(m.tags || []), ...p.suggestedTags].slice(0, 3).map(t => (
                          <Tag key={t} color="gold" className="!text-xs !py-0 !border-0">{t}</Tag>
                        ))}
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
                  <Button icon={<Wallet size={16} />} onClick={() => openRecharge(m)} className="!flex-1 !h-9">
                    充值
                  </Button>
                  <Button icon={<ShoppingBag size={16} />} onClick={() => openConsume(m)} className="!flex-1 !h-9">
                    消费
                  </Button>
                  <Button
                    type="primary" ghost icon={<Eye size={16} />}
                    onClick={() => setDetailDrawer({ open: true, member: m })}
                    className="!flex-1 !h-9"
                  >
                    详情
                  </Button>
                </Space>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'lifecycle' && (() => {
        const groups = s.getLifecycleGroups();
        const stats = s.getLifecycleStats();
        const showList = selectedSegment ? s.getLifecycleMembers(selectedSegment) : [];
        const selGroup = groups.find(g => g.key === selectedSegment);
        return (
          <div className="space-y-5">
            <Row gutter={[16, 16]}>
              {groups.map(g => (
                <Col xs={24} md={12} lg={6} key={g.key}>
                  <Card
                    hoverable
                    onClick={() => setSelectedSegment(selectedSegment === g.key ? null : g.key)}
                    className={`!rounded-2xl bg-gradient-to-br ${g.bg} border-2 transition-all ${selectedSegment === g.key ? 'ring-4 ring-gold-300' : ''}`}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div className="text-4xl mb-2">{g.icon}</div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-lg font-bold text-walnut-800">{g.name}</div>
                      <div className="text-2xl font-bold text-walnut-700">{stats[g.key]}</div>
                    </div>
                    <div className="text-xs text-walnut-500 mt-1">{g.description}</div>
                    <Divider className="!my-3" />
                    <div className="text-xs text-walnut-600">
                      <div className="font-medium mb-1.5 flex items-center gap-1"><Sparkles size={12} />推荐动作：</div>
                      <Space size={[4, 4]} wrap>
                        {g.suggestions.map(sg => <Tag key={sg} color="gold" className="!text-xs !py-0 !border-0">{sg}</Tag>)}
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {selectedSegment && selGroup && (
              <Card
                title={<span className="font-semibold">{selGroup.icon} {selGroup.name}（共 {showList.length} 人）</span>}
                className="!rounded-2xl !shadow-sm"
                extra={<Button size="small" onClick={() => setSelectedSegment(null)}>返回</Button>}
              >
                {showList.length === 0 ? (
                  <Empty description="暂无此类会员" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {showList.map(m => {
                      const p = s.getMemberProfile(m.id);
                      return (
                        <Card key={m.id} size="small" className="!rounded-xl" styles={{ body: { padding: 14 } }}>
                          <div className="flex items-center gap-3">
                            <Avatar size={40} style={AVATAR_BG}>{m.avatar}</Avatar>
                            <div className="flex-1">
                              <div className="font-semibold text-walnut-800">{m.name} <Tag color={LEVEL_COLORS[m.level]} className="!text-xs">{m.level}</Tag></div>
                              <div className="text-xs text-walnut-500">{m.phone} · {p.daysSinceLastVisit > 1000 ? '未到店' : `${p.daysSinceLastVisit}天前到店`} · ¥{p.totalSpend}</div>
                            </div>
                            <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailDrawer({ open: true, member: m })}>详情</Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>
        );
      })()}

      {activeTab === 'marketing' && (
        <Card className="!rounded-2xl !shadow-sm" styles={{ body: { padding: 16 } }}>
          <div className="mb-3 flex justify-between items-center px-2 flex-wrap gap-2">
            <span className="text-walnut-600">
              根据筛选条件找到 <span className="font-bold text-gold-600">{marketingMembers.length}</span> 位会员
            </span>
            <Button
              size="small"
              icon={<Megaphone size={14} />}
              onClick={() => message.success(`已生成 ${marketingMembers.length} 条待联系名单`)}
              disabled={marketingMembers.length === 0}
            >
              导出名单
            </Button>
          </div>
          <Table
            dataSource={marketingMembers}
            columns={marketingColumns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size="middle"
          />
        </Card>
      )}

      {activeTab === 'campaigns' && (() => {
        const columns = [
          { title: '任务名称', dataIndex: 'name', width: 200 },
          { title: '说明', dataIndex: 'description', ellipsis: true },
          { title: '创建时间', dataIndex: 'createdAt', width: 150 },
          {
            title: '名单', width: 70, align: 'center' as const,
            render: (_: any, r: MarketingCampaign) => r.members.length,
          },
          {
            title: '待联系', width: 80, align: 'center' as const,
            render: (_: any, r: MarketingCampaign) => <Tag color="orange">{r.members.filter(m => m.status === 'pending').length}</Tag>,
          },
          {
            title: '已联系', width: 80, align: 'center' as const,
            render: (_: any, r: MarketingCampaign) => <Tag color="blue">{r.members.filter(m => m.status === 'contacted').length}</Tag>,
          },
          {
            title: '已到店/消费', width: 100, align: 'center' as const,
            render: (_: any, r: MarketingCampaign) => <Tag color="green">{r.members.filter(m => m.status === 'visited' || m.status === 'consumed').length}</Tag>,
          },
          {
            title: '转化率', width: 90, align: 'center' as const,
            render: (_: any, r: MarketingCampaign) => {
              const contacted = r.members.filter(m => m.status !== 'pending').length;
              const converted = r.members.filter(m => m.status === 'visited' || m.status === 'consumed').length;
              if (contacted === 0) return <span className="text-walnut-400">-</span>;
              return <span className="font-bold text-emerald-600">{(converted / contacted * 100).toFixed(0)}%</span>;
            },
          },
          {
            title: '操作', width: 180,
            render: (_: any, r: MarketingCampaign) => (
              <Space size="small">
                <Button size="small" onClick={() => setSelectedCampaignId(selectedCampaignId === r.id ? null : r.id)}>
                  {selectedCampaignId === r.id ? '收起' : '名单'}
                </Button>
                <Button size="small" danger onClick={() => { if (confirm('确认删除该任务？')) s.deleteMarketingCampaign(r.id); }}>删除</Button>
              </Space>
            ),
          },
        ];
        const selectedCampaign = s.marketingCampaigns.find(c => c.id === selectedCampaignId);
        const statusOptions: { label: string; value: CampaignMemberStatus; color: string }[] = [
          { label: '待联系', value: 'pending', color: 'orange' },
          { label: '已联系', value: 'contacted', color: 'blue' },
          { label: '已到店', value: 'visited', color: 'cyan' },
          { label: '已消费', value: 'consumed', color: 'green' },
          { label: '已流失', value: 'lost', color: 'red' },
        ];
        return (
          <div className="space-y-4">
            <Card className="!rounded-2xl !shadow-sm" styles={{ body: { padding: 12 } }}>
              {s.marketingCampaigns.length === 0 ? (
                <Empty description="暂无营销任务，可从「营销跟进」Tab筛选后保存任务" />
              ) : (
                <Table
                  size="small"
                  dataSource={s.marketingCampaigns}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                />
              )}
            </Card>
            {selectedCampaign && (
              <Card title={<span className="font-semibold">{selectedCampaign.name} - 跟进名单</span>} className="!rounded-2xl !shadow-sm">
                <Table
                  size="small"
                  dataSource={selectedCampaign.members}
                  rowKey="memberId"
                  pagination={false}
                  columns={[
                    {
                      title: '会员', width: 180,
                      render: (_: any, r: any) => {
                        const m = s.members.find(x => x.id === r.memberId);
                        if (!m) return '-';
                        return <span>{m.avatar} {m.name} <span className="text-walnut-400 text-xs">{m.phone}</span></span>;
                      },
                    },
                    {
                      title: '状态', width: 120,
                      render: (_: any, r: any) => {
                        const opt = statusOptions.find(o => o.value === r.status);
                        return opt ? <Tag color={opt.color}>{opt.label}</Tag> : '-';
                      },
                    },
                    { title: '联系时间', dataIndex: 'contactedAt', width: 150, render: (v: string) => v || '-' },
                    { title: '备注', dataIndex: 'note', render: (v: string) => v || '-' },
                    {
                      title: '更新状态', width: 260,
                      render: (_: any, r: any) => (
                        <Space size="small" wrap>
                          {statusOptions.map(opt => (
                            <Button
                              key={opt.value}
                              size="small"
                              type={r.status === opt.value ? 'primary' : 'default'}
                              onClick={() => s.updateCampaignMemberStatus(selectedCampaign.id, r.memberId, opt.value)}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            )}
          </div>
        );
      })()}

      {/* 保存营销任务弹窗 */}
      <Modal
        title={<span className="font-bold">保存为营销任务</span>}
        open={saveCampaignModal}
        onCancel={() => setSaveCampaignModal(false)}
        onOk={async () => {
          try {
            const v = await saveCampaignForm.validateFields();
            s.createMarketingCampaign({
              name: v.name,
              description: v.description,
              filters: {
                levels: mLevels.length ? mLevels : undefined,
                minBalance: mMinBalance ?? undefined,
                maxBalance: mMaxBalance ?? undefined,
                minDaysNotVisited: mMinDays ?? undefined,
                maxDaysNotVisited: mMaxDays ?? undefined,
              },
              memberIds: marketingMembers.map(m => m.id),
            });
            message.success(`营销任务「${v.name}」已创建，共 ${marketingMembers.length} 人`);
            setSaveCampaignModal(false);
            setActiveTab('campaigns');
          } catch {}
        }}
        okButtonProps={GOLD_BTN}
      >
        <Form form={saveCampaignForm} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="例如：618烫染活动推广、沉睡客唤醒..." />
          </Form.Item>
          <Form.Item name="description" label="任务说明">
            <Input.TextArea rows={2} placeholder="简单描述本次营销的目的、方式..." />
          </Form.Item>
          <div className="p-3 rounded-lg bg-walnut-50 text-sm text-walnut-600">
            将保存 <span className="font-bold text-gold-600">{marketingMembers.length}</span> 位会员为待联系名单
          </div>
        </Form>
      </Modal>

      {/* 新建会员 */}
      <Modal
        title={<div className="flex items-center gap-2"><UserPlus size={20} className="text-gold-500" /><span className="font-bold">新建会员</span></div>}
        open={createModal}
        onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        onOk={confirmCreate}
        okText="确认创建"
        okButtonProps={GOLD_BTN}
      >
        <Form form={createForm} layout="vertical" className="pt-2">
          <Form.Item name="name" label="会员姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="phone" label="联系电话"
            rules={[{ required: true, message: '请输入电话' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 充值弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-gold-500" />
            <span className="font-bold">会员充值 - {rechargeModal.member?.name}</span>
          </div>
        }
        open={rechargeModal.open}
        onCancel={() => setRechargeModal({ open: false })}
        onOk={confirmRecharge}
        okText="确认充值"
        okButtonProps={GOLD_BTN}
      >
        <Form form={rechargeForm} layout="vertical" className="pt-2">
          <Form.Item label="选择充值档位">
            <Space className="!w-full !flex-wrap">
              {s.rechargeRules.filter((r) => r.isActive).map((r) => (
                <Button
                  key={r.id}
                  type={selectedRuleId === r.id ? 'primary' : 'default'}
                  onClick={() => { setSelectedRuleId(r.id); setCustomAmount(null); }}
                  className="!h-14 !px-5 !rounded-xl !text-left"
                  style={selectedRuleId === r.id ? GOLD_BTN.style : {}}
                >
                  <div className="font-bold text-base">充 ¥{r.rechargeAmount}</div>
                  <div className="text-xs opacity-80">送 ¥{r.bonusAmount}</div>
                </Button>
              ))}
            </Space>
          </Form.Item>
          <Form.Item label="自定义金额">
            <InputNumber
              min={0} step={10} prefix="¥"
              value={customAmount}
              onChange={(v) => { setCustomAmount(v); if (v) setSelectedRuleId(undefined); }}
              className="!w-full !h-10"
              placeholder="输入自定义金额，无赠送"
            />
          </Form.Item>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
            <div className="flex justify-between text-sm text-walnut-600 mb-2">
              <span>充值本金</span><span>¥{rechargeAmt}</span>
            </div>
            <div className="flex justify-between text-sm text-walnut-600 mb-2">
              <span>赠送金额</span><span className="text-emerald-600">+¥{rechargeBonus}</span>
            </div>
            <Divider className="!my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-walnut-700">到账总额</span>
              <span className="text-2xl font-bold text-gold-600">¥{rechargeTotal}</span>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 消费弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-gold-500" />
            <span className="font-bold">会员消费 - {consumeModal.member?.name}</span>
          </div>
        }
        open={consumeModal.open}
        onCancel={() => setConsumeModal({ open: false })}
        onOk={confirmConsume}
        okText="确认消费"
        okButtonProps={GOLD_BTN}
        width={480}
      >
        <Form form={consumeForm} layout="vertical" className="pt-2">
          <Form.Item
            name="packageId" label="选择服务套餐"
            rules={[{ required: true, message: '请选择套餐' }]}
          >
            <Select
              placeholder="请选择服务套餐"
              options={s.servicePackages.map((p) => ({
                value: p.id,
                label: `${p.name} - ¥${p.price}（${p.category}）`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="barberId" label="选择理发师"
            rules={[{ required: true, message: '请选择理发师' }]}
          >
            <Select
              placeholder="请选择理发师"
              options={s.barbers.map(b => ({ label: `${b.avatar} ${b.name}`, value: b.id }))}
            />
          </Form.Item>

          {selectedPkgId && (
            <div className={`p-4 rounded-xl border-2 mb-2 ${balanceInsufficient ? 'border-red-300 bg-red-50' : 'border-gold-200 bg-gradient-to-r from-amber-50 to-yellow-50'}`}>
              <Row gutter={12}>
                <Col span={12}>
                  <div className="text-xs text-walnut-500">消费金额</div>
                  <div className="text-xl font-bold text-walnut-700 mt-1">¥{consumeAmount}</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-walnut-500">获得积分</div>
                  <div className="text-xl font-bold text-purple-600 mt-1">+{pointsEarned}</div>
                </Col>
              </Row>
              <Divider className="!my-3" />
              <Row gutter={12}>
                <Col span={12}>
                  <div className="text-xs text-walnut-500">当前余额</div>
                  <div className="text-base font-semibold text-gold-600 mt-1">¥{currentBalance}</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-walnut-500">消费后余额</div>
                  <div className={`text-base font-bold mt-1 ${balanceInsufficient ? 'text-red-600' : 'text-emerald-600'}`}>
                    ¥{newBalance}
                    {balanceInsufficient && <span className="text-xs ml-1">（不足 ¥{-newBalance}）</span>}
                  </div>
                </Col>
              </Row>
              {balanceInsufficient && (
                <Alert
                  type="error"
                  showIcon
                  message="余额不足"
                  description="请先充值或选择其他套餐"
                  className="!mt-3"
                />
              )}
            </div>
          )}
        </Form>
      </Modal>

      {/* 余额调整弹窗 */}
      <Modal
        title={<div className="flex items-center gap-2"><Receipt size={20} className="text-gold-500" /><span className="font-bold">调整余额 - {adjustModal.member?.name}</span></div>}
        open={adjustModal.open}
        onCancel={() => setAdjustModal({ open: false })}
        onOk={confirmAdjust}
        okText="确认调整"
        okButtonProps={GOLD_BTN}
      >
        <Form form={adjustForm} layout="vertical" className="pt-2">
          <Form.Item label="当前余额">
            <div className="text-xl font-bold text-gold-600">¥{adjustModal.member?.balance || 0}</div>
          </Form.Item>
          <Form.Item
            name="amount"
            label="调整金额（正数补登，负数扣款）"
            rules={[{ required: true, message: '请输入调整金额' }]}
          >
            <InputNumber className="!w-full !h-10" placeholder="例如：100 或 -50" prefix="¥" />
          </Form.Item>
          <Form.Item name="note" label="调整备注" rules={[{ required: true, message: '请输入备注' }]}>
            <Input.TextArea rows={2} placeholder="说明调整原因，例如：活动赠送补登、商品购买扣款..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 跟进记录弹窗 */}
      <Modal
        title={<div className="flex items-center gap-2"><MessageCircle size={20} className="text-gold-500" /><span className="font-bold">记录跟进 - {followUpModal.member?.name}</span></div>}
        open={followUpModal.open}
        onCancel={() => setFollowUpModal({ open: false })}
        onOk={confirmFollowUp}
        okText="保存"
        okButtonProps={GOLD_BTN}
      >
        <Form form={followUpForm} layout="vertical" className="pt-2">
          <Form.Item
            name="type"
            label="跟进类型"
            rules={[{ required: true, message: '请选择类型' }]}
            initialValue="marketing"
          >
            <Select
              options={[
                { label: '🎯 营销推广', value: 'marketing' },
                { label: '💝 客户关怀', value: 'care' },
                { label: '📞 服务回访', value: 'callback' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <Input.TextArea rows={4} placeholder="记录本次沟通的内容、客户反馈、后续计划..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 会员详情抽屉 */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-gold-500" />
            <span className="font-bold text-lg">会员详情</span>
          </div>
        }
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false })}
        width={780}
        destroyOnClose
      >
        {detailDrawer.member && (() => {
          const m = detailDrawer.member;
          const records = getMemberRecords(m.id);
          const profile = s.getMemberProfile(m.id);

          return (
            <div className="space-y-5">
              <Card className="!rounded-2xl" styles={CARD_STYLE}>
                <div className="flex items-center gap-4">
                  <Avatar size={68} className="!text-4xl !rounded-2xl" style={AVATAR_BG}>
                    {m.avatar}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-xl m-0">{m.name}</h2>
                      <Tag color={LEVEL_COLORS[m.level]} className="!border-0 !font-medium">
                        {m.level}
                      </Tag>
                      {m.noShowCount > 0 && (
                        <Tag color="orange" icon={<AlertTriangle size={10} />}>爽约{m.noShowCount}次</Tag>
                      )}
                    </div>
                    <p className="text-walnut-500 m-0 mt-1">{m.phone}</p>
                    <p className="text-xs text-walnut-400 m-0 mt-1">注册时间：{m.createdAt}</p>
                  </div>
                  <Space>
                    <Button icon={<Wallet size={14} />} onClick={() => openRecharge(m)}>充值</Button>
                    <Button icon={<ShoppingBag size={14} />} onClick={() => openConsume(m)}>消费</Button>
                  </Space>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="p-3 rounded-xl bg-amber-50 text-center">
                    <div className="text-xs text-walnut-500">余额</div>
                    <div className="text-xl font-bold text-gold-600 mt-1">¥{m.balance}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-50 text-center">
                    <div className="text-xs text-walnut-500">可用积分</div>
                    <div className="text-xl font-bold text-purple-600 mt-1">{m.availablePoints}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 text-center">
                    <div className="text-xs text-walnut-500">累计积分</div>
                    <div className="text-xl font-bold text-rose-600 mt-1">{m.totalPoints}</div>
                  </div>
                </div>
              </Card>

              <Card title={<span className="flex items-center gap-1.5"><Sparkles size={16} className="text-gold-500" />会员画像</span>} className="!rounded-2xl" styles={CARD_STYLE}>
                {renderProfile(profile, m)}
              </Card>

              <Tabs
                defaultActiveKey="balance"
                items={[
                  {
                    key: 'balance',
                    label: <span className="flex items-center gap-1"><Receipt size={14} />余额流水</span>,
                    children: renderBalanceTab(m),
                  },
                  {
                    key: 'followup',
                    label: <span className="flex items-center gap-1"><MessageCircle size={14} />跟进记录</span>,
                    children: renderFollowUpTab(m),
                  },
                  {
                    key: 'recharge',
                    label: `充值记录 (${records.recharge.length})`,
                    children: (
                      <Table
                        size="small"
                        dataSource={records.recharge}
                        rowKey="id"
                        pagination={TABLE_PG}
                        columns={[
                          { title: '时间', dataIndex: 'createdAt', width: 160 },
                          { title: '充值金额', dataIndex: 'rechargeAmount', render: (v) => `¥${v}` },
                          { title: '赠送', dataIndex: 'bonusAmount', render: (v) => <span className="text-emerald-600">+¥{v}</span> },
                          { title: '到账', render: (_, r) => <span className="font-bold text-gold-600">¥{r.rechargeAmount + r.bonusAmount}</span> },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'consume',
                    label: `消费记录 (${records.consume.length})`,
                    children: (
                      <Table
                        size="small"
                        dataSource={records.consume}
                        rowKey="id"
                        pagination={TABLE_PG}
                        columns={[
                          { title: '时间', dataIndex: 'createdAt', width: 160 },
                          { title: '项目', dataIndex: 'note' },
                          {
                            title: '预约来源', width: 140,
                            render: (_: any, r: any) => {
                              if (!r.appointmentId) return <span className="text-walnut-400">直接消费</span>;
                              const a = s.getAppointmentById(r.appointmentId);
                              if (!a) return '-';
                              return (
                                <Tag color="purple" className="!text-xs">
                                  📅 {dayjs(a.date).format('MM-DD')} {a.startTime}
                                </Tag>
                              );
                            },
                          },
                          { title: '理发师', dataIndex: 'barberId', render: (v) => s.barbers.find((b) => b.id === v)?.name || '-' },
                          { title: '金额', dataIndex: 'amount', render: (v) => <span className="text-walnut-700">¥{v}</span> },
                          { title: '积分', dataIndex: 'pointsEarned', render: (v) => <span className="text-purple-600">+{v}</span> },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'points',
                    label: `积分记录 (${records.points.length})`,
                    children: (
                      <Table
                        size="small"
                        dataSource={records.points}
                        rowKey="id"
                        pagination={TABLE_PG}
                        columns={[
                          { title: '时间', dataIndex: 'createdAt', width: 160 },
                          { title: '类型', dataIndex: 'type', render: (v) => v === 'earn' ? <Tag color="green">获得</Tag> : <Tag color="orange">兑换</Tag> },
                          { title: '描述', dataIndex: 'description' },
                          { title: '积分', dataIndex: 'points', render: (v) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v > 0 ? '+' : ''}{v}</span> },
                          { title: '有效期', dataIndex: 'expireDate', render: (v) => v || '-' },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
