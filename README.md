# Google Docs Mermaid Addon

This is the repository that hosts the source code and issue tracker for the Google Docs Mermaid Addon.

## Installation

[**You can install the addon from the marketplace →**](TODO)

If you want to run a development build of the addon, follow the [instructions](#local) below.

## Local

Requirements:
- Node.js 18 or above
- [pnpm](https://pnpm.io/)
- Google Account

TODO: Get specifics on how to setup Google Docs with development addon runnable on it.

Install Dependencies:
```sh
pnpm install
```

Run and push build:
```sh
pnpm run clasp:dev
```

## Architecture

This app uses a pnpm-based monorepo with multiple packages for different views that are implemented in Vue.js and is built using Vite. The server runs on Google Appscript and is transpiled using esbuild.
