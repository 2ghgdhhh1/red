const loadingToast = document.getElementById('loadingToast');
const goLoginLink = document.getElementById('goLoginLink');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');

const modal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalOkBtn = document.getElementById('modalOkBtn');

function showModal(text, callback) {
    modalMessage.textContent = text;
    modal.classList.add('show');
    const handler = () => {
        modal.classList.remove('show');
        modalOkBtn.removeEventListener('click', handler);
        if (callback) callback();
    };
    modalOkBtn.addEventListener('click', handler);
}

function showAutoMessage(text, duration = 3000) {
    loadingToast.textContent = text;
    loadingToast.classList.add('show');
    setTimeout(() => {
        loadingToast.classList.remove('show');
    }, duration);
}

function showLoading(text) {
    loadingToast.textContent = text;
    loadingToast.classList.add('show');
}
function hideLoading() {
    loadingToast.classList.remove('show');
}

goLoginLink.addEventListener('click', () => {
    loginTab.checked = true;
});

// 注册
signupBtn.addEventListener('click', async () => {
    const username = document.getElementById('signupUsername').value.trim();
    const pwd = document.getElementById('signupPwd').value.trim();
    const pwdConfirm = document.getElementById('signupPwdConfirm').value.trim();

    if (!username || !pwd || !pwdConfirm) {
        showModal('请填写完整的注册信息！');
        return;
    }
    if (pwd !== pwdConfirm) {
        showModal('两次输入的密码不一致！');
        return;
    }

    showLoading('注册中...');
    try {
        const response = await fetch('http://localhost:8000/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pwd, password_confirm: pwdConfirm })
        });
        const result = await response.json();
        hideLoading();
        if (result.code === 200) {
            showModal('注册成功！', () => {
                showAutoMessage('正在转入登录...', 2000);
                setTimeout(() => {
                    loginTab.checked = true;
                    document.getElementById('loginUsername').value = username;
                    document.getElementById('loginPwd').value = '';
                }, 2000);
            });
        } else {
            showModal('注册失败：' + result.msg);
        }
    } catch (err) {
        hideLoading();
        showModal('网络错误，请检查后端是否启动');
    }
});

// 登录
loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const pwd = document.getElementById('loginPwd').value.trim();

    if (!username || !pwd) {
        showModal('请填写用户名和密码！');
        return;
    }

    showLoading('登录中...');
    try {
        const response = await fetch('http://localhost:8000/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pwd })
        });
        const result = await response.json();
        hideLoading();
        if (result.code === 200) {
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user_id', result.data.user_id);
            showModal('登录成功！', () => {
                window.location.href = 'index.html';
            });
        } else {
            showModal('登录失败：' + result.msg);
        }
    } catch (err) {
        hideLoading();
        showModal('网络错误，请检查后端是否启动');
    }
});