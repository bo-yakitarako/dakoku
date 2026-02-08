import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import localeJa from '@fullcalendar/core/locales/ja';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Switch,
  Typography,
} from '@mui/material';
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
  const {
    ref,
    currentMonth,
    calendarEvents,
    workTimeSum,
    move,
    loading,
    holidays,
    holidayGrids,
    checked,
    onChecked,
  } = useCalendarMove();
  const currentJob = useRecoilValue(currentJobAtom);

  const todayColorSx = (() => {
    if (loading && holidays.length === 0) {
      return {};
    }
    const today = dayjs();
    const day = today.day();
    let color = '';
    if (day === 0 || holidays.map(({ day }) => day).includes(today.date())) {
      color = '#fcc';
    }
    if (day === 6) {
      color = '#ccf';
    }
    if (color === '') {
      return {};
    }
    return {
      '& .fc-day-today': {
        backgroundColor: 'var(--fc-today-bg-color)',
        '& .fc-daygrid-day-number': {
          color,
        },
      },
    };
  })();

  const holidayGridSx = holidayGrids.reduce<Record<string, object>>((acc, { row, column }) => {
    acc[`& tr:nth-of-type(${row}) td:nth-of-type(${column})`] = {
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      '& .fc-col-header-cell-cushion, & .fc-daygrid-day-number': {
        color: '#fdd',
      },
    };
    return acc;
  }, {});

  const customFullCalendarSx = {
    position: 'relative',
    width: '100%',
    height: 'fit-content',
    ...(loading
      ? {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1,
          },
          ...(holidays.length === 0
            ? {
                '& .fc-day-today': {
                  backgroundColor: 'transparent !important',
                },
              }
            : {}),
        }
      : {}),
    ...(!loading || holidays.length > 0
      ? {
          '& .fc-day-sat': {
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            '& .fc-col-header-cell-cushion, & .fc-daygrid-day-number': {
              color: '#ddf',
            },
          },
          '& .fc-day-sun': {
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            '& .fc-col-header-cell-cushion, & .fc-daygrid-day-number': {
              color: '#fdd',
            },
          },
        }
      : {}),
    '& .fc-scrollgrid-sync-table': {
      ...holidayGridSx,
      '& .fc-daygrid-day-frame': {
        minHeight: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        '& .fc-daygrid-day-top': {
          position: 'absolute',
          top: 0,
          width: '100%',
        },
      },
      '& .fc-daygrid-day-number': {
        width: '100%',
      },
    },
    ...todayColorSx,
    '& .fc-day-other.fc-day-today': {
      backgroundColor: 'transparent',
    },
    '& .fc-day-otther.fc-day-today.fc-day-sat': {
      backgroundColor: 'rgba(0, 0, 255, 0.1)',
    },
    '& .fc-day-other.fc-day-today.fc-day-sun': {
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    '& .fc-day-other *': {
      display: 'none',
    },
  } as const;

  useEffect(() => {
    if (checked) {
      document.title = 'dakoku - カレンダー: おしごとぜんぶ';
      return;
    }
    if (currentJob !== null) {
      document.title = `dakoku - カレンダー: ${currentJob.name}`;
    }
  }, [currentJob, checked]);

  return (
    <Box sx={{ position: 'relative', padding: '16px' }}>
      <FormGroup row sx={{ position: 'absolute', top: '16px', right: '16px' }}>
        <FormControlLabel
          control={<Switch checked={checked} onChange={onChecked} />}
          label="おしごとぜんぶ"
          labelPlacement="start"
        />
      </FormGroup>
      <Typography
        variant="h2"
        sx={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}
      >
        {currentMonth}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          '& > p': { fontSize: '16px' },
        }}
      >
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
      </Box>
      <Box sx={customFullCalendarSx}>
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
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          >
            <CircularProgress size={80} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
