import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '@resources/icon.png?asset';
import dayjs from 'dayjs';
import '@/main/env';
import { getWindowBounds, setWindowBounds } from '@/main/store';
import * as calendarApi from '@/main/api/calendarApi';
import * as dayDetailApi from '@/main/api/dayDetailApi';
import * as mainApi from '@/main/api/mainApi';
import { createCalendarWindow } from '@/main/calendar';
import { Job, JobData, TimeState, WorkStatus } from '@/preload/dataType';
import * as http from '@/main/http';

const apiOrigin = process.env.VITE_API_ORIGIN ?? 'http://localhost:8080';
let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let jobs: Job[] = [];
let currentJob: Job | null = null;
let todayWorksMap: Record<string, number[][]> = {};
const timeStateMap: Record<string, TimeState> = {};

const toRendererJobs = (data: unknown): Job[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(({ id, name }) => ({ jobId: `${id}`, name: `${name}` }));
};

const resolveCurrentJob = async (nextJobs: Job[]) => {
  const current = await mainApi.getCurrent();
  if (current && current.jobId) {
    const found = nextJobs.find((job) => job.jobId === current.jobId);
    if (found) {
      return found;
    }
  }
  if (currentJob && nextJobs.some((job) => job.jobId === currentJob?.jobId)) {
    return currentJob;
  }
  return nextJobs[0] ?? null;
};

const refreshJobs = async (): Promise<JobData> => {
  const serverJobs = await mainApi.getJobs();
  jobs = toRendererJobs(serverJobs);
  currentJob = await resolveCurrentJob(jobs);
  return { currentJob, jobs };
};

const getCurrentTimeState = (): TimeState => {
  if (!currentJob) {
    return { status: 'workOff', works: [] };
  }
  return timeStateMap[currentJob.jobId] ?? { status: 'workOff', works: [] };
};

const prepareMainBootstrap = async () => {
  const { currentJob: current, jobs: nextJobs } = await refreshJobs();
  todayWorksMap = await mainApi.getWorkTimes();
  const works = current ? (todayWorksMap[current.jobId] ?? []) : [];
  const timeState = getCurrentTimeState();
  return {
    currentJob: current,
    jobs: nextJobs,
    status: timeState.status,
    works,
  };
};

const collectMissingTimeEvents = (base: number[][], next: number[][]) => {
  const events: { index: number; actedAt: number }[] = [];
  for (let index = 0; index < next.length; index += 1) {
    const baseTimes = new Set((base[index] ?? []).map((time) => `${time}`));
    const nextTimes = next[index] ?? [];
    for (const actedAt of nextTimes) {
      if (!baseTimes.has(`${actedAt}`)) {
        events.push({ index, actedAt });
      }
    }
  }
  return events;
};

const syncWorksToServer = async (nextWorks: number[][], workStatus: WorkStatus) => {
  if (!currentJob) {
    return [];
  }

  const jobId = currentJob.jobId;
  const currentWorks = todayWorksMap[jobId] ?? [];
  const events = collectMissingTimeEvents(currentWorks, nextWorks);

  if (events.length === 0) {
    todayWorksMap[jobId] = nextWorks;
    return nextWorks;
  }

  let latestMap = todayWorksMap;
  for (const event of events) {
    latestMap = await mainApi.postTime({
      jobId,
      index: event.index,
      actedAt: event.actedAt,
      workStatus,
    });
  }

  todayWorksMap = latestMap;
  return todayWorksMap[jobId] ?? nextWorks;
};

const buildAuthWindowCsp = () => {
  const scriptSrc = is.dev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'";
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src 'self' ${apiOrigin} http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*`,
  ].join('; ');
};

const createAuthWindow = () => {
  if (authWindow) {
    authWindow.focus();
    return;
  }

  authWindow = new BrowserWindow({
    width: 480,
    height: 420,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  const authWindowCsp = buildAuthWindowCsp();
  authWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [authWindowCsp],
      },
    });
  });

  authWindow.on('ready-to-show', () => authWindow?.show());
  authWindow.on('closed', () => {
    authWindow = null;
  });

  const loadURL =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? `${process.env['ELECTRON_RENDERER_URL']}/auth.html`
      : `file://${join(__dirname, '../renderer/auth.html')}`;
  authWindow.loadURL(loadURL);
};

