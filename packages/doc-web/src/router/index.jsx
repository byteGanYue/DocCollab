import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Folder from '@/pages/Folder';
import DocEditor from '@/pages/DocEditor';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Welcome from '@/pages/Welcome';
import LayoutComponent from '@/components/layout/layout';
import AuthGuard from '@/components/AuthGuard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Welcome />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <LayoutComponent />,
    children: [
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'folder',
        element: <Folder />,
      },
      {
        path: 'doc-editor',
        element: <DocEditor />,
      },
      {
        path: 'doc-editor/:id',
        element: <DocEditor />,
      },
    ],
  },
]);

export { router };
export default router;
