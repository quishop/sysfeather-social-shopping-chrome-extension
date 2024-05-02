import { onMessage } from 'webext-bridge';

onMessage('hello-from-content-script', (msg) => {
    console.log('onMessage:', msg);
});

console.log('This is background page!');

// WEBPACK FOOTER //
// ./src/backend/index.js
