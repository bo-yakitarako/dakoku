import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RecoilRoot } from 'recoil';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const CalendarApp: React.FC = () => {
  return (
    <RecoilRoot>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        ｵﾊﾖｳ、ｵﾆｲﾁｬﾝ
      </ThemeProvider>
    </RecoilRoot>
  );
};
