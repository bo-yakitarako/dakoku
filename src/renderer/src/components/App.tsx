import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TimeForm } from './timeForm/TimeForm';
import { RecoilRoot } from 'recoil';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const App: React.FC = () => {
  return (
    <RecoilRoot>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <TimeForm />
      </ThemeProvider>
    </RecoilRoot>
  );
};
