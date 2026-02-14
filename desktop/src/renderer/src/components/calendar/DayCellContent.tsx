import { DayCellContentArg } from '@fullcalendar/core';
import { useAtomValue } from 'jotai';
import { holidaysAtom } from '../../modules/store';
import { Box, Typography } from '@mui/material';

export const DayCellContent: React.FC<DayCellContentArg> = ({ date, dayNumberText }) => {
  const holidays = useAtomValue(holidaysAtom);
  const holiday = holidays.find((holiday) => holiday.day === date.getDate());

  if (holiday === undefined) {
    return (
      <Typography align="right" fontSize="14px">
        {dayNumberText}
      </Typography>
    );
  }

  return (
    <Box display="flex" justifyContent="space-between">
      <Typography fontSize="11px" padding="2px">
        {holiday.name}
      </Typography>
      <Typography fontSize="14px">{dayNumberText}</Typography>
    </Box>
  );
};
