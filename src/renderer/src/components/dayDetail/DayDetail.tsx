import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DayDetailData } from '../../../../preload/dataType';
import { useEffect, useState } from 'react';
import { WorkTimeGraph } from './WorkTimeGraph';

export const DayDetail: React.FC = () => {
  const [dayDetailData, setDayDetailData] = useState<DayDetailData | null>(null);

  useEffect(() => {
    // @ts-ignore
    window.ipcRenderer.on('data', (_, data: DayDetailData) => {
      setDayDetailData(data);
      const { year, month, day } = data.date;
      const dateString = `${year}年${month}月${day}日`;
      document.title = `dakoku - 時間詳細: ${dateString} ${data.name}`;
    });
  }, []);

  if (dayDetailData === null) {
    return (
      <Wrapper>
        <CircularProgress />
      </Wrapper>
    );
  }

  const { date, name, workTimeSum, restTimeSum, graph } = dayDetailData;
  const { year, month, day } = date;
  const dateString = `${year}年${month}月${day}日`;
  return (
    <Wrapper>
      <Header>
        <Typography variant="h1">{dateString}</Typography>
      </Header>
      <GraphWrapper>
        <Typography variant="h2">{name}</Typography>
        <WorkTimeGraph {...graph} />
        <div>
          <Typography>勤務時間:{workTimeSum}</Typography>
          <Typography>休憩時間:{restTimeSum}</Typography>
        </div>
      </GraphWrapper>
    </Wrapper>
  );
};

const Wrapper = styled(Box)`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  padding: 16px;
`;

const Header = styled(Box)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  > h1 {
    position: relative;
    font-size: 24px;
    padding: 16px 16px 0;
  }
  > div {
    position: relative;
    display: flex;
    gap: 16px;
    padding-left: 16px;
    > p {
      font-size: 14px;
      color: ${({ theme }) => theme.palette.text.secondary};
    }
  }
`;

const GraphWrapper = styled(Box)`
  width: fit-content;

  > h2 {
    font-size: 20px;
  }

  > div {
    position: relative;
    display: flex;
    gap: 12px;
    z-index: 1;
    > p {
      font-size: 14px;
      color: ${({ theme }) => theme.palette.text.secondary};
    }
  }
`;
