import { sendMessage } from 'webext-bridge';
// // import { main } from './components/MainFixedWindow.js';
import './style.scss';
import { classTable } from './ClassTable';
import { htmlTable } from './HtmlTable';

const STOP_COMMENT_LENGTH = 2000;
// Intercept fetch requests
try {
    if (isFacebookPostUrl(window.location.href)) {
        // console.log('124');
        // let div = document.createElement('div');
        // div.id = 'myCustomUI';
        // div.innerHTML = '<h1>Hello, this is my custom UI!</h1>';
        // // Append the custom UI to the body of the page
        // document.body.appendChild(div);

        // // Optionally, inject some CSS
        // let style = document.createElement('style');

        // style.textContent = `
        //     #myCustomUI {
        //         position: fixed;
        //         top: 0;
        //         right: 0;
        //         background: white;
        //         border: 1px solid black;
        //         padding: 10px;
        //         z-index: 1000;
        //     }
        //     `;
        // document.head.appendChild(style);

        // sendMessage('hello-from-content-script', '123', 'background');
        getCreationTime(1).then((response) => {
            const data = {
                author: getAuthorFromClass(),
                createTime: new Date(response * 1000),
                commentsLength: getFBCommitLength(),
            };
            sendMessage('hello-from-content-script', data, 'background');
        });

        let node;
        // while (!node) {
        for (const pagePostCommitClass of classTable.pagePostCommitDiv) {
            const pagePostCommitDiv = document
                .querySelector('body')
                .querySelector(pagePostCommitClass);
            if (pagePostCommitDiv) {
                node = pagePostCommitDiv;
                break;
            }
        }
        let commitMutationObserver;
        fetchCommentsList(node);

        // console.log('SwitchNode:', getCommitSwitchNode(node));
        // switchContentState(node);
        // for (const postCommitDiv of classTable.postCommitDiv) {
        //     const commitClass = document.querySelector('body').querySelector(postCommitDiv);
        //     if (commitClass) {
        //         this.postCommit = commitClass;
        //         break;
        //     }
        // }
        // const val = startFetchCommitComments(document.querySelector('body'), []);
        // console.log('test 123:', val);
        // console.log('test 123:', getContentFn());
    }
} catch (e) {
    console.log('error:', e);
}

async function switchContentState(node) {
    const commitstats = await getCommitSwitchNode(node);
    let textcontent = '';
    try {
        textcontent = commitstats.textContent;
    } catch (e) {}

    let doCheckMoreComment = false;

    if (textcontent.indexOf('最相關') != -1 || textcontent.indexOf('最熱門留言') != -1) {
        doCheckMoreComment = true;
    }

    console.log('doCheckMoreComment:', textcontent, doCheckMoreComment);
    if (doCheckMoreComment) {
        console.log('invoked');
        await commitstats.click();
        let selectCommitShowTmpBtn = getCommitSortListBtn(1);
        console.log('selectCommitShowTmpBtn:', selectCommitShowTmpBtn);
        await selectCommitShowTmpBtn.click();
    }
}

function isFacebookPostUrl(url: string) {
    const regexPermalink = /^https:\/\/www\.facebook\.com\/groups\/(\d+)\/permalink\/(\d+)\/$/;
    const regexGroupPost = /^https:\/\/www\.facebook\.com\/groups\/(\d+)\/posts\/(\d+)\/$/;
    const regexPost = /^https:\/\/www\.facebook\.com\/(\d+)\/posts\/(\d+)\/$/;
    return regexPermalink.test(url) || regexPost.test(url) || regexGroupPost.test(url);
}

/**
 * - 取得貼文建立時間
 * @param {integer} funcType 使用的方法
 * @returns {Promise<string>} 時間字串
 */
async function getCreationTime(funcType: number) {
    let timeText = '';
    switch (funcType) {
        case 1:
            timeText = await getCreationTimeByPostHtml();
            break;
    }

    return timeText;
}

// 取得FB顯示留言長度
function getFBCommitLength() {
    let commitClass;
    for (const postCommitDiv of classTable.postCommitDiv) {
        commitClass = document.querySelector('body').querySelector(postCommitDiv);
        if (commitClass) {
            break;
        }
    }

    if (!commitClass) {
        throw 'nullPostCommit'; // 在Mode.js 捕捉初始化錯誤
    }

    let FBlength = 0;
    try {
        let FBPostCommit = null;
        for (let i = 0; i < classTable.FBPostCommit.length; i++) {
            const element = classTable.FBPostCommit[i];
            FBPostCommit = commitClass.querySelector(element);
            if (FBPostCommit) break;
        }
        let content = FBPostCommit.textContent;
        if (content.indexOf('則留言') != -1) {
            return parseInt(content.split('則留言')[0].replace(',', ''));
        }
    } catch (e) {}

    return FBlength;
}

async function getCreationTimeByPostHtml() {
    let postHtml = await getPostHtml();
    if (postHtml && postHtml.indexOf('publish_time\\":') != -1) {
        return postHtml.split('publish_time\\":')[1].split(',')[0];
    }

    return '';
}

