import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import localeJa from '@fullcalendar/core/locales/ja';
import styled from '@emotion/styled';
import { Box, Button, ButtonGroup, CircularProgress, Typography } from '@mui/material';
import { DateTooltip } from './DateTooltip';
import { useCalendarMove } from './hooks/useCalendarMove';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import dayjs from 'dayjs';
import { currentJobAtom } from '../../modules/store';
import { DayCellContent } from './DayCellContent';

export const Calendar: React.FC = () => {
  const { ref, currentMonth, calendarEvents, workTimeSum, move, loading, holidays, holidayGrids } =
    useCalendarMove();
  const currentJob = useRecoilValue(currentJobAtom);

  useEffect(() => {
    if (currentJob !== null) {
      document.title = `dakoku - カレンダー: ${currentJob.name}`;
    }
  }, [currentJob]);

  return (
    <Wrapper>
      <MonthTitle variant="h2">{currentMonth}</MonthTitle>
      <Options>
        <ButtonGroup variant="outlined">
          <Button onClick={move.prevYear}>
            <KeyboardDoubleArrowLeft />
          </Button>
          <Button onClick={move.prev}>
            <KeyboardArrowLeft />
          </Button>
        </ButtonGroup>
        <Typography>{workTimeSum}</Typography>
        <ButtonGroup variant="outlined">
          <Button onClick={move.next}>
            <KeyboardArrowRight />
          </Button>
          <Button onClick={move.nextYear}>
            <KeyboardDoubleArrowRight />
          </Button>
        </ButtonGroup>
      </Options>
      <CustomFullCalendar
        holidays={holidays.map(({ day }) => day)}
        holidayGrids={holidayGrids}
        loading={String(loading) as 'true' | 'false'}
      >
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          locale={localeJa}
          headerToolbar={false}
          dayHeaders
          events={calendarEvents}
          eventContent={(arg) => <DateTooltip {...arg} />}
          dayCellContent={(arg) => <DayCellContent {...arg} />}
        />
        {loading && (
          <LoadingWrapper>
            <CircularProgress size={80} />
          </LoadingWrapper>
        )}
      </CustomFullCalendar>
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

type CalendarProps = {
  holidays: number[];
  holidayGrids: { row: number; column: number }[];
  loading: 'true' | 'false';
};

const CustomFullCalendar = styled.div<CalendarProps>`
  position: relative;
  width: 100%;
  height: fit-content;

  ${({ loading, holidays }) =>
    loading === 'true'
      ? `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 1;
    }
    ${
      holidays.length === 0
        ? `
      .fc-day-today {
        background-color: transparent !important;
      }
    `
        : ''
    }
  `
      : ''}

  ${({ loading, holidays }) =>
    loading === 'false' || holidays.length > 0
      ? `
    .fc-day-sat {
      background-color: rgba(0, 0, 255, 0.1);
      .fc-col-header-cell-cushion,
      .fc-daygrid-day-number {
        color: #ddf;
      }
    }

    .fc-day-sun {
      background-color: rgba(255, 0, 0, 0.1);
      .fc-col-header-cell-cushion,
      .fc-daygrid-day-number {
        color: #fdd;
      }
    }
  `
      : ''}

  .fc-scrollgrid-sync-table {
    ${({ holidayGrids }) =>
      holidayGrids
        .map(
          ({ row, column }) => `
      tr:nth-of-type(${row}) td:nth-of-type(${column}) {
        background-color: rgba(255, 0, 0, 0.1);
        .fc-col-header-cell-cushion,
        .fc-daygrid-day-number {
          color: #fdd;
        }
      }
    `,
        )
        .join('')}

    .fc-daygrid-day-frame {
      min-height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      .fc-daygrid-day-top {
        position: absolute;
        top: 0;
        width: 100%;
      }
    }

    .fc-daygrid-day-number {
      width: 100%;
    }
  }

  ${({ holidays, loading }) => {
    if (loading === 'true' && holidays.length === 0) {
      return '';
    }
    const today = dayjs();
    const day = today.day();
    let color = '';
    if (day === 0 || holidays.includes(today.date())) {
      color = '#fcc';
    }
    if (day === 6) {
      color = '#ccf';
    }
    if (color === '') {
      return '';
    }
    return `
      .fc-day-today {
        background-color: var(--fc-today-bg-color);
        .fc-daygrid-day-number {
          color: ${color};
        }
      }
    `;
  }}
  .fc-day-other.fc-day-today {
    background-color: transparent;
  }
  .fc-day-otther.fc-day-today.fc-day-sat {
    background-color: rgba(0, 0, 255, 0.1);
  }
  .fc-day-other.fc-day-today.fc-day-sun {
    background-color: rgba(255, 0, 0, 0.1);
  }
  .fc-day-other {
    * {
      display: none;
    }
  }
`;

const LoadingWrapper = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
`;
