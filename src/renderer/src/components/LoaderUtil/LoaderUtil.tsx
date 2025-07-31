import { Dialog, LinearProgress, Typography, useTheme } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import HerbalifeLogo from '../../assets/HerbalifeFullLogo.png';
import { Box } from '@mui/system';

function LoaderUtil(): JSX.Element {
  const [progress, setProgress] = useState<number>(0);
  const theme = useTheme();
  useEffect(() => {
    const handleProgressUpdate = (progress: number, message: string): void => {
      setProgress(progress);
      console.log(`Progress: ${progress}, Message: ${message}`);
    };

    window.electron.restartAppUtils.onProgressUpdate(handleProgressUpdate);

    return () => {
      window.electron.restartAppUtils.removeProgressListeners();
    };
  }, []);
  return (
    <Dialog
      open
      fullScreen
      sx={{
        '& .MuiDialog': {
          backgroundColor: '#ffff'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <Box component="img" src={HerbalifeLogo} alt="herbalife" />
        <Typography variant="body1" sx={{ fontSize: '2rem' }}>
          Please wait while we are restarting UI
        </Typography>
        <Box
          sx={{
            width: '70%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: '5rem'
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              '&.MuiLinearProgress-root': {
                width: '80%',
                height: '1.5rem',
                borderRadius: '0.5rem',
                color: theme.palette.primary.main
              },
              '& .MuiLinearProgress-bar': {
                borderRadius: '0.18rem'
              }
            }}
          />

          <Typography
            variant="body2"
            sx={{ fontSize: '1.1rem' }}
          >{`${Math.round(progress)}%`}</Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
export default LoaderUtil;
