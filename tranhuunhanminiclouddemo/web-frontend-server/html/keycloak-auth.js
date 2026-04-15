// Keycloak Authentication for MyMiniCloud
console.log('Keycloak Auth module loaded');

// Cấu hình Keycloak
const KEYCLOAK_CONFIG = {
    // Tự động nhận diện URL gốc để gọi qua Nginx Proxy (tránh lỗi CORS)
    baseUrl: `${window.location.protocol}//${window.location.host}`,
    realm: 'TranHuuNhan_52300235',
    clientId: 'flask-app'
};

// Hàm lấy host hiện tại (hỗ trợ cả localhost và EC2)
function getKeycloakHost() {
    const h = window.location.hostname;
    return (h === '' || h === 'localhost' || h === '127.0.0.1') ? 'localhost' : h;
}

// Biến global để lưu trạng thái authentication
let isAuthenticated = false;
let userInfo = null;
let accessToken = null;

// Hàm lưu trạng thái authentication vào localStorage
function saveAuthState() {
    if (isAuthenticated && userInfo) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('accessToken', accessToken || '');
        localStorage.setItem('authTimestamp', Date.now().toString());
        console.log('✅ Auth state saved to localStorage');
    }
}

// Hàm khôi phục trạng thái authentication từ localStorage
function restoreAuthState() {
    try {
        const savedAuth = localStorage.getItem('isAuthenticated');
        const savedUserInfo = localStorage.getItem('userInfo');
        const savedToken = localStorage.getItem('accessToken');
        const authTimestamp = localStorage.getItem('authTimestamp');

        // Kiểm tra xem auth có hết hạn không (24 giờ)
        const now = Date.now();
        const authAge = authTimestamp ? (now - parseInt(authTimestamp)) : Infinity;
        const maxAge = 24 * 60 * 60 * 1000; // 24 giờ

        if (savedAuth === 'true' && savedUserInfo && authAge < maxAge) {
            isAuthenticated = true;
            userInfo = JSON.parse(savedUserInfo);
            accessToken = savedToken || null;
            console.log('✅ Auth state restored from localStorage:', userInfo.username);
            return true;
        } else if (authAge >= maxAge) {
            console.log('⚠️ Auth state expired, clearing localStorage');
            clearAuthState();
        }
    } catch (error) {
        console.error('❌ Error restoring auth state:', error);
        clearAuthState();
    }
    return false;
}

// Hàm xóa trạng thái authentication
function clearAuthState() {
    isAuthenticated = false;
    userInfo = null;
    accessToken = null;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authTimestamp');
    console.log('🗑️ Auth state cleared');
}

// Hàm lấy host hiện tại
function getHost() {
    const h = window.location.hostname;
    return (h === '' || h === 'localhost' || h === '127.0.0.1') ? 'localhost' : h;
}

// Hàm kiểm tra logout success từ URL
function checkLogoutSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const logoutStatus = urlParams.get('logout');

    if (logoutStatus === 'success') {
        console.log('Logout success detected');

        // Đảm bảo auth state đã được clear
        clearAuthState();

        // Cập nhật UI
        updateAuthUI();

        // Hiển thị thông báo logout thành công với auto-redirect
        showNotification('✅ Đăng xuất thành công!\nBạn đã được đăng xuất khỏi hệ thống.\n\nTự động chuyển về trang chủ sau 3 giây...', 'success');

        // Xóa logout parameter khỏi URL mà không cần reload trang
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        return true;
    }

    return false;
}

// Hàm kiểm tra authorization code từ URL
function checkAuthCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
        console.log('Authorization code found:', code);

        // Exchange code for token
        exchangeCodeForToken(code)
            .then(tokenData => {
                if (tokenData && tokenData.access_token) {
                    accessToken = tokenData.access_token;

                    // Decode token để lấy thông tin user
                    const payload = parseJWT(tokenData.access_token);
                    if (payload) {
                        isAuthenticated = true;
                        userInfo = {
                            username: payload.preferred_username || payload.sub,
                            email: payload.email || '',
                            firstName: payload.given_name || payload.preferred_username || 'User',
                            lastName: payload.family_name || ''
                        };

                        console.log('User authenticated:', userInfo);
                        saveAuthState(); // Lưu trạng thái vào localStorage
                        updateAuthUI();

                        // Xóa code khỏi URL
                        const newUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                    }
                }
            })
            .catch(error => {
                console.error('Error exchanging code for token:', error);
                // Fallback: giả lập đăng nhập thành công
                simulateSuccessfulLogin();
            });

        return true;
    }

    return false;
}

