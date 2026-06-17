import { Layout as AntLayout, Menu, Avatar, Badge, Tag } from 'antd';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Coins,
  BarChart3,
  Settings,
  Bell,
  Scissors,
} from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store';

const { Header, Sider, Content } = AntLayout;

const menuItems = [
  { key: '/', icon: <LayoutDashboard size={18} />, label: '首页仪表盘' },
  { key: '/appointments', icon: <CalendarDays size={18} />, label: '预约管理' },
  { key: '/members', icon: <Users size={18} />, label: '会员管理' },
  { key: '/points', icon: <Coins size={18} />, label: '积分管理' },
  { key: '/statistics', icon: <BarChart3 size={18} />, label: '数据统计' },
  { key: '/settings', icon: <Settings size={18} />, label: '系统设置' },
];

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const expiringMembers = useAppStore((s) => s.getExpiringPointsMembers);
  const alertCount = expiringMembers().length;

  return (
    <AntLayout style={{ minHeight: '100vh' }} className="bg-ivory">
      <Sider
        width={240}
        style={{
          background: 'linear-gradient(180deg, #3E2723 0%, #2C1810 100%)',
          boxShadow: '4px 0 20px rgba(62, 39, 35, 0.15)',
        }}
      >
        <div className="h-20 flex items-center justify-center gap-3 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-2xl shadow-gold-lg">
            <Scissors size={24} className="text-walnut-800" />
          </div>
          <div>
            <div className="font-serif font-bold text-xl text-gold-400 leading-tight">理·享</div>
            <div className="text-xs text-white/60 tracking-widest">BARBER SHOP</div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            paddingTop: 16,
          }}
          theme="dark"
          items={menuItems.map((item) => ({
            key: item.key,
            icon: <span className="text-gold-400">{item.icon}</span>,
            label: <span className="text-white/90 font-medium">{item.label}</span>,
            className: 'my-1 mx-3 rounded-lg hover:bg-white/5',
          }))}
        />

        <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-white/50 mb-2">今日预约</div>
          <div className="text-2xl font-serif font-bold text-gold-400">
            {
              useAppStore
                .getState()
                .appointments.filter((a) => a.date === new Date().toISOString().slice(0, 10)).length
            }{' '}
            <span className="text-sm font-normal text-white/60">单</span>
          </div>
        </div>
      </Sider>

      <AntLayout className="bg-transparent">
        <Header
          className="!h-20 !px-8 flex items-center justify-between"
          style={{
            background: 'rgba(255, 248, 231, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(62, 39, 35, 0.08)',
          }}
        >
          <div>
            <h1 className="font-serif font-bold text-2xl text-walnut-800 m-0">
              {menuItems.find((m) => m.key === location.pathname)?.label || '首页'}
            </h1>
            <p className="text-sm text-mocha/70 m-0 mt-1">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/points')}
              className="relative w-11 h-11 rounded-full bg-white border border-walnut-100 shadow-sm hover:shadow-gold transition-all flex items-center justify-center"
            >
              <Bell size={20} className="text-walnut-600" />
              {alertCount > 0 && (
                <Badge
                  count={alertCount}
                  className="absolute -top-1 -right-1 !bg-gold-500"
                  color="#D4AF37"
                  style={{ color: '#3E2723', fontWeight: 700 }}
                />
              )}
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-walnut-100">
              <Avatar
                size={44}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #B8941F)',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                店
              </Avatar>
              <div>
                <div className="font-semibold text-walnut-800 leading-tight">管理员</div>
                <Tag color="gold" className="!mt-1 !border-0 !bg-gold-100 !text-gold-700">
                  在线
                </Tag>
              </div>
            </div>
          </div>
        </Header>

        <Content className="p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
