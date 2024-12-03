import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { Time } from './Time';
import { Box, Button, IconButton } from '@mui/material';
import { CalendarMonth, Computer, Devices, Home, LocalCafe } from '@mui/icons-material';
import { useTime } from './hooks/useTime';
import { useOpenCalendar } from './hooks/useOpenCalendar';
import { JobSelectBox } from './JobSelectBox';
import { JobControl } from './jobControl/JobControl';
import { useRecoilValue } from 'recoil';
import { currentJobAtom } from '../../modules/store';

export const TimeForm: React.FC = () => {
  const { workStatus, count, start, pause, stop } = useTime();
  const { canOpen, openCalendar } = useOpenCalendar();
  const currentJob = useRecoilValue(currentJobAtom);

  useEffect(() => {
    if (currentJob != null) {
      document.title = `dakoku: ${currentJob.name}`;
    }
  }, [currentJob]);

  return (
    <Wrapper>
      <CalendarButton color="info" onClick={openCalendar} disabled={!canOpen}>
        <CalendarMonth />
      </CalendarButton>
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
      <Buttons>
        {workStatus === 'workOff' && (
          <ActionButton
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<Computer />}
            onClick={start}
          >
            出勤
          </ActionButton>
        )}
        {workStatus === 'working' && (
          <>
            <ActionButton
              variant="outlined"
              color="success"
              size="large"
              startIcon={<LocalCafe />}
              onClick={pause}
            >
              休憩
            </ActionButton>
            <ActionButton
              variant="outlined"
              color="warning"
              size="large"
              startIcon={<Home />}
              onClick={stop}
            >
              退勤
            </ActionButton>
          </>
        )}
        {workStatus === 'resting' && (
          <>
            <ActionButton
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<Devices />}
              onClick={start}
            >
              再開
            </ActionButton>
            <ActionButton
              variant="outlined"
              color="warning"
              size="large"
              startIcon={<Home />}
              onClick={stop}
            >
              退勤
            </ActionButton>
          </>
        )}
      </Buttons>
    </Wrapper>
  );
};

const Wrapper = styled.main`
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
`;

const Buttons = styled(Box)`
  display: flex;
  gap: 16px;
`;

const ActionButton = styled(Button)`
  width: 120px;
`;

const CalendarButton = styled(IconButton)`
  position: absolute;
  top: 8px;
  left: 8px;
`;
