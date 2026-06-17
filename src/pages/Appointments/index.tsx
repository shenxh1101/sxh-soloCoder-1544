import { useState, useMemo, useEffect } from 'react';
import { Modal, Form, DatePicker, Select, TimePicker, Input, Button, message, Tag, Space, Tooltip, Alert } from 'antd';
import { ChevronLeft, ChevronRight, CalendarPlus, CheckCircle2, XCircle, Ban, Clock, Phone, User, FileText, CalendarDays, AlertTriangle } from 'lucide-react';
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
const HOUR_H = 96;
const SLOT_H = 48;

export default function Appointments() {
  const { barbers, members, appointments, servicePackages, addAppointment, updateAppointmentStatus, markNoShow } = useAppStore();
  const [ws, setWs] = useState<Dayjs>(dayjs().startOf('week'));
  const [co, setCo] = useState(false);
  const [da, setDa] = useState<Appointment | null>(null);
  const [form] = Form.useForm();
  const [conflictTip, setConflictTip] = useState('');

  const wd = useMemo(() => Array.from({ length: 7 }, (_, i) => ws.add(i, 'day')), [ws]);
  const wa = useMemo(() => {
    const s = ws.format('YYYY-MM-DD'), e = ws.add(6, 'day').format('YYYY-MM-DD');
    return appointments.filter(a => a.date >= s && a.date <= e);
  }, [appointments, ws]);

  const formDate = Form.useWatch('date', form);
  const formTime = Form.useWatch('time', form);
  const formBarber = Form.useWatch('barberId', form);

  useEffect(() => {
    if (formDate && formTime && formBarber) {
      const dateStr = (formDate as Dayjs).format('YYYY-MM-DD');
      const startTime = (formTime as Dayjs).format('HH:mm');
      const startIdx = T2I(startTime);
      const endIdx = startIdx + 2;
      const endTime = TS[endIdx] || '21:00';

      const hasConflict = appointments.some(a => {
        if (a.barberId !== formBarber || a.date !== dateStr || a.status === 'cancelled') return false;
        const aStart = T2I(a.startTime);
        const aEnd = T2I(a.endTime);
        return !(startIdx >= aEnd || endIdx <= aStart);
      });

      if (hasConflict) {
        setConflictTip(`该时段已被预约，请更换时间或理发师`);
      } else {
        setConflictTip('');
      }
    } else {
      setConflictTip('');
    }
  }, [formDate, formTime, formBarber, appointments]);

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

      if (hasConflict) {
        message.error('该时段已被预约，请更换时间或理发师');
        return;
      }

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
    message.success('状态已更新');
  };

  const isSlotTaken = (date: string, barberId: string, time: string) => {
    const idx = T2I(time);
    return appointments.some(a => {
      if (a.barberId !== barberId || a.date !== date || a.status === 'cancelled') return false;
      const aStart = T2I(a.startTime);
      const aEnd = T2I(a.endTime);
      return idx >= aStart && idx < aEnd;
    });
  };

  const H = TS.length * SLOT_H;

  return (
    <div className="p-6 min-h-screen">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut p-5 mb-5 border border-walnut-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
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
        <div className="flex gap-4 mt-4 flex-wrap items-center">
          <span className="text-sm text-walnut-500">状态：</span>
          {['confirmed 已确认', 'completed 已完成', 'no_show 爽约', 'cancelled 已取消'].map(s => {
            const [st] = s.split(' ');
            return (
              <div key={st} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded bg-walnut-200 ${SS[st as AppointmentStatus]}`} />
                <span className="text-sm text-walnut-600">{s.slice(s.indexOf(' ') + 1)}</span>
              </div>
            );
          })}
          <div className="flex-1" />
          <span className="text-sm text-walnut-500">
            💡 点击空白时段快速创建预约
          </span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut border border-walnut-100 overflow-hidden">
        {/* 表头：7天列 + 理发师 */}
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${wd.length}, minmax(0, 1fr))` }}>
          <div className="sticky top-0 z-20 bg-walnut-700 text-white p-2 text-center font-semibold border-r border-walnut-600 flex items-center justify-center gap-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs">时段</span>
          </div>
          {wd.map((d, di) => {
            const isToday = d.isSame(dayjs(), 'day');
            return (
              <div key={di} className="sticky top-0 z-10 border-r border-walnut-100 last:border-r-0"
                style={{ backgroundColor: isToday ? 'rgba(212,175,55,0.08)' : '#fff' }}>
                <div className={`text-center py-2 border-b border-walnut-100 ${isToday ? 'bg-gold-100/60' : ''}`}>
                  <div className="font-bold text-walnut-800 text-sm">
                    {d.format('M月D日')} {WD[di]}
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

        {/* 时间 + 预约网格 */}
        <div className="relative" style={{ height: H }}>
          <div className="grid absolute inset-0" style={{ gridTemplateColumns: `80px repeat(${wd.length}, minmax(0, 1fr))` }}>
            {/* 时间轴列 */}
            <div className="border-r border-walnut-100 bg-walnut-50/50">
              {TS.slice(0, -1).map((t, i) => (
                <div key={t} className="h-12 border-b border-walnut-100 flex items-end justify-end pr-2 text-xs text-walnut-500 pb-0.5"
                  style={{ borderBottomStyle: i % 2 === 0 ? 'solid' : 'dashed' }}>
                  {i % 2 === 0 ? t : ''}
                </div>
              ))}
            </div>

            {/* 每天列，内部分两个理发师 */}
            {wd.map((d, di) => {
              const dateStr = d.format('YYYY-MM-DD');
              const isToday = d.isSame(dayjs(), 'day');
              return (
                <div key={di} className="relative border-r border-walnut-100 last:border-r-0">
                  <div className="grid grid-cols-2 divide-x divide-walnut-100 h-full">
                    {barbers.map(barber => {
                      const apts = getApts(dateStr, barber.id);
                      return (
                        <div key={barber.id} className="relative h-full">
                          {/* 时段格子 */}
                          {TS.slice(0, -1).map((t, ti) => {
                            const taken = isSlotTaken(dateStr, barber.id, t);
                            const isHalfHour = ti % 2 === 1;
                            return (
                              <div
                                key={t}
                                className={`absolute left-0 right-0 cursor-pointer transition-colors
                                  ${taken ? 'cursor-not-allowed' : isToday ? 'hover:bg-gold-200/30' : 'hover:bg-gold-50/80'}
                                  ${isToday ? 'bg-gold-50/20' : ''}`}
                                style={{
                                  top: ti * SLOT_H,
                                  height: SLOT_H,
                                  borderBottom: isHalfHour ? '1px dashed #EDE6DF' : '1px solid #EDE6DF',
                                }}
                                onClick={() => !taken && oC(d, barber.id, t)}
                              />
                            );
                          })}

                          {/* 预约块 */}
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
                                onClick={e => { e.stopPropagation(); setDa(a); }}
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

      {/* 新建预约弹窗 */}
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
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker className="!w-full" placeholder="选择日期" />
            </Form.Item>
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
            <Form.Item label="理发师" name="barberId" rules={[{ required: true, message: '请选择理发师' }]}>
              <Select placeholder="选择理发师" options={barbers.map(b => ({ label: `${b.avatar} ${b.name}`, value: b.id }))} />
            </Form.Item>
            <Form.Item label="服务项目" name="serviceId" rules={[{ required: true, message: '请选择服务' }]}>
              <Select placeholder="选择服务项目" options={servicePackages.map(s => ({ label: `${s.name} ¥${s.price}`, value: s.id }))} />
            </Form.Item>
            <Form.Item label="客户姓名" name="customerName" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input prefix={<User className="w-4 h-4 text-walnut-400" />} placeholder="姓名" />
            </Form.Item>
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
          </div>
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

      {/* 预约详情弹窗 */}
      <Modal
        title={<span className="text-lg font-bold text-walnut-800 flex items-center gap-2"><Clock className="w-5 h-5 text-gold-500" />预约详情</span>}
        open={!!da}
        onCancel={() => setDa(null)}
        destroyOnClose
        footer={[
          <Button key="x" onClick={() => setDa(null)}>关闭</Button>,
          da?.status === 'confirmed' && (
            <Space key="a">
              <Button danger icon={<Ban className="w-4 h-4" />} onClick={() => da && hS(da.id, 'cancelled')}>取消预约</Button>
              <Button danger icon={<XCircle className="w-4 h-4" />} onClick={() => da && hS(da.id, 'no_show')}>标记爽约</Button>
              <Button type="primary" icon={<CheckCircle2 className="w-4 h-4" />}
                className="!bg-green-500 hover:!bg-green-600 !border-none"
                onClick={() => da && hS(da.id, 'completed')}>
                标记完成
              </Button>
            </Space>
          ),
        ]}
      >
        {da && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-walnut-50">
              <span className="text-walnut-600">状态</span>
              <Tag color={da.status === 'completed' ? 'green' : da.status === 'no_show' ? 'red' : da.status === 'cancelled' ? 'default' : 'gold'}>
                {ST[da.status]}
              </Tag>
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
                <div key={k} className="p-3 rounded-lg bg-walnut-50">
                  <div className="text-walnut-500 mb-1 text-xs">{k}</div>
                  <div className="font-semibold text-walnut-800">{v}</div>
                </div>
              ))}
            </div>
            {da.note && (
              <div className="p-3 rounded-lg bg-gold-50 border border-gold-200">
                <div className="text-walnut-500 mb-1 text-sm flex items-center gap-1"><FileText size={14} />备注</div>
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
      </Modal>
    </div>
  );
}
