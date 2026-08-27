import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MinecraftCommandBuilder } from '@main/minecraft/MinecraftCommandBuilder';
import fs from 'fs';
import { JavaManager } from '@main/adapters/JavaManager';

vi.mock('fs');

describe('MinecraftCommandBuilder', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(JavaManager, 'getJavaPath').mockResolvedValue('C:\\java-mock-path\\bin\\java.exe');
  });

  describe('parseRunBat', () => {
    it('should correctly parse a standard Forge run.bat', () => {
      const batContent = `
@echo off
REM Test script
java @user_jvm_args.txt @libraries/net/minecraftforge/forge/1.20.4-49.2.8/win_args.txt %*
pause
      `;
      vi.spyOn(fs, 'readFileSync').mockReturnValue(batContent);

      const result = MinecraftCommandBuilder.parseRunBat('dummy-path/run.bat');
      expect(result).not.toBeNull();
      expect(result).toEqual([
        '@user_jvm_args.txt',
        '@libraries/net/minecraftforge/forge/1.20.4-49.2.8/win_args.txt'
      ]);
    });

    it('should ignore set commands and extract args correctly with quotes', () => {
      const batContent = `
set JAVA_OPTS="-Xmx4G"
"C:\\Program Files\\Java\\bin\\java.exe" @user_jvm_args.txt "some arg"
pause
      `;
      vi.spyOn(fs, 'readFileSync').mockReturnValue(batContent);

      const result = MinecraftCommandBuilder.parseRunBat('dummy-path/run.bat');
      expect(result).not.toBeNull();
      expect(result).toEqual([
        '@user_jvm_args.txt',
        'some arg'
      ]);
    });
  });

  describe('buildCommand', () => {
    it('should build a basic command for a vanilla server', async () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
        if (p.endsWith('omnihost.json')) return false;
        if (p.endsWith('run.bat')) return false;
        if (p.endsWith('start.bat')) return false;
        if (p.endsWith('server.jar')) return true;
        return false;
      });
      vi.spyOn(fs, 'readdirSync').mockReturnValue([]);

      const result = await MinecraftCommandBuilder.buildCommand('dummy-dir', vi.fn());
      
      expect(result).not.toBeNull();
      expect(result!.targetExecutable).toBe('C:\\java-mock-path\\bin\\java.exe');
      expect(result!.targetArgs).toContain('-jar');
      expect(result!.targetArgs).toContain('server.jar');
      expect(result!.targetArgs).toContain('nogui');
      expect(result!.targetArgs).toContain('-Xmx4G'); // Default max ram
    });
  });
});
