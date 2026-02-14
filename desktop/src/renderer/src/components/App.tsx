import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider as JotaiProvider } from 'jotai';
import { TimeForm } from './timeForm/TimeForm';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const App: React.FC = () => {
  return (
    <JotaiProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <TimeForm />
      </ThemeProvider>
    </JotaiProvider>
  );
};
