import { useState, useMemo } from 'react';
import { Modal, Form, DatePicker, Select, TimePicker, Input, Button, message, Tag, Space, Tooltip } from 'antd';
import { ChevronLeft, ChevronRight, CalendarPlus, CheckCircle2, XCircle, Ban, Clock, Phone, User, FileText, CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useAppStore } from '@/store';
import type { Appointment, AppointmentStatus } from '@/types';

const WD = ['日', '一', '二', '三', '四', '五', '六'];
const TS: string[] = [];
for (let h = 9; h <= 20; h++) { TS.push(`${String(h).padStart(2, '0')}:00`); TS.push(`${String(h).padStart(2, '0')}:30`); }
TS.push('21:00');

const SS: Record<AppointmentStatus, string> = { confirmed: 'ring-2 ring-gold-500', completed: 'ring-2 ring-green-500', no_show: 'ring-2 ring-red-500', cancelled: 'ring-2 ring-gray-400 opacity-50' };
const ST: Record<AppointmentStatus, string> = { confirmed: '已确认', completed: '已完成', no_show: '爽约', cancelled: '已取消' };
const T2I = (t: string) => { const [h, m] = t.split(':').map(Number); return (h - 9) * 2 + (m >= 30 ? 1 : 0); };
const TC = (s: string) => `!bg-${s} !border-walnut-200 !text-walnut-700`;

