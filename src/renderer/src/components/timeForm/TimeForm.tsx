import React from 'react';
import styled from '@emotion/styled';
import { Time } from './Time';
import { Box, Button } from '@mui/material';
import { Computer, Devices, Home, LocalCafe } from '@mui/icons-material';
import { useTime } from './hooks/useTime';

export const TimeForm: React.FC = () => {
  const { playStatus, workTime, pausedTime, start, pause, stop } = useTime();
  return (
    <Wrapper>
      {playStatus !== 'stopped' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: playStatus === 'playing' ? 'column-reverse' : 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Time label="勤務時間" focused={playStatus === 'playing'}>
            {workTime}
          </Time>
          <Time label="休憩時間" focused={playStatus === 'paused'}>
            {pausedTime}
          </Time>
        </Box>
      )}
      <Buttons>
        {playStatus === 'stopped' && (
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
        {playStatus === 'playing' && (
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
        {playStatus === 'paused' && (
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
