import { Box, Tooltip, Typography, tooltipClasses } from '@mui/material';
import { blue, yellow } from '@mui/material/colors';
import { DayDetailGraphItem } from '../../../../preload/dataType';

export const GraphItem: React.FC<DayDetailGraphItem> = (props) => {
  const { time, durationTime, first, last, jobName, isAll } = props;
  const jobTooltipTitle = isAll ? jobName : null;
  const baseColor = props.type === 'work' ? blue[200] : yellow[200];
  const baseRgb = hexToRgb(baseColor);
  return (
    <Tooltip
      title={jobTooltipTitle}
      placement="top"
      enterDelay={0}
      leaveDelay={0}
      arrow
      slotProps={{
        tooltip: { sx: { backgroundColor: 'success.dark', fontSize: 11.5 } },
        arrow: { sx: { color: 'success.dark' } },
      }}
    >
      <Box
        component="div"
        sx={(theme) => ({
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: props.location.length,
          height: '100%',
          left: props.location.start,
          bottom: 0,
          borderTop: `solid 2px ${baseColor}`,
          background: `rgba(${baseRgb}, 0.4)`,
          transition: 'background 0.2s',
          zIndex: 1,
          '& > div': {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '& > p': {
              color: 'transparent',
              transition: 'color 0.2s',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              ...(props.canDisplayTime
                ? {
                    '&:not(:first-of-type)': {
                      position: 'absolute',
                      bottom: '-20px',
                    },
                    '&:nth-of-type(2)': {
                      left: 0,
                      transform: 'translateX(-50%)',
                    },
                    '&:nth-of-type(3)': {
                      right: 0,
                      transform: 'translateX(50%)',
                    },
                    '&:nth-of-type(n + 4)': {
                      top: '-20px',
                      color: theme.palette.text.primary,
                      '&.first': {
                        left: 0,
                        transform: 'translateX(-50%)',
                      },
                      '&.last': {
                        right: 0,
                        transform: 'translateX(50%)',
                      },
                    },
                  }
                : {
                    '&:not(:first-of-type)': {
                      position: 'absolute',
                      top: '-20px',
                      color: theme.palette.text.primary,
                    },
                    '&.first': {
                      left: 0,
                      transform: 'translateX(-50%)',
                    },
                    '&.last': {
                      right: 0,
                      transform: 'translateX(50%)',
                    },
                  }),
            },
          },
          '&:hover': {
            cursor: 'default',
            background: `rgba(${baseRgb}, 0.55)`,
            '& > div > p': {
              color: theme.palette.text.primary,
            },
          },
        })}
      >
        {props.canDisplayTime ? (
          <div>
            <Typography>{durationTime}</Typography>
            <Typography>{time.start}</Typography>
            <Typography>{time.end}</Typography>
            {first && <Typography className="first">{time.start}</Typography>}
            {last && <Typography className="last">{time.end}</Typography>}
          </div>
        ) : (
          <Tooltip
            title={`${time.start} - ${time.end}`}
            placement="bottom"
            enterDelay={0}
            leaveDelay={0}
            arrow
            slotProps={{
              tooltip: { sx: { backgroundColor: 'transparent', fontSize: 11.5 } },
              arrow: { sx: { display: 'none' } },
              popper: {
                sx: {
                  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                    {
                      marginTop: '0px',
                    },
                  [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]:
                    {
                      marginBottom: '0px',
                    },
                  [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]:
                    {
                      marginLeft: '0px',
                    },
                  [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]:
                    {
                      marginRight: '0px',
                    },
                },
              },
            }}
          >
            <div>
              <Typography>{durationTime}</Typography>
              {first && <Typography className="first">{time.start}</Typography>}
              {last && <Typography className="last">{time.end}</Typography>}
            </div>
          </Tooltip>
        )}
      </Box>
    </Tooltip>
  );
};

export const hexToRgb = (hex: string) => {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};
