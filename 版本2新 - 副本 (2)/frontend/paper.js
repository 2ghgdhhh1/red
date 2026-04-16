// 数字人对话功能
function openAI() {
    alert('数字人对话功能即将上线，敬请期待！');
}

// 上一期跳转功能
function prevIssue() {
    // 获取当前报纸ID，同时支持id和issue参数
    const urlParams = new URLSearchParams(window.location.search);
    const currentId = parseInt(urlParams.get('issue') || urlParams.get('id') || '1');
    
    // 计算上一期的ID
    const prevId = Math.max(1, currentId - 1);
    
    // 跳转到上一期
    window.location.href = `paper.html?issue=${prevId}`;
}

// 下一期跳转功能
function nextIssue() {
    // 获取当前报纸ID，同时支持id和issue参数
    const urlParams = new URLSearchParams(window.location.search);
    const currentId = parseInt(urlParams.get('issue') || urlParams.get('id') || '1');
    
    // 计算下一期的ID
    const nextId = currentId + 1;
    
    // 跳转到下一期
    window.location.href = `paper.html?issue=${nextId}`;
}

// 时间处理功能
function handleDateNavigation(targetDate) {
    // 模拟检查目标日期是否有事件
    const hasEvent = checkIfHasEvent(targetDate);
    
    if (hasEvent) {
        // 有事件，跳转到该日期的报纸
        alert(`跳转到 ${targetDate} 的报纸`);
    } else {
        // 无事件，跳转到最近的事件日期
        const nearestDate = findNearestEventDate(targetDate);
        alert(`该日期无事件，跳转到最近的事件日期：${nearestDate}`);
    }
}

// 模拟检查日期是否有事件
function checkIfHasEvent(date) {
    // 实际项目中这里应该从数据库或API检查该日期是否有事件
    // 这里简单模拟，假设每月1号、8号、15号、22号、29号有事件
    const day = new Date(date).getDate();
    return [1, 8, 15, 22, 29].includes(day);
}

// 模拟查找最近的事件日期
function findNearestEventDate(targetDate) {
    // 实际项目中这里应该从数据库或API查找最近的事件日期
    // 这里简单模拟，返回最近的有事件的日期
    const target = new Date(targetDate);
    const day = target.getDate();
    
    // 可能的事件日期
    const possibleDates = [1, 8, 15, 22, 29];
    
    // 找到最接近的日期
    let nearestDay = possibleDates.reduce((prev, curr) => {
        return (Math.abs(curr - day) < Math.abs(prev - day) ? curr : prev);
    });
    
    // 构建最近日期的完整日期字符串
    const year = target.getFullYear();
    const month = target.getMonth() + 1;
    return `${year}年${month}月${nearestDay}日`;
}

// 月份展开/收起功能
function toggleMonth(element) {
    const issueList = element.nextElementSibling;
    const icon = element.querySelector('i');
    
    if (issueList.style.display === 'none') {
        issueList.style.display = 'block';
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
    } else {
        issueList.style.display = 'none';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
    }
}

// 设置当前活跃期数并跳转
function setActiveIssue(element, url) {
    // 添加点击动画效果
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 150);
    
    // 跳转到指定URL
    window.location.href = url;
}

// 页面加载时根据URL参数设置活跃状态
function setActiveIssueOnLoad() {
    // 获取URL中的id或issue参数
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('issue') || urlParams.get('id') || '1';
    console.log('设置活跃状态，ID:', idParam);
    
    // 移除所有活跃状态和"(当前)"标记
    const allIssues = document.querySelectorAll('.issue-list li');
    allIssues.forEach(issue => {
        issue.classList.remove('active');
        // 移除"(当前)"标记
        issue.textContent = issue.textContent.replace(' (当前)', '');
    });
    
    // 找到对应的期数并设置为活跃状态
    let targetElement = null;
    allIssues.forEach(issue => {
        // 检查期数文本是否包含当前期数
        const text = issue.textContent;
        if (text.includes(`第${idParam}期`)) {
            targetElement = issue;
        }
    });
    
    // 如果找到对应的期数，设置为活跃状态并添加"(当前)"标记
    if (targetElement) {
        targetElement.classList.add('active');
        if (!targetElement.textContent.includes('(当前)')) {
            targetElement.textContent += ' (当前)';
        }
        console.log('设置活跃元素:', targetElement.textContent);
    } else {
        console.log('未找到对应的期数元素');
    }
}

