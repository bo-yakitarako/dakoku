import { Box, Typography } from '@mui/material';

type Props = {
  children: React.ReactNode;
  label?: string;
  focused?: boolean;
};

export const Time: React.FC<Props> = ({ children, label = '', focused = false }) => {
  const seconds = Math.floor(Number(children) / 1000);
  if (Number.isNaN(seconds)) {
    return <Typography>00:00:00</Typography>;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainedSeconds = seconds % 60;
  return (
    <Box>
      <Typography
        color="text.secondary"
        lineHeight={1}
        fontSize={`${focused ? 12 : 8}px`}
        sx={{
          transition: 'font-size 0.3s ease-in-out',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h3"
        fontSize={`${focused ? 48 : 20}px`}
        sx={{
          transition: 'font-size 0.3s ease-in-out',
        }}
      >
        {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(remainedSeconds)}
      </Typography>
    </Box>
  );
};

const zeroPad = (num: number) => num.toString().padStart(2, '0');
