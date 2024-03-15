import { Delete } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useDeleteJob } from './hooks/useDeleteJob';

export const JobDeleteButtonWithDialog: React.FC = () => {
  const { isOpen, toggleDialog, jobName, canOpen, deleteJob } = useDeleteJob();
  return (
    <>
      <IconButton color="error" size="large" onClick={toggleDialog} disabled={!canOpen}>
        <Delete />
      </IconButton>
      <Dialog open={isOpen} onClose={toggleDialog} fullWidth>
        <DialogTitle>「{jobName}」を消そう</DialogTitle>
        <DialogContent>もうこいつとはおしまいよ</DialogContent>
        <DialogActions>
          <Button onClick={toggleDialog}>やめる</Button>
          <LoadingButton loading={!canOpen} color="error" onClick={deleteJob}>
            一思いにやっちゃう
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
