import styled from '@emotion/styled';
import { Tooltip, TooltipProps, Typography, tooltipClasses } from '@mui/material';
import { blue, yellow } from '@mui/material/colors';
import { DayDetailGraphItem } from '../../../../preload/dataType';

export const GraphItem: React.FC<DayDetailGraphItem> = (props) => {
  const { time, durationTime, first, last, jobName, isAll, ...remained } = props;
  const jobTooltipTitle = isAll ? jobName : null;
  return (
    <JobNameTooltip title={jobTooltipTitle} placement="top" enterDelay={0} leaveDelay={0}>
      <ItemWrapper {...remained}>
        {props.canDisplayTime ? (
          <div>
            <Typography>{durationTime}</Typography>
            <Typography>{time.start}</Typography>
            <Typography>{time.end}</Typography>
            {first && <Typography className="first">{time.start}</Typography>}
            {last && <Typography className="last">{time.end}</Typography>}
          </div>
        ) : (
          <TimeTooltip
            title={`${time.start} - ${time.end}`}
            placement="bottom"
            enterDelay={0}
            leaveDelay={0}
            slotProps={{
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
          </TimeTooltip>
        )}
      </ItemWrapper>
    </JobNameTooltip>
  );
};

type StyleProps = {
  type: 'work' | 'rest';
  location: {
    start: string; // xx.xxx%
    length: string; // zz.zzz%
  };
  canDisplayTime: boolean;
};

const ItemWrapper = styled.div<StyleProps>`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ location }) => location.length};
  height: 100%;
  left: ${({ location }) => location.start};
  bottom: 0;
  border-top: solid 2px ${({ type }) => (type === 'work' ? blue[200] : yellow[200])};
  background: rgba(${({ type }) => hexToRgb(type === 'work' ? blue[200] : yellow[200])}, 0.4);
  transition: background 0.2s;
  z-index: 1;

  > div {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    > p {
      color: transparent;
      transition: color 0.2s;
      font-size: 12px;
      white-space: nowrap;
      ${({ canDisplayTime, theme }) =>
        canDisplayTime
          ? `
        &:not(:first-of-type) {
          position: absolute;
          bottom: -20px;
        }
        &:nth-of-type(2) {
          left: 0;
          transform: translateX(-50%);
        }
        &:nth-of-type(3) {
          right: 0;
          transform: translateX(50%);
        }
        &:nth-of-type(n + 4) {
          top: -20px;
          color: ${theme.palette.text.primary};
          &.first {
            left: 0;
            transform: translateX(-50%);
          }
          &.last {
            right: 0;
            transform: translateX(50%);
          }
        }
      `
          : `
        &:not(:first-of-type) {
          position: absolute;
          top: -20px;
          color: ${theme.palette.text.primary};
        }
        &.first {
          left: 0;
          transform: translateX(-50%);
        }
        &.last {
          right: 0;
          transform: translateX(50%);
        }
      `}
    }
  }

  &:hover {
    cursor: default;
    background: rgba(${({ type }) => hexToRgb(type === 'work' ? blue[200] : yellow[200])}, 0.55);
    > div {
      > p {
        color: ${({ theme }) => theme.palette.text.primary};
      }
    }
  }
`;

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

const JobNameTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => {
  return {
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.success.dark,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.success.dark,
      fontSize: 11.5,
    },
  };
});

const TimeTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(() => {
  return {
    [`& .${tooltipClasses.arrow}`]: {
      display: 'none',
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: 'transparent',
      fontSize: 11.5,
    },
  };
});
