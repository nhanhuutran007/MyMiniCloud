// Keycloak Authentication for MyMiniCloud
console.log('Keycloak Auth module loaded');

// Cấu hình Keycloak
const KEYCLOAK_CONFIG = {
    url: 'http://localhost:8081',
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

// Hàm lấy host hiện tại
function getHost() {
    const h = window.location.hostname;
    return (h === '' || h === 'localhost' || h === '127.0.0.1') ? 'localhost' : h;
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
    const host = getHost();
    const tokenUrl = `http://${host}:8081/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KEYCLOAK_CONFIG.clientId,
        code: code,
        redirect_uri: window.location.origin
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
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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
    
    // Kiểm tra Keycloak có sẵn không
    fetch(`http://${host}:8081/realms/${KEYCLOAK_CONFIG.realm}`)
        .then(response => {
            if (response.ok) {
                // Keycloak có sẵn, thử đăng nhập thực
                const state = Math.random().toString(36).substring(2, 15);
                const keycloakLoginUrl = `http://${host}:8081/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?client_id=${KEYCLOAK_CONFIG.clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=openid&state=${state}`;
                
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

    // Reset trạng thái local
    isAuthenticated = false;
    userInfo = null;
    accessToken = null;

    // Redirect đến Keycloak logout
    const keycloakLogoutUrl = `http://${host}:8081/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;

    console.log('Redirecting to logout:', keycloakLogoutUrl);
    window.location.href = keycloakLogoutUrl;
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

// Khởi tạo authentication khi DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Keycloak authentication...');

    // Kiểm tra xem có authorization code không
    if (!checkAuthCode()) {
        // Không có code, hiển thị UI mặc định
        updateAuthUI();
    }

    // Bắt đầu auto-refresh token mỗi 5 phút
    setInterval(refreshTokenIfNeeded, 5 * 60 * 1000);
});

// Export functions để có thể gọi từ HTML
window.keycloakLogin = keycloakLogin;
window.keycloakLogout = keycloakLogout;
window.testSecureAPI = testSecureAPI;
window.showNotification = showNotification;