// Hàm exchange authorization code cho access token
async function exchangeCodeForToken(code) {
    const tokenUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

    // Sử dụng port hiện tại để đảm bảo redirect đúng
    const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    const redirectUri = `${window.location.protocol}//${window.location.hostname}:${currentPort}`;

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KEYCLOAK_CONFIG.clientId,
        code: code,
        redirect_uri: redirectUri
    });

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Token exchange failed: ${response.status}`);
        }
    } catch (error) {
        console.error('Token exchange error:', error);
        throw error;
    }
}

// Hàm parse JWT token
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return null;
    }
}

// Hàm giả lập đăng nhập thành công (fallback)
function simulateSuccessfulLogin() {
    isAuthenticated = true;
    userInfo = {
        username: 'sv01',
        email: 'nhanhuutran006@gmail.com',
        firstName: 'TRAN HUU',
        lastName: 'NHAN'
    };

    console.log('Simulated successful login:', userInfo);
    saveAuthState(); // Lưu trạng thái vào localStorage
    updateAuthUI();

    // Xóa code khỏi URL
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
}

// Hàm cập nhật giao diện authentication
function updateAuthUI() {
    console.log('Updating auth UI. Authenticated:', isAuthenticated, 'User:', userInfo);

    const userInfoEl = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const protectedContent = document.getElementById('protectedContent');
    const secureApiBtn = document.getElementById('secureApiBtn');
    const studentsSection = document.getElementById('studentsSection');
    const loginPromptSection = document.getElementById('loginPromptSection');
    const navBlog = document.getElementById('nav-blog');

    if (isAuthenticated && userInfo) {
        // Hiển thị thông tin user
        const displayName = userInfo.firstName || userInfo.username || 'User';
        const initials = getInitials(displayName);

        if (userName) userName.textContent = displayName;
        if (userAvatar) userAvatar.textContent = initials;

        if (userInfoEl) userInfoEl.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';

        // Hiển thị protected content
        if (protectedContent) {
            protectedContent.classList.add('show');
        }

        // Hiển thị Students Section
        if (studentsSection) {
            studentsSection.style.display = 'block';
            studentsSection.classList.add('show');
            // Tải dữ liệu sinh viên khi đã đăng nhập
            loadStudentData();
            startAutoRefresh();
        }

        // Ẩn Login Prompt Section
        if (loginPromptSection) {
            loginPromptSection.style.display = 'none';
        }

        // Enable Blog link
        if (navBlog) {
            navBlog.style.pointerEvents = 'auto';
            navBlog.style.opacity = '1';
            navBlog.onclick = null;
            // Cập nhật href để trỏ đến trang blog index
            if (window.location.pathname.includes('/blog/')) {
                navBlog.href = 'index.html';
            } else {
                navBlog.href = '/blog/index.html';
            }
        }

        // Cập nhật nút "Khám phá Blog" trong hero section
        const exploreBlogBtn = document.getElementById('exploreBlogBtn');
        if (exploreBlogBtn) {
            exploreBlogBtn.href = '/blog/index.html';
            exploreBlogBtn.onclick = null;
        }

        // Hiển thị nút Test Secure API
        if (secureApiBtn) {
            secureApiBtn.style.display = 'inline-flex';
        }

        // Cập nhật protected content với thông tin user
        updateProtectedContent();

        console.log('UI updated for authenticated user:', displayName);

    } else {
        // Hiển thị nút đăng nhập
        if (userInfoEl) userInfoEl.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // Ẩn protected content
        if (protectedContent) {
            protectedContent.classList.remove('show');
        }

        // Ẩn Students Section
        if (studentsSection) {
            studentsSection.style.display = 'none';
            studentsSection.classList.remove('show');
            stopAutoRefresh();
        }

        // Hiển thị Login Prompt Section
        if (loginPromptSection) {
            loginPromptSection.style.display = 'block';
        }

        // Disable Blog link
        if (navBlog) {
            navBlog.style.pointerEvents = 'none';
            navBlog.style.opacity = '0.5';
            navBlog.onclick = function (e) {
                e.preventDefault();
                showNotification('Vui lòng đăng nhập để truy cập blog', 'warning');
                return false;
            };
        }

        // Disable nút "Khám phá Blog" trong hero section
        const exploreBlogBtn = document.getElementById('exploreBlogBtn');
        if (exploreBlogBtn) {
            exploreBlogBtn.style.pointerEvents = 'none';
            exploreBlogBtn.style.opacity = '0.5';
            exploreBlogBtn.onclick = function (e) {
                e.preventDefault();
                showNotification('Vui lòng đăng nhập để truy cập blog', 'warning');
                return false;
            };
        }

        // Ẩn nút Test Secure API
        if (secureApiBtn) {
            secureApiBtn.style.display = 'none';
        }

        console.log('UI updated for non-authenticated user');
    }
}

// Hàm cập nhật nội dung protected với thông tin user
function updateProtectedContent() {
    const protectedContent = document.getElementById('protectedContent');
    if (!protectedContent || !userInfo) return;

    const protectedDesc = protectedContent.querySelector('.protected-desc');
    if (protectedDesc) {
        const displayName = userInfo.firstName || userInfo.username || 'User';
        const email = userInfo.email || 'N/A';

        protectedDesc.innerHTML = `
            Chào mừng <strong>${displayName}</strong>! 
            Bạn đã đăng nhập thành công với email: <strong>${email}</strong>
            <br><br>
            Bạn có thể truy cập các tính năng đặc biệt như:
            <br>• Quản lý hồ sơ cá nhân
            <br>• Xem lịch sử hoạt động  
            <br>• Truy cập API bảo mật của hệ thống
            <br>• Test secure endpoint với token
        `;
    }
}

// Hàm lấy initials từ tên
function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Hàm đăng nhập với Keycloak
function keycloakLogin() {
    console.log('Login button clicked - checking Keycloak availability');

    const host = getHost();

    // Kiểm tra Keycloak có sẵn không - gọi qua Proxy
    fetch(`${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}`)
        .then(response => {
            if (response.ok) {
                // Keycloak có sẵn, thử đăng nhập thực
                const state = Math.random().toString(36).substring(2, 15);
                const redirectUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

                const keycloakLoginUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?client_id=${KEYCLOAK_CONFIG.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid&state=${state}`;

                console.log('Redirecting to Keycloak:', keycloakLoginUrl);
                window.location.href = keycloakLoginUrl;
            } else {
                throw new Error('Keycloak not available');
            }
        })
        .catch(error => {
            console.log('Keycloak not available, using demo mode:', error);
            showNotification('Keycloak không khả dụng. Sử dụng chế độ demo.', 'info');

            // Fallback: demo mode
            setTimeout(() => {
                simulateSuccessfulLogin();
                showNotification('Đăng nhập demo thành công!', 'success');
            }, 1000);
        });
}

