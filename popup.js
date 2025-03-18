// 当弹出窗口加载时
document.addEventListener('DOMContentLoaded', function() {
  const linkList = document.getElementById('linkList');
  const selectAllBtn = document.getElementById('selectAll');
  const deselectAllBtn = document.getElementById('deselectAll');
  const downloadBtn = document.getElementById('download');
  const optionsBtn = document.getElementById('options');
  
  // 更新标题
  document.querySelector('h1').textContent = '批量下载重命名助手';
  
  // 获取当前标签页
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0];
    
    // 向content script发送消息，获取页面上所有链接
    chrome.tabs.sendMessage(activeTab.id, {action: 'getAllLinks'}, function(response) {
      if (response && response.links) {
        displayLinks(response.links);
      } else {
        linkList.innerHTML = '<div class="error">无法获取页面链接</div>';
      }
    });
  });
  
  // 显示链接列表
  function displayLinks(links) {
    if (links.length === 0) {
      linkList.innerHTML = '<div class="empty">页面上没有找到链接</div>';
      return;
    }
    
    linkList.innerHTML = '';
    links.forEach((link, index) => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.index = index;
      
      const linkText = document.createElement('span');
      linkText.className = 'link-text';
      linkText.textContent = link.text || link.url;
      
      // 添加文件类型标识
      const fileType = getFileTypeFromUrl(link.url);
      if (fileType) {
        const typeTag = document.createElement('span');
        typeTag.className = 'file-type-tag';
        // 使用中文文件类型名称
        typeTag.textContent = getChineseFileTypeName(fileType);
        typeTag.style.marginLeft = '5px';
        typeTag.style.fontSize = '10px';
        typeTag.style.padding = '1px 4px';
        typeTag.style.borderRadius = '3px';
        typeTag.style.backgroundColor = getColorForFileType(fileType);
        typeTag.style.color = '#fff';
        linkText.appendChild(typeTag);
      }
      
      linkItem.appendChild(checkbox);
      linkItem.appendChild(linkText);
      linkList.appendChild(linkItem);
    });
    
    // 存储链接数据
    window.linksData = links;
  }
  
  // 从URL获取文件类型
  function getFileTypeFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = pathname.substring(pathname.lastIndexOf('.') + 1).toLowerCase();
      
      if (!extension || extension.length > 5 || extension === pathname) {
        return null;
      }
      
      return extension;
    } catch (e) {
      return null;
    }
  }
  
  // 获取文件类型的中文名称
  function getChineseFileTypeName(type) {
    const typeNames = {
      'pdf': '文档PDF',
      'doc': '文档DOC',
      'docx': '文档DOCX',
      'xls': '表格XLS',
      'xlsx': '表格XLSX',
      'ppt': '幻灯片PPT',
      'pptx': '幻灯片PPTX',
      'zip': '压缩ZIP',
      'rar': '压缩RAR',
      'jpg': '图片JPG',
      'jpeg': '图片JPEG',
      'png': '图片PNG',
      'gif': '动图GIF',
      'txt': '文本TXT',
      'csv': '表格CSV',
      'mp3': '音频MP3',
      'mp4': '视频MP4',
      'html': '网页HTML',
      'htm': '网页HTM'
    };
    
    return typeNames[type] || type.toUpperCase();
  }
  
  // 根据文件类型获取标签颜色
  function getColorForFileType(type) {
    const typeColors = {
      'pdf': '#E74C3C',
      'doc': '#3498DB',
      'docx': '#3498DB',
      'xls': '#2ECC71',
      'xlsx': '#2ECC71',
      'ppt': '#E67E22',
      'pptx': '#E67E22',
      'zip': '#9B59B6',
      'rar': '#9B59B6',
      'jpg': '#1ABC9C',
      'jpeg': '#1ABC9C',
      'png': '#1ABC9C',
      'gif': '#1ABC9C'
    };
    
    return typeColors[type] || '#95A5A6';
  }
  
  // 全选按钮
  selectAllBtn.addEventListener('click', function() {
    const checkboxes = linkList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  // 取消全选按钮
  deselectAllBtn.addEventListener('click', function() {
    const checkboxes = linkList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // 下载按钮
  downloadBtn.addEventListener('click', function() {
    const checkboxes = linkList.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
      alert('请选择要下载的链接');
      return;
    }
    
    const selectedLinks = Array.from(checkboxes).map(checkbox => {
      const index = parseInt(checkbox.dataset.index);
      return window.linksData[index];
    });
    
    // 发送消息到background.js进行下载
    chrome.runtime.sendMessage({
      action: 'downloadLinks',
      links: selectedLinks
    });
    
    // 显示下载提示
    alert(`开始下载 ${selectedLinks.length} 个文件`);
  });
  
  // 设置按钮
  optionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});