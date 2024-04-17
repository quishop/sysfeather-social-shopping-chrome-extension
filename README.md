<p align="center">
  <img width="150" src="/public/new-sysfeather.png" alt="Sysfeather icon">
</p>

<h1 align="center">矽羽社群購物Chrome plugin</h1>

# sysfeather-social-shopping-chrome-extension

## :sparkles: 特性

`popup` 頁面支持 `react hot reload` & `react devtools`，充分享受現代前端工程化的便捷，讓你從開發 `SPA` 無縫切換到 chrome 擴展開發。

- :shield: 整個模板包括 `webpack` 配置都是用 `TypeScript` 編寫的，使用 `TypeScript` 配置 `webpack` 減少查閱文檔和手殘的概率。
- :lipstick: ​ 支持 css/less/sass，使用 `mini-css-extract-plugin` 將 CSS 分離成 content CSS Script。
- :hammer_and_pick: 集成了社區很多的優秀的 `webpack`，`eslint` 和 `babel` 插件，優化開發，構建和打包分析體驗，還配置了 `husky` , `format-imports`, `stylelint`, `travis` 和 `audit-ci` 構建工具。
- :rainbow: 默認集成了 `jquery`，`lodash`，`antd` 等常用工具庫，並對它們的打包進行了優化

## :package: 安装

```bash

# 安裝依賴，推薦使用 pnpm, npm可能會報錯
pnpm
```

## :hammer_and_wrench: 開發