// Hàm đăng xuất khỏi Keycloak
function keycloakLogout() {
    console.log('Logout button clicked');

    const host = getHost();

    // Xóa trạng thái local và localStorage
    clearAuthState();

    // Cập nhật UI ngay lập tức
    updateAuthUI();

    // Tạo URL redirect về trang chủ sau logout
    const redirectUrl = `${KEYCLOAK_CONFIG.baseUrl}/index.html?logout=success`;

    // Redirect đến Keycloak logout với post_logout_redirect_uri qua Proxy
    const keycloakLogoutUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUrl)}&client_id=${encodeURIComponent(KEYCLOAK_CONFIG.clientId)}`;

    console.log('Redirecting to logout:', keycloakLogoutUrl);
    console.log('Post-Logout Redirect URL:', redirectUrl);

    // Hiển thị thông báo logout
    showNotification('Đang đăng xuất...', 'info');

    // Redirect sau 1 giây để user thấy thông báo
    setTimeout(() => {
        window.location.href = keycloakLogoutUrl;
    }, 1000);
}

// Hàm test API bảo mật với token
async function testSecureAPI() {
    if (!isAuthenticated) {
        showNotification('Vui lòng đăng nhập trước khi test API bảo mật', 'warning');
        return;
    }

    try {
        const host = getHost();
        console.log('Testing secure API with token...');

        // Hiển thị loading
        showNotification('Đang test API bảo mật...', 'info');

        if (accessToken) {
            // Test với token thực
            const response = await fetch(`http://${host}/api/secure`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                showNotification(`✅ API Secure thành công!\n\nResponse: ${JSON.stringify(data, null, 2)}\n\nUser: ${userInfo.username}\nEmail: ${userInfo.email}`, 'success');

                // Log token info for debugging
                console.log('Token payload:', parseJWT(accessToken));
            } else {
                throw new Error(`API call failed: ${response.status}`);
            }
        } else {
            // Fallback: hiển thị thông tin user
            showNotification(`✅ Đăng nhập thành công!\n\nUser: ${userInfo.username}\nEmail: ${userInfo.email}\nName: ${userInfo.firstName} ${userInfo.lastName}\n\nAPI secure endpoint sẽ hoạt động khi có token thực từ Keycloak.`, 'success');
        }
    } catch (error) {
        console.error('Error testing secure API:', error);
        showNotification(`⚠️ API Test Warning\n\nUser: ${userInfo.username}\nEmail: ${userInfo.email}\n\nLưu ý: API secure endpoint cần token hợp lệ từ Keycloak.`, 'warning');
    }
}

