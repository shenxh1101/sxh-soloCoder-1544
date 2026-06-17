import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { router } from '@/router';

dayjs.locale('zh-cn');

const themeConfig = {
  token: {
    colorPrimary: '#D4AF37',
    colorInfo: '#D4AF37',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorBgBase: '#FFF8E7',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorTextBase: '#3E2723',
    colorTextSecondary: '#8D6E63',
    colorBorder: '#EDE6DF',
    colorBorderSecondary: '#FAF7F5',
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: '"Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif',
    boxShadowTertiary: '0 4px 14px 0 rgba(212, 175, 55, 0.15)',
  },
  components: {
    Button: {
      colorPrimary: '#3E2723',
      colorPrimaryHover: '#5D3A1A',
      colorPrimaryActive: '#2C1810',
      algorithm: true,
    },
    Card: {
      colorBgContainer: '#FFFFFF',
      boxShadowTertiary: '0 4px 16px rgba(62, 39, 35, 0.06)',
    },
    Table: {
      headerBg: '#FAF7F5',
      headerColor: '#3E2723',
      headerSortActiveBg: '#FFF3C4',
      rowHoverBg: '#FFFBEB',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(212, 175, 55, 0.18)',
      darkItemSelectedColor: '#D4AF37',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
    },
    Input: {
      colorBorder: '#D4C3B0',
      hoverBorderColor: '#B89A7D',
      activeBorderColor: '#D4AF37',
      activeShadow: '0 0 0 3px rgba(212, 175, 55, 0.15)',
    },
    Select: {
      colorBorder: '#D4C3B0',
      hoverBorderColor: '#B89A7D',
      activeBorderColor: '#D4AF37',
      activeShadow: '0 0 0 3px rgba(212, 175, 55, 0.15)',
    },
    Modal: {
      titleColor: '#3E2723',
    },
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
