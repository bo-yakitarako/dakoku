import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { WorkStatus } from '../../preload/dataType';

type StorageKey = 'count' | 'times';

declare global {
  interface Storage {
    workStatus?: WorkStatus;
    works?: string;
    getItem(key: StorageKey): string | null;
    setItem(key: StorageKey, value: string): void;
    removeItem(key: StorageKey): void;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
