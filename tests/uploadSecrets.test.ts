import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  checkRepoAccess,
  deleteSecrets,
  uploadSecrets,
} from '../src/uploadSecrets';

vi.mock('node:child_process');
vi.mock('node:fs');

describe('uploadSecrets', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  describe('checkRepoAccess', () => {
    test('should return exists: true and canPush: true when repo exists and user has push access', () => {
      const mockOutput = JSON.stringify({ permissions: { push: true } });
      vi.mocked(execSync).mockReturnValue(mockOutput);

      const result = checkRepoAccess('owner/repo');

      expect(execSync).toHaveBeenCalledWith('gh api repos/owner/repo', {
        encoding: 'utf-8',
      });
      expect(result).toEqual({ exists: true, canPush: true });
    });

    test('should return exists: true and canPush: false when repo exists and user does not have push access', () => {
      const mockOutput = JSON.stringify({ permissions: { push: false } });
      vi.mocked(execSync).mockReturnValue(mockOutput);

      const result = checkRepoAccess('owner/repo');

      expect(result).toEqual({ exists: true, canPush: false });
    });

    test('should return exists: false and canPush: false when repo does not exist', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error();
      });

      const result = checkRepoAccess('owner/repo');

      expect(result).toEqual({ exists: false, canPush: false });
    });
  });

  describe('uploadSecrets', () => {
    test('should upload secrets from .clasprc.json', () => {
      const clasprcData = {
        token: {
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          scope: 'test_scope',
          token_type: 'Bearer',
          id_token: 'test_id_token',
          expiry_date: 1234567890,
        },
        oauth2ClientSettings: {
          clientId: 'test_client_id',
          clientSecret: 'test_client_secret',
          redirectUri: 'http://localhost',
        },
        isLocalCreds: true,
      };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(clasprcData));

      uploadSecrets('owner/repo');

      expect(execSync).toHaveBeenCalledTimes(10);
      expect(execSync).toHaveBeenCalledWith(
        'gh secret set CLASP_ACCESS_TOKEN --repo owner/repo --app actions',
        expect.any(Object),
      );
    });

    test('should exit if .clasprc.json does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => uploadSecrets('owner/repo')).toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteSecrets', () => {
    test('should delete all clasp secrets', () => {
      deleteSecrets('owner/repo');

      expect(execSync).toHaveBeenCalledTimes(10);
      expect(execSync).toHaveBeenCalledWith(
        'gh secret delete CLASP_ACCESS_TOKEN --repo owner/repo --app actions',
        expect.any(Object),
      );
    });

    test('should warn if deleting a secret fails', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      vi.mocked(execSync).mockImplementation((command) => {
        if (command.includes('CLASP_ACCESS_TOKEN')) {
          throw new Error();
        }
        return Buffer.from('');
      });

      deleteSecrets('owner/repo');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Secret CLASP_ACCESS_TOKEN の削除に失敗しました（存在しない可能性あり）',
      );
      expect(execSync).toHaveBeenCalledTimes(10);
    });
  });

  describe('path construction', () => {
    const ENV_BACKUP = { ...process.env };
    const PLATFORM_BACKUP = process.platform;

    afterEach(() => {
      process.env = { ...ENV_BACKUP };
      Object.defineProperty(process, 'platform', {
        value: PLATFORM_BACKUP,
      });
    });

    test('should use HOME on linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });
      process.env.HOME = '/fake/home';
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const _mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => uploadSecrets('owner/repo')).toThrow('process.exit called');
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join('/fake/home', '.clasprc.json'),
      );
    });

    test('should use current directory if no user home is set', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });
      delete process.env.HOME;
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const _mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => uploadSecrets('owner/repo')).toThrow('process.exit called');
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join('', '.clasprc.json'),
      );
    });

    test('should use USERPROFILE on windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\fake';
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const _mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => uploadSecrets('owner/repo')).toThrow('process.exit called');
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join('C:\\Users\\fake', '.clasprc.json'),
      );
    });
  });
});