// 发送消息功能
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        // 获取聊天消息区域
        const chatMessages = document.querySelector('.chat-messages');
        
        // 添加用户消息
        const userMessageHTML = `
            <div class="chat-message user-message mb-3 text-right">
                <div class="message-content bg-secondary text-white p-3 rounded-lg rounded-tr-none max-w-[80%] ml-auto">
                    <p>${message}</p>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', userMessageHTML);
        
        // 清空输入框
        input.value = '';
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 显示加载中状态
        const loadingHTML = `
            <div class="chat-message bot-message mb-3">
                <div class="message-content bg-primary text-white p-3 rounded-lg rounded-tl-none max-w-[80%]">
                    <p>正在思考...</p>
                </div>
            </div>
        `;
        const loadingElement = document.createElement('div');
        loadingElement.innerHTML = loadingHTML;
        chatMessages.appendChild(loadingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // 调用数字人API
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const aiReply = data.reply;
            
            // 移除加载中状态
            chatMessages.removeChild(loadingElement);
            
            // 添加数字人回复
            const botMessageHTML = `
                <div class="chat-message bot-message mb-3">
                    <div class="message-content bg-primary text-white p-3 rounded-lg rounded-tl-none max-w-[80%]">
                        <p>${aiReply}</p>
                    </div>
                </div>
            `;
            chatMessages.insertAdjacentHTML('beforeend', botMessageHTML);
            
        } catch (error) {
            console.error('发送消息失败:', error);
            
            // 移除加载中状态
            chatMessages.removeChild(loadingElement);
            
            // 显示错误消息
            const errorMessageHTML = `
                <div class="chat-message bot-message mb-3">
                    <div class="message-content bg-danger text-white p-3 rounded-lg rounded-tl-none max-w-[80%]">
                        <p>抱歉，数字人服务暂时不可用，请稍后重试。</p>
                    </div>
                </div>
            `;
            chatMessages.insertAdjacentHTML('beforeend', errorMessageHTML);
        } finally {
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

// 从API加载报纸详情
async function loadNewspaperFromDatabase(id) {
    try {
        console.log('从API加载报纸详情，ID:', id);
        
        // 调用API获取报纸详情
        const response = await fetch(`http://localhost:8000/api/newspapers/${id}`);
        console.log('API响应:', response);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('API返回404，报纸不存在');
                return null;
            }
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const newspaper = await response.json();
        console.log('API返回的数据:', newspaper);
        
        return newspaper;
    } catch (error) {
        console.error('加载报纸详情失败:', error);
        return null;
    }
}

// 页面加载时直接根据URL参数更新内容
async function loadPageContent() {
    // 获取URL中的报纸ID，同时支持id和issue参数
    const urlParams = new URLSearchParams(window.location.search);
    const issueParam = urlParams.get('issue');
    const idParam = urlParams.get('id');
    const newspaperId = parseInt(issueParam || idParam || '1');
    console.log('URL参数 - issue:', issueParam, 'id:', idParam);
    console.log('当前报纸ID:', newspaperId);
    
    // 从API加载报纸详情
    let currentContent = null;
    try {
        console.log('准备调用loadNewspaperFromDatabase，ID:', newspaperId);
        currentContent = await loadNewspaperFromDatabase(newspaperId);
    } catch (error) {
        console.error('加载报纸详情失败:', error);
    }
    
    // 如果API没有返回数据，显示错误信息
    if (!currentContent) {
        console.error('API中没有找到ID为', newspaperId, '的报纸');
        // 更新页面内容为错误信息
        const headlineElement = document.querySelector('.headline');
        if (headlineElement) {
            headlineElement.textContent = '报纸不存在';
        }
        
        const contentElement = document.querySelector('.paper-content');
        if (contentElement) {
            contentElement.innerHTML = '<p>抱歉，找不到对应的报纸内容。</p>';
        }
        
        return;
    }
    
    // 更新页面内容
    const headlineElement = document.querySelector('.headline');
    if (headlineElement) {
        headlineElement.textContent = currentContent.title;
        console.log('更新标题:', currentContent.title);
    }
    
    const contentElement = document.querySelector('.paper-content');
    if (contentElement) {
        contentElement.innerHTML = `<p>${currentContent.content.replace(/\n/g, '</p><p>')}</p>`;
        console.log('更新内容');
    }
    
    // 不更新图片，按照用户要求删除图片元素
    const imgElement = document.querySelector('.paper-content img');
    if (imgElement) {
        imgElement.remove();
        console.log('删除图片元素');
    }
    
    // 更新数据来源
    const sourceElement = document.querySelector('.mt-5.pt-4.border-top p');
    if (sourceElement) {
        sourceElement.textContent = currentContent.source || '本报纸内容参考自《中国共产党简史》、《红色精神谱系》等权威资料，图片来源于国家博物馆和党史纪念馆。';
        console.log('更新数据来源:', currentContent.source);
    }
    
    // 更新日期
    const dateElement = document.querySelector('.paper-info');
    if (dateElement) {
        // 解析日期
        let year, month, day, dayOfWeek, lunarDate;
        if (currentContent.date) {
            const dateObj = new Date(currentContent.date);
            year = dateObj.getFullYear();
            month = dateObj.getMonth() + 1;
            day = dateObj.getDate();
            dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
            
            // 简单的农历计算
            lunarDate = `农历${month}月${day}`;
        } else {
            // 如果日期为null，使用当前日期
            const dateObj = new Date();
            year = dateObj.getFullYear();
            month = dateObj.getMonth() + 1;
            day = dateObj.getDate();
            dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
            
            // 简单的农历计算
            lunarDate = `农历${month}月${day}`;
        }
        
        dateElement.textContent = `${year}年${month}月${day}日 | 第${Math.ceil(day / 7)}卷 | 第${newspaperId}期 | 星期${dayOfWeek} | ${lunarDate}`;
        console.log('更新日期:', dateElement.textContent);
    }
    
    // 更新期数列表
    await updateIssueList();
    
    // 设置活跃状态
    setActiveIssueOnLoad();
}