async function getPostHtml() {
    const config = {
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        },
    };

    let response = null;
    try {
        const fetchResponse = await fetch(window.location.href, config);
        if (!fetchResponse.ok) {
            throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
        }
        response = await fetchResponse.text(); // Assuming you want to get the response as text
    } catch (e) {
        console.error('Error fetching data:', e);
    }
    return response;
}

function getAuthorFromClass() {
    //不要異動到外層的author
    let classAuthor = {
        id: '',
        name: '',
    };

    //作者的連結
    // const author_link = document.querySelector('a[href="/me/"]')
    // if(author_link) {
    //   classAuthor.id = getUserID()
    //   classAuthor.name = author_link.textContent
    // }
    const scriptStringList = document.getElementsByTagName('script');
    let userInfo = getUserInfoSearchUserIDByScript(scriptStringList);
    classAuthor = userInfo;

    if (classAuthor.id == '') {
        classAuthor = getAccountUsersByScriptStringList(scriptStringList);
    }

    //若上方抓不到id 就從 &__user抓
    if (classAuthor.id == '') {
        classAuthor = getAccountUsersAtBottomUserByScriptStringList(scriptStringList);
    }

    return classAuthor;
}

/**
 * - 取得切換留言排序的節點
 * @param {node} nodes - 搜尋的節點
 * @returns {node} - 切換留言的節點
 */
function getCommitSwitchNode(nodes) {
    let commitstats = null;
    try {
        /*
      找出切換留言顯示方式CSS                                                               
      /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[4]/div/div/div/div/div/div/div[1]/div/div/div/div/div/div/div/div/div/div/div[8]/div/div[4]/div/div/div[2]/div[2]/div/div/div/span
      */
        for (let i = 0; i < classTable.postCommentSortClass.length; i++) {
            const element = classTable.postCommentSortClass[i];
            if (nodes.querySelector(element)) {
                for (let count = 0; count < classTable.postCommitState.length; count++) {
                    const postCommitStateClass = classTable.postCommitState[count];
                    commitstats = nodes.querySelector(element).querySelector(postCommitStateClass);
                    if (commitstats) break;
                }
                if (commitstats) break;
            }
        }
    } catch (e) {
        // console.log("no change")
    }

    return commitstats;
}

function getUserInfoSearchUserIDByScript(scriptStringList) {
    let userInfo = {
        id: '',
        name: '',
    };
    try {
        for (let index = 0; index < scriptStringList.length; index++) {
            let startIndex = scriptStringList[index].textContent.indexOf('"USER_ID":"');
            let endIndex = scriptStringList[index].textContent.indexOf(',"SHORT_NAME":"');
            if (startIndex != -1 && endIndex != -1) {
                let userInfoStr = scriptStringList[index].textContent.substring(
                    startIndex,
                    endIndex,
                );
                let userInfoJSON = JSON.parse(`{${userInfoStr}}`);
                userInfo.id = userInfoJSON['USER_ID'];
                userInfo.name = userInfoJSON['NAME'];
                break;
            }
        }
    } catch (error) {}
    return userInfo;
}

//專門處理的方法
function getAccountUsersByScriptStringList(scriptStringList) {
    let author = {
        id: '',
        name: '',
    };

    for (let index = 0; index < scriptStringList.length; index++) {
        let scriptStringListInner = scriptStringList[index].innerHTML;
        if (scriptStringListInner.search('account_user') >= 0) {
            let userString = extractUserStringByAccountUser(scriptStringListInner);
            const nodeUserJson = JSON.parse('{' + userString + '}');
            if (nodeUserJson) {
                author.id = nodeUserJson['account_user']['id'];
                try {
                    author.name = nodeUserJson['account_user']['short_name'];
                } catch (e) {
                    author.name = '';
                }
                break;
            }
        }
    }
    return author;
}

function extractUserStringByAccountUser(scriptString) {
    const userStringStart = scriptString.search('"account_user');
    const userStringEnd = scriptString.search('"extensions');

    if (userStringStart > 0 && userStringEnd > 0) {
        const userStringLength = userStringEnd - userStringStart - 3;
        return scriptString.substr(userStringStart, userStringLength);
    }

    return null;
}

function getAccountUsersAtBottomUserByScriptStringList(scriptStringList) {
    let author = {
        id: '',
        name: '',
    };
    for (let index = 0; index < scriptStringList.length; index++) {
        let scriptStringListInner = scriptStringList[index].innerHTML;
        if (scriptStringListInner.search('&__user=') >= 0) {
            const userIdString = extractUserStringByBottomUser(scriptStringListInner);
            if (userIdString) {
                author.id = userIdString;
                break;
            }
        }
    }
    return author;
}

function extractUserStringByBottomUser(scriptString) {
    const userStringStart = scriptString.search('&__user=');
    const userStringEnd = scriptString.search('&__comet_req=');

    if (userStringStart > 0 && userStringEnd > 0) {
        const userStringLength = userStringEnd - userStringStart;
        const userString = scriptString.substr(userStringStart, userStringLength);
        return userString.replace('&__user=', '');
    }

    return null;
}

