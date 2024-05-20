// import { onMessage } from 'webext-bridge';

// onMessage('hello-from-content-script', (msg) => {
//     console.log('onMessage:', msg);
// });

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendData') {
        // Store data in local storage
        console.log('received data:', request.data);
        chrome.storage.local.set({ data: request.data }, () => {
            console.log('Data stored:', request.data);
        });

        // // Create a new tab with the desired chrome:// URL
        // chrome.tabs.create({ url: 'chrome://newtab/' }, (tab) => {
        //     // Once the tab is created, send the data to the content script
        //     chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        //         if (info.status === 'complete' && tabId === tab.id) {
        //             chrome.tabs.onUpdated.removeListener(listener);
        //             chrome.tabs.sendMessage(tab.id, { action: 'displayData', data: request.data });
        //         }
        //     });
        // });
        // Create a new tab with the desired URL
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') }, (tab) => {
            sendResponse({ status: 'Tab opened' });
        });
        sendResponse({ status: 'Data received and tab opened' });
    }
});
// WEBPACK FOOTER //
// ./src/backend/index.js
