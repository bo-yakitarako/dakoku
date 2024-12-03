import styled from '@emotion/styled';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useJobSelect } from './hooks/useJobSelect';
import { useRecoilValue } from 'recoil';
import { canOpenCalendarAtom } from '../../modules/store';

export const JobSelectBox: React.FC = () => {
  const isOpenCalendar = !useRecoilValue(canOpenCalendarAtom);
  const { jobs, jobIdValue, onChange } = useJobSelect();
  return (
    <Wrapper>
      <InputLabel id="job-select-label">おしごと選択</InputLabel>
      <Select
        labelId="job-select-label"
        id="job-select"
        label="おしごと選択"
        value={jobIdValue}
        onChange={onChange}
        disabled={isOpenCalendar}
      >
        {jobs.map(({ jobId, name }) => (
          <MenuItem key={jobId} value={jobId}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </Wrapper>
  );
};

const Wrapper = styled(FormControl)`
  position: absolute;
  top: 16px;
  right: 16px;
  min-width: 150px;
`;
