import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RecoilRoot } from 'recoil';

declare global {
  let timpo: string;
}

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const DayDetailApp: React.FC = () => {
  return (
    <RecoilRoot>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <div>うんちすげえええ</div>
      </ThemeProvider>
    </RecoilRoot>
  );
};
