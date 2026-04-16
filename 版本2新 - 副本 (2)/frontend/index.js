// 从API加载最新的报纸数据
async function loadLatestNewspapers() {
    try {
        console.log('开始从API加载最新报纸数据...');
        
        // 调用API获取最新的3期报纸
        const response = await fetch('http://localhost:8001/api/newspapers/latest');
        console.log('API响应:', response);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const newspapers = await response.json();
        console.log('API返回的数据:', newspapers);
        
        if (newspapers && newspapers.length > 0) {
            updateNewspaperListFromAPI(newspapers);
        } else {
            console.error('API返回的数据为空');
            // 如果API没有返回数据，显示提示信息
            const newspaperContainer = document.querySelector('.row');
            newspaperContainer.innerHTML = '';
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12 text-center text-muted mt-4';
            emptyMessage.textContent = '数据库中没有报纸数据';
            newspaperContainer.appendChild(emptyMessage);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        // 显示错误信息
        const newspaperContainer = document.querySelector('.row');
        newspaperContainer.innerHTML = '';
        const errorMessage = document.createElement('div');
        errorMessage.className = 'col-12 text-center text-danger mt-4';
        errorMessage.textContent = '加载数据失败，请检查服务器连接。';
        newspaperContainer.appendChild(errorMessage);
    }
}

// 更新报纸列表
function updateNewspaperList(newspapers) {
    const newspaperContainer = document.querySelector('.row');
    newspaperContainer.innerHTML = '';
    
    newspapers.forEach((newspaper, index) => {
        const [id, title, date, content, imageUrl] = newspaper;
        
        // 截取内容作为简介
        const summary = content.substring(0, 100) + '...';
        
        // 创建报纸卡片
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card paper-card">
                <img src="${imageUrl || 'https://picsum.photos/id/' + (1005 + index) + '/300/200'}" class="card-img-top paper-img" alt="${title}">
                <div class="card-body">
                    <h5 class="card-title">第${3 - index}期：${title}</h5>
                    <p class="card-text">${summary}</p>
                    <a href="paper.html?issue=${id}" class="btn btn-outline-danger">立即阅读</a>
                </div>
            </div>
        `;
        
        newspaperContainer.appendChild(card);
    });
}

// 从API更新报纸列表
function updateNewspaperListFromAPI(newspapers) {
    const newspaperContainer = document.querySelector('.row');
    newspaperContainer.innerHTML = '';
    
    newspapers.forEach((newspaper, index) => {
        const { id, title, date, content, image_url, source } = newspaper;
        
        // 截取内容作为简介
        const summary = content.substring(0, 100) + '...';
        
        // 创建报纸卡片
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card paper-card">
                <img src="${image_url || 'https://picsum.photos/id/' + (1005 + index) + '/300/200'}" class="card-img-top paper-img" alt="${title}">
                <div class="card-body">
                    <h5 class="card-title">第${3 - index}期：${title}</h5>
                    <p class="card-text">${summary}</p>
                    <a href="paper.html?issue=${id}" class="btn btn-outline-danger">立即阅读</a>
                </div>
            </div>
        `;
        
        newspaperContainer.appendChild(card);
    });
}

// 页面加载完成后加载数据库
// window.onload = loadLatestNewspapers;