// 检查API中是否有指定月份的内容
async function checkDatabaseMonths() {
    try {
        console.log('开始检查API中的月份...');
        
        // 调用API获取所有报纸
        const response = await fetch('http://localhost:8000/api/newspapers');
        console.log('API响应:', response);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const newspapers = await response.json();
        console.log('API返回的数据:', newspapers);
        
        if (newspapers && newspapers.length > 0) {
            // 提取所有月份
            const months = [...new Set(newspapers.map(newspaper => {
                const date = new Date(newspaper.date);
                return date.getMonth() + 1;
            }))];
            console.log('API中存在的月份:', months);
            
            // 检查用户询问的月份
            const queryMonths = [1, 2, 5, 6, 7, 8, 9, 10, 11, 12];
            console.log('用户询问的月份:', queryMonths);
            
            const existingMonths = queryMonths.filter(month => months.includes(month));
            const missingMonths = queryMonths.filter(month => !months.includes(month));
            
            console.log('API中存在的月份:', existingMonths);
            console.log('API中不存在的月份:', missingMonths);
            
            return { existingMonths, missingMonths };
        } else {
            console.log('API返回的数据为空');
            return { existingMonths: [], missingMonths: [1, 2, 5, 6, 7, 8, 9, 10, 11, 12] };
        }
    } catch (error) {
        console.error('检查月份失败:', error);
        return { existingMonths: [], missingMonths: [1, 2, 5, 6, 7, 8, 9, 10, 11, 12] };
    }
}

// 从API加载数据
async function loadDataFromDatabase() {
    try {
        console.log('开始从API加载数据...');
        
        // 调用API获取所有报纸
        const response = await fetch('http://localhost:8000/api/newspapers');
        console.log('API响应:', response);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const newspapers = await response.json();
        console.log('API返回的数据:', newspapers);
        
        if (newspapers && newspapers.length > 0) {
            // 直接返回API数据，不进行转换
            console.log('返回API数据');
            return newspapers;
        }
        
        console.log('API返回的数据为空');
        return [];
    } catch (error) {
        console.error('加载数据失败:', error);
        return [];
    }
}