function fetchCommentsList(node) {
    // var unorderedList = nodes.querySelector('ul:not([class])');
    if (!node) {
        return;
    }
    var unorderedList = node.querySelector('ul:not([class])');
    let check_style = true;

    if (unorderedList) {
    } else {
        for (const commentDiv of classTable.CommentDiv) {
            unorderedList = node.querySelector('div' + commentDiv);
            if (unorderedList) {
                break;
            }
        }
    }
    console.log('unorderedList:', unorderedList);
    let oneComments = '';
    const res = [];
    for (const OneCommentDiv of classTable.OneCommentDiv) {
        oneComments = unorderedList.querySelectorAll('div' + OneCommentDiv);
        if (oneComments) {
            break;
        }
    }
    console.log('oneComments:', oneComments);
    let hasMore = false;
    if (oneComments) {
        check(node, null);
    }
}

async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function check(node, resolve) {
    await wait(1000);

    // //if (is_load) return;
    // if (len >= STOP_COMMENT_LENGTH) return;

    // for (const postCommitNode of classTable.postCommitNode) {
    //     const postCommentListNode = node.querySelectorAll(postCommitNode);
    //     if (postCommentListNode.length > 0) {
    //         len = postCommentListNode.length;
    //         break;
    //     }
    // }
    await wait(2000);
    let checkMoreStatus = clickcheckMore(node);
    let clickMoreStatus = clickMoreCommit(node);
    console.log('status:', checkMoreStatus, clickMoreStatus);
    if (checkMoreStatus && checkMoreStatus == clickMoreStatus) {
        //找留言列表準備抓留言內容
        //if (is_load) return;
        console.log('invokeds');
        await wait(2000);
        fetchCommentsList(node);
    }

    // // 留言數量超過STOP_COMMENT_LENGTH 就匯入更新貼文
    // if (len >= STOP_COMMENT_LENGTH) {
    //     //if (is_load) return;
    //     is_load = true;
    //     fetchCommit(resolve);
    // } else {
    //     await wait(2000);
    //     let checkMoreStatus = clickcheckMore(nodes);
    //     let clickMoreStatus = clickMoreCommit(nodes);

    //     // 如果沒有可以展開的按鈕就匯入更新貼文
    //     if (!checkMoreStatus && checkMoreStatus == clickMoreStatus) {
    //         //找留言列表準備抓留言內容
    //         //if (is_load) return;
    //         is_load = true;
    //         await wait(2000);
    //         fetchCommit(resolve);
    //     }
    // }
}

// 檢查是否還有更多留言按鈕。
// 回傳true 表示點擊按鈕，畫面可能會變動。
function clickcheckMore(nodes) {
    //留言內的點擊更多的CSS
    /*
    /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[4]/div/div/div/div/div/div/div[1]/div/div/div/div/div/div/div/div/div/div/div[8]/div/div[4]/div/div/div[2]/div[2]/div[1]/div[2]/span/span
    */
    let postContentMoreElements = nodes.querySelectorAll(classTable.postContentMore);
    let count = 0;
    //篩選一模一樣的關鍵字點擊展開
    for (let i = 0; i < postContentMoreElements.length; i++) {
        const element = postContentMoreElements[i];
        for (let j = 0; j < htmlTable.postCommitMore.length; j++) {
            if (element.textContent == htmlTable.postCommitMore[j]) {
                if (element.textContent.indexOf('隱藏') == '-1') {
                    count++;
                    element.click();
                }
            }
        }

        //模糊篩選關鍵字點擊展開
        for (let k = 0; k < htmlTable.postCommitMoreFuzzy.length; k++) {
            if (element.textContent.indexOf(htmlTable.postCommitMoreFuzzy[k]) != '-1') {
                if (element.textContent.indexOf('隱藏') == '-1') {
                    count++;
                    element.click();
                }
            }
        }
        /*
      if(el.textContent.indexOf("則回覆") != "-1") {
        if(el.textContent.indexOf("檢視") != "-1") {
          count++
          el.click()
        }
      }
      if(el.textContent.indexOf("已回覆") != "-1") {
        if(el.textContent.indexOf("則回覆") != "-1") {
          count++
          el.click()
        }
      }
      */

        /*
      if (el.textContent == "查看更多" || el.textContent == "顯示更多") {

        count++
        el.click()
      }
      */
    }

    if (count != 0) {
        return true;
    } else {
        return false;
    }
}

