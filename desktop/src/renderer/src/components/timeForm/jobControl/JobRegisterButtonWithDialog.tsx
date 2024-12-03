import { AddCircleOutline } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import { useJobRegister } from './hooks/useJobRegister';
import { LoadingButton } from '@mui/lab';

export const JobRegisterButtonWithDialog: React.FC = () => {
  const { isOpen, canOpen, toggleDialog, showCancel, submit, loading, error, props } =
    useJobRegister();

  return (
    <>
      <IconButton color="inherit" size="large" onClick={toggleDialog} disabled={!canOpen}>
        <AddCircleOutline />
      </IconButton>
      <Dialog open={isOpen} onClose={toggleDialog} fullWidth>
        <form onSubmit={submit}>
          <DialogTitle>おしごとを追加</DialogTitle>
          <DialogContent>
            <TextField
              error={error.hasError}
              helperText={error.message}
              autoFocus
              margin="dense"
              label="おしごと名を入力"
              fullWidth
              variant="standard"
              defaultValue=""
              {...props}
            />
          </DialogContent>
          <DialogActions>
            {showCancel && <Button onClick={toggleDialog}>やめる</Button>}
            <LoadingButton type="submit" loading={loading}>
              追加
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
