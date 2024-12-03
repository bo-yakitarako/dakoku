import styled from '@emotion/styled';
import { GraphItem } from './GraphItem';
import { Typography } from '@mui/material';
import { DayDetailGraph } from '../../../../preload/dataType';

export const WorkTimeGraph: React.FC<DayDetailGraph> = ({ startHour, endHour, items }) => {
  return (
    <Graph>
      <Typography color="text.secondary">{startHour}</Typography>
      {items.map((item) => (
        <GraphItem key={item.time.start} {...item} />
      ))}
      <Typography color="text.secondary">{endHour}</Typography>
    </Graph>
  );
};

const Graph = styled.div`
  position: relative;
  width: 80vw;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  height: 60px;
  margin: 24px 0 28px;

  > p {
    position: absolute;
    font-size: 12px;
    bottom: 0;
    z-index: -1;
    &:first-of-type {
      left: 0;
    }
    &:last-of-type {
      right: 0;
    }
  }
`;