// 檢查是否還有更多留言按鈕。
// 回傳true 表示點擊按鈕，畫面可能會變動。
function clickMoreCommit(nodes) {
    if (!nodes) {
        //等待檢查是否會有空值情況發生
        return false;
    }

    // let commitstats = null
    // //classTable.CommentUlClass 是整篇留言最外層的DIV
    // /*
    // /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[4]/div/div/div/div/div/div/div[1]/div/div/div/div/div/div/div/div/div/div/div[8]/div/div[4]/div/div/div[2]
    // */
    // for (let i = 0; i < classTable.CommentUlClass.length; i++) {
    //   if (nodes.querySelector(classTable.CommentUlClass[i])) {
    //     commitstats = nodes.querySelector(classTable.CommentUlClass[i])
    //   }
    // }
    // if (!commitstats) return true

    let moreCommit = null;
    for (let i = 0; i < classTable.postViewCommitCommit.length; i++) {
        const element = classTable.postViewCommitCommit[i];
        moreCommit = nodes.querySelector(element);
        if (moreCommit) break;
    }
    let loading = null;
    for (let i = 0; i < classTable.postViewCommitLoad.length; i++) {
        const element = classTable.postViewCommitLoad[i];
        loading = nodes.querySelector(element);
        if (loading) break;
    }
    if (!moreCommit && !loading) {
        return false;
    }
    let count = 0;
    let moreCommitArr = null;
    for (let i = 0; i < classTable.postViewCommitCommit.length; i++) {
        const element = classTable.postViewCommitCommit[i];
        moreCommitArr = nodes.querySelectorAll(element);
        if (moreCommitArr.length > 0) break;
    }
    for (let i = 0; i < moreCommitArr.length; i++) {
        const element = moreCommitArr[i];
        if (element.hasChildNodes() && element.textContent.indexOf('隱藏') == -1) {
            count++;
            element.click();
        }
    }
    if (count || loading) {
        return true;
    }
    return false;
}

/**
 * - 返回我要點擊排序的btn
 * @param {integer} funcType - 使用方法
 * @returns {node} - 返回找到的btn節點
 */
function getCommitSortListBtn(funcType) {
    let selectCommitShowNewBtn = null;
    switch (funcType) {
        case 1:
            selectCommitShowNewBtn = getCommitSwitchBtn(getCommitSortListNode);
            break;
    }
    console.log('selectCommitShowNewBtn:', selectCommitShowNewBtn);
    return selectCommitShowNewBtn;
}

/**
 * - 找出他切換留言顯示方式(EX:最新，最相關，即時留言)
 * @param {function} nodeFetcher - 注入選擇節點的方法
 * @returns {node} 返回目標btn Node
 */
function getCommitSwitchBtn(nodeFetcher) {
    /*
    /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[2]/div/div/div[1]/div[1]/div/div/div[1]/div/div/div/div[1]/div/div[1]
    */
    let commitSortList = nodeFetcher();
    let switchNewBtn = null;
    let selectCommitShowTmp = null;
    for (let i = 0; i < classTable.postCommitlastState.length; i++) {
        const element = classTable.postCommitlastState[i];
        selectCommitShowTmp = commitSortList.querySelectorAll(element);
        if (selectCommitShowTmp.length > 0) break;
    }

    //選擇最新留言顯示
    if (selectCommitShowTmp[selectCommitShowTmp.length - 1].innerText.indexOf('隱藏') != '-1') {
        for (let i = 0; i < selectCommitShowTmp.length; i++) {
            if (selectCommitShowTmp[i].innerText.indexOf('最新') != '-1') {
                switchNewBtn = selectCommitShowTmp[i];
            }
        }
    } else {
        switchNewBtn = selectCommitShowTmp[selectCommitShowTmp.length - 1];
    }
    console.log('switchNewBtn:', switchNewBtn);
    return switchNewBtn;
}

//commitSortList 是找出他是找出他切換留言顯示方式的框框
function getCommitSortListNode() {
    /*
    /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[2]/div/div/div[1]
    */
    let commitSortList = null;
    for (let i = 0; i < classTable.postCommitlast.length; i++) {
        const element = classTable.postCommitlast[i];
        commitSortList = document.querySelectorAll(element);
        if (commitSortList.length > 0) {
            commitSortList = commitSortList[commitSortList.length - 1];
            break;
        }
    }
    console.log('commitSortList:', commitSortList);
    return commitSortList;
}

// // 初始化抓留言list dom的地方
// function startFetchCommitComments(node, postDataComments) {
//     if (!checkCommentsNodeHasChild(node)) return;
//     let fetchData = {
//         node: node,
//         postDataComments: postDataComments,
//     };
//     fetchCommentsList(1, fetchData);
//     return;
// }

// /**
//  *  - 遞迴留言列表
//  * @param {integer} funcType - 使用方法
//  * @param {object} fetchData - 節點物件跟留言內容的籃子
//  * @returns
//  */
// function fetchCommentsList(funcType, fetchData) {
//     try {
//         switch (funcType) {
//             case 1:
//                 fetchByCommentsListNode(fetchData);
//                 break;
//         }
//     } catch (error) {
//         // console.log(error)
//     }

//     return;
// }

// /**
//  * - 遞迴留言列表的每個留言節點(含有頭像的)
//  * @param {object} fetchData - 節點物件跟留言內容的籃子
//  * @returns
//  */
// function fetchByCommentsListNode(fetchData) {
//     if (!checkCommentsNodeHasChild(fetchData.node)) return;
//     let commentsListNode = fetchData.node.childNodes;
//     commentsListNode.forEach((commentNode) => {
//         if (commentNode.nodeName == '#text') {
//             //do nothing
//         } else {
//             getComment(commentNode, fetchData.postDataComments);
//         }
//     });
// }

