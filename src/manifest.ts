import type { Manifest } from 'webextension-polyfill';

import pkg from '../package.json';
import { __DEV__ } from '../server/utils/constants';

const manifest: Manifest.WebExtensionManifest = {
    name: pkg.displayName,
    version: '1.0',
    description: pkg.description,
    manifest_version: 3,
    minimum_chrome_version: pkg.browserslist.split(' ')[2],
    permissions: ['webRequest', 'tabs', 'storage'],
    content_security_policy: {
        extension_pages: "script-src 'self' http://localhost; object-src 'self';",
    },
    web_accessible_resources: [
        {
            matches: ['<all_urls>'],
            resources: ['icons/*', 'images/*', 'fonts/*'],
        },
    ],

    background: {
        service_worker: 'js/background.js',
    },
    content_scripts: [
        {
            matches: ['<all_urls>'],
            css: ['css/all.css'],
            js: ['js/all.js', ...(__DEV__ ? [] : ['js/all.js'])],
            run_at: 'document_start',
        },
    ],
    host_permissions: ['<all_urls>'],
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
if (!__DEV__) {
    manifest.content_scripts?.unshift({
        matches: ['<all_urls>'],
        js: ['js/vendor.js'],
    });
}

export default manifest;
