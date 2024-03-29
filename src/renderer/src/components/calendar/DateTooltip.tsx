import styled from '@emotion/styled';
import { EventContentArg } from '@fullcalendar/core';
import { Circle } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { useRecoilValue } from 'recoil';
import { monthWorkTimesAtom } from '../../modules/store';

export const DateTooltip: React.FC<EventContentArg> = (arg) => {
  const { start } = arg.event;
  const workTimes = useRecoilValue(monthWorkTimesAtom);
  const restTimeText = workTimes[start!.getDate()]?.restTime ?? '';
  const d = dayjs(start);
  const timeText = d.hour() === 0 ? d.format('m分s秒') : d.format('H時間m分');
  return (
    <ColoredTooltip title={`休憩時間: ${restTimeText}`} arrow>
      <Container>
        <Circle color="primary" />
        <Typography>{timeText}</Typography>
      </Container>
    </ColoredTooltip>
  );
};

const Container = styled(Box)`
  display: flex;
  width: 100%;
  gap: 4px;
  justify-content: center;
  align-items: center;
  > svg {
    font-size: 12px;
  }
  > p {
    font-size: 14px;
  }
`;

const ColoredTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.success.dark,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.success.dark,
  },
}));