// //檢查留言列表dom節點是否為空若為空就終止
// function checkCommentsNodeHasChild(node) {
//     let check = true;

//     if (!node || !node.hasChildNodes()) {
//         check = false;
//     }

//     if (check) {
//         let commentChildNode = node.childNodes;
//         if (
//             commentChildNode.length == 0 ||
//             !commentChildNode ||
//             !commentChildNode[0].querySelector('div')
//             //li[0].querySelector("div").getAttribute("aria-label")
//         ) {
//             check = false;
//         }
//     }

//     return check;
// }

// /**
//  * - 取得留言內容 commentNode(留言完整節點) > commitComentNode(排除頭像) > messageNode(真正的文字節點)
//  * @param {node} commentNode - 留言節點
//  * @param {object} postDataComments - 留言內容籃子(push)
//  * @returns
//  */
// function getComment(commentNode, postDataComments) {
//     let commitCommentNode = getCommitCommentNode(1, commentNode);
//     if (!commitCommentNode) return;

//     let fbNameUrl = commitCommentNode.querySelector('a').href;
//     let commenterName = getCommenterName(1, commitCommentNode);
//     let commenterObj = getCommentInfoObj(1, fbNameUrl);
//     let fb_comment_from_id = commenterObj.id;
//     let fb_comment_from_nickname = commenterObj.nickname;

//     let message = getCommentMessage(1, commitCommentNode);
//     let commenturl = getCommentUrl(1, commentNode);
//     let id = getCommentId(1, commenturl);

//     //如果沒有完成勾勾，顯示備份中.. css
//     if (!commitCommentNode.querySelector('.buy_1_backend')) {
//         let span = document.createElement('span');
//         span.innerHTML += htmlTable.import;
//         commitCommentNode.after(' ');
//         commitCommentNode.innerHTML += htmlTable.import;
//     }

//     fbNameUrl =
//         fbNameUrl.indexOf('/?__cft__') != -1
//             ? fbNameUrl.split('/?__cft__')[0].replace('https://www.facebook.com', '')
//             : '';

//     let data = {
//         fb_user_name: encodeURI(commenterName),
//         fb_comment_from_id: encodeURI(fb_comment_from_id),
//         fb_comment_message: encodeURI(message.trim()),
//         fbnameurl: encodeURI(fbNameUrl),
//         fb_created_time: '',
//         fb_comment_from_nickname: encodeURI(fb_comment_from_nickname),
//         commenturl: encodeURI(commenturl),
//     };
//     //封鎖問題
//     if (fbNameUrl != '') {
//         if ([].indexOf(commenturl) !== -1) {
//             // 已存在不做事
//         } else {
//             postDataComments.push(data);
//             [].push(commenturl);
//         }
//     }

//     fetchChildCommentListByCommentNode(commentNode, postDataComments);

//     //這個看起來像是尋找本層有沒有漏找的留言?
//     if (commentNode.querySelectorAll('ul').length > 2) {
//         let fetchData = {
//             node: commentNode.querySelectorAll('ul')[1],
//             postDataComments: postDataComments,
//         };
//         fetchCommentsList(1, fetchData);
//     }
//     return;
// }

// /**
//  * - 找尋下一層留言節點
//  * @param {node} commentNode - 留言節點
//  * @param {object} postDataComments - 留言物件push
//  * @returns
//  */
// function fetchChildCommentListByCommentNode(commentNode, postDataComments) {
//     for (let i = 0; i < classTable.oneCommentClass.length; i++) {
//         let oneCommentClass = classTable.oneCommentClass[i];
//         let oneCommentByCommentNode = commentNode.querySelector(oneCommentClass);
//         if (oneCommentByCommentNode) {
//             //現在在第一層
//             fetchUnderOneCommentsListByCommentNode(oneCommentByCommentNode, postDataComments);
//         } else if (oneCommentByCommentNode == null) {
//             //找不到第一層的node，就去找第二層
//             fetchUnderSecondCommentsListByCommentNode(commentNode, postDataComments);
//         }
//     }

//     return;
// }

// //處理第一層下的所有回覆
// function fetchUnderOneCommentsListByCommentNode(commentNode, postDataComments) {
//     if (commentNode.childNodes[1].childNodes.length > 0) {
//         let fetchData = {
//             node: commentNode.childNodes[1],
//             postDataComments: postDataComments,
//         };
//         fetchCommentsList(1, fetchData);
//     }
//     return;
// }

