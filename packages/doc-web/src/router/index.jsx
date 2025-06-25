import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Folder from '@/pages/Folder';
import DocEditor from '@/pages/DocEditor';
import RecentDocs from '@/pages/RecentDocs';
import Collaboration from '@/pages/Collaboration';
import HistoryVersion from '@/pages/HistoryVersion';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Welcome from '@/pages/Welcome';
import LayoutComponent from '@/components/layout/layout';
import EditorDemo from '@/pages/EditorDemo';
// import AuthGuard from '@/components/AuthGuard';

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
        path: 'recent-docs',
        element: <RecentDocs />,
      },
      {
        path: 'folder',
        element: <Folder />,
      },
      {
        path: 'collaboration',
        element: <Collaboration />,
      },
      {
        path: 'doc-editor',
        element: <DocEditor />,
      },
      {
        path: 'doc-editor/:id',
        element: <DocEditor />,
      },
      {
        path: 'history-version/:id',
        element: <HistoryVersion />,
      },
      {
        path: '/test',
        element: <EditorDemo />,
      },
    ],
  },
]);

export { router };
export default router;
