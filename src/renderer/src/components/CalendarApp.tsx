import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RecoilRoot } from 'recoil';
import { Calendar } from './calendar/Calendar';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const CalendarApp: React.FC = () => {
  return (
    <RecoilRoot>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Calendar />
      </ThemeProvider>
    </RecoilRoot>
  );
};