// //處理第二層下的所有回覆
// function fetchUnderSecondCommentsListByCommentNode(commentNode, postDataComments) {
//     let allSecondComment = [];
//     let querySelect = '.x78zum5 .xdt5ytf';
//     // let querySelect = ".x1n2onr6 .x1xb5h2r"  //他是子層不能同時query喔！會重複抓取
//     if (commentNode.querySelectorAll(querySelect)) {
//         allSecondComment = commentNode.querySelectorAll(querySelect);
//         for (let second_temp = 0; second_temp < allSecondComment.length; second_temp++) {
//             if (allSecondComment[second_temp].childNodes.length > 0) {
//                 let secondCommentChildNodesLength = allSecondComment[second_temp].childNodes.length;
//                 let fetchData = {
//                     node: allSecondComment[second_temp].childNodes[
//                         secondCommentChildNodesLength - 1
//                     ],
//                     postDataComments: postDataComments,
//                 };
//                 fetchCommentsList(1, fetchData);
//             }
//         }
//     }
//     return;
// }

// /**
//  * 取得留言的form id
//  * @param {integer} funcType - 使用方法
//  * @param {string} commentUrl - 留言的url
//  * @returns {string}
//  */
// function getCommentId(funcType, commentUrl) {
//     let id = '';
//     switch (funcType) {
//         case 1:
//             id = this.getCommentIdByUrlSplitWord(commentUrl);
//             break;
//     }
//     return id;
// }

// /**
//  * - 取得留言的a_link
//  * @param {integer} funcType - 使用方法
//  * @param {node} commentNode - 注入節點
//  * @returns {string} - 留言的a_link
//  */
// function getCommentUrl(funcType, commentNode) {
//     let commentUrl = '';
//     switch (funcType) {
//         case 1:
//             commentUrl = getCommentUrlFromCommentTimeByCommentNode(commentNode);
//             break;
//     }
//     return commentUrl;
// }

// //從留言的時間超連結找出留言url
// function getCommentUrlFromCommentTimeByCommentNode(commentNode) {
//     let commentUrl = '';
//     //找留言時間的dom
//     let tmpPostTime = null;
//     for (let i = 0; i < classTable.postTimeID.length; i++) {
//         const element = classTable.postTimeID[i];
//         tmpPostTime = commentNode.querySelector(element);
//         if (tmpPostTime) break;
//     }

//     if (tmpPostTime) {
//         commentUrl =
//             tmpPostTime.href.indexOf('&__cft__') != -1 ? tmpPostTime.href.split('&__cft__')[0] : '';
//     } else {
//         commentUrl = '';
//     }

//     return commentUrl;
// }

// /**
//  *  - 取得留言者realId or nickName
//  * @param {integer} funcType - 使用方法
//  * @param {string} fbNameUrl - 注入節點
//  * @returns {obj} - 留言者的id，小名
//  */
// function getCommentInfoObj(funcType, fbNameUrl) {
//     let commenter = {
//         id: '',
//         nickname: '',
//     };
//     try {
//         switch (funcType) {
//             case 1:
//                 commenter = getCommenterIdAndNicknameFromNameUrl(fbNameUrl);
//                 break;
//         }
//     } catch (error) {}
//     return commenter;
// }

// //取得留言者者id與綽號
// function getCommenterIdAndNicknameFromNameUrl(fbNameUrl) {
//     let commenter = {
//         id: '',
//         nickname: '',
//     };

//     if (fbNameUrl.indexOf('user') != '-1') {
//         commenter.id = fbNameUrl.split('user')[1].split('/')[1];
//     } else if (fbNameUrl.indexOf('profile.php?') != '-1') {
//         commenter.id = fbNameUrl.split('id=')[1].split('&__cft__')[0];
//     } else {
//         commenter.nickname = fbNameUrl.split('?__cft__')[0].replace('https://www.facebook.com', '');
//     }

//     return commenter;
// }

// /**
//  * - 取得留言者名稱
//  * @param {integer} funcType - 使用方法
//  * @param {node} commitCommentNode - 注入節點
//  * @returns {string} - 留言者名稱
//  */
// function getCommenterName(funcType, commitCommentNode) {
//     let commenterName = '';
//     switch (funcType) {
//         case 1:
//             commenterName = commitCommentNode.querySelector('span').textContent;
//             break;
//     }
//     return commenterName;
// }

// /**
//  * - 取得留言者訊息
//  * @param {integer} funcType - 使用方法
//  * @param {node} commitCommentNode - 注入節點
//  * @returns {string} - 訊息
//  */
// function getCommentMessage(funcType, commitCommentNode) {
//     let message = '';
//     switch (funcType) {
//         case 1:
//             message = getMessageByMessageNode(
//                 getCommentMsgNodeByCommitCommentNode,
//                 commitCommentNode,
//             );
//             break;
//     }
//     return message;
// }

// //從留言的node中找出留言內容的區塊
// function getCommentMsgNodeByCommitCommentNode(commitCommentNode) {
//     let textNode = null;
//     for (let i = 0; i < classTable.postCommitContent.length; i++) {
//         const element = classTable.postCommitContent[i];
//         textNode = commitCommentNode.querySelector(element);
//         if (textNode) break;
//     }
//     return textNode;
// }

