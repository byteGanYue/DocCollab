import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Folder from '../pages/Folder';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/folder',
    element: <Folder />,
  },
]);
