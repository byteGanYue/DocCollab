import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
console.log(router, 'rout');
createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />,
);
