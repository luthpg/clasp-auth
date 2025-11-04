import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

describe('action', () => {
  const ENV_BACKUP = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
    vi.resetModules();
  });

  test('should write .clasprc.json with environment variables', async () => {
    // Mock environment variables
    process.env.CLASP_ACCESS_TOKEN = 'test_access_token';
    process.env.CLASP_REFRESH_TOKEN = 'test_refresh_token';
    process.env.CLASP_SCOPE = 'test_scope';
    process.env.CLASP_TOKEN_TYPE = 'Bearer';
    process.env.CLASP_ID_TOKEN = 'test_id_token';
    process.env.CLASP_EXPIRY_DATE = '1234567890';
    process.env.CLASP_CLIENT_ID = 'test_client_id';
    process.env.CLASP_CLIENT_SECRET = 'test_client_secret';
    process.env.CLASP_REDIRECT_URI = 'http://localhost';
    process.env.CLASP_IS_LOCAL_CREDS = 'true';

    // Mock fs.writeFileSync
    const writeFileSyncSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {});

    // Dynamically import and run the action
    await import('../src/action');

    const home = os.homedir();
    const clasprcPath = path.join(home, '.clasprc.json');
    const expectedData = {
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

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      clasprcPath,
      JSON.stringify(expectedData, null, 2),
    );

    writeFileSyncSpy.mockRestore();
  });
});
