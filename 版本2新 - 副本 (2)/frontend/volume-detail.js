const API_CONFIG = {
    baseUrl: "http://localhost:8000/api",
    api: {
        getVolumeList: "/volume/list",
    },
    headers: {
        "Content-Type": "application/json",
        "token": localStorage.getItem("token") || ""
    }
};

window.addEventListener("load", () => {
    initVolumeList();
    bindFilterEvents();
});

function initVolumeList(params = {}) {
    const tableBody = document.getElementById("eventTableBody");
    tableBody.innerHTML = "<tr><td colspan='5' align='center'>加载中...</td></tr>";

    const query = new URLSearchParams();
    if (params.period && params.period !== "all") query.append("period", params.period);
    if (params.month && params.month !== "0") query.append("month", params.month);
    if (params.type && params.type !== "all") query.append("type", params.type);

    fetch(`${API_CONFIG.baseUrl}${API_CONFIG.api.getVolumeList}?${query}`, {
        method: "GET",
        headers: API_CONFIG.headers
    })
    .then(res => res.json())
    .then(result => {
        tableBody.innerHTML = "";
        if (result.code !== 200) {
            tableBody.innerHTML = `<tr><td colspan='5' align='center'>数据加载失败：${result.msg || "未知错误"}</td></tr>`;
            return;
        }
        const data = result.data;
        if (data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5' align='center'>暂无数据</td></tr>";
            return;
        }
        data.forEach(item => {
            const tr = document.createElement("tr");
            tr.style.cursor = "pointer";
            tr.addEventListener("click", () => {
                const userId = localStorage.getItem('user_id');
                if (userId) {
                    fetch(`http://localhost:8000/api/history/add?user_id=${userId}&issue_id=${item.id}`, {
                        method: 'POST'
                    }).catch(e => console.warn('记录历史失败', e));
                }
                window.location.href = `paper.html?id=${item.id}`;
            });
            tr.innerHTML = `
                <td>${item.year}年${item.month}月</td>
                <td>${item.title}</td>
                <td>${item.period || '-'}</td>
                <td>${item.source || '-'}</td>
                <td>${item.key_figure_place || '-'}</td>
            `;
            tableBody.appendChild(tr);
        });
    })
    .catch(err => {
        console.error(err);
        tableBody.innerHTML = "<tr><td colspan='5' align='center'>网络错误，请检查后端是否启动</td></tr>";
    });
}

function bindFilterEvents() {
    const filterBtn = document.getElementById("filterBtn");
    const resetBtn = document.getElementById("resetBtn");

    filterBtn.addEventListener("click", () => {
        const params = {
            period: document.getElementById("periodSelect").value,
            month: document.getElementById("monthSelect").value,
            type: document.getElementById("typeSelect").value
        };
        initVolumeList(params);
    });

    resetBtn.addEventListener("click", () => {
        document.getElementById("periodSelect").value = "all";
        document.getElementById("monthSelect").value = "0";
        document.getElementById("typeSelect").value = "all";
        initVolumeList();
    });
}