export default function Appointments() {
  const { barbers, members, appointments, servicePackages, addAppointment, updateAppointmentStatus, markNoShow } = useAppStore();
  const [ws, setWs] = useState<Dayjs>(dayjs().startOf('week'));
  const [co, setCo] = useState(false);
  const [da, setDa] = useState<Appointment | null>(null);
  const [form] = Form.useForm();

  const wd = useMemo(() => Array.from({ length: 7 }, (_, i) => ws.add(i, 'day')), [ws]);
  const wa = useMemo(() => { const s = ws.format('YYYY-MM-DD'), e = ws.add(6, 'day').format('YYYY-MM-DD'); return appointments.filter(a => a.date >= s && a.date <= e); }, [appointments, ws]);

  const gAS = (a: Appointment) => {
    const t = T2I(a.startTime) * 48, h = Math.max(48, (T2I(a.endTime) - T2I(a.startTime)) * 48);
    const b = barbers.find(x => x.id === a.barberId);
    return { top: `${t}px`, height: `${h - 4}px`, backgroundColor: b?.colorTag || '#D4AF37' };
  };

  const oC = (date?: Dayjs, barberId?: string, time?: string) => {
    form.resetFields();
    if (date) form.setFieldsValue({ date });
    if (barberId) form.setFieldsValue({ barberId });
    if (time) form.setFieldsValue({ time: dayjs(time, 'HH:mm') });
    setCo(true);
  };

  const hC = async () => {
    const v = await form.validateFields(), p = v.customerPhone, em = members.find(m => m.phone === p);
    if (em && em.noShowCount >= 2) message.warning(`⚠️ 客户「${em.name}」历史爽约${em.noShowCount}次，请谨慎确认`);
    const ts = (v.time as Dayjs).format('HH:mm'), ni = T2I(ts) + 2, eh = Math.floor(ni / 2) + 9, em2 = (ni % 2) * 30;
    addAppointment({ memberId: em?.id, barberId: v.barberId, date: (v.date as Dayjs).format('YYYY-MM-DD'), startTime: ts, endTime: `${String(eh).padStart(2, '0')}:${String(em2).padStart(2, '0')}`, serviceType: servicePackages.find(s => s.id === v.serviceId)?.name || '', customerName: v.customerName, customerPhone: p, note: v.note });
    message.success('预约创建成功'); setCo(false); form.resetFields();
  };

  const hS = (id: string, s: AppointmentStatus) => { s === 'no_show' ? markNoShow(id) : updateAppointmentStatus(id, s); setDa(null); message.success('状态已更新'); };
  const gCA = (d: string, b: string) => wa.filter(a => a.date === d && a.barberId === b);
  const H = TS.length * 48;

  return (
    <div className="p-6 min-h-screen">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut p-5 mb-5 border border-walnut-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setWs(w => w.subtract(7, 'day'))} className={TC('walnut-50 hover:!bg-walnut-100')}>上一周</Button>
            <Button onClick={() => setWs(dayjs().startOf('week'))} className="!bg-gold-500 hover:!bg-gold-600 !border-none !text-white font-medium">今天</Button>
            <Button icon={<ChevronRight className="w-4 h-4" />} onClick={() => setWs(w => w.add(7, 'day'))} className={TC('walnut-50 hover:!bg-walnut-100')}>下一周</Button>
            <span className="ml-3 pl-4 border-l border-walnut-200 text-walnut-800 font-semibold text-lg">{ws.format('M月D日')} - {ws.add(6, 'day').format('M月D日')}</span>
          </div>
          <Button type="primary" size="large" icon={<CalendarPlus className="w-5 h-5" />} onClick={() => oC()} className="!bg-gradient-to-r !from-gold-500 !to-gold-600 hover:!from-gold-600 hover:!to-gold-700 !border-none !shadow-gold !px-6">新建预约</Button>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">{['confirmed 金色边框 已确认', 'completed 绿色 已完成', 'no_show 红色 爽约', 'cancelled 灰色 已取消'].map(s => { const [st] = s.split(' '); return <div key={st} className="flex items-center gap-2"><div className={`w-4 h-4 rounded bg-walnut-200 ${SS[st as AppointmentStatus]}`} /><span className="text-sm text-walnut-600">{s.slice(s.indexOf(' ') + 1)}</span></div>; })}</div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-walnut border border-walnut-100 overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${barbers.length}, minmax(0, 1fr))` }}>
          <div className="sticky top-0 z-10 bg-walnut-700 text-white p-3 text-center font-semibold border-r border-walnut-600"><CalendarDays className="w-4 h-4 mx-auto mb-1" />时段</div>
          {barbers.map(b => <div key={b.id} className="sticky top-0 z-10 p-3 text-center font-semibold border-r border-walnut-100" style={{ backgroundColor: b.colorTag + '25' }}><div className="text-2xl">{b.avatar}</div><div className="text-walnut-800 mt-1">{b.name}</div></div>)}
        </div>
        <div className="relative" style={{ height: H }}>
          <div className="grid absolute inset-0" style={{ gridTemplateColumns: `80px repeat(${barbers.length}, minmax(0, 1fr))` }}>
            <div className="border-r border-walnut-100 bg-walnut-50/50">{TS.map((t, i) => <div key={t} className="h-12 border-b border-walnut-100 flex items-center justify-end pr-2 text-xs text-walnut-500" style={{ borderBottomStyle: i % 2 ? 'dashed' : 'solid' }}>{t}</div>)}</div>
            {barbers.map(barber => (
              <div key={barber.id} className="relative border-r border-walnut-100">
                {wd.map((d, di) => {
                  const ds = d.format('YYYY-MM-DD'), it = d.isSame(dayjs(), 'day'), cs = gCA(ds, barber.id);
                  return <div key={di} className="absolute left-0 right-0" style={{ top: 0, height: H }}>
                    <div className={`text-center py-1 border-b border-walnut-100 text-xs font-medium ${it ? 'bg-gold-100 text-walnut-800' : 'text-walnut-600'}`}>{d.format('M/D')} {WD[di]}{it && <Tag color="gold" className="!ml-1 !text-xs">今天</Tag>}</div>
                    <div className="relative" style={{ height: (TS.length - 1) * 48 }}>
                      {TS.slice(0, -1).map((t, i) => <div key={t} className={`absolute left-0 right-0 cursor-pointer hover:bg-gold-50/60 transition-colors ${it ? 'bg-gold-50/20' : ''}`} style={{ top: i * 48, height: 48, borderBottom: i % 2 ? '1px solid #EDE6DF' : '1px dashed #EDE6DF' }} onClick={() => oC(d, barber.id, t)} />)}
                      {cs.map(a => <Tooltip key={a.id} title={`${a.customerName} · ${a.serviceType}`}><div className={`absolute left-1 right-1 rounded-lg p-2 cursor-pointer text-white text-xs overflow-hidden shadow-md hover:shadow-lg hover:scale-[1.02] hover:z-20 transition-all ${SS[a.status]}`} style={gAS(a)} onClick={e => { e.stopPropagation(); setDa(a); }}><div className="font-semibold truncate">{a.customerName}</div><div className="opacity-90 truncate text-[11px]">{a.serviceType}</div><div className="opacity-75 text-[10px] mt-0.5">{a.startTime}-{a.endTime}</div></div></Tooltip>)}
                    </div>
                  </div>;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal title={<span className="text-lg font-bold text-walnut-800 flex items-center gap-2"><CalendarPlus className="w-5 h-5 text-gold-500" />新建预约</span>} open={co} onCancel={() => setCo(false)} destroyOnClose footer={[<Button key="c" onClick={() => setCo(false)}>取消</Button>, <Button key="o" type="primary" onClick={hC} className="!bg-gold-500 hover:!bg-gold-600 !border-none">确认创建</Button>]}>
        <Form form={form} layout="vertical" className="mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}><DatePicker className="!w-full" placeholder="选择日期" /></Form.Item>
            <Form.Item label="时段" name="time" rules={[{ required: true, message: '请选择时段' }]}><TimePicker className="!w-full" format="HH:mm" minuteStep={30} placeholder="选择时间" disabledTime={() => ({ disabledHours: () => [...Array(9).keys(), ...Array.from({ length: 4 }, (_, k) => k + 21)] })} /></Form.Item>
            <Form.Item label="理发师" name="barberId" rules={[{ required: true, message: '请选择理发师' }]}><Select placeholder="选择理发师" options={barbers.map(b => ({ label: `${b.avatar} ${b.name}`, value: b.id }))} /></Form.Item>
            <Form.Item label="服务项目" name="serviceId" rules={[{ required: true, message: '请选择服务' }]}><Select placeholder="选择服务项目" options={servicePackages.map(s => ({ label: `${s.name} ¥${s.price}`, value: s.id }))} /></Form.Item>
            <Form.Item label="客户姓名" name="customerName" rules={[{ required: true, message: '请输入姓名' }]}><Input prefix={<User className="w-4 h-4 text-walnut-400" />} placeholder="姓名" /></Form.Item>
            <Form.Item label="联系电话" name="customerPhone" rules={[{ required: true, message: '请输入电话' }, { pattern: /^1\d{10}$/, message: '手机号格式错误' }]}><Input prefix={<Phone className="w-4 h-4 text-walnut-400" />} placeholder="11位手机号" onChange={e => { const m = members.find(mm => mm.phone === e.target.value); if (m && m.noShowCount >= 2) message.warning(`⚠️ ${m.name} 爽约${m.noShowCount}次`); }} /></Form.Item>
          </div>
          <Form.Item label="备注" name="note"><Input.TextArea rows={2} placeholder="特殊要求等..." /></Form.Item>
        </Form>
      </Modal>

      <Modal title={<span className="text-lg font-bold text-walnut-800 flex items-center gap-2"><Clock className="w-5 h-5 text-gold-500" />预约详情</span>} open={!!da} onCancel={() => setDa(null)} destroyOnClose footer={[<Button key="x" onClick={() => setDa(null)}>关闭</Button>, da?.status === 'confirmed' && <Space key="a"><Button danger icon={<Ban className="w-4 h-4" />} onClick={() => da && hS(da.id, 'cancelled')}>取消预约</Button><Button danger icon={<XCircle className="w-4 h-4" />} onClick={() => da && hS(da.id, 'no_show')}>标记爽约</Button><Button type="primary" icon={<CheckCircle2 className="w-4 h-4" />} className="!bg-green-500 hover:!bg-green-600 !border-none" onClick={() => da && hS(da.id, 'completed')}>标记完成</Button></Space>]}>
        {da && <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-walnut-50"><span className="text-walnut-600">状态</span><Tag color={da.status === 'completed' ? 'green' : da.status === 'no_show' ? 'red' : da.status === 'cancelled' ? 'default' : 'gold'}>{ST[da.status]}</Tag></div>
          <div className="grid grid-cols-2 gap-3 text-sm">{[['客户姓名', da.customerName], ['联系电话', da.customerPhone], ['日期', da.date], ['时段', `${da.startTime} - ${da.endTime}`], ['理发师', barbers.find(b => b.id === da.barberId)?.name || '-'], ['服务项目', da.serviceType]].map(([k, v]) => <div key={k} className="p-3 rounded-lg bg-walnut-50"><div className="text-walnut-500 mb-1">{k}</div><div className="font-semibold text-walnut-800">{v}</div></div>)}</div>
          {da.note && <div className="p-3 rounded-lg bg-gold-50 border border-gold-200"><div className="text-walnut-500 mb-1 text-sm">备注</div><div className="text-walnut-800">{da.note}</div></div>}
        </div>}
      </Modal>
    </div>
  );
}
