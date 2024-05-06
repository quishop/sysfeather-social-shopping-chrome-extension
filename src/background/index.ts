import { onMessage } from 'webext-bridge';

onMessage('hello-from-content-script', (msg) => {
    console.log('onMessage:', msg);
});

console.log('This is background page!');

// chrome.webRequest.onBeforeRequest.addListener(
//     function (details) {
//         if (details.url.includes('www.facebook.com')) {
//             console.log('Capturing request to:', details.url);
//             console.log('Capturing request detail:', details);
//             console.log('Status code:', details.statusCode);
//             console.log('Response headers:', JSON.stringify(details.responseHeaders, null, 2));
//         }
//         // Add additional logic here as needed
//     },
//     { urls: ['https://www.facebook.com/*'] }, // This pattern matches all URLs
// );
// WEBPACK FOOTER //
// ./src/backend/index.js
