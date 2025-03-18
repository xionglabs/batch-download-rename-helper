// 存储选中的链接
let selectedLinks = [];

// 初始化右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'smartDownload',
    title: '批量下载并重命名',
    contexts: ['link']
  });
  
  // 移除不工作的菜单项
  // chrome.contextMenus.create({
  //   id: 'smartDownloadSelection',
  //   title: '批量下载选中的链接',
  //   contexts: ['selection']
  // });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'smartDownload' && info.linkUrl) {
    // 单个链接下载
    downloadWithSmartName(info.linkUrl, info.linkText || tab.title);
  }
  // 移除不工作的菜单处理
  // else if (info.menuItemId === 'smartDownloadSelection') {
  //   // 向content script发送消息，获取选中的链接
  //   chrome.tabs.sendMessage(tab.id, {action: 'getSelectedLinks'});
  // }
});

// 接收来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'linksSelected') {
    // 存储选中的链接
    selectedLinks = request.links;
  } else if (request.action === 'downloadSelected') {
    // 下载选中的链接
    selectedLinks.forEach(link => {
      downloadWithSmartName(link.url, link.text || link.title);
    });
    // 清空选中的链接
    selectedLinks = [];
  } else if (request.action === 'downloadLinks') {
    // 从popup请求下载多个链接
    request.links.forEach(link => {
      downloadWithSmartName(link.url, link.text || link.title);
    });
  }
  return true;
});

// 智能下载函数
function downloadWithSmartName(url, text) {
  // 从URL获取文件扩展名
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const extension = pathname.substring(pathname.lastIndexOf('.') + 1) || '';
  
  // 使用链接文本作为文件名（通常是中文名称）
  let filename = text.trim();
  
  // 如果链接文本为空或过短，尝试从URL中提取文件名
  if (!filename || filename.length < 3) {
    const urlFilename = pathname.substring(pathname.lastIndexOf('/') + 1);
    filename = decodeURIComponent(urlFilename) || '未命名文件';
  }
  
  // 清理文件名中的非法字符
  filename = filename.replace(/[\\\/:\*\?"<>\|]/g, '_');
  
  // 如果文件名过长，截断
  if (filename.length > 100) {
    filename = filename.substring(0, 100);
  }
  
  // 添加扩展名（如果URL中有且文件名中没有）
  if (extension && extension.length <= 5 && !filename.endsWith(`.${extension}`)) {
    filename += `.${extension}`;
  }
  
  // 调用浏览器下载API
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: false // 设为true会弹出保存对话框
  }, downloadId => {
    if (chrome.runtime.lastError) {
      console.error('下载错误:', chrome.runtime.lastError);
    }
  });
}