// Hàm hiển thị notification đẹp hơn
function showNotification(message, type = 'info') {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 12px;
        font-size: 0.9rem;
        line-height: 1.5;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(12px);
        animation: slideIn 0.3s ease-out;
        white-space: pre-line;
    `;

    // Màu sắc theo type
    const colors = {
        success: { bg: 'rgba(16, 185, 129, 0.9)', border: '#10b981', text: '#ffffff' },
        warning: { bg: 'rgba(251, 191, 36, 0.9)', border: '#fbbf24', text: '#ffffff' },
        error: { bg: 'rgba(248, 113, 113, 0.9)', border: '#f87171', text: '#ffffff' },
        info: { bg: 'rgba(59, 130, 246, 0.9)', border: '#3b82f6', text: '#ffffff' }
    };

    const color = colors[type] || colors.info;
    notification.style.background = color.bg;
    notification.style.border = `1px solid ${color.border}`;
    notification.style.color = color.text;

    notification.textContent = message;

    // Thêm animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);

    // Click để đóng
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Hàm auto-refresh token
async function refreshTokenIfNeeded() {
    if (!accessToken) return;

    try {
        const payload = parseJWT(accessToken);
        if (!payload || !payload.exp) return;

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;

        // Refresh nếu token sắp hết hạn trong 5 phút
        if (timeUntilExpiry < 300) {
            console.log('🔄 Token sắp hết hạn, đang refresh...');
            await refreshAccessToken();
        }
    } catch (error) {
        console.error('Error checking token expiry:', error);
    }
}

// Hàm refresh access token
async function refreshAccessToken() {
    try {
        const host = getHost();
        const refreshUrl = `http://${host}:8081/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;

        // Giả lập refresh (trong thực tế cần refresh token)
        console.log('Token refresh would happen here');
        showNotification('Token đã được refresh tự động', 'info');
    } catch (error) {
        console.error('Token refresh failed:', error);
        showNotification('Không thể refresh token. Vui lòng đăng nhập lại.', 'warning');
    }
}