// 更新期数列表
async function updateIssueList() {
    const issueContainer = document.querySelector('.issue-sidebar');
    
    // 清空现有内容，只保留标题
    const titleElement = issueContainer.querySelector('h3');
    issueContainer.innerHTML = '';
    issueContainer.appendChild(titleElement);
    
    // 从API加载数据
    const issuesData = await loadDataFromDatabase();
    
    // 只使用API中的真实数据
    let issues = [];
    if (issuesData.length > 0) {
        // 从API数据转换为所需格式
        issues = issuesData.map(item => {
            // 解析item，处理不同的数据格式
            if (Array.isArray(item)) {
                // 旧格式：[id, title, date, content, image_url, source]
                const [id, title, date, content, image_url, source] = item;
                return { id, date, title, period: '' };
            } else if (typeof item === 'object') {
                // 新格式：{ id, title, date, content, image_url, source, year, month, period }
                return { 
                    id: item.id, 
                    date: item.date,
                    publish_date: item.publish_date,
                    title: item.title,
                    year: item.year,
                    month: item.month,
                    period: item.period || ''
                };
            }
        }).filter(item => {
            // 过滤掉无效数据、period为空或title为空的记录
            // 同时过滤掉period为乱码的记录（长度小于2的可能是乱码）
            return item && 
                   item.period && 
                   item.period.trim() && 
                   item.period.length >= 2 && 
                   item.title && 
                   item.title.trim();
        });
    } else {
        console.error('API中没有报纸数据');
        // 如果API没有返回数据，显示提示信息
        const issueContainer = document.querySelector('.issue-sidebar');
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-muted mt-4';
        emptyMessage.textContent = 'API中没有报纸数据';
        issueContainer.appendChild(emptyMessage);
        return;
    }
    
    // 按period字段分组，过滤掉period为空的记录
    const issuesByPeriod = {};
    issues.forEach(issue => {
        const period = issue.period || '';
        
        if (period) {
            if (!issuesByPeriod[period]) {
                issuesByPeriod[period] = [];
            }
            
            issuesByPeriod[period].push(issue);
        }
    });
    
    // 生成期数列表
    Object.entries(issuesByPeriod).forEach(([period, periodIssues]) => {
        const periodDiv = document.createElement('div');
        periodDiv.className = 'issue-month mb-3';
        
        const periodTitle = document.createElement('h4');
        periodTitle.className = 'month-title py-2 px-3 bg-light rounded cursor-pointer';
        periodTitle.onclick = function() { toggleMonth(this); };
        periodTitle.innerHTML = `<i class="fas fa-chevron-down mr-2"></i> ${period} (${periodIssues.length}期)`;
        
        const issueList = document.createElement('ul');
        issueList.className = 'issue-list mt-2 pl-5';
        
        // 按期数排序
        periodIssues.sort((a, b) => {
            return b.id - a.id;
        });
        
        // 添加报纸
        periodIssues.forEach(issue => {
            const listItem = document.createElement('li');
            listItem.className = 'py-1';
            listItem.onclick = function() { setActiveIssue(this, `paper.html?issue=${issue.id}`); };
            
            // 构建日期字符串
            let dateStr;
            if (issue.publish_date) {
                dateStr = issue.publish_date;
            } else if (issue.date) {
                dateStr = issue.date;
            } else if (issue.year && issue.month) {
                dateStr = `${issue.year}年${issue.month}月`;
            } else {
                dateStr = '';
            }
            
            listItem.textContent = dateStr ? `${dateStr} - ${issue.title}` : issue.title;
            issueList.appendChild(listItem);
        });
        
        periodDiv.appendChild(periodTitle);
        periodDiv.appendChild(issueList);
        issueContainer.appendChild(periodDiv);
    });
}

// ==================== 新增：阅读心跳功能 ====================
let heartbeatInterval = null;

// 停止心跳
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('心跳已停止');
    }
}

// 启动心跳（每30秒发送一次）
function startHeartbeat(issueId, userId) {
    if (!userId || !issueId) {
        console.warn('无法启动心跳：缺少用户ID或报纸ID');
        return;
    }
    // 先停止已有的心跳，避免重复
    stopHeartbeat();
    
    console.log(`启动心跳，用户ID: ${userId}, 报纸ID: ${issueId}`);
    heartbeatInterval = setInterval(() => {
        fetch('http://localhost:8000/api/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, issue_id: issueId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.code !== 200) {
                console.warn('心跳响应异常:', data.msg);
            } else {
                console.log('心跳发送成功');
            }
        })
        .catch(err => console.error('心跳发送失败:', err));
    }, 30000); // 30秒
}

// 页面加载完成后启动心跳（确保用户已登录且报纸ID有效）
window.addEventListener('load', () => {
    // 获取当前报纸ID（与loadPageContent中的逻辑一致）
    const urlParams = new URLSearchParams(window.location.search);
    const issueId = parseInt(urlParams.get('issue') || urlParams.get('id') || '1');
    // 从localStorage获取用户ID（登录后存储）
    const userId = localStorage.getItem('user_id');
    if (userId && issueId) {
        startHeartbeat(issueId, parseInt(userId));
    } else {
        console.log('用户未登录或报纸ID无效，不启动心跳');
    }
});

// 页面关闭或刷新前停止心跳
window.addEventListener('beforeunload', () => {
    stopHeartbeat();
});

// 页面加载时先更新期数列表，再加载页面内容
window.onload = async function() {
    await updateIssueList();
    loadPageContent();
};