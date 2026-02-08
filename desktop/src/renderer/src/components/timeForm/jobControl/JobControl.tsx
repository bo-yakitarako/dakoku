import { Box } from '@mui/material';
import { JobRegisterButtonWithDialog } from './JobRegisterButtonWithDialog';
import { JobRenameButtonWithDialog } from './JobRenameButtonWithDialog';
import { JobDeleteButtonWithDialog } from './JobDeleteButtonWithDialog';

export const JobControl: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', position: 'absolute', bottom: '8px', right: '8px', gap: '4px' }}>
      <JobRegisterButtonWithDialog />
      <JobRenameButtonWithDialog />
      <JobDeleteButtonWithDialog />
    </Box>
  );
};
