import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import DocEditor from '@/pages/DocEditor';
import RecentDocs from '@/pages/RecentDocs';
import Collaboration from '@/pages/Collaboration';
import HistoryVersion from '@/pages/HistoryVersion';
import ArchiveManagement from '@/pages/ArchiveManagement';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Welcome from '@/pages/Welcome';
import LayoutComponent from '@/components/layout/layout';
import EditorDemo from '@/pages/EditorDemo';
import Folder from '@/pages/Folder';
import VersionCompare from '../pages/VersionCompare';
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
        path: 'folderListPage/:id',
        element: <Folder />,
      },
      {
        path: 'history-version/:id',
        element: <HistoryVersion />,
      },
      {
        path: 'archive-management/:id',
        element: <ArchiveManagement />,
      },
      {
        path: '/test',
        element: <EditorDemo />,
      },
      {
        path: '/version-compare/:documentId',
        element: <VersionCompare />,
      },
    ],
  },
]);

export { router };
export default router;
