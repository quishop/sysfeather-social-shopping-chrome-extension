import type { Manifest } from 'webextension-polyfill';

import pkg from '../package.json';
import { __DEV__ } from '../server/utils/constants';

const manifest: Manifest.WebExtensionManifest = {
    name: pkg.displayName,
    version: pkg.version,
    description: pkg.description,
    manifest_version: 3,
    minimum_chrome_version: pkg.browserslist.split(' ')[2],
    permissions: ['activeTab', 'declarativeContent', 'storage', 'scripting'],
    host_permissions: ['https://www.facebook.com/*'],
    content_security_policy: {
        extension_pages: "script-src 'self' http://localhost; object-src 'self';",
    },
    web_accessible_resources: [
        {
            matches: ['<all_urls>'],
            resources: ['icons/*', 'images/*', 'fonts/*'],
        },
        {
            resources: ['js/content.js'],
            matches: ['https://www.facebook.com/*'],
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
                'https://*.facebook.com/permalink.php?story_fbid=*&id=*',
                'https://*.facebook.com/*/posts/*',
                'https://*.facebook.com/*/permalink/*',
                'https://*.facebook.com/photo.php?fbid=*&set=a*',
                'https://*.facebook.com/groups/*?post_id=*',
                'https://*.facebook.com/groups/*',
            ],
            css: ['css/all.css'],
            js: ['js/all.js', ...(__DEV__ ? [] : ['js/all.js'])],
            all_frames: true,
            run_at: 'document_end',
        },
        // {
        //     css: ['css/all.css'],
        //     js: ['js/all.js', ...(__DEV__ ? [] : ['js/all.js'])],
        //     run_at: 'document_end',
        //     matches: [
        //         'https://*.facebook.com/*',
        //         'https://*.facebook.com/groups/*/permalink/*',
        //         'https://*.facebook.com/permalink.php?story_fbid=*&id=*',
        //         'https://*.facebook.com/*/posts/*',
        //         'https://*.facebook.com/*/permalink/*',
        //         'https://*.facebook.com/photo.php?fbid=*&set=a*',
        //         'https://*.facebook.com/groups/*?post_id=*',
        //         'https://*.facebook.com/groups/*',
        //     ],
        //     all_frames: true,
        // },
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
if (!__DEV__) {
    manifest.content_scripts?.unshift({
        matches: ['<all_urls>'],
        js: ['js/vendor.js'],
    });
}

export default manifest;
