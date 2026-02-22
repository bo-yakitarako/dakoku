import { Box } from '@mui/material';
import { JobRegisterButtonWithDialog } from '@/renderer/src/components/timeForm/jobControl/JobRegisterButtonWithDialog';
import { JobRenameButtonWithDialog } from '@/renderer/src/components/timeForm/jobControl/JobRenameButtonWithDialog';
import { JobDeleteButtonWithDialog } from '@/renderer/src/components/timeForm/jobControl/JobDeleteButtonWithDialog';

export const JobControl: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', position: 'absolute', bottom: '8px', right: '8px', gap: '4px' }}>
      <JobRegisterButtonWithDialog />
      <JobRenameButtonWithDialog />
      <JobDeleteButtonWithDialog />
    </Box>
  );
};
