import './App.scss';
// import { classTable } from './ClassTable';
import { useEffect } from 'react';
const App = () => {
    useEffect(() => {
        // getGroupNameClass();
    }, []);

    // async function getGroupNameClass() {
    //     // let groupName = null;
    //     // //取社團名稱(用社團名稱超連結的CSS)
    //     // /*
    //     // /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[1]/div[2]/div/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/h1/span/a
    //     // */

    //     // for (let i = 0; i < classTable.group_name.length; i++) {
    //     //     const groupNameNode = classTable.group_name[i];
    //     //     console.log('groupNameNode:', classTable.group_name);
    //     //     groupName = document.querySelector(groupNameNode);
    //     //     if (groupName) break;
    //     // }
    //     // console.log('invoked getGroupNameClass: ', groupName);
    //     const className =
    //         'x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1heor9g xt0b8zv x1xlr1w8';
    //     const elements = document.querySelectorAll(`.${className.replace(/ /g, '.')}`);

    //     console.log('elements:', elements.length ? elements[0].innerHTML : '');

    //     return elements.length ? elements[0].innerHTML : '';
    // }

    return (
        <div className="app">
            <h1 className="title">popup page</h1>
        </div>
    );
};

export default App;
