import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import localeJa from '@fullcalendar/core/locales/ja';
import styled from '@emotion/styled';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { DateTooltip } from './DateTooltip';
import { useCalendarMove } from './hooks/useCalendarMove';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material';

export const Calendar: React.FC = () => {
  const { ref, currentMonth, calendarEvents, workTimeSum, move, loading } = useCalendarMove();
  return (
    <Wrapper>
      <MonthTitle variant="h2">{currentMonth}</MonthTitle>
      <Options>
        <ButtonGroup variant="outlined" disabled={loading}>
          <Button onClick={move.prevYear}>
            <KeyboardDoubleArrowLeft />
          </Button>
          <Button onClick={move.prev}>
            <KeyboardArrowLeft />
          </Button>
        </ButtonGroup>
        <Typography>{workTimeSum}</Typography>
        <ButtonGroup variant="outlined" disabled={loading}>
          <Button onClick={move.next}>
            <KeyboardArrowRight />
          </Button>
          <Button onClick={move.nextYear}>
            <KeyboardDoubleArrowRight />
          </Button>
        </ButtonGroup>
      </Options>
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale={localeJa}
        headerToolbar={false}
        dayHeaders
        events={calendarEvents}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }}
        eventContent={(arg) => <DateTooltip arg={arg} />}
      />
    </Wrapper>
  );
};

const Wrapper = styled(Box)`
  padding: 16px;
`;

const MonthTitle = styled(Typography)`
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

const Options = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  > p {
    font-size: 16px;
  }
`;
