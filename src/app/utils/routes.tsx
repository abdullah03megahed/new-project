import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Home } from '../pages/Home';
import { Houses } from '../pages/Houses';
import { HouseDetail } from '../pages/HouseDetail';
import { Profile } from '../pages/Profile';
import { Dashboard } from '../pages/Dashboard';
import { AddHouse } from '../pages/AddHouse';
import { Login } from '../pages/Login';
import { SignUp } from '../pages/SignUp';
import { Admin } from '../pages/Admin';
import { Matching } from '../pages/Matching';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { CompleteProfile } from '../pages/CompleteProfile';
import { Subscription } from '../pages/Subscription';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'houses', Component: Houses },
      { path: 'house/:id', Component: HouseDetail },
      { path: 'profile', Component: Profile },
      { path: 'dashboard', Component: Dashboard },
      { path: 'add-house', Component: AddHouse },
      { path: 'admin', Component: Admin },
      { path: 'login', Component: Login },
      { path: 'signup', Component: SignUp },
      { path: 'matching', Component: Matching },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'reset-password', Component: ResetPassword },
      { path: 'complete-profile', Component: CompleteProfile },
      { path: 'subscription', Component: Subscription },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
