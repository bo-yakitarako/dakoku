import styled from '@emotion/styled';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DayDetailData } from '../../../../preload/dataType';
import { useEffect, useState } from 'react';
import { JobItem } from './JobItem';

export const DayDetail: React.FC = () => {
  const [dayDetailData, setDayDetailData] = useState<DayDetailData | null>(null);

  useEffect(() => {
    // @ts-ignore
    window.ipcRenderer.on('data', (_, data: dayDetailData) => {
      setDayDetailData(data);
      const { year, month, day } = data.date;
      const dateString = `${year}年${month}月${day}日`;
      const titleName = data.jobSum ? '全おしごと' : data.jobItems[0].jobName;
      document.title = `dakoku - 時間詳細: ${dateString} ${titleName}`;
    });
  }, []);

  if (dayDetailData === null) {
    return (
      <Wrapper>
        <CircularProgress />
      </Wrapper>
    );
  }

  const { date, jobItems, jobSum } = dayDetailData;
  const { year, month, day } = date;
  const dateString = `${year}年${month}月${day}日`;
  return (
    <Wrapper>
      <Header>
        <Typography variant="h1">{dateString}</Typography>
        {jobSum !== undefined && (
          <div>
            <Typography>勤務時間合計: {jobSum.workTimeSum}</Typography>
            <Typography>休憩時間合計: {jobSum.restTimeSum}</Typography>
          </div>
        )}
      </Header>
      <JobsWrapper>
        {jobItems.map((jobItem) => (
          <JobItem key={jobItem.jobId} {...jobItem} />
        ))}
      </JobsWrapper>
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

const JobsWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: fit-content;
`;
