import { useState, useMemo, useEffect } from 'react';
import {
  Modal, Form, DatePicker, Select, TimePicker, Input, Button, message, Tag, Space,
  Tooltip, Alert, Row, Col, Drawer, Table, Empty,
} from 'antd';
const { TextArea } = Input;
import {
  ChevronLeft, ChevronRight, CalendarPlus, CheckCircle2, XCircle, Ban, Clock, Phone,
  User, FileText, CalendarDays, AlertTriangle, Filter, RefreshCw, Edit3, Scissors,
  ShoppingBag, MessageCircle, Receipt, Link2,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useAppStore } from '@/store';
import type { Appointment, AppointmentStatus } from '@/types';

const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TS: string[] = [];
for (let h = 9; h <= 20; h++) { TS.push(`${String(h).padStart(2, '0')}:00`); TS.push(`${String(h).padStart(2, '0')}:30`); }
TS.push('21:00');

const SS: Record<AppointmentStatus, string> = {
  confirmed: 'ring-2 ring-gold-500',
  completed: 'ring-2 ring-green-500',
  no_show: 'ring-2 ring-red-500',
  cancelled: 'ring-2 ring-gray-400 opacity-50',
};
const ST: Record<AppointmentStatus, string> = {
  confirmed: '已确认', completed: '已完成', no_show: '爽约', cancelled: '已取消',
};
const T2I = (t: string) => { const [h, m] = t.split(':').map(Number); return (h - 9) * 2 + (m >= 30 ? 1 : 0); };
const TC = (s: string) => `!bg-${s} !border-walnut-200 !text-walnut-700`;
const SLOT_H = 48;
const STATUS_COLOR: Record<AppointmentStatus, string> = {
  confirmed: 'gold', completed: 'green', no_show: 'red', cancelled: 'default',
};

function LinkConsumptionSelect({ appointmentId, memberId }: { appointmentId: string; memberId: string }) {
  const { consumptionRecords, servicePackages, barbers, linkAppointmentConsumption } = useAppStore();
  const memberConsumptions = useMemo(
    () => consumptionRecords.filter(c => c.memberId === memberId).slice(0, 20),
    [consumptionRecords, memberId]
  );
  return (
    <Select
      placeholder="关联消费记录"
      className="!w-52"
      allowClear
      size="small"
      options={memberConsumptions.map(c => {
        const pkg = servicePackages.find(p => p.id === c.packageId);
        return {
          label: `${c.createdAt.slice(5)} ¥${c.amount} ${c.note || pkg?.name || ''}`,
          value: c.id,
        };
      })}
      onChange={(val) => {
        if (val) {
          linkAppointmentConsumption(appointmentId, val);
          message.success('已关联消费记录');
        }
      }}
    />
  );
}

function FollowUpNoteEditor({ appointmentId, note }: { appointmentId: string; note?: string }) {
  const { updateAppointment } = useAppStore();
  const [editing, setEditing] = useState(!note);
  const [value, setValue] = useState(note || '');
  const save = () => {
    updateAppointment(appointmentId, { followUpNote: value });
    setEditing(false);
    message.success('回访备注已保存');
  };
  return (
    <div>
      {editing ? (
        <div className="space-y-2">
          <TextArea
            rows={3}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="记录客户反馈、满意度、后续建议..."
          />
          <Space>
            <Button size="small" type="primary" onClick={save}>保存</Button>
            {note && <Button size="small" onClick={() => { setEditing(false); setValue(note); }}>取消</Button>}
          </Space>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <p className="text-sm text-walnut-700 m-0 whitespace-pre-wrap">{note}</p>
          <Button size="small" type="link" onClick={() => setEditing(true)}>编辑</Button>
        </div>
      )}
    </div>
  );
}

