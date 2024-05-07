import { sendMessage } from 'webext-bridge';
import $ from 'jquery';
import './style.scss';

console.log('This is content script!');
try {
    $(document).ready(function () {
        console.log('ready!');
    });
    sendMessage('hello-from-content-script', 'Hello from content script!');
} catch (error) {
    console.log('error:', error);
}
