import type { Manifest } from 'webextension-polyfill';

import pkg from '../package.json';
import { __DEV__ } from '../server/utils/constants';

const manifest: Manifest.WebExtensionManifest = {
    name: '矽羽+1智慧小幫手',
    version: pkg.version,
    description: pkg.description,
    manifest_version: 3,
    minimum_chrome_version: pkg.browserslist.split(' ')[2],
    // SL-1486：程式只用到 chrome.storage；chrome.tabs.create、chrome.runtime 不需要另外申請權限
    permissions: ['storage'],
    host_permissions: ['https://www.facebook.com/*'],
    content_security_policy: {
        // SL-1487：http://localhost 只給本機開發的熱更新用，正式版不允許
        extension_pages: __DEV__
            ? "script-src 'self' http://localhost; object-src 'self';"
            : "script-src 'self'; object-src 'self';",
    },
    // SL-1487：只開放給 FB（content script 在 FB 頁面插入 icons/* 圖示），其他網站無法偵測使用者有沒有裝插件。
    // 原本的 js/content.js、js/options.js 兩項沒有對應檔案或用不到，一併移除。
    web_accessible_resources: [
        {
            matches: ['https://*.facebook.com/*'],
            resources: ['icons/*', 'images/*', 'fonts/*'],
        },
    ],
    background: {
        service_worker: 'js/background.js',
    },
    content_scripts: [
        {
            matches: [
                'https://*.facebook.com/*',
                'https://*.facebook.com/groups/*/permalink/*',
                'https://*.facebook.com/groups/*/posts/*',
                'https://*.facebook.com/permalink.php?story_fbid=*&id=*',
                'https://*.facebook.com/*/posts/*',
                'https://*.facebook.com/*/permalink/*',
                'https://*.facebook.com/photo.php?fbid=*&set=a*',
                'https://*.facebook.com/groups/*?post_id=*',
                'https://*.facebook.com/groups/*',
            ],
            css: ['css/all.css'],
            js: ['js/all.js'],
            run_at: 'document_end',
            //    "run_at": "document_start"
        },
    ],
    action: {
        default_popup: 'popup.html',
        default_icon: {
            '16': 'icons/extension-icon-x16.png',
            '32': 'icons/extension-icon-x32.png',
            '48': 'icons/extension-icon-x48.png',
            '128': 'icons/extension-icon-x128.png',
        },
    },
    options_ui: {
        page: 'options.html',
        open_in_tab: true,
    },
    icons: {
        '16': 'icons/extension-icon-x16.png',
        '32': 'icons/extension-icon-x32.png',
        '48': 'icons/extension-icon-x48.png',
        '128': 'icons/extension-icon-x128.png',
    },
};
export default manifest;