export default function Appointments() {
  const s = useAppStore();
  const { barbers, members, appointments, servicePackages, addAppointment, updateAppointmentStatus, markNoShow, rescheduleAppointment, linkAppointmentConsumption, updateAppointment } = s;
  const [ws, setWs] = useState<Dayjs>(dayjs().startOf('week'));
  const [co, setCo] = useState(false);
  const [da, setDa] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [rescheduleForm] = Form.useForm();
  const [conflictTip, setConflictTip] = useState('');
  const [rescheduleConflict, setRescheduleConflict] = useState('');

  const [filterBarber, setFilterBarber] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | undefined>();
  const [filterKeyword, setFilterKeyword] = useState('');

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (filterBarber && a.barberId !== filterBarber) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterKeyword) {
        const kw = filterKeyword.trim().toLowerCase();
        if (!a.customerName.toLowerCase().includes(kw) && !a.customerPhone.includes(kw)) return false;
      }
      return true;
    });
  }, [appointments, filterBarber, filterStatus, filterKeyword]);

  const wd = useMemo(() => Array.from({ length: 7 }, (_, i) => ws.add(i, 'day')), [ws]);
  const wa = useMemo(() => {
    const s = ws.format('YYYY-MM-DD'), e = ws.add(6, 'day').format('YYYY-MM-DD');
    return filteredAppointments.filter(a => a.date >= s && a.date <= e);
  }, [filteredAppointments, ws]);

  const formDate = Form.useWatch('date', form);
  const formTime = Form.useWatch('time', form);
  const formBarber = Form.useWatch('barberId', form);

  useEffect(() => {
    if (formDate && formTime && formBarber) {
      const dateStr = (formDate as Dayjs).format('YYYY-MM-DD');
      const startTime = (formTime as Dayjs).format('HH:mm');
      const startIdx = T2I(startTime);
      const endIdx = startIdx + 2;

      const hasConflict = appointments.some(a => {
        if (a.barberId !== formBarber || a.date !== dateStr || a.status === 'cancelled') return false;
        const aStart = T2I(a.startTime);
        const aEnd = T2I(a.endTime);
        return !(startIdx >= aEnd || endIdx <= aStart);
      });

      setConflictTip(hasConflict ? '该时段已被预约，请更换时间或理发师' : '');
    } else {
      setConflictTip('');
    }
  }, [formDate, formTime, formBarber, appointments]);

  const rDate = Form.useWatch('date', rescheduleForm);
  const rTime = Form.useWatch('time', rescheduleForm);
  const rBarber = Form.useWatch('barberId', rescheduleForm);

  useEffect(() => {
    if (rDate && rTime && rBarber && da) {
      const dateStr = (rDate as Dayjs).format('YYYY-MM-DD');
      const startTime = (rTime as Dayjs).format('HH:mm');
      const startIdx = T2I(startTime);
      const endIdx = startIdx + 2;

      const hasConflict = appointments.some(a => {
        if (a.id === da.id) return false;
        if (a.barberId !== rBarber || a.date !== dateStr || a.status === 'cancelled') return false;
        const aStart = T2I(a.startTime);
        const aEnd = T2I(a.endTime);
        return !(startIdx >= aEnd || endIdx <= aStart);
      });

      setRescheduleConflict(hasConflict ? '该时段已被预约，请更换时间或理发师' : '');
    } else {
      setRescheduleConflict('');
    }
  }, [rDate, rTime, rBarber, appointments, da]);

  const getApts = (date: string, barberId: string) =>
    wa.filter(a => a.date === date && a.barberId === barberId);

  const getAptStyle = (a: Appointment) => {
    const top = T2I(a.startTime) * SLOT_H;
    const height = Math.max(SLOT_H * 1.5, (T2I(a.endTime) - T2I(a.startTime)) * SLOT_H - 4);
    const b = barbers.find(x => x.id === a.barberId);
    return { top: `${top}px`, height: `${height}px`, backgroundColor: b?.colorTag || '#D4AF37' };
  };

  const oC = (date?: Dayjs, barberId?: string, time?: string) => {
    form.resetFields();
    setConflictTip('');
    if (date) form.setFieldsValue({ date });
    if (barberId) form.setFieldsValue({ barberId });
    if (time) form.setFieldsValue({ time: dayjs(time, 'HH:mm') });
    setCo(true);
  };

  const hC = async () => {
    try {
      const v = await form.validateFields();
      const p = v.customerPhone;
      const em = members.find(m => m.phone === p);
      if (em && em.noShowCount >= 2) {
        message.warning(`⚠️ 客户「${em.name}」历史爽约${em.noShowCount}次，请谨慎确认`);
      }

      const dateStr = (v.date as Dayjs).format('YYYY-MM-DD');
      const startTime = (v.time as Dayjs).format('HH:mm');
      const startIdx = T2I(startTime);
      const endIdx = startIdx + 2;
      const endTime = TS[endIdx] || '21:00';

      const hasConflict = appointments.some(a => {
        if (a.barberId !== v.barberId || a.date !== dateStr || a.status === 'cancelled') return false;
        const aStart = T2I(a.startTime);
        const aEnd = T2I(a.endTime);
        return !(startIdx >= aEnd || endIdx <= aStart);
      });

      if (hasConflict) { message.error('该时段已被预约，请更换时间或理发师'); return; }

      addAppointment({
        memberId: em?.id,
        barberId: v.barberId,
        date: dateStr,
        startTime,
        endTime,
        serviceType: servicePackages.find(s => s.id === v.serviceId)?.name || '',
        customerName: v.customerName,
        customerPhone: p,
        note: v.note,
      });
      message.success('预约创建成功');
      setCo(false);
      form.resetFields();
    } catch {}
  };

  const hS = (id: string, s: AppointmentStatus) => {
    s === 'no_show' ? markNoShow(id) : updateAppointmentStatus(id, s);
    setDa(null);
    setDrawerOpen(false);
    message.success('状态已更新');
  };

  const openReschedule = (apt: Appointment) => {
    rescheduleForm.resetFields();
    rescheduleForm.setFieldsValue({
      date: dayjs(apt.date),
      time: dayjs(apt.startTime, 'HH:mm'),
      barberId: apt.barberId,
    });
    setRescheduleConflict('');
  };

  const confirmReschedule = async () => {
    if (!da) return;
    try {
      const v = await rescheduleForm.validateFields();
      const dateStr = (v.date as Dayjs).format('YYYY-MM-DD');
      const startTime = (v.time as Dayjs).format('HH:mm');
      const startIdx = T2I(startTime);
      const endIdx = startIdx + 2;
      const endTime = TS[endIdx] || '21:00';

      const ok = rescheduleAppointment(da.id, {
        date: dateStr,
        startTime,
        endTime,
        barberId: v.barberId,
      });

      if (!ok) {
        message.error('该时段已被预约，请更换时间或理发师');
        return;
      }
      message.success('预约改期成功');
      setDrawerOpen(false);
      setDa(null);
    } catch {}
  };

  const isSlotTaken = (date: string, barberId: string, time: string) => {
    const idx = T2I(time);
    return filteredAppointments.some(a => {
      if (a.barberId !== barberId || a.date !== date || a.status === 'cancelled') return false;
      const aStart = T2I(a.startTime);
      const aEnd = T2I(a.endTime);
      return idx >= aStart && idx < aEnd;
    });
  };

  const clearFilters = () => {
    setFilterBarber(undefined);
    setFilterStatus(undefined);
    setFilterKeyword('');
  };

  const hasFilters = !!filterBarber || !!filterStatus || !!filterKeyword;

  const H = TS.length * SLOT_H;

  const listColumns = [
    { title: '日期', dataIndex: 'date', width: 110, render: (v: string) => <span className="font-medium">{v}</span> },
    { title: '时段', width: 130, render: (_, r: Appointment) => <span>{r.startTime} - {r.endTime}</span> },
    { title: '理发师', dataIndex: 'barberId', width: 110, render: (v: string) => {
      const b = barbers.find(x => x.id === v); return <span>{b?.avatar} {b?.name}</span>;
    }},
    { title: '客户', width: 140, render: (_, r: Appointment) => (
      <div><div className="font-medium text-walnut-700">{r.customerName}</div><div className="text-xs text-walnut-400">{r.customerPhone}</div></div>
    )},
    { title: '服务', dataIndex: 'serviceType', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: AppointmentStatus) => <Tag color={STATUS_COLOR[v]}>{ST[v]}</Tag> },
    { title: '操作', width: 140, render: (_, r: Appointment) => (
      <Space size="small">
        <Button size="small" icon={<Edit3 size={14} />} onClick={() => { setDa(r); openReschedule(r); setDrawerOpen(true); }}>改期</Button>
        <Button size="small" onClick={() => { setDa(r); setDrawerOpen(true); }}>详情</Button>
      </Space>
    )},
  ];

  return (
    <div className="p-6 min-h-screen">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut p-5 mb-5 border border-walnut-100">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Button icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setWs(w => w.subtract(7, 'day'))} className={TC('walnut-50 hover:!bg-walnut-100')}>上一周</Button>
            <Button onClick={() => setWs(dayjs().startOf('week'))} className="!bg-gold-500 hover:!bg-gold-600 !border-none !text-white font-medium">今天</Button>
            <Button icon={<ChevronRight className="w-4 h-4" />} onClick={() => setWs(w => w.add(7, 'day'))} className={TC('walnut-50 hover:!bg-walnut-100')}>下一周</Button>
            <span className="ml-3 pl-4 border-l border-walnut-200 text-walnut-800 font-semibold text-lg">
              {ws.format('M月D日')} - {ws.add(6, 'day').format('M月D日')}
            </span>
          </div>
          <Button type="primary" size="large" icon={<CalendarPlus className="w-5 h-5" />} onClick={() => oC()}
            className="!bg-gradient-to-r !from-gold-500 !to-gold-600 hover:!from-gold-600 hover:!to-gold-700 !border-none !shadow-gold !px-6">
            新建预约
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-walnut-100">
          <span className="flex items-center gap-1 text-walnut-500 text-sm"><Filter size={14} />筛选：</span>
          <Select
            placeholder="选择理发师"
            allowClear
            value={filterBarber}
            onChange={setFilterBarber}
            className="!w-40"
            options={barbers.map(b => ({ label: `${b.avatar} ${b.name}`, value: b.id }))}
          />
          <Select
            placeholder="预约状态"
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
            className="!w-32"
            options={(['confirmed', 'completed', 'no_show', 'cancelled'] as AppointmentStatus[]).map(s => ({ label: ST[s], value: s }))}
          />
          <Input
            placeholder="搜索姓名或手机号"
            allowClear
            value={filterKeyword}
            onChange={e => setFilterKeyword(e.target.value)}
            className="!w-52"
            prefix={<User size={14} className="text-walnut-400" />}
          />
          {hasFilters && (
            <Button size="small" icon={<RefreshCw size={14} />} onClick={clearFilters} className="!text-walnut-500">清空筛选</Button>
          )}
          {hasFilters && (
            <Tag color="gold" className="!ml-2">已筛选 {filteredAppointments.length} 条</Tag>
          )}
          <div className="flex-1" />
          <div className="flex gap-4 flex-wrap items-center">
            <span className="text-sm text-walnut-500">状态：</span>
            {(['confirmed', 'completed', 'no_show', 'cancelled'] as AppointmentStatus[]).map(st => (
              <div key={st} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded bg-walnut-200 ${SS[st]}`} />
                <span className="text-sm text-walnut-600">{ST[st]}</span>
              </div>
            ))}
            <span className="text-sm text-walnut-500">💡 点击空白时段快速创建预约</span>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut border border-walnut-100 overflow-hidden mb-5">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${wd.length}, minmax(0, 1fr))` }}>
          <div className="sticky top-0 z-20 bg-walnut-700 text-white p-2 text-center font-semibold border-r border-walnut-600 flex items-center justify-center gap-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs">时段</span>
          </div>
          {wd.map((d) => {
            const isToday = d.isSame(dayjs(), 'day');
            const realWeekday = d.day();
            return (
              <div key={d.format('YYYY-MM-DD')} className="sticky top-0 z-10 border-r border-walnut-100 last:border-r-0"
                style={{ backgroundColor: isToday ? 'rgba(212,175,55,0.08)' : '#fff' }}>
                <div className={`text-center py-2 border-b border-walnut-100 ${isToday ? 'bg-gold-100/60' : ''}`}>
                  <div className="font-bold text-walnut-800 text-sm">
                    {d.format('M月D日')} {WD[realWeekday]}
                    {isToday && <Tag color="gold" className="!ml-1 !text-xs !py-0">今天</Tag>}
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-walnut-100">
                  {barbers.map(b => (
                    <div key={b.id} className="py-1.5 text-center bg-walnut-50/60">
                      <span className="text-base">{b.avatar}</span>
                      <span className="ml-1 text-xs font-medium text-walnut-700">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative" style={{ height: H }}>
          <div className="grid absolute inset-0" style={{ gridTemplateColumns: `80px repeat(${wd.length}, minmax(0, 1fr))` }}>
            <div className="border-r border-walnut-100 bg-walnut-50/50">
              {TS.slice(0, -1).map((t, i) => (
                <div key={t} className="h-12 border-b border-walnut-100 flex items-end justify-end pr-2 text-xs text-walnut-500 pb-0.5"
                  style={{ borderBottomStyle: i % 2 === 0 ? 'solid' : 'dashed' }}>
                  {i % 2 === 0 ? t : ''}
                </div>
              ))}
            </div>

            {wd.map((d) => {
              const dateStr = d.format('YYYY-MM-DD');
              const isToday = d.isSame(dayjs(), 'day');
              return (
                <div key={d.format('YYYY-MM-DD')} className="relative border-r border-walnut-100 last:border-r-0">
                  <div className="grid grid-cols-2 divide-x divide-walnut-100 h-full">
                    {barbers.map(barber => {
                      const apts = getApts(dateStr, barber.id);
                      return (
                        <div key={barber.id} className="relative h-full">
                          {TS.slice(0, -1).map((t, ti) => {
                            const taken = isSlotTaken(dateStr, barber.id, t);
                            const isHalfHour = ti % 2 === 1;
                            const filteredOut = hasFilters && filterBarber && filterBarber !== barber.id;
                            return (
                              <div
                                key={t}
                                className={`absolute left-0 right-0 transition-colors
                                  ${taken ? 'cursor-not-allowed' : isToday ? 'hover:bg-gold-200/30 cursor-pointer' : 'hover:bg-gold-50/80 cursor-pointer'}
                                  ${isToday ? 'bg-gold-50/20' : ''}
                                  ${filteredOut ? 'opacity-30' : ''}`}
                                style={{
                                  top: ti * SLOT_H,
                                  height: SLOT_H,
                                  borderBottom: isHalfHour ? '1px dashed #EDE6DF' : '1px solid #EDE6DF',
                                }}
                                onClick={() => !taken && !filteredOut && oC(d, barber.id, t)}
                              />
                            );
                          })}

                          {apts.map(a => (
                            <Tooltip
                              key={a.id}
                              title={
                                <div className="text-sm">
                                  <div className="font-bold mb-1">{a.customerName} · {a.serviceType}</div>
                                  <div>{a.startTime} - {a.endTime}</div>
                                  <div className="opacity-80">{a.customerPhone}</div>
                                  {a.note && <div className="mt-1 text-xs">备注：{a.note}</div>}
                                  <div className="mt-1 text-xs">状态：{ST[a.status]}</div>
                                </div>
                              }
                            >
                              <div
                                className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 cursor-pointer text-white text-xs overflow-hidden shadow-sm hover:shadow-md hover:z-20 transition-all ${SS[a.status]}`}
                                style={getAptStyle(a)}
                                onClick={e => { e.stopPropagation(); setDa(a); openReschedule(a); setDrawerOpen(true); }}
                              >
                                <div className="font-semibold truncate leading-tight">{a.customerName}</div>
                                <div className="opacity-90 truncate text-[10px] leading-tight mt-0.5">{a.serviceType}</div>
                              </div>
                            </Tooltip>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut border border-walnut-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-walnut-100 flex items-center justify-between">
          <span className="font-semibold text-walnut-700">预约列表{hasFilters && <Tag color="gold" className="ml-2">已筛选</Tag>}</span>
          <span className="text-sm text-walnut-400">共 {filteredAppointments.length} 条记录</span>
        </div>
        <Table
          dataSource={filteredAppointments}
          columns={listColumns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          rowClassName={r => r.status === 'cancelled' ? 'opacity-50' : ''}
        />
      </div>

      <Modal
        title={<span className="text-lg font-bold text-walnut-800 flex items-center gap-2"><CalendarPlus className="w-5 h-5 text-gold-500" />新建预约</span>}
        open={co}
        onCancel={() => { setCo(false); form.resetFields(); setConflictTip(''); }}
        destroyOnClose
        width={520}
        footer={[
          <Button key="c" onClick={() => { setCo(false); form.resetFields(); setConflictTip(''); }}>取消</Button>,
          <Button key="o" type="primary" onClick={hC} disabled={!!conflictTip}
            className="!bg-gold-500 hover:!bg-gold-600 !border-none disabled:!bg-walnut-200">
            确认创建
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker className="!w-full" placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="时段" name="time" rules={[{ required: true, message: '请选择时段' }]}>
                <TimePicker
                  className="!w-full"
                  format="HH:mm"
                  minuteStep={30}
                  placeholder="选择时间"
                  disabledTime={() => ({
                    disabledHours: () => [...Array(9).keys(), ...Array.from({ length: 4 }, (_, k) => k + 21)],
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="理发师" name="barberId" rules={[{ required: true, message: '请选择理发师' }]}>
                <Select placeholder="选择理发师" options={barbers.map(b => ({ label: `${b.avatar} ${b.name}`, value: b.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="服务项目" name="serviceId" rules={[{ required: true, message: '请选择服务' }]}>
                <Select placeholder="选择服务项目" options={servicePackages.map(s => ({ label: `${s.name} ¥${s.price}`, value: s.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="客户姓名" name="customerName" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input prefix={<User className="w-4 h-4 text-walnut-400" />} placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" name="customerPhone"
                rules={[{ required: true, message: '请输入电话' }, { pattern: /^1\d{10}$/, message: '手机号格式错误' }]}>
                <Input
                  prefix={<Phone className="w-4 h-4 text-walnut-400" />}
                  placeholder="11位手机号"
                  onChange={e => {
                    const m = members.find(mm => mm.phone === e.target.value);
                    if (m && m.noShowCount >= 2) message.warning(`⚠️ ${m.name} 爽约${m.noShowCount}次`);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={2} placeholder="特殊要求等..." />
          </Form.Item>

          {conflictTip && (
            <Alert
              message={<span className="flex items-center gap-2"><AlertTriangle size={16} />时间冲突</span>}
              description={conflictTip}
              type="error"
              showIcon
              className="!mt-2"
            />
          )}
        </Form>
      </Modal>

      <Drawer
        title={<span className="text-lg font-bold text-walnut-800 flex items-center gap-2"><Clock className="w-5 h-5 text-gold-500" />预约详情</span>}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDa(null); }}
        width={480}
        destroyOnClose
        extra={da && da.status === 'confirmed' && (
          <Space>
            <Button danger icon={<Ban className="w-4 h-4" />} onClick={() => da && hS(da.id, 'cancelled')}>取消预约</Button>
            <Button danger icon={<XCircle className="w-4 h-4" />} onClick={() => da && hS(da.id, 'no_show')}>标记爽约</Button>
            <Button type="primary" icon={<CheckCircle2 className="w-4 h-4" />}
              className="!bg-green-500 hover:!bg-green-600 !border-none"
              onClick={() => da && hS(da.id, 'completed')}>
              标记完成
            </Button>
          </Space>
        )}
      >
        {da && (
          <div className="space-y-5 mt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-walnut-50">
              <span className="text-walnut-600">状态</span>
              <Tag color={STATUS_COLOR[da.status]} className="!font-medium">{ST[da.status]}</Tag>
            </div>

            <div className="p-4 rounded-xl border-2 border-gold-200 bg-gradient-to-r from-gold-50 to-walnut-50">
              <div className="flex items-center gap-2 mb-3 text-walnut-700 font-semibold">
                <Edit3 size={16} className="text-gold-500" />
                改期（更换日期/时间/理发师）
              </div>
              <Form form={rescheduleForm} layout="vertical">
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
                      <DatePicker className="!w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="时段" name="time" rules={[{ required: true, message: '请选择时段' }]}>
                      <TimePicker
                        className="!w-full"
                        format="HH:mm"
                        minuteStep={30}
                        disabledTime={() => ({
                          disabledHours: () => [...Array(9).keys(), ...Array.from({ length: 4 }, (_, k) => k + 21)],
                        })}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="理发师" name="barberId" rules={[{ required: true, message: '请选择理发师' }]}>
                  <Select
                    placeholder="选择理发师"
                    options={barbers.map(b => ({ label: `${b.avatar} ${b.name}`, value: b.id }))}
                    optionRender={(opt) => {
                      const b = barbers.find(x => x.id === opt.value);
                      const dateStr = rDate ? (rDate as Dayjs).format('YYYY-MM-DD') : da.date;
                      const dayApts = filteredAppointments.filter(a => a.barberId === b?.id && a.date === dateStr && a.id !== da.id && a.status !== 'cancelled');
                      return (
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          {dayApts.length > 0 && <Tag color="orange" className="!text-xs">当天 {dayApts.length} 单</Tag>}
                        </div>
                      );
                    }}
                  />
                </Form.Item>
                {rescheduleConflict && (
                  <Alert
                    message={<span className="flex items-center gap-2"><AlertTriangle size={16} />时间冲突</span>}
                    description={rescheduleConflict}
                    type="error"
                    showIcon
                  />
                )}
                <Button
                  type="primary"
                  block
                  icon={<Scissors size={16} />}
                  onClick={confirmReschedule}
                  disabled={!!rescheduleConflict}
                  className="!mt-2 !bg-gold-500 hover:!bg-gold-600 !border-none disabled:!bg-walnut-200"
                >
                  保存改期
                </Button>
              </Form>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['客户姓名', da.customerName],
                ['联系电话', da.customerPhone],
                ['日期', da.date],
                ['时段', `${da.startTime} - ${da.endTime}`],
                ['理发师', barbers.find(b => b.id === da.barberId)?.name || '-'],
                ['服务项目', da.serviceType],
              ].map(([k, v]) => (
                <div key={k as string} className="p-3 rounded-lg bg-walnut-50">
                  <div className="text-walnut-500 mb-1 text-xs">{k}</div>
                  <div className="font-semibold text-walnut-800">{v}</div>
                </div>
              ))}
            </div>

            {/* 消费关联 */}
            <div className="p-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between mb-3">
                <div className="text-walnut-700 font-semibold flex items-center gap-1.5">
                  <ShoppingBag size={16} className="text-emerald-500" />
                  到店消费转化
                </div>
                {da.status === 'completed' && !da.consumptionId && da.memberId && (
                  <LinkConsumptionSelect
                    appointmentId={da.id}
                    memberId={da.memberId}
                  />
                )}
              </div>
              {da.consumptionId ? (() => {
                const rec = s.consumptionRecords.find(c => c.id === da.consumptionId);
                if (!rec) return <Empty description="关联的消费记录不存在" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                const barber = s.barbers.find(b => b.id === rec.barberId);
                const pkg = s.servicePackages.find(p => p.id === rec.packageId);
                return (
                  <div className="bg-white/70 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-walnut-500">消费项目</span>
                      <span className="font-medium text-walnut-800">{rec.note || pkg?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-walnut-500">服务理发师</span>
                      <span className="font-medium text-walnut-800">{barber ? `${barber.avatar} ${barber.name}` : '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-walnut-500">消费金额</span>
                      <span className="font-bold text-rose-600">¥{rec.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-walnut-500">获得积分</span>
                      <span className="font-semibold text-purple-600">+{rec.pointsEarned}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-walnut-500">消费时间</span>
                      <span className="text-walnut-600">{rec.createdAt}</span>
                    </div>
                  </div>
                );
              })() : (
                <div className="text-sm text-walnut-500">
                  {da.status !== 'completed'
                    ? '预约完成后可关联消费记录'
                    : da.memberId
                      ? '尚未关联消费记录，可点击右侧按钮关联'
                      : '非会员客户无法关联消费'}
                </div>
              )}
            </div>

            {/* 回访记录 */}
            <div className="p-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="text-walnut-700 font-semibold mb-3 flex items-center gap-1.5">
                <MessageCircle size={16} className="text-purple-500" />
                回访备注
              </div>
              <FollowUpNoteEditor appointmentId={da.id} note={da.followUpNote} />
            </div>

            {da.note && (
              <div className="p-3 rounded-lg bg-gold-50 border border-gold-200">
                <div className="text-walnut-500 mb-1 text-sm flex items-center gap-1"><FileText size={14} />预约备注</div>
                <div className="text-walnut-800">{da.note}</div>
              </div>
            )}

            {(() => {
              const m = members.find(mm => mm.id === da.memberId);
              if (!m) return null;
              return (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-blue-700 text-sm font-medium">会员信息</div>
                  <div className="text-sm text-blue-600 mt-1">
                    {m.avatar} {m.name} · 余额 ¥{m.balance} · 积分 {m.availablePoints}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Drawer>
    </div>
  );
}
