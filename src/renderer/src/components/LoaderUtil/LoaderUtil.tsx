import { Button, Dialog, LinearProgress, Typography, useTheme } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import HerbalifeLogo from '../../assets/HerbalifeFullLogo.png';
import { Box } from '@mui/system';
import { RESTART_STATUS } from '../../../../shared/restartStatus';

function LoaderUtil(): JSX.Element {
  const [progress, setProgress] = useState<number>(0);
  const theme = useTheme();
  const [restartUpdate, setRestartUpdate] = useState<string>('');
  const restartApp = async (): Promise<void> => {
    await window.electron.restartAppUtils.restartApp();
  };
  useEffect(() => {
    const handleProgressUpdate = (progress: number, message: string): void => {
      setProgress(progress);
      setRestartUpdate(message);
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
          {progress >= 0 && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <Box width="100%" display="flex" flexDirection="row" alignItems="center" gap={2}>
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

                {(restartUpdate.includes(RESTART_STATUS.Retrying) ||
                  restartUpdate.includes(RESTART_STATUS.WebsiteToLoad)) && (
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '1rem', color: 'red', marginTop: '2rem' }}
                  >
                    {restartUpdate}
                  </Typography>
                )}
              </Box>
            </>
          )}
          {progress === -1 && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'red' }}
                >
                  {restartUpdate}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    restartApp();
                  }}
                >
                  Try Again
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
export default LoaderUtil;
