// 监听选中文本事件
document.addEventListener('mouseup', function(event) {
  const selection = window.getSelection();
  if (selection.toString().length > 0) {
    // 检查选中内容是否包含链接
    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    const links = container.querySelectorAll('a');
    if (links.length > 0) {
      // 发送消息到background.js，包含选中的链接
      const linksData = Array.from(links).map(link => {
        return {
          url: link.href,
          text: link.textContent.trim(),
          title: link.title || document.title
        };
      });
      
      // 显示提示信息
      showSelectionTooltip(event.clientX, event.clientY, links.length);
      
      // 发送消息到background.js
      chrome.runtime.sendMessage({
        action: 'linksSelected',
        links: linksData
      });
    }
  }
});

// 显示选中链接的提示工具条
function showSelectionTooltip(x, y, count) {
  // 移除已有的提示
  const existingTooltip = document.getElementById('smart-downloader-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  // 创建提示元素
  const tooltip = document.createElement('div');
  tooltip.id = 'smart-downloader-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y - 40}px`;
  tooltip.style.backgroundColor = '#4285f4';
  tooltip.style.color = 'white';
  tooltip.style.padding = '8px 12px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  tooltip.style.zIndex = '9999';
  tooltip.style.fontSize = '14px';
  tooltip.style.transition = 'opacity 0.3s';
  
  // 设置提示内容
  tooltip.textContent = `已选择 ${count} 个链接，点击下载`;
  
  // 添加点击事件
  tooltip.addEventListener('click', function() {
    chrome.runtime.sendMessage({
      action: 'downloadSelected'
    });
    tooltip.remove();
  });
  
  // 添加到页面
  document.body.appendChild(tooltip);
  
  // 3秒后自动消失
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }
  }, 3000);
}

// 接收来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAllLinks') {
    // 获取页面上所有链接
    const links = document.querySelectorAll('a');
    const linksData = Array.from(links).map(link => {
      return {
        url: link.href,
        text: link.textContent.trim(),
        title: link.title || document.title
      };
    }).filter(link => link.url && link.url.startsWith('http'));
    
    sendResponse({links: linksData});
    return true;
  }
});