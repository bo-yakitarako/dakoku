import ReactDOM from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClient } from '@tanstack/react-query';
import { QueryClientAtomProvider } from 'jotai-tanstack-query/react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { AuthApp } from './components/AuthApp';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <JotaiProvider>
    <QueryClientAtomProvider client={queryClient}>
      <AuthApp />
    </QueryClientAtomProvider>
  </JotaiProvider>,
);
