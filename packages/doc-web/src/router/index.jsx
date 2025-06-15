import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Folder from '@/pages/Folder';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/folder',
    element: <Folder />,
  },
]);

export { router };
export default router;
