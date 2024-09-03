import React from 'react';
import { createRoot } from 'react-dom/client';
import ActionPanel from './components/ActionPanel';
import { sendMessage } from 'webext-bridge';
import './style.scss';
import { classTable } from './ClassTable';
import { htmlTable } from './HtmlTable';

// Intercept fetch requests
try {
    if (isFacebookPostUrl(window.location.href)) {
        const div = document.createElement('div');
        document.body.appendChild(div);
        const root = createRoot(div);
        root.render(<ActionPanel />);
    }
} catch (e) {
    console.log('error:', e);
}

export async function switchContentState(node) {
    const commitstats = await getCommitSwitchNode(node);
    let textcontent = '';
    try {
        textcontent = commitstats.textContent;
    } catch (e) {}

    let doCheckMoreComment = false;

    if (textcontent.indexOf('最相關') != -1 || textcontent.indexOf('最熱門留言') != -1) {
        doCheckMoreComment = true;
    }

    if (doCheckMoreComment) {
        await commitstats.click();
        let selectCommitShowTmpBtn = getCommitSortListBtn(1);
        await selectCommitShowTmpBtn.click();
    }
}

function isFacebookPostUrl(url: string) {
    const regexPermalinkAndPost =
        /^https:\/\/www\.facebook\.com\/groups\/.+?\/permalink\/[0-9]+\/?$/;
    const regexPost = /^https:\/\/www\.facebook\.com\/groups\/.+?\/posts\/[0-9]+\/?$/;
    const regrexPrivatePermalinkAndPost =
        /https:\/\/www\.facebook\.com\/groups\/.+?\/permalink\/\d+\//;
    const regrexPrivatePost = /https:\/\/www\.facebook\.com\/groups\/.+?\/posts\/\d+\//;

    const res =
        regexPermalinkAndPost.test(url) ||
        regexPost.test(url) ||
        regrexPrivatePermalinkAndPost.test(url) ||
        regrexPrivatePost.test(url);
    return res;
}

//取得貼文者的Id
export async function getPostOwner() {
    let postOwnerId = '';

    const targetElement = getTargetPostClassFromDocumentBody()[0];
    let postHeaderClass = targetElement.querySelectorAll('div.xu06os2.x1ok221b a.x1i10hfl');
    for (let i = 0; i < postHeaderClass.length; i++) {
        if (postHeaderClass[i].href.search('user') != -1) {
            postOwnerId = postHeaderClass[i].href.split('user')[1].split('/')[1];
            break;
        }
    }

    if (!postOwnerId) {
        for (let i = 0; i < postHeaderClass.length; i++) {
            if (postHeaderClass[i].href.search('profile.php?') != -1) {
                postOwnerId = postHeaderClass[i].href.split('id=')[1].split('&__cft__')[0];
                break;
            }
        }
    }
    let postOwnerName = targetElement.querySelector(
        'a.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1sur9pj.xkrqix3.xzsf02u.x1s688f',
    );

    return { name: postOwnerName ? postOwnerName.textContent : '', id: postOwnerId };
}

/**
 * - 取得貼文建立時間
 * @param {integer} funcType 使用的方法
 * @returns {Promise<string>} 時間字串
 */
export async function getCreationTime(funcType: number) {
    let timeText = '';
    switch (funcType) {
        case 1:
            timeText = await getCreationTimeByPostHtml();
            break;
    }

    return timeText;
}

