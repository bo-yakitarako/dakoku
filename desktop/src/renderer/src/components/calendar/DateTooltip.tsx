import { EventContentArg } from '@fullcalendar/core';
import { Circle } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { calendarAllCheckAtom, calendarLoadingAtom, monthWorkTimesAtom } from '../../modules/store';

export const DateTooltip: React.FC<EventContentArg> = (arg) => {
  const { start } = arg.event;
  const workTimes = useAtomValue(monthWorkTimesAtom);
  const setLoading = useSetAtom(calendarLoadingAtom);
  const isAll = useAtomValue(calendarAllCheckAtom);
  const restTimeText = workTimes[start!.getDate()]?.restTime ?? '';
  const d = dayjs(start);
  const timeText = d.hour() === 0 ? d.format('m分s秒') : d.format('H時間m分');

  const onClick = () => {
    setLoading(true);
    window.api.openDayDetail(d.year(), d.month() + 1, d.date(), isAll);
  };

  return (
    <Tooltip
      title={`休憩時間: ${restTimeText}`}
      arrow
      slotProps={{
        tooltip: { sx: { backgroundColor: 'success.dark' } },
        arrow: { sx: { color: 'success.dark' } },
      }}
    >
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          width: '100%',
          gap: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          '& > svg': { fontSize: '12px' },
          '& > p': { fontSize: '14px' },
          '&:hover': { cursor: 'pointer' },
        }}
      >
        <Circle color="primary" />
        <Typography>{timeText}</Typography>
      </Box>
    </Tooltip>
  );
};
