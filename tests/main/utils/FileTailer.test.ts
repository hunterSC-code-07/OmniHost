import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileTailer } from '@main/utils/FileTailer';
import fs from 'fs';

vi.mock('fs');

describe('FileTailer', () => {
  let onLineMock: any;
  let onLogMock: any;
  let tailer: FileTailer;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    onLineMock = vi.fn();
    onLogMock = vi.fn();
    
    tailer = new FileTailer({
      directory: 'dummy-dir',
      filePattern: /\.log$/,
      startTime: 0,
      onLine: onLineMock,
      onLog: onLogMock,
    });
  });

  afterEach(() => {
    tailer.stop();
    vi.useRealTimers();
  });

  it('should initialize and create directory if not exists', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mkdirSpy = vi.spyOn(fs, 'mkdirSync');
    
    tailer.start();
    
    expect(mkdirSpy).toHaveBeenCalledWith('dummy-dir', { recursive: true });
    expect(onLogMock).toHaveBeenCalledWith(expect.stringContaining('Initializing'));
  });

  it('should read lines correctly and buffer partial lines', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    // Trigger attach
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['test.log'] as any);
    vi.spyOn(fs, 'statSync').mockReturnValue({ mtimeMs: 100 } as any);
    vi.spyOn(fs, 'openSync').mockReturnValue(99);
    
    let simulatedFileSize = 0;
    vi.spyOn(fs, 'fstatSync').mockImplementation(() => ({ size: simulatedFileSize } as any));
    
    const readSyncSpy = vi.spyOn(fs, 'readSync').mockImplementation((fd: any, buffer: any, offset: any, length: any, position: any) => {
      // Simulate writing "Hello\nWorld" in two chunks
      if (simulatedFileSize === 5) {
        buffer.write('Hello', 0, length, 'utf8');
      } else if (simulatedFileSize === 12) {
        buffer.write('\nWorld\n', 0, length, 'utf8');
      }
      return length;
    });

    tailer.start();
    vi.advanceTimersByTime(2000); // Trigger pollForFile -> attach

    // Simulate first file change: "Hello" (no newline)
    simulatedFileSize = 5;
    vi.advanceTimersByTime(500); // Trigger setInterval readNewLogs
    expect(onLineMock).not.toHaveBeenCalled(); // No newline yet

    // Simulate second file change: "\nWorld\n"
    simulatedFileSize = 12;
    vi.advanceTimersByTime(500); // Trigger setInterval readNewLogs
    
    expect(onLineMock).toHaveBeenCalledTimes(2);
    expect(onLineMock).toHaveBeenNthCalledWith(1, 'Hello');
    expect(onLineMock).toHaveBeenNthCalledWith(2, 'World');
  });
});
