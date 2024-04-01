import styled from '@emotion/styled';
import { DayDetailJobItem } from '../../../../preload/dataType';
import { Box, Typography } from '@mui/material';
import { WorkTimeGraph } from './WorkTimeGraph';

export const JobItem: React.FC<DayDetailJobItem> = (props) => {
  const { jobName, workTimeSum, restTimeSum, graph } = props;

  return (
    <Wrapper>
      <Typography variant="h2">おしごと: {jobName}</Typography>
      <WorkTimeGraph {...graph} />
      <div>
        <Typography>勤務時間:{workTimeSum}</Typography>
        <Typography>休憩時間:{restTimeSum}</Typography>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled(Box)`
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
