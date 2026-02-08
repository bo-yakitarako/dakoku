import { GraphItem } from './GraphItem';
import { Box, Typography } from '@mui/material';
import { DayDetailGraph } from '../../../../preload/dataType';

export const WorkTimeGraph: React.FC<DayDetailGraph> = ({ startHour, endHour, items }) => {
  return (
    <Box
      component="div"
      sx={{
        position: 'relative',
        width: '80vw',
        borderBottom: '1px solid #eee',
        boxSizing: 'border-box',
        height: '60px',
        margin: '24px 0 28px',
        '& > p': {
          position: 'absolute',
          fontSize: '12px',
          bottom: 0,
          zIndex: -1,
        },
        '& > p:first-of-type': {
          left: 0,
        },
        '& > p:last-of-type': {
          right: 0,
        },
      }}
    >
      <Typography color="text.secondary">{startHour}</Typography>
      {items.map((item) => (
        <GraphItem key={item.time.start} {...item} />
      ))}
      <Typography color="text.secondary">{endHour}</Typography>
    </Box>
  );
};
