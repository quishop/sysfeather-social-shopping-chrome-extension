import { sendMessage } from 'webext-bridge';
// // import { main } from './components/MainFixedWindow.js';
import './style.scss';
import { classTable } from './ClassTable';
import { htmlTable } from './HtmlTable';
// console.log(`Current page's url must be prefixed with https://www.facebook.com/`);

// Intercept fetch requests
console.log('123')
const originalFetch = window.fetch;
window.fetch = function (...args) {
    return originalFetch.apply(this, args).then((response) => {
        const clone = response.clone(); // Clone to not interfere with the stream
        clone.text().then((text) => {
            console.log(`Fetch request to ${response.url} responded with`, text);
            // Handle or log the text response here
        }).catch(error => console.error("Error reading response text", error));
        return response; // Return the original response so the page can operate normally
    }).catch(error => console.error("Fetch failed", error));
};

// Intercept XMLHttpRequest
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    this.url = url; // Save URL to use in the load event
    originalOpen.apply(this, arguments);
};

const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener('load', function () {
        console.log(`XHR request to ${this.url} responded with`, this.responseText);
        // Handle or log the responseText here
    });
    originalSend.apply(this, arguments);
};

// try {
//     if (isFacebookPostUrl(window.location.href)) {
//         let div = document.createElement('div');
//         div.id = 'myCustomUI';
//         div.innerHTML = '<h1>Hello, this is my custom UI!</h1>';
//         // Append the custom UI to the body of the page
//         document.body.appendChild(div);

//         // Optionally, inject some CSS
//         let style = document.createElement('style');

//         style.textContent = `
//             #myCustomUI {
//                 position: fixed;
//                 top: 0;
//                 right: 0;
//                 background: white;
//                 border: 1px solid black;
//                 padding: 10px;
//                 z-index: 1000;
//             }
//             `;
//         document.head.appendChild(style);

//         // getCreationTime(1).then((response) => {
//         //     const data = {
//         //         author: getAuthorFromClass(),
//         //         createTime: new Date(response * 1000),
//         //         commentsLength: getFBCommitLength(),
//         //     };
//         //     sendMessage('hello-from-content-script', data, 'background');
//         // });
//         // fetchCommentsList();
//         // for (const postCommitDiv of classTable.postCommitDiv) {
//         //     const commitClass = document.querySelector('body').querySelector(postCommitDiv);
//         //     if (commitClass) {
//         //         this.postCommit = commitClass;
//         //         break;
//         //     }
//         // }
//         // const val = startFetchCommitComments(document.querySelector('body'), []);
//         // console.log('test 123:', val);
//         // console.log('test 123:', getContentFn());
//     }
// } catch (e) {}

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

function fetchCommentsList() {
    // var unorderedList = nodes.querySelector('ul:not([class])');
    const node = document.querySelector('body');
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
    for (const OneCommentDiv of classTable.OneCommentDiv) {
        oneComments = unorderedList.querySelectorAll('div' + OneCommentDiv);
        if (oneComments) {
            break;
        }
    }
    console.log('oneComments:', oneComments);
    for (const oneComment of oneComments) {
        if (oneComment.hasAttribute('style')) {
            check_style = false;
            break;
        }
    }
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
