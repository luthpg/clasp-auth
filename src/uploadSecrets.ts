import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function checkRepoAccess(repo: string): {
  exists: boolean;
  canPush: boolean;
} {
  try {
    // リポジトリ情報を取得
    const output = execSync(`gh api repos/${repo}`, { encoding: 'utf-8' });
    const data = JSON.parse(output);

    // push 権限の有無を確認
    const canPush = data.permissions?.push === true;
    return { exists: true, canPush };
  } catch {
    return { exists: false, canPush: false };
  }
}

export function uploadSecrets(repo: string) {
  const clasprcPath = path.join(
    process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] || '',
    '.clasprc.json',
  );

  if (!fs.existsSync(clasprcPath)) {
    console.error('No .clasprc.json found. Run `clasp login` first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));

  function setSecret(key: string, value: string) {
    execSync(`gh secret set ${key} --repo ${repo} --app actions`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
  }

  setSecret('CLASP_ACCESS_TOKEN', data.token.access_token);
  setSecret('CLASP_REFRESH_TOKEN', data.token.refresh_token);
  setSecret('CLASP_CLIENT_ID', data.oauth2ClientSettings.clientId);
  setSecret('CLASP_CLIENT_SECRET', data.oauth2ClientSettings.clientSecret);
  setSecret('CLASP_REDIRECT_URI', data.oauth2ClientSettings.redirectUri);
  setSecret('CLASP_SCOPE', data.token.scope);
  setSecret('CLASP_TOKEN_TYPE', data.token.token_type);
  setSecret('CLASP_ID_TOKEN', data.token.id_token);
  setSecret('CLASP_EXPIRY_DATE', String(data.token.expiry_date));
  setSecret('CLASP_IS_LOCAL_CREDS', String(data.isLocalCreds));

  console.log('✅ Uploaded clasp credentials to GitHub Secrets');
}

export function deleteSecrets(repo: string) {
  const secrets = [
    'CLASP_ACCESS_TOKEN',
    'CLASP_REFRESH_TOKEN',
    'CLASP_CLIENT_ID',
    'CLASP_CLIENT_SECRET',
    'CLASP_REDIRECT_URI',
    'CLASP_SCOPE',
    'CLASP_TOKEN_TYPE',
    'CLASP_ID_TOKEN',
    'CLASP_EXPIRY_DATE',
    'CLASP_IS_LOCAL_CREDS',
  ];

  for (const name of secrets) {
    try {
      execSync(`gh secret delete ${name} --repo ${repo} --app actions`, {
        stdio: 'inherit',
      });
    } catch {
      console.warn(
        `⚠️ Secret ${name} の削除に失敗しました（存在しない可能性あり）`,
      );
    }
  }
}