const createMainWindow = async () => {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  const windowBounds = getWindowBounds('main');
  mainWindow = new BrowserWindow({
    ...windowBounds,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      additionalArguments: [
        `--mainBootstrap=${encodeURIComponent(JSON.stringify(await prepareMainBootstrap()))}`,
      ],
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      setWindowBounds(mainWindow, 'main');
    }
    ipcMain.removeHandler('openCalendar');
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.handle('openCalendar', () => {
    const now = dayjs();
    return createCalendarWindow(
      mainWindow!,
      async () => {
        const year = now.year();
        const month = now.month() + 1;
        const checked = false;
        const { workTimeSum, dates } = await calendarApi.getMonthWorkTime(
          year,
          month,
          checked,
          currentJob?.jobId ?? null,
        );
        const holidays = await calendarApi.getHolidays(year, month);
        return { year, month, checked, workTimeSum, dates, holidays };
      },
      async (year, month, day, isAll) => {
        if (jobs.length === 0) {
          await refreshJobs();
        }
        return dayDetailApi.getDayDetailWindowData(year, month, day, isAll, jobs, currentJob);
      },
    );
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html`);
  } else {
    mainWindow.loadURL(`file://${join(__dirname, '../renderer/index.html')}`);
  }
};

const openInitialWindow = async () => {
  const refreshResult = await http.authRefresh();
  if (refreshResult.ok) {
    try {
      await createMainWindow();
      return;
    } catch (error) {
      console.error('[main] failed to open main window after refresh', error);
    }
  }
  createAuthWindow();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  void openInitialWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      void openInitialWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('initializeCurrentJob', async () => {
  const data = await refreshJobs();
  return data.currentJob;
});

ipcMain.handle('getJobs', async () => {
  const data = await refreshJobs();
  return data.jobs;
});

ipcMain.handle('registerJob', async (_event, jobName: string) => {
  jobs = toRendererJobs(await mainApi.registerJob(jobName));
  currentJob = await resolveCurrentJob(jobs);
  return { currentJob, jobs };
});

ipcMain.handle('changeCurrentJob', async (_event, jobId: string) => {
  if (jobs.length === 0) {
    await refreshJobs();
  }
  currentJob = jobs.find((job) => job.jobId === jobId) ?? currentJob;
  return currentJob;
});

ipcMain.handle('renameCurrentJob', async (_event, jobName: string) => {
  if (!currentJob) {
    return { currentJob, jobs };
  }
  jobs = toRendererJobs(await mainApi.editJob(currentJob.jobId, jobName));
  currentJob = jobs.find((job) => job.jobId === currentJob?.jobId) ?? null;
  return { currentJob, jobs };
});

ipcMain.handle('deleteCurrentJob', async () => {
  if (!currentJob) {
    return { currentJob, jobs };
  }
  jobs = toRendererJobs(await mainApi.deleteJob(currentJob.jobId));
  currentJob = await resolveCurrentJob(jobs);
  return { currentJob, jobs };
});

ipcMain.handle('setTimeState', async (_event, nextTimeState?: Partial<TimeState>) => {
  if (!currentJob) {
    return;
  }
  if (!nextTimeState) {
    delete timeStateMap[currentJob.jobId];
    return;
  }
  const current = timeStateMap[currentJob.jobId] ?? { status: 'workOff', works: [] };
  const nextStatus = nextTimeState.status ?? current.status;
  const nextWorks = nextTimeState.works ?? current.works;
  const syncedWorks = await syncWorksToServer(nextWorks, nextStatus);
  timeStateMap[currentJob.jobId] = {
    status: nextStatus,
    works: syncedWorks,
  };
});

ipcMain.handle('registerWorks', async (_event, works: number[][]) => {
  if (!currentJob) {
    return;
  }
  const status = timeStateMap[currentJob.jobId]?.status ?? 'workOff';
  const syncedWorks = await syncWorksToServer(works, status);
  todayWorksMap[currentJob.jobId] = syncedWorks;
  if (timeStateMap[currentJob.jobId]) {
    timeStateMap[currentJob.jobId].works = syncedWorks;
  }
});

ipcMain.handle('getTodayWorks', async () => {
  if (!currentJob) {
    return [];
  }
  if (!todayWorksMap[currentJob.jobId]) {
    todayWorksMap = await mainApi.getWorkTimes();
  }
  return todayWorksMap[currentJob.jobId] ?? [];
});

ipcMain.handle('getMonthWorkTime', async (_event, year: number, month: number, isAll: boolean) => {
  return calendarApi.getMonthWorkTime(year, month, isAll, currentJob?.jobId ?? null);
});

ipcMain.handle('getHolidays', async (_event, year: number, month: number) => {
  return calendarApi.getHolidays(year, month);
});

ipcMain.handle('authRegister', async (_event, email: string, password: string) => {
  return http.authRegister(email, password);
});

ipcMain.handle('authLogin', async (_event, email: string, password: string) => {
  const response = await http.authLogin(email, password);
  if (response.ok) {
    try {
      await createMainWindow();
      authWindow?.close();
    } catch (error) {
      console.error('[main] failed to open main window after login', error);
      return {
        ok: false,
        status: 500,
        data: { message: 'メインウィンドウの起動に失敗しました' },
      };
    }
  }
  return response;
});

ipcMain.handle('authRefresh', async () => {
  return http.authRefresh();
});

ipcMain.handle('authLogout', async () => {
  const response = await http.authLogout();
  if (response.ok) {
    mainWindow?.close();
    createAuthWindow();
  }
  return response;
});

ipcMain.handle('authResetPassword', async (_event, email: string) => {
  return http.authResetPassword(email);
});
