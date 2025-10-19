// مدیریت وضعیت لاگین
function checkAuthStatus() {
    const ownerLoggedIn = localStorage.getItem('worldapi_owner_logged') === 'true';
    const userData = localStorage.getItem('worldapi_current_user');
    
    if (ownerLoggedIn) {
        updateAuthUI('owner');
    } else if (userData) {
        updateAuthUI('user');
    }
}

// مدیریت خطاها
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    showMessage('خطایی رخ داده است. لطفاً دوباره تلاش کنید.', 'error');
}

// اعتبارسنجی فرم‌ها
function validateForm(formData, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData.get(field);
        
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${rule.label} الزامی است`);
        }
        
        if (value && rule.minLength && value.length < rule.minLength) {
            errors.push(`${rule.label} باید حداقل ${rule.minLength} کاراکتر باشد`);
        }
        
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.label} معتبر نیست`);
        }
    }
    
    return errors;
}

// مدیریت محصولات ویژه
function getFeaturedProducts() {
    return products.filter(product => product.featured).slice(0, 3);
}

// جستجوی محصولات
function searchProducts(query) {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
}

// سبد خرید
let cart = JSON.parse(localStorage.getItem('worldapi_cart') || '[]');

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('worldapi_cart', JSON.stringify(cart));
    updateCartCount();
    showMessage('محصول به سبد خرید اضافه شد', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('worldapi_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartElements = document.querySelectorAll('.cart-count');
    
    cartElements.forEach(element => {
        element.textContent = count;
        element.style.display = count > 0 ? 'flex' : 'none';
    });
}

// تاریخ شمسی
function toPersianDate(date) {
    const gregorian = new Date(date);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'persian',
        numberingSystem: 'arab'
    };
    
    return new Intl.DateTimeFormat('fa-IR', options).format(gregorian);
}

// مدیریت تم سایت
function initTheme() {
    const savedTheme = localStorage.getItem('worldapi_theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('worldapi_theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('worldapi_theme', newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// انیمیشن‌های پیشرفته
function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (range * progress);
        element.textContent = Math.floor(current).toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// مدیریت نوتیفیکیشن‌ها
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }
    
    createContainer() {
        const existing = document.getElementById('notification-container');
        if (existing) return existing;
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        
        return container;
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-xl">&times;</button>
            </div>
        `;
        
        this.container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('translate-x-0', 'opacity-100');
        }, 10);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        return notification;
    }
    
    remove(notification) {
        notification.classList.remove('translate-x-0', 'opacity-100');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }
}

const notifications = new NotificationManager();

// جایگزین برای showMessage
function showMessage(message, type = 'info') {
    notifications.show(message, type);
}

// مدیریت آپلود فایل
class FileUploader {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 2 * 1024 * 1024; // 2MB default
        this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    }
    
    validateFile(file) {
        const errors = [];
        
        if (file.size > this.maxSize) {
            errors.push(`حجم فایل نباید بیشتر از ${this.maxSize / 1024 / 1024}MB باشد`);
        }
        
        if (!this.allowedTypes.includes(file.type)) {
            errors.push('فرمت فایل پشتیبانی نمی‌شود');
        }
        
        return errors;
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const errors = this.validateFile(file);
            if (errors.length > 0) {
                reject(new Error(errors.join(', ')));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
            reader.readAsDataURL(file);
        });
    }
}

const imageUploader = new FileUploader();
const fontUploader = new FileUploader({
    allowedTypes: ['font/ttf', 'font/otf', 'application/font-woff', 'application/font-woff2'],
    maxSize: 5 * 1024 * 1024 // 5MB for fonts
});

// مدیریت وضعیت آنلاین
function initOnlineStatus() {
    function updateOnlineStatus() {
        if (navigator.onLine) {
            document.documentElement.classList.remove('offline');
            document.documentElement.classList.add('online');
        } else {
            document.documentElement.classList.remove('online');
            document.documentElement.classList.add('offline');
            showMessage('اتصال اینترنت قطع شده است', 'warning');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

// راه‌اندازی اولیه
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initTheme();
    initOnlineStatus();
    updateCartCount();
    
    // لود محصولات در صورت نیاز
    if (document.getElementById('products-grid')) {
        loadProducts();
    }
    
    console.log('WorldApiTM - Ready!');
});

// مدیریت ریدایرکت به تلگرام
function redirectToTelegram(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const message = `👋 سلام!
    
می‌خواهم محصول زیر را خریداری کنم:

📦 محصول: ${product.name}
💰 قیمت: ${product.price.toLocaleString()} تومان
⏰ مدت: ${product.duration}
📝 توضیحات: ${product.description}

لطفاً راهنمایی کنید چگونه پرداخت را انجام دهم.`;

    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/rahmatedit?text=${encodedMessage}`;
    
    // باز کردن در پنجره جدید
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    
    showMessage('در حال هدایت به تلگرام...', 'success');
}