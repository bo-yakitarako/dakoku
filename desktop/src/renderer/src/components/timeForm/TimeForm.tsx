import React, { useEffect } from 'react';
import { Time } from './Time';
import { Box, Button, IconButton } from '@mui/material';
import { CalendarMonth, Computer, Devices, Home, LocalCafe } from '@mui/icons-material';
import { useTime } from './hooks/useTime';
import { useOpenCalendar } from './hooks/useOpenCalendar';
import { JobSelectBox } from './JobSelectBox';
import { JobControl } from './jobControl/JobControl';
import { useAtomValue } from 'jotai';
import { currentJobAtom } from '../../modules/store';

export const TimeForm: React.FC = () => {
  const { workStatus, count, isLoading, start, pause, stop } = useTime();
  const { canOpen, openCalendar } = useOpenCalendar();
  const currentJob = useAtomValue(currentJobAtom);

  useEffect(() => {
    if (currentJob != null) {
      document.title = `dakoku: ${currentJob.name}`;
    }
  }, [currentJob]);

  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
      }}
    >
      <IconButton
        color="info"
        onClick={openCalendar}
        disabled={!canOpen}
        sx={{ position: 'absolute', top: '8px', left: '8px' }}
      >
        <CalendarMonth />
      </IconButton>
      {workStatus === 'workOff' ? (
        <>
          <JobSelectBox />
          <JobControl />
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: workStatus === 'working' ? 'column-reverse' : 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Time label="勤務時間" focused={workStatus === 'working'}>
            {count.workTime}
          </Time>
          <Time label="休憩時間" focused={workStatus === 'resting'}>
            {count.restTime}
          </Time>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: '16px' }}>
        {workStatus === 'workOff' && (
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<Computer />}
            onClick={start}
            disabled={isLoading}
            sx={{ width: '120px' }}
          >
            出勤
          </Button>
        )}
        {workStatus === 'working' && (
          <>
            <Button
              variant="outlined"
              color="success"
              size="large"
              startIcon={<LocalCafe />}
              onClick={pause}
              disabled={isLoading}
              sx={{ width: '120px' }}
            >
              休憩
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="large"
              startIcon={<Home />}
              onClick={stop}
              disabled={isLoading}
              sx={{ width: '120px' }}
            >
              退勤
            </Button>
          </>
        )}
        {workStatus === 'resting' && (
          <>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<Devices />}
              onClick={start}
              disabled={isLoading}
              sx={{ width: '120px' }}
            >
              再開
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="large"
              startIcon={<Home />}
              onClick={stop}
              disabled={isLoading}
              sx={{ width: '120px' }}
            >
              退勤
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};
