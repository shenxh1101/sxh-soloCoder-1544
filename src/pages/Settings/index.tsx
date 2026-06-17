import { useState } from 'react';
import {
  Tabs, Card, Form, Input, InputNumber, TimePicker, Checkbox, Button,
  Space, Switch, Table, Select, ColorPicker, Row, Col, Tag, Popconfirm, message,
} from 'antd';
import { Plus, Trash2, Edit2, Save, Scissors } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { Barber, RechargeRule, ExchangeItem } from '@/types';

const WEEKDAYS = ['周一','周二','周三','周四','周五','周六','周日'].map((l,i)=>({label:l,value:i===6?'0':String(i+1)}));
const AVATAR_OPTIONS = ['💈','✂️','🧔','👨‍🦱','👩‍🦰','💇','🪮','✨'];
const ICON_OPTIONS = ['💇','🧴','✨','🪮','🎁','💎','🌟','🎀','💈','✂️'];
const GOLD_COLORS = ['#D4AF37','#B8941F','#F4D03F','#C9A227','#E5C100','#DAA520','#CFB53B','#BDB76B','#8D6E63','#5D4037'];
const GOLD_BTN = '!bg-gradient-to-r !from-gold-500 !to-gold-600 !border-0';
const RND_CARD = '!rounded-2xl !border-walnut-100';
const GOLD_TAG = '!border-0 !bg-gold-100 !text-gold-700';

