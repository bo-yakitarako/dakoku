import styled from '@emotion/styled';
import { EventContentArg } from '@fullcalendar/core';
import { Circle } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { calendarLoadingAtom, monthWorkTimesAtom } from '../../modules/store';

export const DateTooltip: React.FC<EventContentArg> = (arg) => {
  const { start } = arg.event;
  const workTimes = useRecoilValue(monthWorkTimesAtom);
  const setLoading = useSetRecoilState(calendarLoadingAtom);
  const restTimeText = workTimes[start!.getDate()]?.restTime ?? '';
  const d = dayjs(start);
  const timeText = d.hour() === 0 ? d.format('m分s秒') : d.format('H時間m分');

  const onClick = () => {
    setLoading(true);
    window.api.openDayDetail(d.year(), d.month() + 1, d.date(), false);
  };

  return (
    <ColoredTooltip title={`休憩時間: ${restTimeText}`} arrow>
      <Container onClick={onClick}>
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
  &:hover {
    cursor: pointer;
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
