import { Box, CircularProgress, Typography } from '@mui/material';
import { blue, yellow } from '@mui/material/colors';
import { DayDetailData } from '../../../../preload/dataType';
import { useEffect, useState } from 'react';
import { WorkTimeGraph } from './WorkTimeGraph';
import { hexToRgb } from './GraphItem';

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
      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100vh',
          padding: '16px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const { date, name, workTimeSum, restTimeSum, graph } = dayDetailData;
  const { year, month, day } = date;
  const dateString = `${year}年${month}月${day}日`;
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        padding: '16px',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100vw',
          '& > h1': {
            position: 'relative',
            fontSize: '24px',
            padding: '16px 16px 0',
          },
          '& > div': {
            position: 'relative',
            display: 'flex',
            gap: '16px',
            paddingLeft: '16px',
            '& > p': {
              fontSize: '14px',
              color: 'text.secondary',
            },
          },
        }}
      >
        <Typography variant="h1">{dateString}</Typography>
      </Box>
      <Box
        sx={{
          width: 'fit-content',
          '& > h2': { fontSize: '18px' },
          '& > div': {
            position: 'relative',
            display: 'flex',
            gap: '12px',
            zIndex: 1,
            '& > p': {
              fontSize: '14px',
              color: 'text.secondary',
            },
          },
        }}
      >
        <Typography variant="h2">{name}</Typography>
        <WorkTimeGraph {...graph} />
        <div>
          <Typography>勤務時間:{workTimeSum}</Typography>
          <Typography>休憩時間:{restTimeSum}</Typography>
        </div>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          right: 0,
          bottom: 0,
          padding: '16px',
          gap: '20px',
        }}
      >
        <Box
          component="div"
          sx={{
            position: 'relative',
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            '& > p': {
              fontSize: '12px',
              color: 'text.secondary',
            },
            '& > span': {
              width: '60px',
              height: '12px',
              borderTop: `solid 2px ${blue[200]}`,
              background: `rgba(${hexToRgb(blue[200])}, 0.4)`,
            },
          }}
        >
          <Typography>勤務時間:</Typography>
          <span />
        </Box>
        <Box
          component="div"
          sx={{
            position: 'relative',
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            '& > p': {
              fontSize: '12px',
              color: 'text.secondary',
            },
            '& > span': {
              width: '60px',
              height: '12px',
              borderTop: `solid 2px ${yellow[200]}`,
              background: `rgba(${hexToRgb(yellow[200])}, 0.4)`,
            },
          }}
        >
          <Typography>休憩時間:</Typography>
          <span />
        </Box>
      </Box>
    </Box>
  );
};
