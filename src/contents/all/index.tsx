// import { sendMessage } from 'webext-bridge';

import './style.scss';
console.log('This is content script1!');

(function () {
    console.log('This function runs right away!');
    // Intercept Fetch API requests and log responses
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        console.log('invoked1');
        return originalFetch.apply(this, args).then((response) => {
            console.log('invoked2');
            const clone = response.clone();
            clone.text().then((text) => {
                console.log(`Fetch request to ${args[0]} got response:`, text);
                // Optionally send this data to your background script if needed
            });
            console.log('invoked3');
            return response;
        });
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        // this.url = url;
        originalXHROpen.apply(this, arguments);
    };

    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
        console.log('invoked4');
        this.addEventListener('load', function () {
            // console.log(`XHR request to ${this.url} got response:`, this.responseText);
            // Optionally send this data to your background script if needed
        });
        console.log('invoked5');
        originalXHRSend.apply(this, arguments);
    };
})();

// console.log(`Current page's url must be prefixed with https://github.com`);