:bell: 請確保你對 chrome 擴展開發已經有基本的了解，入門推薦：[Chrome 插件(擴展)開發全攻略](http://blog.haoji.me/chrome-plugin-develop.html)。如果你對項目的配置有疑問。

### 準備工作

#### 修改清單文件

使用 `src/manifest.ts` 編寫 `manifest.json`，它其實是一個 node 腳本，因此你可以使用 `server` 下面的所有模塊，可以使用環境變量處理不同開發環境的配置。

**注意**：任何注入了 `content scripts` 的頁面也必須被註入 `js/all.js` 和 `css/all.css` ，為了實現這一點，它倆的 `matches` 應該是其它所有 `content scripts` 的 `matches` 的父集。

示例的配置:

```javascript
"content_scripts": [
    // 所有註入了 content scripts 的頁面都註入了 js/all.js 和 css/all.css
    {
        "matches": ["https://github.com/*"],
        "css": ["css/all.css"],
        "js": ["js/all.js"]
    },
    // 註入到 github pull requests 頁面
    {
        "matches": ["https://github.com/pulls"],
        "css": ["css/pulls.css"],
        "js": ["js/pulls.js"]
    }
]
```

#### 添加靜態資源

`public` 下的文件會被打包到擴展的根目錄，`manifest` 中用到的圖標等資源可以直接放到 `public` 文件夾下面。模板在 `public/icons` 放了一些默認的圖標，因此可以在 `manifest` 中這樣引用圖標：

```json
// manifest.dev.json
{
  "icons": {
    "16": "icons/extension-icon-x16.png",
    "32": "icons/extension-icon-x32.png",
    "48": "icons/extension-icon-x48.png",
    "128": "icons/extension-icon-x128.png"
  }
}
```

### 啟動 devServer

```bash
yarn start
```

無論是開發環境還是生產環境都會在項目根目錄生成 `extension` 文件夾，chrome 訪問 [chrome://extensions/](chrome://extensions/) 也就是擴展管理頁面，點擊右上角的按鈕開啟開發者模式，選擇加載已解壓的擴展程序，再選擇剛剛生成的 `extension` 文件夾即可加載擴展。

![load extension](https://i.loli.net/2020/03/10/rlbXpmdyu6KitVW.png)

由於 `chrome` 的限制，官方的 chrome 擴展 [react devtools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) 並不能審查 `chrome-extension://` 協議的頁面如 `options`，`popup` 頁面。所以需要使用獨立的 [react devtools](https://www.npmjs.com/package/react-devtools)，使用下面的命令啟動 devServer 的同時打開獨立的 devtools 窗口：

```bash
npm run devtools
```

![react devtools](https://i.loli.net/2020/03/10/DzK8MWHbN4YmeZU.png)

你可以通過 `open` 參數配置在 webpack 初次編譯成功打開某個 URL：

```javascript
"scripts": {
        "start": "cross-env-shell NODE_ENV=development ts-node --files -P ./server/tsconfig.json ./server --open=https://xxx.xxx.com",
    },
```

### 編寫代碼

模板默認的代碼實現的功能是修改 `github` 導航欄的顏色，模板使用了 [normalize.css](https://github.com/necolas/normalize.css) 和一些自定義樣式對 CSS 進行樣式重置。

#### [background](https://developer.chrome.com/extensions/background_pages)

如果你想開發 `background` 腳本，你可以在 `src/background` 文件夾編寫你的代碼。`src/background/index.ts` 是 `background` 腳本的入口，也是 `webpack` 的一個 `entry`，其它像 `options` 和 `popup` 頁面也類似。你可以查看 `webpack` 的 `entry` 配置： `src/server/utils/entry.ts` 了解更多實現細節。

#### [options](https://developer.chrome.com/extensions/options) 和 [popup](https://developer.chrome.com/extensions/browserAction#popups)

它倆的 webpack entry 分別是 `src/options/index.tsx` 和 `src/popup/index.tsx`。這兩個頁面很相似，都只是一個普通的 web 頁面，因此你可以像開發一個 react **SPA** 一樣開發它們。

這個模板使用了 `react` 的最新版本，因此你可以使用 `react hooks` 去開發函數組件，`react hooks` 的 `eslint` 規則也集成了。

模板使用 [React Fast Refresh](https://github.com/facebook/react/issues/16604) 支持 `react` 的熱更新。

#### [content scripts](https://developer.chrome.com/extensions/content_scripts)

這個模板會掃描 `src/contents` 文件夾，將所有子文件夾中的 `index.tsx` 或 `index.ts` 作為 `webpack entry`。

`content scripts` 都放在 `src/contents` 目錄下。默認有個 `all.ts`，也是個 webpack entry，它不能被刪除，因為這個 webpack entry 被用於註入實現 chrome 擴展自動刷新功能的補丁。

**舉個 🌰:**

當你要給 URL 是 `https://www.example.com/discuss` 頁面開發 `content script`，你需要做下面兩步:

1. 添加 `content scripts` 和頁面 URL 之間的映射到 `manifest.dev.json` 和 `manifest.prod.json`:

   ```json
   {
     "content_scripts": [
       {
         "matches": ["https://www.example.com/discuss*"],
         "css": ["css/discuss.css"],
         "js": ["js/discuss.js"]
       }
     ]
   }
   ```

2. 創建一個和上面 `content script` 路徑對應的文件夾 `src/contents/discuss`。`src/discuss/index.tsx` 或者 `src/discuss/index.ts` 將會被視為一個 webpack entry。 `webpack` 會通過這個 `entry` 最終產出 `js/discuss.js` 這個 `chunk`。

   `mini-css-extract-plugin` 會將所有被 `discuss/index.ts` 導入的樣式文件合並再分離到 `extension/css/discuss.css`，這也是為什麽上面的 `manifest` 中 content CSS script 可以使用 `css/discuss.css` 的原因

### dev server 代理

你可以在 `server/configs/proxy.ts` 中配置 `dev server` 的代理，所有向 `dev serve`r 發送的請求都會根據你配置的規則被代理轉發，修改配置後需要重啟 `dev server` 才會生效，更多細節請查看使用的中間件 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)。

```typescript
const proxyTable: ProxyTable = {
  // 如果 devServer 啟動地址是 http://127.0.0.1:3600
  // 那麽請求 http://127.0.0.1:3600/path_to_be_proxy 將會被 dev server 轉發到 http://target.domain.com/path_to_be_proxy
  '/path_to_be_proxy': { target: 'http://target.domain.com', changeOrigin: true },
};
```

## :construction_worker: 打包

構建生產級別的包直接運行：

```bash
pnpm build
```

如果你想分析打包情況：

```bash
pnpm build-analyze
```

## :loudspeaker: 註意事項

`src/all` 和 `src/background` 下的文件包含了實現修改 `content script` 自動重載擴展和刷新註入了 `content script` 頁面的功能的代碼。除非你不開發 `content scripts`，否則，**不能刪除它**。

## :books: Blog

核心原理：[使用 webpack 構建 chrome 擴展的熱更新問題](https://zhuanlan.zhihu.com/p/103072251)