// /**
//  *
//  * @param {Function} msgFetcher - 用來取得留言的方法
//  * @param {node} commitCommentNode - 注入節點
//  * @returns {string} - 留言內容
//  */
// function getMessageByMessageNode(msgFetcher, commitCommentNode) {
//     let message = '';
//     let messageNode = msgFetcher(commitCommentNode);
//     if (messageNode) {
//         messageNode.childNodes.forEach((textNode) => {
//             message += textNode.innerText + '\n\n';
//         });
//     }
//     return message;
// }

// /**
//  * - 往下找到更精準的留言區塊(排除頭像)
//  * @param {integer} funcType - 使用方法
//  * @param {*} commentNode - 使用者留言的節點
//  * @returns {node} - 排除使用者頭像更精準的留言節點
//  */
// function getCommitCommentNode(funcType, commentNode) {
//     let commitCommentNode = null;
//     switch (funcType) {
//         case 1:
//             commitCommentNode = getCommmitCommentNodeByCommentNode(commentNode);
//             break;
//     }
//     return commitCommentNode;
// }

// //取得留言區塊排除頭像
// function getCommmitCommentNodeByCommentNode(commentNode) {
//     let commitCommentNode = null;
//     for (let i = 0; i < classTable.postCommitNode.length; i++) {
//         const nodeClass = classTable.postCommitNode[i];
//         commitCommentNode = commentNode.querySelector(nodeClass);
//         if (commitCommentNode) break;
//     }
//     return commitCommentNode;
// }

// //取得社團名稱div資訊
// async function getGroupNameClass() {
//     let groupName = null;
//     //取社團名稱(用社團名稱超連結的CSS)
//     /*
//     /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[1]/div[2]/div/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/h1/span/a
//     */
//     for (let i = 0; i < classTable.group_name.length; i++) {
//         const groupNameNode = classTable.group_name[i];
//         groupName = document.querySelector(groupNameNode);
//         if (groupName) break;
//     }
//     return groupName;
// }

// /**
//  *
//  * @param {Node} targetNode 目標節點
//  * @returns {Node} 返回找到的節點
//  */
// function getTargetFromClassTablePost(targetNode) {
//     let target = null;
//     for (let i = 0; i < classTable.postClass.length; i++) {
//         target = targetNode.querySelectorAll(classTable.postClass[i]);
//         console.log('target:', targetNode, target, classTable.postClass[i]);
//         if (target.length > 0) break;
//     }
//     console.log('getTargetFromClassTablePost:', target, targetNode, classTable.postClass);
//     return target;
// }

// function getTargetPostClassFromDocumentBody() {
//     let postClass = getTargetFromClassTablePost(document.querySelector('body'));
//     console.log('postClass:', postClass);
//     return postClass;
// }

// function content(selector) {
//     const nodes = getTargetPostClassFromDocumentBody();
//     console.log('content:', nodes, selector);
//     let contentNodes = nodes.querySelector(selector);
//     return getContentText(contentNodes);
// }

// function getContentText(contentNode) {
//     console.log('getContentText:', contentNode);
//     if (contentNode !== null) {
//         if (contentNode.hasChildNodes()) {
//             let text = '';
//             contentNode.childNodes.forEach((element) => {
//                 text += getContentText(element);
//             });

//             if (contentNode.tagName != undefined && contentNode.tagName == 'DIV') {
//                 text += '\n';
//             }
//             return text;
//         } else if (!contentNode.hasChildNodes() && contentNode.tagName == 'BR') {
//             return '\n';
//         } else {
//             return contentNode.textContent;
//         }
//     }

//     return '';
// }

// function getContentFn() {
//     for (let i = 0; i < classTable.postContent.length; i++) {
//         let contentElement = classTable.postContent[i];
//         console.log('contentElement1:', contentElement);
//         const text = content(contentElement);
//         console.log('contentElement:', contentElement, text);
//         if (text && text.trim() != '點擊可標註商品') {
//             return text;
//         }
//     }

//     return '';
// }

/////////// content
//   // 取得 Header的資訊
//   async function getPostHeader() {
//     let postGroupInfo = postData.group_info
//     //用PO文人的姓名超連結取的PO文人ID

//     let postOwnerId = await getPostOwnerId()

//     postGroupInfo.fb_user_id = postOwnerId

//     let pageNameClass = await getPageNameClass()

//     let pageName = null
//     if(pageNameClass) {
//       pageName = pageNameClass.querySelector('strong')
//     }
//     try {
//       postGroupInfo.fb_group_name = pageName.textContent
//     } catch (error) { }
//     postGroupInfo.fb_user_name = postData.author.name

//     let fbPostNumInfoObj = await getPostNumInfo(1)

//     if(fbPostNumInfoObj.num) {
//       postGroupInfo.fb_post_num_new = fbPostNumInfoObj.num
//     } else {
//       // console.log('lost post num')
//     }

//     postGroupInfo.posturl = getRealPostUrl();
//     postGroupInfo.fb_post_id = postGroupInfo.fb_group_id + "_" + postGroupInfo.fb_post_num_new
//     postGroupInfo.time_obj = await getCreationTime(1)
//   }

// 取得貼文url
// function getPostUrl() {
//     const url = getPostUrlFromComment();
//     if (url) return url;

