import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Appointments from '@/pages/Appointments';
import Members from '@/pages/Members';
import Points from '@/pages/Points';
import Statistics from '@/pages/Statistics';
import Settings from '@/pages/Settings';
import Review from '@/pages/Review';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'appointments', element: <Appointments /> },
      { path: 'members', element: <Members /> },
      { path: 'points', element: <Points /> },
      { path: 'statistics', element: <Statistics /> },
      { path: 'review', element: <Review /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
