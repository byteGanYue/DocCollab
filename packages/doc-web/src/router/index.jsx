import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Folder from '@/pages/Folder';
import Login from '@/pages/Login';
import AuthGuard from '@/components/AuthGuard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGuard />,
  },
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/folder',
    element: <Folder />,
  },
  {
    path: '/login',
    element: <Login />,
  },
]);

export { router };
export default router;
