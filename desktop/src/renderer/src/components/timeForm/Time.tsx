import { Box, Typography } from '@mui/material';
import { convertTime } from '../../../../commonUtility/timeConverter';

type Props = {
  children: React.ReactNode;
  label?: string;
  focused?: boolean;
};

export const Time: React.FC<Props> = ({ children, label = '', focused = false }) => {
  const milliSecondsTime = Number(children);
  if (Number.isNaN(milliSecondsTime)) {
    return <Typography>00:00:00</Typography>;
  }
  const timeText = convertTime(milliSecondsTime);
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
        {timeText}
      </Typography>
    </Box>
  );
};
