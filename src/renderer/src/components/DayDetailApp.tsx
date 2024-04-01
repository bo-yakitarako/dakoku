import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DayDetail } from './dayDetail/DayDetail';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const DayDetailApp: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <DayDetail />
    </ThemeProvider>
  );
};
