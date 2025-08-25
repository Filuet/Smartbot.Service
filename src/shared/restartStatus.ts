export const enum RESTART_STATUS {
  Retrying = 'Retrying...',
  WebsiteToLoad = 'Waiting for website to load',
  WebsiteDidNotLoad = 'Website did not load after restart',
  RestartSuccessful = 'Application restarted successfully',
  RestartFailed = 'Restart failed',
  FailedToLaunch = 'Failed to launch a process',
  RestartStarted = 'Preparing to restart...',
  ProcessesKilled = 'Processes killed',
  ProcessLaunched = 'Process launched'
}