// 取得FB顯示留言長度
export function getFBCommitLength() {
    let commitClass;
    const targetElement = getTargetPostClassFromDocumentBody()[0];
    for (const postCommitDiv of classTable.postCommitDiv) {
        commitClass = targetElement.parentNode.parentNode.querySelector(postCommitDiv);
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
        for (let i = 0; i < classTable.pageFBPostCommit.length; i++) {
            const element = classTable.pageFBPostCommit[i];
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

export async function getCreationTimeByPostHtml() {
    let postHtml = await getPostHtml();
    if (postHtml && postHtml.indexOf('publish_time\\":') != -1) {
        return postHtml.split('publish_time\\":')[1].split(',')[0];
    }

    return '';
}

export async function getPostHtml() {
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

export function getAuthorFromClass() {
    //不要異動到外層的author
    let classAuthor = {
        id: '',
        name: '',
    };

    // 作者的連結
    const author_link = document.querySelector('a[href="/me/"]');
    if (author_link) {
        classAuthor.id = getUserID();
        classAuthor.name = author_link.textContent;
    }
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

export function getUserID() {
    let userId = '';
    try {
        let str = '"USER_ID":"';
        userId = getUserIDFromScript(getTargetDomFromDocumentScripts, str);
    } catch (error) {}
    return userId;
}

function getGroupIDFromMeta(str) {
    let groupId = '';
    const documentScripts = document.getElementsByTagName('meta');
    for (let i = 0; i < documentScripts.length; i++) {
        if (documentScripts[i].getAttribute('property') == 'al:android:url') {
            groupId = documentScripts[i].getAttribute('content').replace('fb://group/', '');
            break;
        }
    }
    return groupId;
}

export function getGroupID() {
    let groupId = '';
    const searchStrings = ["{'groupID':'", '"groupID":"'];
    try {
        for (const str of searchStrings) {
            if (groupId) {
                break;
            }
            groupId = getGroupIDFromScript(getTargetDomFromDocumentScripts, str);
            if (!groupId) {
                groupId = getGroupIDFromMeta(str);
            }
        }
    } catch (error) {
        console.error(error);
    }
    return groupId;
}

/**
 *
 * @param {function} domFetcher - 要從哪裡抓取字符
 * @param {string} str - 要搜索的字。
 * @returns {string} - 返回找到的组ID
 */
function getGroupIDFromScript(domFetcher, str) {
    let id = '';

    const firstScript = domFetcher(str);

    if (firstScript) {
        let start = firstScript.textContent.indexOf(str);
        id = firstScript.textContent.substr(start + str.length).split('"')[0];
    }

    return id;
}

/**
 *
 * @param {function} domFetcher - 要從哪裡抓取字符
 * @param {string} str - 要搜索的字
 * @returns {string} - 返回找到的组ID
 */
export function getUserIDFromScript(domFetcher, str) {
    let userId = '';
    const firstScript = domFetcher(str);
    if (firstScript) {
        let start = firstScript.textContent.indexOf(str);
        userId = firstScript.textContent.substr(start + str.length).split('"')[0];
    }
    return userId;
}

export function getTargetDomFromDocumentScripts(str) {
    const documentScripts = document.querySelectorAll('script');

    for (let i = 0; i < documentScripts.length; i++) {
        let scriptDom = documentScripts[i];
        let start = scriptDom.textContent.indexOf(str);
        if (start !== -1) return scriptDom;
    }

    return '';
}

/**
 * - 取得切換留言排序的節點
 * @param {node} nodes - 搜尋的節點
 * @returns {node} - 切換留言的節點
 */
export function getCommitSwitchNode(nodes) {
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

export function getUserInfoSearchUserIDByScript(scriptStringList) {
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
export function getAccountUsersByScriptStringList(scriptStringList) {
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

export function extractUserStringByAccountUser(scriptString) {
    const userStringStart = scriptString.search('"account_user');
    const userStringEnd = scriptString.search('"extensions');

    if (userStringStart > 0 && userStringEnd > 0) {
        const userStringLength = userStringEnd - userStringStart - 3;
        return scriptString.substr(userStringStart, userStringLength);
    }

    return null;
}

export function getAccountUsersAtBottomUserByScriptStringList(scriptStringList) {
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

export function extractUserStringByBottomUser(scriptString) {
    const userStringStart = scriptString.search('&__user=');
    const userStringEnd = scriptString.search('&__comet_req=');

    if (userStringStart > 0 && userStringEnd > 0) {
        const userStringLength = userStringEnd - userStringStart;
        const userString = scriptString.substr(userStringStart, userStringLength);
        return userString.replace('&__user=', '');
    }

    return null;
}

export async function fetchComments() {
    const targetElement = getTargetPostClassFromDocumentBody()[0];
    // let node = document.querySelector('body'); // this.postHeader
    let target = targetElement.parentNode.parentNode; // this.postHeader
    let node;

    while (!node) {
        for (const pagePostCommitClass of classTable.pagePostCommitDiv) {
           
            const pagePostCommitDiv = target.querySelector(pagePostCommitClass);
            if (pagePostCommitDiv) {
                node = pagePostCommitDiv;
                break;
            }
        }
    }
    
    const comments = await fetchCommentsList(node);
    if (comments) return comments;
}

export async function fetchCommentsList(node) {
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

    let oneComments = '';
    const res: any[] = [];
    for (const OneCommentDiv of classTable.OneCommentDiv) {
        oneComments = unorderedList.querySelectorAll('div' + OneCommentDiv);
        if (oneComments) {
            break;
        }
    }

    if (oneComments) {
        let curCommentsList = [];

        oneComments.forEach((item, index) => {
            curCommentsList.push(item);
        });
        const hasMore = await check(node, null);

        if (hasMore) {
            return fetchCommentsList(node);
        } else {
            let res = [];
            curCommentsList = curCommentsList.filter((item) => {
                return (
                    item.classList.contains('x169t7cy') &&
                    item.classList.contains('x19f6ikt') &&
                    item.classList.length === 2
                );
            });

            curCommentsList.forEach((item, index) => {
                const filteredChildren = item.querySelectorAll(
                    '.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd',
                );

                for (let i = 0; i < filteredChildren.length; i++) {
                    const item = filteredChildren[i];
                    const itemLink = item.querySelector('a');
                    if (itemLink && itemLink.getAttribute('aria-hidden') === 'true') {
                        let fbNameUrl = item.querySelector('a').href;
                        const commentUrlAndTime = getCommentUrlFromCommentTimeByCommentNode(item);

                        const comment = {
                            message: getCommentMessage(1, item),
                            url: commentUrlAndTime.commentUrl,
                            id: getCommentId(1, commentUrlAndTime.commentUrl),
                            time: commentUrlAndTime.commentTime,
                            author: {
                                name: getCommenterName(1, item),
                                id: getCommentInfoObj(1, fbNameUrl).id,
                                avata: findImageUrl(item),
                            },
                        };
                        res.push(comment);
                    }
                }
            });

            const filteredArray = [];
            const idSet = new Set();

            res.forEach((obj) => {
                if (!idSet.has(obj.id)) {
                    idSet.add(obj.id);
                    filteredArray.push(obj);
                }
            });
            res = filteredArray;

            return res;
        }
    }
}

function findAllNodesByClass(node, className, results = []) {
    // Check if the current node is a 'div' with the desired class name
    if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === 'DIV' &&
        node.classList.contains(className)
    ) {
        results.push(node);
    }

    // Recursively search in each child node
    for (let child of node.children) {
        findAllNodesByClass(child, className, results);
    }

    return results;
}
export async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function check(node, resolve) {
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

    // if (checkMoreStatus && checkMoreStatus == clickMoreStatus) {
    if (checkMoreStatus && checkMoreStatus !== clickMoreStatus) {
        //找留言列表準備抓留言內容
        //if (is_load) return;
        await wait(2000);
        return true;
        // fetchCommentsList(node);
    }
    return false;

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
export function clickcheckMore(nodes) {
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
    }

    if (count != 0) {
        return true;
    } else {
        return false;
    }
}

// 檢查是否還有更多留言按鈕。
// 回傳true 表示點擊按鈕，畫面可能會變動。
export function clickMoreCommit(nodes) {
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
export function getCommitSortListBtn(funcType) {
    let selectCommitShowNewBtn = null;
    switch (funcType) {
        case 1:
            selectCommitShowNewBtn = getCommitSwitchBtn(getCommitSortListNode);
            break;
    }

    return selectCommitShowNewBtn;
}

/**
 * - 找出他切換留言顯示方式(EX:最新，最相關，即時留言)
 * @param {function} nodeFetcher - 注入選擇節點的方法
 * @returns {node} 返回目標btn Node
 */
export function getCommitSwitchBtn(nodeFetcher) {
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

    return switchNewBtn;
}

//commitSortList 是找出他是找出他切換留言顯示方式的框框
export function getCommitSortListNode() {
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

    return commitSortList;
}

//取得留言者者id與綽號
export function getCommenterIdAndNicknameFromNameUrl(fbNameUrl) {
    let commenter = {
        id: '',
        nickname: '',
    };

    if (fbNameUrl.indexOf('user') != '-1') {
        commenter.id = fbNameUrl.split('user')[1].split('/')[1];
    } else if (fbNameUrl.indexOf('profile.php?') != '-1') {
        commenter.id = fbNameUrl.split('id=')[1].split('&__cft__')[0];
    } else {
        commenter.nickname = fbNameUrl.split('?__cft__')[0].replace('https://www.facebook.com', '');
    }

    return commenter;
}

//從留言的node中找出留言內容的區塊
export function getCommentMsgNodeByCommitCommentNode(commitCommentNode) {
    let textNode = null;
    for (let i = 0; i < classTable.postCommitContent.length; i++) {
        const element = classTable.postCommitContent[i];
        textNode = commitCommentNode.querySelector(element);
        if (textNode) break;
    }

    return textNode;
}

//從留言的時間超連結找出留言url
export function getCommentUrlFromCommentTimeByCommentNode(commentNode) {
    let commentUrl = '';
    //找留言時間的dom
    let tmpPostTime = null;
    for (let i = 0; i < classTable.postTimeID.length; i++) {
        const element = classTable.postTimeID[i];
        tmpPostTime = commentNode.querySelector(element);
        if (tmpPostTime) break;
    }

    let commentTime = 'unknown';

    if (tmpPostTime) {
        commentUrl =
            tmpPostTime.href.indexOf('&__cft__') != -1 ? tmpPostTime.href.split('&__cft__')[0] : '';

        const postTimeNode = tmpPostTime.querySelector('span');

        if (postTimeNode) {
            commentTime = parseTimeInput(postTimeNode.textContent);
        }
    } else {
        commentUrl = '';
    }

    return { commentUrl, commentTime };
}

function parseTimeInput(input) {
    // Get the number from the input
    const timeValue = parseInt(input, 10);
    // Determine the unit and convert accordingly
    if (input.includes('分鐘') || input.includes('m')) {
        return formatDate(new Date(Date.now() - timeValue * 60 * 1000)); // minutes
    } else if (input.includes('小時') || input.includes('h')) {
        return formatDate(new Date(Date.now() - timeValue * 60 * 60 * 1000)); // hours
    } else if (input.includes('天') || input.includes('d')) {
        return formatDate(new Date(Date.now() - timeValue * 24 * 60 * 60 * 1000)); // days
    } else if (input.includes('週') || input.includes('w')) {
        return formatDate(new Date(Date.now() - timeValue * 7 * 24 * 60 * 60 * 1000)); // weeks
    } else if (input.includes('年') || input.includes('y')) {
        return formatDate(new Date(Date.now() - timeValue * 365 * 24 * 60 * 60 * 1000)); // years
    } else {
        return 'unknown';
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * - 往下找到更精準的留言區塊(排除頭像)
 * @param {integer} funcType - 使用方法
 * @param {*} commentNode - 使用者留言的節點
 * @returns {node} - 排除使用者頭像更精準的留言節點
 */
export function getCommitCommentNode(funcType, commentNode) {
    let commitCommentNode = null;
    switch (funcType) {
        case 1:
            commitCommentNode = getCommmitCommentNodeByCommentNode(commentNode);
            break;
    }
    return commitCommentNode;
}

//取得留言區塊排除頭像
export function getCommmitCommentNodeByCommentNode(commentNode) {
    let commitCommentNode = null;
    for (let i = 0; i < classTable.postCommitNode.length; i++) {
        const nodeClass = classTable.postCommitNode[i];
        commitCommentNode = commentNode.querySelector(nodeClass);
        if (commitCommentNode) break;
    }
    return commitCommentNode;
}

/**
 * - 找尋下一層留言節點
 * @param {node} commentNode - 留言節點
 * @param {object} postDataComments - 留言物件push
 * @returns
 */
export function fetchChildCommentListByCommentNode(commentNode, postDataComments) {
    for (let i = 0; i < classTable.oneCommentClass.length; i++) {
        let oneCommentClass = classTable.oneCommentClass[i];
        let oneCommentByCommentNode = commentNode.querySelector(oneCommentClass);
        if (oneCommentByCommentNode) {
            //現在在第一層

            fetchUnderOneCommentsListByCommentNode(oneCommentByCommentNode, postDataComments);
        } else if (oneCommentByCommentNode == null) {
            //找不到第一層的node，就去找第二層

            fetchUnderSecondCommentsListByCommentNode(commentNode, postDataComments);
        }
    }

    return;
}

//處理第一層下的所有回覆
export function fetchUnderOneCommentsListByCommentNode(commentNode, postDataComments) {
    if (commentNode.childNodes[1].childNodes.length > 0) {
        let fetchData = {
            node: commentNode.childNodes[1],
            postDataComments: postDataComments,
        };
        fetchCommentsList(1, fetchData);
    }
    return;
}

// //處理第二層下的所有回覆
// export function fetchUnderSecondCommentsListByCommentNode(commentNode, postDataComments) {
//     let allSecondComment = [];
//     let querySelect = '.x169t7cy .x19f6ikt';
//     // let querySelect = ".x1n2onr6 .x1xb5h2r"  //他是子層不能同時query喔！會重複抓取
//     console.log('fetchUnderSecondCommentsListByCommentNode')
//     if (commentNode.querySelectorAll(querySelect)) {
//         console.log('fetchUnderSecondCommentsListByCommentNode invoked1')
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

//處理第二層下的所有回覆
function fetchUnderSecondCommentsListByCommentNode(commentNode, postDataComments) {
    let allSecondComment = [];
    let querySelect = '.x169t7cy .x19f6ikt';
    // let querySelect = ".x1n2onr6 .x1xb5h2r"  //他是子層不能同時query喔！會重複抓取

    if (commentNode.querySelectorAll(querySelect)) {
        allSecondComment = commentNode.querySelectorAll(querySelect);
        for (let second_temp = 0; second_temp < allSecondComment.length; second_temp++) {
            if (allSecondComment[second_temp].childNodes.length > 0) {
                let secondCommentChildNodesLength = allSecondComment[second_temp].childNodes.length;
                let fetchData = {
                    node: allSecondComment[second_temp].childNodes[
                        secondCommentChildNodesLength - 1
                    ],
                    postDataComments: postDataComments,
                };

                fetchCommentsList(
                    allSecondComment[second_temp].childNodes[secondCommentChildNodesLength - 1],
                );
            }
        }
    }
    return;
}

/**
 * - 取得留言者名稱
 * @param {integer} funcType - 使用方法
 * @param {node} commitCommentNode - 注入節點
 * @returns {string} - 留言者名稱
 */
export function getCommenterName(funcType, commitCommentNode) {
    let commenterName = '';
    switch (funcType) {
        case 1:
            commenterName = getCommenterNameByMsgClassCommitNode(commitCommentNode);
            break;
    }
    return commenterName;
}

export function getCommenterNameByMsgClassCommitNode(commitCommentNode) {
    let commenterName = '';

    for (let i = 0; i < classTable.pageMsgName.length; i++) {
        let commentNameElement = commitCommentNode.querySelector(
            'span' + classTable.pageMsgName[i],
        );
        if (commentNameElement) {
            try {
                commenterName = commentNameElement.textContent;
            } catch (error) {}
        }
        if (commenterName) break;
    }
    return commenterName;
}

/**
 * - 取得留言者訊息
 * @param {integer} funcType - 使用方法
 * @param {node} commitCommentNode - 注入節點
 * @returns {string} - 訊息
 */
export function getCommentMessage(funcType, commitCommentNode) {
    let message = '';
    switch (funcType) {
        case 1:
            message = getMessageByMessageNode(
                getCommentMsgNodeByCommitCommentNode,
                commitCommentNode,
            );
            break;
    }
    return message;
}

/**
 *
 * @param {Function} msgFetcher - 用來取得留言的方法
 * @param {node} commitCommentNode - 注入節點
 * @returns {string} - 留言內容
 */
export function getMessageByMessageNode(msgFetcher, commitCommentNode) {
    let message = '';
    let messageNode = msgFetcher(commitCommentNode);
    if (messageNode) {
        messageNode.childNodes.forEach((textNode) => {
            message += textNode.innerText + '\n\n';
        });
    }
    return message;
}

/**
 *  - 取得留言者realId or nickName
 * @param {integer} funcType - 使用方法
 * @param {string} fbNameUrl - 注入節點
 * @returns {obj} - 留言者的id，小名
 */
export function getCommentInfoObj(funcType, fbNameUrl) {
    let commenter = {
        id: '',
        nickname: '',
    };
    try {
        switch (funcType) {
            case 1:
                commenter = getCommenterIdAndNicknameFromNameUrl(fbNameUrl);
                break;
        }
    } catch (error) {}
    return commenter;
}

/**
 * - 取得留言的a_link
 * @param {integer} funcType - 使用方法
 * @param {node} commentNode - 注入節點
 * @returns {string} - 留言的a_link
 */
export function getCommentUrl(funcType, commentNode) {
    let commentUrl = '';
    switch (funcType) {
        case 1:
            commentUrl = getCommentUrlFromCommentTimeByCommentNode(commentNode);
            break;
    }
    return commentUrl;
}

/**
 * 取得留言的form id
 * @param {integer} funcType - 使用方法
 * @param {string} commentUrl - 留言的url
 * @returns {string}
 */
export function getCommentId(funcType, commentUrl) {
    let id = '';
    switch (funcType) {
        case 1:
            id = getCommentIdByUrlSplitWord(commentUrl);
            break;
    }
    return id;
}

export function getCommentIdByUrlSplitWord(url) {
    let id;

    if (url.indexOf('&reply_comment_id=') != -1) {
        id = url.split('&reply_comment_id=')[1].split('&')[0];
    } else if (url.indexOf('?comment_id=') !== -1) {
        id = url.split('?comment_id=')[1].split('&')[0];
    }
    return id;
}

/**
 * - 遞迴留言列表的每個留言節點(含有頭像的)
 * @param {object} fetchData - 節點物件跟留言內容的籃子
 * @returns
 */
export function fetchByCommentsListNode(fetchData) {
    let commentsListNode = fetchData.childNodes;
    commentsListNode.forEach((commentNode) => {});
}

/**
 * - 取得留言者頭像連結(含有頭像的)
 * @param {node} commitCommentNode - 注入節點
 * @returns
 */
export function findImageUrl(node) {
    // Locate the element that contains the image URL using its class or other distinctive attributes
    const imageElement = node.querySelector(
        'a.x1i10hfl.x1qjc9v5.xjbqb8w.xjqpnuy.xa49m3k.xqeqjp1.x2hbi6w.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xdl72j9.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.xggy1nq.x1ja2u2z.x1t137rt.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x1q0g3np.x87ps6o.x1lku1pv.x1a2a7pz',
    );

    if (imageElement) {
        // Extract the URL from the 'xlink:href' attribute of the <image> tag inside the <svg>
        const svgImage = imageElement.querySelector('svg > g > image');
        if (svgImage) {
            return svgImage.getAttribute('xlink:href');
        }
    }
    return '';
}

// 取得貼文url
function getPostUrl() {
    const url = getPostUrlFromComment();
    if (url) return url;

    const header = getHeader();
    if (header && header.href) {
        const urlFromHeader = header.href.match('.*/posts/[0-9]+');
        if (urlFromHeader && urlFromHeader[0]) {
            return urlFromHeader[0];
        }
    }

    return null;
}

// 從留言時間取得貼文url
function getPostUrlFromComment() {
    for (const commentTimeNode of classTable.commentTime) {
        const commentTimeClass = postCommit.querySelector(commentTimeNode);
        if (commentTimeClass && commentTimeClass.href) {
            const commentTimeUrl = commentTimeClass.href.match('.*/posts/[0-9]+');
            if (commentTimeUrl && commentTimeUrl[0]) {
                return commentTimeUrl[0];
            }
        }
    }
    return null;
}

// 取得貼文header
export function getHeader(i) {
    const targetElement = getTargetPostClassFromDocumentBody()[0];
    // let node = document.querySelector('body'); // this.postHeader
    let node = targetElement.parentNode.parentNode; // this.postHeader
    let header = '';
    /*
    貼文人姓名的超連結
    /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[4]/div/div/div/div/div/div/div[1]/div/div/div/div/div/div/div/div/div/div/div[8]/div/div[2]/div/div[2]/div/div[1]/span/h3/span/span/a
    */
    let headerHtml =
        // node.querySelectorAll("div.xu06os2.x1ok221b a.x1i10hfl");
        node.querySelectorAll('div.xu06os2.x1ok221b span.x4k7w5x.x1h91t0o a.x1i10hfl');

    for (let i = 0; i < headerHtml.length; i++) {
        if (headerHtml[i].href.search('posts') != -1) {
            header = headerHtml[i];
            break;
        }
        // Facebook 將連結網址隱藏起來，直到滑鼠連結上。
        if (headerHtml[i].href.slice(-1) == '#') {
            header = headerHtml[i];
            break;
        }
        if (headerHtml[i].href.search('permalink') != -1) {
            header = headerHtml[i];
            break;
        }
        if (headerHtml[i].href.search('groups') != -1) {
            if (headerHtml[i].href.search('user') != -1) {
            } else {
                header = headerHtml[i];
                break;
            }
        }
    }

    /*
          if(typeof node.querySelector(".buofh1pr").querySelectorAll(".qzhwtbm6.knvmm38d")[i].querySelectorAll("a")[i] !="undefined"){
            header = node.querySelector(".buofh1pr").querySelectorAll(".qzhwtbm6.knvmm38d")[i].querySelectorAll("a")[i]
          } else {
            header = node.querySelector(".buofh1pr").querySelectorAll(".qzhwtbm6.knvmm38d")[i].querySelector("a")
          }
    */
    return header;
}

//取得社團名稱div資訊
export async function getGroupNameClass() {
    let groupName = null;
    //取社團名稱(用社團名稱超連結的CSS)
    /*
    /html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[1]/div[2]/div/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/h1/span/a
    */
    for (let i = 0; i < classTable.group_name.length; i++) {
        const groupNameNode = classTable.group_name[i];
        groupName = document.querySelector(groupNameNode);
        if (groupName) break;
    }
    return groupName;
}

/**
 *  - 取得本頁貼文Id url postNum
 * @param {integer} funcType - 尋找的方法
 * @param {object} postGroupInfo - 團別貼文資訊
 * @returns {object} - 返回貼文url object
 */
export async function getPostNumInfo(funcType) {
    let fbPostInfo = {
        url: '',
        num: '',
        text: '',
    };

    switch (funcType) {
        case 1:
            fbPostInfo = await getPostNumFromUrl(getPostNumFromUrlBySplitWord);
            if (fbPostInfo.num == null) {
                fbPostInfo = await getPostNumFromHeader();
            }
            break;
        case 2:
            fbPostInfo = await getPostNumFromUrl(getPostNumFromUrlBySplitWordNoPost);
            break;
    }

    fbPostInfo = fixedPostInfo(fbPostInfo);
    fbPostInfo.text = getContentFn().trim();
    return fbPostInfo;
}

async function getPostNumFromUrl(domFetcher) {
    let fbPostUrl = window.location.toString();
    let fbPostInfo = {
        url: '',
        num: '',
    };

    //嘗試在url上抓到postnum
    fbPostInfo.num = domFetcher(fbPostUrl);
    if (fbPostInfo.num) {
        fbPostInfo.url = fbPostUrl;
    }

    return fbPostInfo;
}

function getPostNumFromUrlBySplitWord(url) {
    let num = null;
    if (url !== null) {
        if (url.includes('/posts/')) {
            num = url.split('posts/')[1].split('/')[0];
        } else if (url.includes('/permalink/')) {
            num = url.split('permalink/')[1].split('/')[0];
        }
    }

    if (num != null && num.includes('?a=buyplus1__do')) {
        num = num.split('?a=buyplus1__do')[0];
    }

    return num;
}

function getPostNumFromUrlBySplitWordNoPost(url) {
    let num = null;
    if (url != null) {
        if (url.includes('/posts/')) {
            num = url.split('posts/')[1].split('/')[0];
        } else if (url.includes('/permalink/')) {
            num = url.split('permalink/')[1].split('/')[0];
        } else if (url.includes('/www.facebook.com/')) {
            num = url.split('/www.facebook.com/')[1].split('/')[0];
        }
    }

    if (num != null && num.includes('?a=buyplus1__do')) {
        num = num.split('?a=buyplus1__do')[0];
    }
    return num;
}

/**
 * 修正最後出來的fbPost物件
 * @param {object} fbPostInfo
 * @returns
 */
function fixedPostInfo(fbPostInfo) {
    if (fbPostInfo.num && fbPostInfo.num.indexOf('?comment_id') != -1) {
        fbPostInfo.num = fbPostInfo.num.split('?comment_id')[0];
    }
    return fbPostInfo;
}

async function getPostNumFromHeader() {
    let fbPostInfo = {
        url: '',
        num: '',
    };
    await getHeader(1).focus();
    if (getHeader(1).href.indexOf('?__cft__[0]=') != -1) {
        fbPostInfo.url = getHeader(1).href.split('?__cft__[0]=')[0];
        fbPostInfo.num = fbPostInfo.url.split('/').filter((el) => el != '')[5];
    }
    return fbPostInfo;
}

export const content = (selector) => {
    // let contentNodes = postContentNode.querySelector(selector);
    const targetNode = getTargetPostClassFromDocumentBody()[0].parentNode.parentNode;
    if (targetNode) {
        let contentNodes = targetNode.childNodes[2].querySelector(selector);
    }
    return getContentText(targetNode.childNodes[2]);
    //  return getContentText(contentNodes);
};

export const getContentFn = () => {
    for (let i = 0; i < classTable.postContent.length; i++) {
        let contentElement = classTable.postContent[i];
        const text = content(contentElement);
        if (text && text.trim() != '點擊可標註商品') {
            return text;
        }
    }

    return '';
};

const getContentText = (contentNode) => {
    if (contentNode !== null) {
        if (contentNode.hasChildNodes()) {
            let text = '';
            contentNode.childNodes.forEach((element) => {
                text += getContentText(element);
            });

            if (contentNode.tagName != undefined && contentNode.tagName == 'DIV') {
                text += '\n';
            }
            return text;
        } else if (!contentNode.hasChildNodes() && contentNode.tagName == 'BR') {
            return '\n';
        } else {
            return contentNode.textContent;
        }
    }

    return '';
};

//處理dom行為的function
export function getTargetPostClassFromDocumentBody() {
    const _this = this;
    let postClass = getTargetFromClassTablePost(document.querySelector('body'));
    return postClass;
}

/* @param {Node} targetNode 目標節點
 * @returns {Node} 返回找到的節點
 */
function getTargetFromClassTablePost(targetNode) {
    let target = null;
    for (let i = 0; i < classTable.postClass.length; i++) {
        target = targetNode.querySelectorAll(classTable.postClass[i]);
        if (target.length > 0) break;
    }

    return target;
}

/**
 * - 取得社團ID
 * @param {string} funcType - 使用的方法
 * @returns {string} - 返回id
 */
export function getFbGroupId(funcType) {
    let groupId = null;
    switch (funcType) {
        case 1:
            groupId = getGroupIDByStrReplace();
        default:
            break;
    }

    return groupId;
}

function getGroupIDByStrReplace() {
    const groupStr = getGroupContentFromAndroidUrl();
    const fbGroupId = groupStr.replace('fb://group/', '');
    return fbGroupId;
}

function getGroupContentFromAndroidUrl() {
    const metas = document.getElementsByTagName('meta');
    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('property') == 'al:android:url') {
            let group = metas[i].getAttribute('content');
            if (group) return group;
        }
    }
    return '';
}

/**
 *
 * @param {string} funcType - 使用的方法
 * @returns {string} - 返回id
 */
export function getfbPostNum(funcType) {
    let fbPostNum = null;
    switch (funcType) {
        case 1:
            fbPostNum = getfbPostNumFromPostUrl();
        default:
            break;
    }
    return fbPostNum;
}

function getfbPostNumFromPostUrl() {
    let fbPostNum = '';
    let fbPostUrl = window.location.toString();
    if (fbPostUrl) {
        if (fbPostUrl.indexOf('posts/') != -1) {
            fbPostNum = fbPostUrl.split('posts/')[1].split('/')[0];
        } else if (fbPostUrl.indexOf('permalink/') != -1) {
            fbPostNum = fbPostUrl.split('permalink/')[1].split('/')[0];
        }

        if (fbPostNum.indexOf('?comment_id') != -1) {
            fbPostNum = fbPostNum.split('?comment_id')[0];
        }
    }
    return fbPostNum;
}

//檢查留言列表dom節點是否為空若為空就終止
function checkCommentsNodeHasChild(node) {
    let check = true;

    if (!node || !node.hasChildNodes()) {
        check = false;
    }

    if (check) {
        let commentChildNode = node.childNodes;
        if (
            commentChildNode.length == 0 ||
            !commentChildNode ||
            !commentChildNode[0].querySelector('div')
            //li[0].querySelector("div").getAttribute("aria-label")
        ) {
            check = false;
        }
    }

    return check;
}

//  /**
//    * - 遞迴留言列表的每個留言節點(含有頭像的)
//    * @param {object} fetchData - 節點物件跟留言內容的籃子
//    * @returns
//    */
//  fetchByCommentsListNode(fetchData) {
//     if(!checkCommentsNodeHasChild(fetchData.node)) return
//     let commentsListNode = fetchData.node.childNodes
//     commentsListNode.forEach((commentNode) => {
//       if(commentNode.nodeName == "#text"){
//         //do nothing
//       } else {
//         getComment(commentNode, fetchData.postDataComments)
//       }
//     })

//   }
