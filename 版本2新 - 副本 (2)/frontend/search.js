// 全局搜索函数（供所有页面调用，但主要在 search-results.html 中使用）
async function performSearch(keyword) {
    console.log('performSearch 被调用，关键词：', keyword);
    const resultListDiv = document.getElementById('resultList');
    if (!keyword) {
        resultListDiv.innerHTML = '<div class="no-result">请输入关键词</div>';
        return;
    }

    resultListDiv.innerHTML = '加载中...';

    try {
        // 调用后端搜索接口
        const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(keyword)}`);
        if (!response.ok) throw new Error('网络错误');
        const result = await response.json();

        if (result.code !== 200 || !result.data.length) {
            resultListDiv.innerHTML = '<div class="no-result">未找到相关报纸，请尝试其他关键词。</div>';
            return;
        }

        const matched = result.data;

        // 特殊处理：如果关键词完全匹配某报纸标题，可以直接跳转（可选，增加用户体验）
        const exactMatch = matched.find(item => item.title === keyword);
        if (exactMatch && matched.length === 1) {
            // 唯一精确匹配，直接跳转
            window.location.href = `paper.html?id=${exactMatch.id}`;
            return;
        }

        // 展示匹配列表
        let html = '';
        matched.forEach(item => {
            // 截取日期显示
            let dateStr = item.date || (item.year && item.month ? `${item.year}年${item.month}月` : '日期未知');
            html += `
                <div class="result-item" onclick="location.href='paper.html?id=${item.id}'">
                    <div class="result-title">${escapeHtml(item.title)}</div>
                    <div class="result-date">${escapeHtml(dateStr)}</div>
                    ${item.content_preview ? `<div class="result-preview" style="font-size:14px;color:#666;margin-top:5px;">${escapeHtml(item.content_preview)}</div>` : ''}
                </div>
            `;
        });
        resultListDiv.innerHTML = html;

    } catch (error) {
        console.error('搜索失败', error);
        resultListDiv.innerHTML = '<div class="no-result">搜索失败，请检查后端服务是否启动。</div>';
    }
}

// 辅助函数：防止XSS攻击
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== 全局搜索绑定（供所有页面使用） ====================
function bindSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    if (!searchInput || !searchBtn) return;
    
    const doSearch = () => {
        const keyword = searchInput.value.trim();
        if (keyword) {
            window.location.href = `search-results.html?q=${encodeURIComponent(keyword)}`;
        } else {
            alert('请输入搜索关键词');
        }
    };
    
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });
}

// 页面加载完成后自动绑定搜索功能
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSearch);
} else {
    bindSearch();
}