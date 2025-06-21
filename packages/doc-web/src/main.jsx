import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext';
import router from '@/router';
import './styles/global.less';

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </UserProvider>,
);
