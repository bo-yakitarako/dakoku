import ReactDOM from 'react-dom/client';
import { Box, CssBaseline, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Warning } from '@mui/icons-material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: '4px',
        }}
      >
        <Warning color="warning" />
        <Typography>サーバーと接続できないのじゃ</Typography>
      </Box>
    </ThemeProvider>
  );
}