//     const header = getHeader();
//     let postUrl = null;
//     if (header && header.href) {
//         let hasPosts = header.href.match('.*/posts/.+');
//         let hasStory = header.href.match('.*?story_fbid=.+');
//         let hasVideos = header.href.match('.*/videos/.+');
//         if (hasPosts) {
//             postUrl = hasPosts[0];
//         } else if (hasStory) {
//             postUrl = hasStory[0];
//         } else if (hasVideos) {
//             postUrl = hasVideos[0];
//         }
//     }
//     return postUrl;
// }

// // 從留言時間取得貼文url
// function getPostUrlFromComment() {
//     let postUrl = null;
//     for (const commentTimeNode of classTable.pageCommentTime) {
//         const commentTimeClass = postCommit.querySelector(commentTimeNode);
//         if (commentTimeClass && commentTimeClass.href) {
//             let hasPosts = commentTimeClass.href.match('.*/posts/.+');
//             let hasStory = commentTimeClass.href.match('.*?story_fbid=.+');
//             let hasVideos = commentTimeClass.href.match('.*/videos/.+');
//             if (hasPosts) {
//                 postUrl = hasPosts[0];
//             } else if (hasStory) {
//                 postUrl = hasStory[0];
//             } else if (hasVideos) {
//                 postUrl = hasVideos[0];
//             }
//         }
//     }
//     return postUrl;
// }

// function getHeader(i) {
//     let node = postHeader
//     let header = ''

//     let headerHtml =
//       node.querySelectorAll("div.xu06os2.x1ok221b span.x4k7w5x.x1h91t0o a.x1i10hfl");

//     const pageUrlRegex = /^https\:\/\/www\.facebook\.com\/[^\/]+\/?\?.+$/;
//     for (let i = 0; i < headerHtml.length; i++) {
//       let isPageUrl = pageUrlRegex.test(headerHtml[i]);
//       if (headerHtml[i].href.search("posts") != -1) {
//         header = headerHtml[i];
//         break;
//       }
//       // Facebook 將連結網址隱藏起來，直到滑鼠連結上。
//       if (headerHtml[i].href.slice(-1) == "#") {
//         header = headerHtml[i];
//         break;
//       }
//       if (headerHtml[i].href.search("permalink") != -1) {
//         header = headerHtml[i];
//         break;
//       }

//       if (isPageUrl) {
//         header = headerHtml[i];
//         break;
//       }
//       if (headerHtml[i].href.search("videos") != -1) {
//         header = headerHtml[i];
//         break;
//       }

//     }

//     return header
//   }

// /**
//  *
//  * @param {function} domFetcher - 要從哪裡抓取字符
//  * @param {string} str - 要搜索的字。
//  * @returns {string} - 返回找到的组ID
//  */
// function getGroupIDFromScript(domFetcher, str) {
//     let id = '';

//     const firstScript = domFetcher(str);

//     if (firstScript) {
//         let start = firstScript.textContent.indexOf(str);
//         id = firstScript.textContent.substr(start + str.length).split('"')[0];
//     }

//     return id;
// }

// function getTargetDomFromDocumentScripts(str) {
//     const documentScripts = document.querySelectorAll('script');

//     for (let i = 0; i < documentScripts.length; i++) {
//         let scriptDom = documentScripts[i];
//         let start = scriptDom.textContent.indexOf(str);
//         if (start !== -1) return scriptDom;
//     }

//     return '';
// }

// function getGroupIDFromMeta(str) {
//     let groupId = '';
//     const documentScripts = document.getElementsByTagName('meta');
//     for (let i = 0; i < documentScripts.length; i++) {
//         if (documentScripts[i].getAttribute('property') == 'al:android:url') {
//             groupId = documentScripts[i].getAttribute('content').replace('fb://group/', '');
//             break;
//         }
//     }
//     return groupId;
// }

// function getGroupID() {
//     let groupId = '';
//     const searchStrings = ["{'groupID':'", '"groupID":"'];
//     try {
//         for (const str of searchStrings) {
//             if (groupId) {
//                 break;
//             }
//             groupId = getGroupIDFromScript(getTargetDomFromDocumentScripts, str);
//             if (!groupId) {
//                 groupId = getGroupIDFromMeta(str);
//             }
//         }
//     } catch (error) {
//         console.error(error);
//     }
//     return groupId;
// }

// function getUserID() {
//     let userId = '';
//     try {
//         let str = '"USER_ID":"';
//         userId = getUserIDFromScript(getTargetDomFromDocumentScripts, str);
//     } catch (error) {}
//     return userId;
// }

// /**
//  *
//  * @param {function} domFetcher - 要從哪裡抓取字符
//  * @param {string} str - 要搜索的字
//  * @returns {string} - 返回找到的组ID
//  */
// function getUserIDFromScript(domFetcher, str) {
//     let userId = '';
//     const firstScript = domFetcher(str);
//     if (firstScript) {
//         let start = firstScript.textContent.indexOf(str);
//         userId = firstScript.textContent.substr(start + str.length).split('"')[0];
//     }
//     return userId;
// }
