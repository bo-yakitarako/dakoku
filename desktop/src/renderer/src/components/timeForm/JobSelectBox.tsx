import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useJobSelect } from './hooks/useJobSelect';
import { useAtomValue } from 'jotai';
import { canOpenCalendarAtom } from '../../modules/store';

export const JobSelectBox: React.FC = () => {
  const isOpenCalendar = !useAtomValue(canOpenCalendarAtom);
  const { jobs, jobIdValue, onChange } = useJobSelect();
  return (
    <FormControl
      sx={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        minWidth: '150px',
      }}
    >
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
    </FormControl>
  );
};
