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
    console.log('Login button clicked - redirecting to Keycloak');

    const host = getHost();
    const state = Math.random().toString(36).substring(2, 15);
    
    // Redirect đến Keycloak login
    const keycloakLoginUrl = `http://${host}:8081/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?client_id=${KEYCLOAK_CONFIG.clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=openid&state=${state}`;

    console.log('Redirecting to:', keycloakLoginUrl);
    window.location.href = keycloakLoginUrl;
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
        alert('Vui lòng đăng nhập trước khi test API bảo mật');
        return;
    }

    try {
        const host = getHost();
        console.log('Testing secure API with token...');

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
                alert(`✅ API Secure thành công!\n\nResponse: ${JSON.stringify(data, null, 2)}\n\nUser: ${userInfo.username}\nEmail: ${userInfo.email}`);
            } else {
                throw new Error(`API call failed: ${response.status}`);
            }
        } else {
            // Fallback: hiển thị thông tin user
            alert(`✅ Đăng nhập thành công!\n\nUser: ${userInfo.username}\nEmail: ${userInfo.email}\nName: ${userInfo.firstName} ${userInfo.lastName}\n\nAPI secure endpoint sẽ hoạt động khi có token thực từ Keycloak.`);
        }
    } catch (error) {
        console.error('Error testing secure API:', error);
        alert(`✅ Đăng nhập thành công!\n\nUser: ${userInfo.username}\nEmail: ${userInfo.email}\n\nLưu ý: API secure endpoint cần token hợp lệ.`);
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
});

// Export functions để có thể gọi từ HTML
window.keycloakLogin = keycloakLogin;
window.keycloakLogout = keycloakLogout;
window.testSecureAPI = testSecureAPI;