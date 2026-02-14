import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider as JotaiProvider } from 'jotai';
import { Calendar } from './calendar/Calendar';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const CalendarApp: React.FC = () => {
  return (
    <JotaiProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Calendar />
      </ThemeProvider>
    </JotaiProvider>
  );
};
