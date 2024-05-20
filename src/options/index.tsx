import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App';

import './App.scss';

const container = document.querySelector('#root');
const root = createRoot(container!);
// chrome.storage.local.get('data', (result) => {
//     if (result.data) {
//         let dataElement = document.getElementById('data');
//         dataElement.textContent = JSON.stringify(result.data, null, 2);
//     } else {
//         console.log('No data found');
//     }
// });
root.render(
    <HashRouter>
        <App  />
    </HashRouter>,
);
