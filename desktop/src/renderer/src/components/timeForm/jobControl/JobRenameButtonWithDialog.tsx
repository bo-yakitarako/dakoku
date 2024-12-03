import { DriveFileRenameOutline } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useRenameJob } from './hooks/useRenameJob';

export const JobRenameButtonWithDialog: React.FC = () => {
  const { isOpen, canOpen, toggleDialog, submit, loading, error, props, jobName } = useRenameJob();

  return (
    <>
      <IconButton color="inherit" size="large" onClick={toggleDialog} disabled={!canOpen}>
        <DriveFileRenameOutline />
      </IconButton>
      <Dialog open={isOpen} onClose={toggleDialog} fullWidth>
        <form onSubmit={submit}>
          <DialogTitle>「{jobName}」はやめよう</DialogTitle>
          <DialogContent>
            <TextField
              error={error.hasError}
              helperText={error.message}
              autoFocus
              margin="dense"
              label="別の名前にして"
              fullWidth
              variant="standard"
              defaultValue={jobName}
              {...props}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={toggleDialog}>やめる</Button>
            <LoadingButton type="submit" loading={loading}>
              変更
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
