# @ciderjs/clasp-auth

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/clasp-auth.svg)](https://www.npmjs.com/package/@ciderjs/clasp-auth)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-@ciderjs/clasp--auth-blue?logo=github)](https://github.com/marketplace/actions/setup-clasp-auth)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/clasp-auth.svg)](https://github.com/luthpg/clasp-auth/issues)

Google Apps Script (GAS) を GitHub Actions で CI/CD するための **clasp 認証補助ツール**。  
ローカルで `clasp login` した認証情報を GitHub Secrets にアップロード／削除し、CI/CD 環境で `.clasprc.json` を自動生成します。

---

## ⚠️ Prerequisites

このツールを利用するには以下が必要です:

- **GitHub CLI (`gh`)**
  - [インストール](https://cli.github.com/) してください
  - `gh auth login` を実行し、GitHub にログインしておく必要があります

- **Google Apps Script CLI (`clasp`)**
  - [インストール](https://github.com/google/clasp) してください
  - `clasp login` を実行し、Google アカウントでログインしておく必要があります

- **注意事項**
  - CI/CD は **実行者の Google アカウント情報** を利用して行われます
  - Secrets をアップロードするリポジトリは十分に注意してください  
    （誤ったリポジトリにアップロードすると、意図しない環境で認証情報が利用される可能性があります）

---

## ✨ Features

- **CLI**
  - `upload`: ローカルの `~/.clasprc.json` を読み込み、`gh secret set` を使って GitHub Secrets にアップロード
  - `delete`: 登録済みの Secrets を削除
  - `--yes` オプションで確認プロンプトをスキップ可能
  - 実行前に **リポジトリの存在確認** と **編集権限チェック** を自動で行う

- **GitHub Action**
  - Secrets から `.clasprc.json` を生成し、CI/CD 環境で `clasp push` を実行可能にする

---

## 📦 Installation

グローバルインストール:

```bash
npm install -g @ciderjs/clasp-auth
```

プロジェクトローカル:

```bash
npm install --save-dev @ciderjs/clasp-auth
```

---

## 🚀 Usage

### 1. Secrets をアップロード (CLI)

まずローカルで `clasp login` を実行し、`~/.clasprc.json` を生成します。  
その後、以下のコマンドで GitHub Secrets にアップロードします:

```bash
npx @ciderjs/clasp-auth upload <owner/repo>
```

例:

```bash
npx @ciderjs/clasp-auth upload ciderjs/city-gas
```

確認プロンプトをスキップする場合:

```bash
npx @ciderjs/clasp-auth upload ciderjs/city-gas --yes
```

登録される Secrets:

- `CLASP_ACCESS_TOKEN`
- `CLASP_REFRESH_TOKEN`
- `CLASP_CLIENT_ID`
- `CLASP_CLIENT_SECRET`
- `CLASP_REDIRECT_URI`
- `CLASP_SCOPE`
- `CLASP_TOKEN_TYPE`
- `CLASP_ID_TOKEN`
- `CLASP_EXPIRY_DATE`
- `CLASP_IS_LOCAL_CREDS`

---

### 2. Secrets を削除 (CLI)

登録済みの Secrets を削除するには:

```bash
npx @ciderjs/clasp-auth delete <owner/repo>
```

確認プロンプトをスキップする場合:

```bash
npx @ciderjs/clasp-auth delete <owner/repo> --yes
```

---

### 3. GitHub Actions で利用 (Action)

Workflow 内で Action を呼び出すと、Secrets から `.clasprc.json` が生成されます。

```yaml
name: Deploy GAS
on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup clasp auth
        uses: ciderjs/clasp-auth@v1

      - name: Install clasp
        run: npm install -g @google/clasp

      - name: Push to GAS
        run: clasp push
```

---

## 🛠 Development

```bash
# ビルド
pnpm build

# テスト (Vitest)
pnpm test

# ローカルで CLI を試す
npm link
clasp-auth upload <owner/repo>
```

---

## 🔒 Security Considerations

このリポジトリを利用する際には以下のセキュリティリスクと対策を考慮してください。

### リスク
- 認証情報（アクセストークン・リフレッシュトークン）の漏洩
- 誤ったリポジトリへの Secrets 登録
- 不要なワークフローからの Secrets 利用
- CI/CD 実行環境でのログ出力による漏洩
- トークンの長期利用による被害拡大

### 対策
- 公開リポジトリではなくプライベートリポジトリで利用する
- 必要最小限のリポジトリにのみ Secrets を登録する
- GitHub Actions の `permissions` を制御し、Secrets を参照できるジョブを限定する
- `.clasprc.json` の内容をログに出力しない
- 定期的に `clasp login` をやり直し、Secrets をローテーションする
- ブランチ保護ルールを設定し、信頼できるユーザーのみがワークフローを実行できるようにする
- GitHub の監査ログや Google アカウントのログイン履歴を定期的に確認する

---

## 🔄 Release

- タグを手動で付与してリリースをトリガーします（例: `v0.1.0`）
- リリースノートは **GitHub の自動生成ノート** を利用
- npm publish は CI により実行されます（`NPM_TOKEN` が必要）

---

## 📄 License

MIT