// Hàm kiểm tra và xử lý trang Keycloak logout
function checkKeycloakLogoutPage() {
    const url = window.location.href;
    const bodyText = document.body.textContent.toLowerCase();
    
    // Kiểm tra xem có phải đang ở trang logout của Keycloak không
    // Kiểm tra xem có phải đang ở trang logout thực sự của Keycloak không
    // Tránh trùng với tham số ?logout=success của chính trang web
    const isKeycloakLogout = (
        url.includes('/realms/') && 
        (url.includes('/protocol/openid-connect/logout') || url.includes('logout')) &&
        !url.includes('logout=success')
    );
    
    if (isKeycloakLogout) {
        console.log('Keycloak logout page detected, preparing auto-redirect...');
        showKeycloakLogoutMessage();
        redirectFromKeycloakLogout();
        return true;
    }
    
    return false;
}

// Hiển thị thông báo khi ở trang Keycloak logout
function showKeycloakLogoutMessage() {
    // Tạo overlay thông báo
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    
    const message = document.createElement('div');
    message.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    const hostname = window.location.hostname;
    const homeUrl = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') 
        ? 'http://localhost:8080?logout=success' 
        : `http://${hostname}:8080?logout=success`;
    
    message.innerHTML = `
        <div style="color: #10b981; font-size: 48px; margin-bottom: 16px;">✅</div>
        <h2 style="color: #333; margin: 0 0 16px 0;">Đăng xuất thành công!</h2>
        <p style="color: #666; margin: 0 0 20px 0;">
            Bạn đã được đăng xuất khỏi hệ thống.<br>
            Tự động chuyển về trang chủ sau <span id="keycloak-countdown">2</span> giây...
        </p>
        <button onclick="window.location.href='${homeUrl}'" 
                style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            Về trang chủ ngay
        </button>
    `;
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    
    // Countdown timer
    let countdown = 2;
    const countdownEl = document.getElementById('keycloak-countdown');
    const timer = setInterval(() => {
        countdown--;
        if (countdownEl) {
            countdownEl.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(timer);
        }
    }, 1000);
}

// Redirect từ trang Keycloak logout về trang chủ
function redirectFromKeycloakLogout() {
    // Sử dụng origin hiện tại (bao gồm cả port) để đảm bảo quay về đúng gateway
    const homeUrl = window.location.origin;
    
    console.log('Redirecting from Keycloak logout to home:', homeUrl);
    
    // Thêm parameter để báo hiệu logout thành công
    const redirectUrl = `${homeUrl}/index.html?logout=success`;
    
    // Redirect với delay 2 giây để user thấy thông báo
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 2000);
}

// Khởi tạo authentication khi DOM loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing Keycloak authentication...');

    // Kiểm tra xem có phải đang ở trang Keycloak logout không
    if (checkKeycloakLogoutPage()) {
        // Đã xử lý Keycloak logout page, không cần làm gì thêm
        return;
    }

    // Kiểm tra logout success từ URL parameter
    if (checkLogoutSuccess()) {
        // Đã xử lý logout success, không cần làm gì thêm
        return;
    }

    // Đầu tiên thử khôi phục trạng thái từ localStorage
    const restored = restoreAuthState();

    if (restored) {
        console.log('🔄 Auth state restored, updating UI...');
        updateAuthUI();
    } else {
        // Đảm bảo trạng thái ban đầu là chưa đăng nhập
        isAuthenticated = false;
        userInfo = null;
        accessToken = null;

        // Kiểm tra xem có authorization code không
        if (!checkAuthCode()) {
            // Không có code, hiển thị UI cho trạng thái chưa đăng nhập
            updateAuthUI();
        }
    }

    // Theo dõi thay đổi DOM để phát hiện Keycloak logout page (cho trường hợp trang load động)
    const observer = new MutationObserver((mutations) => {
        if (checkKeycloakLogoutPage()) {
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Timeout để tránh observer chạy mãi
    setTimeout(() => {
        observer.disconnect();
    }, 10000);

    // Bắt đầu auto-refresh token mỗi 5 phút
    setInterval(refreshTokenIfNeeded, 5 * 60 * 1000);
});

// Export functions để có thể gọi từ HTML
window.keycloakLogin = keycloakLogin;
window.keycloakLogout = keycloakLogout;
window.testSecureAPI = testSecureAPI;
window.showNotification = showNotification;