const BarberCard = ({ barber }: { barber: Barber }) => {
  const [form] = Form.useForm();
  const updateBarber = useAppStore((s) => s.updateBarber);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      updateBarber(barber.id, {
        name: v.name, avatar: v.avatar, colorTag: v.colorTag,
        workStartTime: v.workTime[0].format('HH:mm'),
        workEndTime: v.workTime[1].format('HH:mm'),
        workDays: v.workDays,
      });
      setEditing(false);
      message.success(`${barber.name} 信息已更新`);
    } catch { message.error('请检查表单填写'); }
  };

  return (
    <Card className={`${RND_CARD} shadow-sm hover:shadow-gold transition-all`} styles={{ body: { padding: 24 } }}
      title={<div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${barber.colorTag}20`, border: `2px solid ${barber.colorTag}` }}>{barber.avatar}</div>
        <div>
          <div className="font-serif font-bold text-lg text-walnut-800">{barber.name}</div>
          <Tag color="gold" className={`${GOLD_TAG} !mt-1`}>
            {barber.workDays.length === 7 ? '全勤' : `每周${barber.workDays.length}天`}
          </Tag>
        </div>
      </div>}
      extra={editing ? (
        <Button type="primary" icon={<Save size={16} />} onClick={handleSave} className={GOLD_BTN}>保存</Button>
      ) : (
        <Button icon={<Edit2 size={16} />} onClick={() => {
          form.setFieldsValue({
            name: barber.name, avatar: barber.avatar, colorTag: barber.colorTag,
            workTime: [dayjs(barber.workStartTime,'HH:mm'), dayjs(barber.workEndTime,'HH:mm')],
            workDays: barber.workDays,
          });
          setEditing(true);
        }} className="!border-gold-400 !text-gold-600 hover:!bg-gold-50">编辑</Button>
      )}
    >
      <Form form={form} layout="vertical" disabled={!editing} initialValues={{ workDays: barber.workDays }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input className="!rounded-lg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="头像" name="avatar" rules={[{ required: true }]}>
              <Select options={AVATAR_OPTIONS.map(e=>({label:e,value:e}))} className="!rounded-lg" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="颜色标签" name="colorTag" rules={[{ required: true }]}>
              <ColorPicker format="hex" presets={[{label:'金色系',colors:GOLD_COLORS}]}
                showText={(color) => <span className="text-walnut-600">{color.toHexString()}</span>}
                className="!w-full !h-10 !rounded-lg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="上下班时间" name="workTime" rules={[{ required: true }]}>
              <TimePicker.RangePicker format="HH:mm" className="!w-full !rounded-lg" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="工作日" name="workDays" rules={[{ required: true, message: '请选择工作日' }]}>
          <Checkbox.Group options={WEEKDAYS.map(w=>({label:w.label,value:w.value}))} className="!flex !flex-wrap !gap-2" />
        </Form.Item>
      </Form>
    </Card>
  );
};

const RechargeRulesTab = () => {
  const rules = useAppStore((s) => s.rechargeRules);
  const { addRechargeRule, updateRechargeRule, removeRechargeRule } = useAppStore();
  const [form] = Form.useForm();

  const handleAdd = async () => {
    try {
      const v = await form.validateFields();
      addRechargeRule({ ...v, isActive: true });
      form.resetFields();
      message.success('充值规则已添加');
    } catch { message.error('请检查金额填写'); }
  };

  const cols = [
    { title: '充值金额', dataIndex: 'rechargeAmount', render: (v:number)=>(<span className="font-bold text-walnut-800">¥{v}</span>) },
    { title: '赠送金额', dataIndex: 'bonusAmount', render: (v:number)=>(<Tag color="gold" className={GOLD_TAG}>+¥{v}</Tag>) },
    { title: '优惠力度', render: (_:unknown,r:RechargeRule)=>(<span className="text-mocha">赠送 {((r.bonusAmount/r.rechargeAmount)*100).toFixed(0)}%</span>) },
    { title: '启用状态', dataIndex: 'isActive', render: (v:boolean,r:RechargeRule)=>(<Switch checked={v} onChange={c=>updateRechargeRule(r.id,{isActive:c})} />) },
    { title: '操作', render: (_:unknown,r:RechargeRule)=>(<Popconfirm title="确定删除此规则？" onConfirm={()=>removeRechargeRule(r.id)}>
      <Button type="text" danger icon={<Trash2 size={16} />} /></Popconfirm>) },
  ];

  return (
    <Space direction="vertical" size={24} className="w-full">
      <Card className={RND_CARD} styles={{ body: { padding: 24 } }}
        title={<span className="font-serif font-bold text-walnut-800">新增充值规则</span>}>
        <Form form={form} layout="inline" className="!flex !items-end">
          <Form.Item label="充值金额" name="rechargeAmount"
            rules={[{required:true,message:'必填'},{type:'number',min:1,message:'>0'}]}>
            <InputNumber min={1} addonBefore="¥" className="!w-40 !rounded-lg" />
          </Form.Item>
          <Form.Item label="赠送金额" name="bonusAmount"
            rules={[{required:true},{type:'number',min:0,message:'≥0'}]}>
            <InputNumber min={0} addonBefore="¥" className="!w-40 !rounded-lg" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd} className={GOLD_BTN}>添加规则</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card className={RND_CARD} styles={{ body: { padding: 0 } }}>
        <Table dataSource={rules} columns={cols} rowKey="id" pagination={false} />
      </Card>
    </Space>
  );
};

const PointsRulesTab = () => {
  const pr = useAppStore((s) => s.pointsRule);
  const { updatePointsRule, addExchangeItem, removeExchangeItem } = useAppStore();
  const [form] = Form.useForm();

  const handleAdd = async () => {
    try {
      const v = await form.validateFields();
      addExchangeItem(v);
      form.resetFields();
      message.success('兑换项目已添加');
    } catch { message.error('请检查填写内容'); }
  };

  const cols = [
    { title: '图标', dataIndex: 'icon', render: (v:string)=>(<span className="text-2xl">{v}</span>), width: 80 },
    { title: '项目名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', render: (v:string)=>(<Tag color={v==='service'?'gold':'default'} className="!border-0">
      {v==='service'?'服务':'礼品'}</Tag>) },
    { title: '所需积分', dataIndex: 'pointsRequired', render: (v:number)=>(<span className="font-bold text-gold-600">{v}</span>) },
    { title: '操作', render: (_:unknown,r:ExchangeItem)=>(<Popconfirm title="确定删除此项目？" onConfirm={()=>removeExchangeItem(r.id)}>
      <Button type="text" danger icon={<Trash2 size={16} />} /></Popconfirm>) },
  ];

  return (
    <Space direction="vertical" size={24} className="w-full">
      <Card className={RND_CARD} styles={{ body: { padding: 24 } }}
        title={<span className="font-serif font-bold text-walnut-800">积分规则</span>}>
        <Form layout="vertical" initialValues={pr} onValuesChange={v=>updatePointsRule(v)}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="每元积分数" name="pointsPerYuan">
                <InputNumber min={1} max={10} className="!w-full !rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="有效期规则" name="expireRule">
                <Select className="!rounded-lg" onChange={v=>updatePointsRule({expireRule:v})}
                  options={[{label:'每年年底清零',value:'yearly'},{label:'自定义月数后过期',value:'custom'}]} />
              </Form.Item>
            </Col>
          </Row>
          {pr.expireRule==='custom' && (
            <Form.Item label="过期月数" name="expireMonths" extra="积分获得后多少个月过期">
              <InputNumber min={1} max={36} addonAfter="个月" className="!w-48 !rounded-lg" />
            </Form.Item>
          )}
        </Form>
      </Card>
      <Card className={RND_CARD} styles={{ body: { padding: 24 } }}
        title={<span className="font-serif font-bold text-walnut-800">新增兑换项目</span>}>
        <Form form={form} layout="inline" className="!flex !flex-wrap !gap-2 !items-end">
          <Form.Item label="名称" name="name" rules={[{required:true}]}>
            <Input className="!rounded-lg" placeholder="项目名称" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{required:true}]}>
            <Select className="!w-28 !rounded-lg" options={[{label:'服务',value:'service'},{label:'礼品',value:'gift'}]} />
          </Form.Item>
          <Form.Item label="积分" name="pointsRequired" rules={[{required:true,min:1}]}>
            <InputNumber min={1} className="!w-28 !rounded-lg" />
          </Form.Item>
          <Form.Item label="图标" name="icon" rules={[{required:true}]}>
            <Select className="!w-24 !rounded-lg" options={ICON_OPTIONS.map(e=>({label:e,value:e}))} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd} className={GOLD_BTN}>添加</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card className={RND_CARD} styles={{ body: { padding: 0 } }}>
        <Table dataSource={pr.exchangeItems} columns={cols} rowKey="id" pagination={false} />
      </Card>
    </Space>
  );
};

const Settings = () => {
  const barbers = useAppStore((s) => s.barbers);
  const items = [
    { key: 'barbers', label: <span className="flex items-center gap-2"><Scissors size={16}/>理发师信息</span>,
      children: <Row gutter={24}>{barbers.map(b=>(<Col xs={24} lg={12} key={b.id}><BarberCard barber={b}/></Col>))}</Row> },
    { key: 'recharge', label: <span className="flex items-center gap-2"><span>💰</span>充值规则配置</span>,
      children: <RechargeRulesTab /> },
    { key: 'points', label: <span className="flex items-center gap-2"><span>⭐</span>积分规则设置</span>,
      children: <PointsRulesTab /> },
  ];
  return (
    <div className="settings-tabs">
      <Tabs
        items={items}
        size="large"
        className="custom-tabs"
        style={{
          '--tab-border-bottom': '2px solid rgba(212,175,55,0.15)',
          '--ink-bar-bg': 'linear-gradient(90deg, #D4AF37, #B8941F)',
        } as React.CSSProperties}
      />
      <style>{`
        .custom-tabs .ant-tabs-nav { border-bottom: 2px solid rgba(212,175,55,0.15); margin-bottom: 28px; }
        .custom-tabs .ant-tabs-ink-bar { background: linear-gradient(90deg, #D4AF37, #B8941F); height: 3px; border-radius: 2px; }
        .custom-tabs .ant-tabs-tab { padding: 12px 24px; }
        .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #3E2723; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Settings;
