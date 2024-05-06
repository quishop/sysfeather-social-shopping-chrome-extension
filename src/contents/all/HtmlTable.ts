// import { POST_MAXIMUM_LENGTH } from './const.js'
const POST_MAXIMUM_LENGTH = 100;
// // 要在mainifest.js 設定，才能讀到圖片
// let icon = chrome.runtime.getURL('icons/sync.svg');
let loading = chrome.runtime.getURL('icons/giphy.gif');
let checked = chrome.runtime.getURL('icons/checked.svg');
let logo = chrome.runtime.getURL('icons/logo.svg');

let htmlTable = {
    // 貼文按鈕
    //postButton: `<i class="fas fa-sync" style="color:#ffffff;font-size:10px;"></i><span class="spanBtn" style="color:#ffffff">匯入/更新留言</span>`,
    // postButton:
    //     `<img src="` +
    //     icon +
    //     `" style="width:10%"><span class="spanBtn" style="color:#ffffff">匯入/更新留言</span>`,
    // tryAgain:
    //     `<img src="` +
    //     icon +
    //     `" style="width:10%"><span class="spanBtn" style="color:#ffffff">請再點一次</span>`,

    pageLiveError: `<span class="spanBtn" style="color:#ffffff">直播中，不支援</span>`,

    postErrorButton: `<sapn disabled="disabled"><i class="fa fa-times fa-fw" style="font-size:10px;color:#ffffff;"></i><span class="spanBtn" style="margin-left:-5px;">Stop!! 操作太頻繁，FB會被封鎖Buy+1關心您</span></span>`,
    //postButton: `<i class="fas fa-sync"></i><span class="spanBtn">分析此篇</span>`,
    fetchPost:
        `<img src="` +
        loading +
        `" style="width:12%"><span class="loading spanBtn " style="line-height:20px;color:#ffffff;font-size:10px;">正在抓取</span>`,
    uploaded: `<span class="spanBtn">已更新留言</span>`,
    importPost: `<span class="spanBtn">已匯入貼文</span>`,
    uploadError: `<span class="spanBtn">錯誤</span>`,
    uploading: `<i class="fas fa-upload"></i> <span span class="loading">正在上傳資料 請稍後</span>`,
    nofetchPostBecauseOver2000: `<i class="fa-times">未抓取兩千以上留言貼文，請手動點擊</span>`,
    postInitError: `<span>錯誤</span>`,
    unsupportedPostError: `<span>錯誤</span>`,
    postSkip: `<span>跳過</span>`,

    // 貼文備份
    import: `<div class='buy_1_backend' style='color:#7feb7f'> Buy+1 備份中</div>`,
    importError: `<div class='buy_1_backend' style='color:#FF0011'> Buy+1 錯誤</div>`,
    importSuccess: ` Buy+1 <img src="` + checked + `" style="width:5%">`,
    // 懸浮在右上角
    flexFetchingPost: `<i class="fas fa-spinner"></i><span>正在爬取中</span>`,
    flexFetchPost: `<i class="fas fa-spinner fa-pulse"></i><span class="loading">停止抓取</span>`,
    originFlexBtn: `'<i class="fas fa-sync"></i><span>一鍵更新</span>'`,
    updateCompleted: `<i class="fas fa-sync"></i><span>更新完成</span>`,
    completedPostStatus(postCount) {
        return `<i class="fas fa-sync"></i>
    <span>成功更新${postCount}篇貼文</span>`;
    },
    completedCommentStatus(commentCount) {
        return `<i class="fas fa-sync"></i>
    <span>共${commentCount}則留言</span>`;
    },

    mainFixedWindow: `
  <div class="userContent">
    <div class="buttons_logo">
      <img src="${logo}" width="70px">
    </div>
  </div>`,

    mainLoadingText: `載入中`,
    mainReadyText: `自動更新貼文及留言`,
    //page
    mainPageReadyText: `粉絲頁，目前只支援單篇匯入`,
    pageCantGetPostID: `錯誤!無法匯入貼文`,
    mainFetchingText: (i) => {
        if (i && typeof i == 'number') {
            return `正在更新第${i}篇留言`;
        } else {
            return `正在更新留言`;
        }
    },
    mainButtonReadyText: `開始`,
    mainUserInputCount: `
    <span>前<input type="number" min="1" step="1" max="${POST_MAXIMUM_LENGTH}" required>篇</span>
  `,
    mainDoneText: `更新完成`,
    mainRecoverText: (total) => `發現${total}篇更新失敗貼文`,
    mainLoadingError: `<i class="red">請至右上角Buy+1應用程式，輸入系統金鑰</i>`,
    mainOldKeyError: `<i class="red">請至右上角Buy+1應用程式，點選清除重新輸入系統金鑰</i>`,
    mainKeyError: `金鑰失效，請重新複製`,
    mainGroupError: `無法匯入他人貼文`,
    mainPageError: `無法匯入非綁定的粉絲頁貼文`,
    mainSystemCheckPostIsImportedErrorText: `後台連線錯誤`,
    mainSystemReloadErrorText: `系統已更新。請重新登入Buy+1 後台`,
    mainSystemCloseErrorText: `Buy+1 系統已到期`,
    mainPostUrlErrorText: `無法抓取貼文網址`,

    mainExtending: (i) => {
        if (i == 0) {
            return `正在展開貼文`;
        } else {
            return `正在展開${i}篇貼文`;
        }
    },
    /*
  loadingFlex: `
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.css" integrity="sha512-3icgkoIO5qm2D4bGSUkPqeQ96LS8+ukJC7Eqhl1H5B2OJMEnFqLmNDxXVmtV/eq5M65tTDkUYS/Q0P4gvZv+yA==" crossorigin="anonymous"/>
  <div class="userContent">
    <div class="buttons_logo">
      <img src="${logo}" width="70px" />
    </div>
    <div class="Buyplus1-btn">
      <button id="Buy_fetchCurrenData"><i class="fas fa-spinner fa-pulse"  style="color:#ffffff;font-size:10px;"></i><span  style="color:#ffffff;font-size:10px;">載入中</span></button>
    </div>
  </div>`,
  */

    loadingFlex: `
  <div class="userContent">
    <div class="buttons_logo">
      <img src="${logo}" width="70px" />
    </div>
    <div class="Buyplus1-btn">
      <button id="Buy_fetchCurrenData">
        <i class="fas fa-spinner fa-pulse" style="color:#ffffff;font-size:10px;"></i>
        <span style="color:#ffffff;font-size:10px;">載入中</span>
      </button>
    </div>
  </div>`,
    loadingError: `<button id="Buy_fetchCurrenData"><i class="fa fa-times fa-fw"></i><span class="red">請至右上角Buy+1應用程式，輸入系統金鑰</span></button>`,
    oldKey: `<button id="Buy_fetchCurrenData"><i class="fa fa-times fa-fw"></i><span class="red">請至右上角Buy+1應用程式，點選清除重新輸入系統金鑰</span></button>`,
    keyErrorForPost: `<div style="width:120px;">金鑰失效，請重新複製</div>`,
    keyError: `<button id="Buyplus1_btn_update_comment""><i class="fa fa-times fa-fw"></i><span class="red">金鑰失效，請至後台重新複製</span></button>`,
    notSupport: `<button id="Buy_fetchCurrenData"><i class="fa fa-times fa-fw"></i><span class="red">不支援非社團匯入</span></button>`,
    // loadedFlex: `<button id="Buy_fetchCurrenData"><i class="fas fa-sync"></i><span>一鍵更新</span><br><span style="font-size:10px;"> (20篇or 2千留言)</span></button>`,
    loadedFlex: `<button id="Buy_fetchCurrenData">
    <i class="fas fa-sync"></i>
    <span>自動更新留言及貼文</span>
  </button>`,
    //loadedFlex: `<button id="Buy_fetchCurrenData"><span>請點「匯入/更新留言」</span></button>`,
    // loadedFlex: `<button id="Buy_fetchCurrenData"><span></span></button>`,
    //ID = Buy_fetchCurrenData
    systemClose: `<button id=""><i class="fa fa-times fa-fw"></i><span class="red">Buy+1系統已到期</span></button>`,
    //ID = Buy_fetchCurrenData
    sytemReload: `<button id=""><i class="fa fa-times fa-fw"></i><span class="red">系統已更新<br>請重新登入<br>Buy+1後台!</span></button>`,
    //ID = Buy_fetchCurrenData
    groupError: `<button id=""><i class="fa fa-times fa-fw"></i><span class="red">無法匯入<br>他人貼文!</span></button>`,
    postImportError: `<button id=""><i class="fa fa-times fa-fw"></i><span class="red">Stop!!</span><span><br>操作太頻繁<br>FB會被封鎖<br>請稍後再試<br>Buy+1關心您</span></button>`,
    postError: `<button id="Buyplus1_btn_update_comment" onclick="window.location.reload()"><i class="fa fa-times fa-fw"></i><span class="red">錯誤!<br>請點我重新整理</span></button>`,
    fetchingPost: (i, j) => {
        return `<i class="fas fa-spinner  fa-pulse" style="font-size:10px;"></i>
            <span span style="font-size:14px;">正在更新留言</span>`;
        // return `<i class="fas fa-spinner  fa-pulse" style="font-size:10px;"></i>
        //         <span span class="loading" style="font-size:10px;">正在更新篇留言</span>`
    },
    postIdError: `<button id="Buyplus1_btn_update_comment" "><i class="fa fa-times fa-fw"></i><span class="red">錯誤!<br>請重新開啟分頁更新</span></button>`,
    //<span span class="loading" style="color:#ffffff;font-size:10px;">正在更新篇留言</span>`
    //<span span class="" style="font-size:10px;">正在更新${i}/${j}篇留言</span>`
    postCommitMore: [
        '查看更多',
        '顯示更多',
        '顯示先前的留言',
        '查看更多留言',
        '查看更多回覆',
        '查看先前的回答',
    ],
    postCommitMoreFuzzy: [
        '則留言',
        '先前的留言',
        '之前的回覆',
        '先前的回覆',
        '則回覆',
        '先前的回應',
        '個回覆',
        '則回應',
        '之前的答案',
        '先前的回答',
        '查看更多回答',
        '個回答',
    ],
    postContentMore: ['查看更多', '顯示更多'],
    baseButton: (i) => {
        return `
    <div class="Buyplus1-btn Buyplus1-single">
      <button class="Buy_fetchCurrenData" style="margin: 0px;width:130px !important;color:#ffffff;font-size:10px;">
        ${i}
      </button>
    </div>
    `;
    },
    baseErrorBtn: (i) => {
        return `
    <div class="Buyplus1-btn Buyplus1-single Buyplus1Error">
      <button style="margin: 0px;width:130px !important;color:#ffffff;font-size:10px;cursor:not-allowed;">
        ${i}
      </button>
    </div>
    `;
    },
    extendPost: (i, j) => {
        return `<i class="fas fa-spinner  fa-pulse"></i><span>正在展開${i}/${j}篇貼文留言</span>`;
    },
};

// const fetchingPost = (i, j) => {
//   return `<i class="fas fa-spinner  fa-pulse"></i>
//       <span span class="loading">正在更新${i}/${j}篇留言</span>`
// }

// const baseButton = (i) => {
//   return `
//   <div class="Buyplus1-btn Buyplus1-single">
//     <button class="Buy_fetchCurrenData" style="margin: 0px;">
//       ${i}
//     </button>
//   </div>
//   `
// }

// const extendPost = (i, j) => {
//   return `<i class="fas fa-spinner  fa-pulse"></i><span>正在展開${i}/${j}篇貼文留言</span>`
// }

export { htmlTable };

// WEBPACK FOOTER //
// ./src/content/HtmlTable.js
