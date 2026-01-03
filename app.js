// app.js - Main application logic

// ============================================
// PRODUCT DATABASE CLASS
// ============================================
class ProductDB {
    constructor() {
        this.storageKey = 'aymShopProducts';
        this.cartStorageKey = 'aymShopCart';
        this.wishlistStorageKey = 'aymShopWishlist';
        this.originalCartStorageKey = 'aymShopOriginalCart';
        this.products = [];
        this.categories = [];
        this.cart = [];
        this.wishlist = [];
        this.currentProductId = null;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentSearchResults = [];
        this.currentCategory = 'all';
        this.isLoading = false;
        this.billSerial = null;
        this.customerInfo = {
            name: '',
            phone: '',
            address: ''
        };
        this.apiEndpoint = '/api/products';
    }
    
    async loadProductsFromAPI() {
        try {
            console.log('در حال بارگیری محصولات از API...');
            
            const response = await fetch(this.apiEndpoint, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('وضعیت پاسخ:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`خطا در پاسخ سرور: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ داده‌های دریافتی:', data);
            console.log(`📊 تعداد محصولات: ${data.products?.length || 0}`);
            
            if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
                console.warn('⚠️ هیچ محصولی پیدا نشد');
                this.products = [];
                this.currentSearchResults = [];
                this.saveProducts();
                return this.products;
            }
            
            this.products = data.products;
            
            console.log(`✅ ${this.products.length} محصول با موفقیت بارگیری شد`);
            
            this.currentSearchResults = [...this.products];
            this.saveProducts();
            
            return this.products;
            
        } catch (error) {
            console.error('❌ خطا در بارگیری محصولات:', error);
            throw error;
        }
    }
    
    getCategoryPlaceholder(category) {
        const categoryEmojis = {
            'آرایشی و بهداشتی': '💄',
            'مراقبت مو': '🧴',
            'مراقبت پوست': '🧴',
            'بهداشتی': '🧼',
            'لوازم آرایشی': '💅',
            'عطر': '🌸',
            'کرم': '🧴',
            'شامپو': '🧴',
            'صابون': '🧼',
            'لوازم خانگی': '🏠',
            'لباس': '👕',
            'کفش': '👟',
            'اکسسوری': '👜',
            'لوازم الکترونیکی': '📱',
            'کتاب': '📚',
            'اسباب بازی': '🧸',
            'خوراکی': '🍎',
            'عمومی': '📦'
        };
        
        return categoryEmojis[category] || '📦';
    }
    
    extractCategories() {
        const allCategories = this.products.map(p => p.category || 'عمومی');
        const uniqueCategories = ['همه', ...new Set(allCategories)];
        this.categories = uniqueCategories;
    }
    
    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        const mainContainer = document.getElementById('mainContainer');
        
        if (loadingEl && mainContainer) {
            if (show) {
                loadingEl.style.display = 'flex';
                mainContainer.style.display = 'none';
            } else {
                loadingEl.style.display = 'none';
                mainContainer.style.display = 'block';
            }
        }
    }
    
    showLoadingError(show, message = '') {
        const loadingError = document.getElementById('loadingError');
        if (loadingError) {
            if (show) {
                loadingError.style.display = 'block';
                if (message) {
                    const errorText = loadingError.querySelector('p');
                    if (errorText) {
                        errorText.innerHTML = message;
                    }
                }
            } else {
                loadingError.style.display = 'none';
            }
        }
    }
    
    saveProducts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.products));
        } catch (e) {
            console.error('خطا در ذخیره محصولات در حافظه محلی:', e);
        }
    }
    
    loadCart() {
        try {
            return [];
        } catch (e) {
            console.error('خطا در بارگیری سبد خرید:', e);
            return [];
        }
    }
    
    loadWishlist() {
        try {
            const wishlist = localStorage.getItem(this.wishlistStorageKey);
            return wishlist ? JSON.parse(wishlist) : [];
        } catch (e) {
            console.error('خطا در بارگیری لیست علاقه‌مندی‌ها:', e);
            return [];
        }
    }
    
    saveCart() {
        try {
            localStorage.setItem(this.cartStorageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.error('خطا در ذخیره سبد خرید:', e);
        }
    }
    
    saveWishlist() {
        try {
            localStorage.setItem(this.wishlistStorageKey, JSON.stringify(this.wishlist));
        } catch (e) {
            console.error('خطا در ذخیره لیست علاقه‌مندی‌ها:', e);
        }
    }
    
    saveOriginalCart() {
        try {
            localStorage.setItem(this.originalCartStorageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.error('خطا در ذخیره سبد خرید اصلی:', e);
        }
    }
    
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
    
    searchProducts(query, category = this.currentCategory) {
        let filteredProducts = this.products;
        
        if (category !== 'all' && category !== 'همه') {
            filteredProducts = filteredProducts.filter(product => 
                product.category === category
            );
        }
        
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                (product.name && product.name.toLowerCase().includes(searchTerm)) || 
                (product.code && product.code.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.fullDescription && product.fullDescription.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentSearchResults = filteredProducts;
        this.currentCategory = category;
        
        return this.getPaginatedProducts();
    }
    
    getPaginatedProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.currentSearchResults.slice(startIndex, endIndex);
    }
    
    getTotalPages() {
        return Math.ceil(this.currentSearchResults.length / this.itemsPerPage);
    }
    
    getWishlistProducts() {
        return this.products.filter(product => this.wishlist.includes(product.id));
    }
    
    formatNumberWithCommas(number) {
        return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    }
    
    parsePrice(priceString) {
        if (!priceString) return 0;
        const cleanString = priceString.toString().replace(/[^\d,]/g, '').replace(/,/g, '');
        return parseInt(cleanString) || 0;
    }
    
    formatPrice(price) {
        if (typeof price === 'string') {
            const numericPart = this.parsePrice(price);
            const formattedNumber = this.formatNumberWithCommas(numericPart);
            return `${formattedNumber} افغانی`;
        }
        return `${this.formatNumberWithCommas(price)} افغانی`;
    }
    
    addToCart(productId, quantity = 1) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const existingItemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex !== -1) {
            this.cart[existingItemIndex].quantity += quantity;
            this.saveCart();
            this.saveOriginalCart();
            return true;
        } else {
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                images: product.images,
                category: product.category
            };
            
            this.cart.push(cartItem);
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
    }
    
    toggleWishlist(productId) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const index = this.wishlist.indexOf(productId);
        if (index !== -1) {
            this.wishlist.splice(index, 1);
        } else {
            this.wishlist.push(productId);
        }
        
        this.saveWishlist();
        return true;
    }
    
    removeFromWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        if (index !== -1) {
            this.wishlist.splice(index, 1);
            this.saveWishlist();
            return true;
        }
        return false;
    }
    
    isInWishlist(productId) {
        return this.wishlist.includes(productId);
    }
    
    getWishlistCount() {
        return this.wishlist.length;
    }
    
    updateCartQuantity(productId, quantity) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const cartItemIndex = this.cart.findIndex(item => item.id === productId);
        if (cartItemIndex !== -1) {
            if (quantity <= 0) {
                this.cart.splice(cartItemIndex, 1);
            } else {
                this.cart[cartItemIndex].quantity = quantity;
            }
            
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
        return false;
    }
    
    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.id === productId);
        if (index !== -1) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
        return false;
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.saveOriginalCart();
    }
    
    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    getCartTotal() {
        return this.cart.reduce((total, item) => {
            const price = this.parsePrice(item.price);
            return total + (price * item.quantity);
        }, 0);
    }
    
    checkout() {
        let success = true;
        let outOfStockItems = [];
        
        for (const cartItem of this.cart) {
            const product = this.getProductById(cartItem.id);
            if (product && product.stock >= cartItem.quantity) {
                product.stock -= cartItem.quantity;
            } else {
                success = false;
                outOfStockItems.push(cartItem.name);
            }
        }
        
        if (success) {
            this.saveProducts();
            this.saveOriginalCart();
            return { success: true };
        }
        
        return { success: false, outOfStockItems };
    }
}

// ============================================
// APPLICATION INITIALIZATION
// ============================================
let db;

async function initializeApp() {
    db = new ProductDB();
    db.showLoading(true);
    db.showLoadingError(false);
    
    try {
        const loadPromise = db.loadProductsFromAPI();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('بارگیری محصولات بیش از حد طول کشید. لطفاً اتصال اینترنت خود را بررسی کنید')), 30000)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);
        
        db.wishlist = db.loadWishlist();
        db.extractCategories();
        updateCartCount();
        updateWishlistCount();
        renderCurrentPage();
        renderCart();
        renderWishlist();
        setupEventListeners();
        
        db.showLoading(false);
        
        console.log('فروشگاه آنلاین AYM با موفقیت راه‌اندازی شد');
        console.log(`تعداد محصولات: ${db.products.length}`);
        console.log(`تعداد دسته‌بندی‌ها: ${db.categories.length}`);
        
        if (db.products.length === 0) {
            const productCount = document.getElementById('productCount');
            if (productCount) {
                productCount.textContent = 'هیچ محصولی در سیستم وجود ندارد';
            }
        }
        
    } catch (error) {
        console.error('خطا در راه‌اندازی برنامه:', error);
        
        db.products = [];
        db.currentSearchResults = [];
        db.categories = [];
        
        const loadingEl = document.getElementById('loading');
        const spinner = document.querySelector('.loading-spinner');
        
        if (spinner) {
            spinner.style.display = 'none';
        }
        
        const errorMessage = `
            <h4><i class="fas fa-exclamation-triangle"></i> خطا در بارگیری محصولات</h4>
            <p><strong>${error.message}</strong></p>
            <p>نمی‌توانیم محصولات را از سرور بارگیری کنیم.</p>
            <p><strong>لطفاً:</strong></p>
            <p>۱. اتصال اینترنت خود را بررسی کنید</p>
            <p>۲. صفحه را رفرش (F5) کنید</p>
            <p>۳. اگر مشکل ادامه دارد، با پشتیبانی تماس بگیرید: <strong>۰۷۸۹۲۸۱۷۷۰</strong></p>
            <p><strong>خطای فنی:</strong> ${error.message}</p>
        `;
        
        db.showLoadingError(true, errorMessage);
    }
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================
function renderCategoryModal() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    categoryList.innerHTML = '';
    
    if (db.categories.length === 0) {
        db.categories = ['همه'];
    }
    
    db.categories.forEach(category => {
        const categoryItem = document.createElement('button');
        categoryItem.className = 'category-item';
        if (category === 'همه' || category === db.currentCategory) {
            categoryItem.classList.add('active');
        }
        categoryItem.textContent = category;
        
        categoryItem.addEventListener('click', function() {
            db.currentPage = 1;
            db.currentCategory = category === 'همه' ? 'all' : category;
            db.searchProducts(document.getElementById('searchInput').value, db.currentCategory);
            renderCurrentPage();
            closeModal(document.getElementById('categoryModal'));
            document.querySelector('.tab[data-tab="products"]').click();
        });
        
        categoryList.appendChild(categoryItem);
    });
}

function renderProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (products.length === 0) {
        productsContainer.style.display = 'none';
        emptyState.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }
    
    productsContainer.style.display = 'grid';
    emptyState.style.display = 'none';
    
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const cartItem = db.cart.find(item => item.id === product.id);
        const isInWishlist = db.isInWishlist(product.id);
        
        const stockClass = product.stock > 10 ? 'stock-available' : 
                          product.stock > 0 ? 'stock-low' : 'stock-out';
        
        const stockText = product.stock > 10 ? 'موجود' :
                         product.stock > 0 ? `تنها ${product.stock} عدد` : 'ناموجود';
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-id', product.id);
        
        const isMobile = window.innerWidth <= 480;
        const nameMaxLength = isMobile ? (window.innerWidth <= 360 ? 25 : 30) : 35;
        
        const displayName = product.name && product.name.length > nameMaxLength ? 
            product.name.substring(0, nameMaxLength) + '...' : (product.name || 'محصول بدون نام');
        
        const hasMultipleImages = product.images && product.images.length > 1;
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
        
        productCard.innerHTML = `
            <div class="product-gallery">
                <img src="${mainImage}" 
                     alt="${product.name || 'محصول'}"
                     class="main-image"
                     loading="lazy"
                     width="250"
                     height="160"
                     onerror="handleImageError(this, '${db.getCategoryPlaceholder(product.category)}', true)">
                <div class="image-fallback" style="display: none">${db.getCategoryPlaceholder(product.category)}</div>
                
                <button class="wishlist-btn" style="position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 4; font-size: 1rem;" data-wishlist="${isInWishlist}">
                    <i class="fas fa-heart" style="color: ${isInWishlist ? '#f44336' : '#616161'}"></i>
                </button>
                
                ${hasMultipleImages ? `
                <div class="thumbnail-container">
                    ${product.images.map((img, index) => `
                        <img src="${img}" 
                             alt="تصویر ${index + 1} از ${product.name}"
                             class="thumbnail ${index === 0 ? 'active' : ''}"
                             data-index="${index}"
                             onclick="changeProductImage(this, '${product.id}')"
                             loading="lazy"
                             width="30"
                             height="30"
                             onerror="this.style.display='none'">
                    `).join('')}
                </div>
                ` : ''}
            </div>
            <h3 title="${product.name || 'محصول'}">${displayName}</h3>
            <div class="price-tag">
                ${db.formatPrice(product.price || 0)}
            </div>
            <div class="stock-info">
                <span class="${stockClass}"><i class="fas fa-box"></i> ${stockText}</span>
                ${product.category && product.category !== 'عمومی' ? `<div class="product-category">${product.category}</div>` : ''}
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary btn-small view-detail-btn">
                    <i class="fas fa-eye"></i> مشاهده
                </button>
                <button class="btn btn-success btn-small add-btn">
                    <i class="fas fa-cart-plus"></i> افزودن
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
        
        const viewDetailBtn = productCard.querySelector('.view-detail-btn');
        viewDetailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showProductDetail(product.id);
        });
        
        const addBtn = productCard.querySelector('.add-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAddToCart(product.id, addBtn);
        });
        
        const wishlistBtn = productCard.querySelector('.wishlist-btn');
        wishlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleToggleWishlist(product.id, wishlistBtn);
        });
        
        productCard.addEventListener('click', (e) => {
            if (!e.target.closest('.view-detail-btn') &&
                !e.target.closest('.add-btn') &&
                !e.target.closest('.wishlist-btn')) {
                showProductDetail(product.id);
            }
        });
    });
    
    updateProductCount();
    updatePagination();
}

function renderWishlist() {
    const wishlistContainer = document.getElementById('wishlistContainer');
    const emptyWishlist = document.getElementById('emptyWishlist');
    
    const wishlistProducts = db.getWishlistProducts();
    
    if (wishlistProducts.length === 0) {
        wishlistContainer.innerHTML = '';
        emptyWishlist.style.display = 'block';
        return;
    }
    
    emptyWishlist.style.display = 'none';
    wishlistContainer.innerHTML = '';
    
    wishlistProducts.forEach(product => {
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        wishlistItem.setAttribute('data-id', product.id);
        
        const firstImage = product.images && product.images.length > 0 ? product.images[0] : '';
        
        wishlistItem.innerHTML = `
            <div class="wishlist-item-icon">
                <img src="${firstImage}" 
                     alt="${product.name}"
                     loading="lazy"
                     width="80"
                     height="80"
                     onerror="handleImageError(this, '${db.getCategoryPlaceholder(product.category)}')">
                <div class="image-fallback" style="display: none">${db.getCategoryPlaceholder(product.category)}</div>
            </div>
            <div class="wishlist-item-details">
                <div class="wishlist-item-name">${product.name}</div>
                <div class="wishlist-item-price">${db.formatPrice(product.price || 0)}</div>
                ${product.category && product.category !== 'عمومی' ? `<div class="wishlist-item-category">${product.category}</div>` : ''}
            </div>
            <div class="wishlist-item-actions">
                <button class="btn btn-primary btn-small view-wishlist-detail-btn">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-success btn-small add-wishlist-to-cart-btn">
                    <i class="fas fa-cart-plus"></i>
                </button>
                <button class="btn btn-danger btn-small remove-wishlist-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        wishlistContainer.appendChild(wishlistItem);
        
        const viewDetailBtn = wishlistItem.querySelector('.view-wishlist-detail-btn');
        viewDetailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showProductDetail(product.id);
        });
        
        const addToCartBtn = wishlistItem.querySelector('.add-wishlist-to-cart-btn');
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAddToCart(product.id, null, true);
        });
        
        const removeBtn = wishlistItem.querySelector('.remove-wishlist-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRemoveFromWishlist(product.id);
        });
    });
}

function renderCurrentPage() {
    const products = db.getPaginatedProducts();
    renderProducts(products);
}

function showProductDetail(productId) {
    const product = db.getProductById(productId);
    if (!product) return;
    
    db.currentProductId = productId;
    
    const detailName = document.getElementById('detailName');
    const detailDescription = document.getElementById('detailDescription');
    const detailPrice = document.getElementById('detailPrice');
    const detailCode = document.getElementById('detailCode');
    const detailStock = document.getElementById('detailStock');
    const detailCategory = document.getElementById('detailCategory');
    const detailMainImage = document.getElementById('detailMainImage');
    const detailThumbnails = document.getElementById('detailThumbnails');
    
    detailName.textContent = product.name || 'محصول بدون نام';
    
    const fullDescription = product.fullDescription || product.description || 'بدون توضیح';
    detailDescription.textContent = fullDescription;
    
    detailPrice.textContent = db.formatPrice(product.price || 0);
    detailCode.textContent = product.code || 'بدون کود';
    detailCategory.textContent = product.category || 'عمومی';
    
    const stockClass = product.stock > 10 ? 'stock-available' : 
                      product.stock > 0 ? 'stock-low' : 'stock-out';
    
    detailStock.textContent = product.stock > 10 ? 'موجود' :
                              product.stock > 0 ? `تنها ${product.stock} عدد` : 'ناموجود';
    detailStock.className = stockClass;
    
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
    detailMainImage.src = mainImage;
    detailMainImage.alt = product.name || 'محصول';
    
    detailMainImage.onerror = function() {
        this.style.display = 'none';
        const fallback = document.querySelector('#productDetailModal .image-fallback');
        if (fallback) {
            fallback.textContent = db.getCategoryPlaceholder(product.category);
            fallback.style.display = 'block';
        }
    };
    
    detailThumbnails.innerHTML = '';
    if (product.images && product.images.length > 1) {
        detailThumbnails.style.display = 'flex';
        product.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.alt = `تصویر ${index + 1} از ${product.name}`;
            thumbnail.className = `detail-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.index = index;
            thumbnail.onclick = () => changeDetailImage(thumbnail, index);
            thumbnail.onerror = function() {
                this.style.display = 'none';
            };
            detailThumbnails.appendChild(thumbnail);
        });
    } else {
        detailThumbnails.style.display = 'none';
    }
    
    document.getElementById('productDetailModal').style.display = 'flex';
}

function renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    
    if (db.cart.length === 0) {
        cartContainer.innerHTML = '';
        emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartContainer.innerHTML = '';
    
    let subtotal = 0;
    
    db.cart.forEach(cartItem => {
        const product = db.getProductById(cartItem.id);
        if (!product) return;
        
        const price = db.parsePrice(cartItem.price);
        const itemTotal = price * cartItem.quantity;
        subtotal += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        const firstImage = cartItem.images && cartItem.images.length > 0 ? cartItem.images[0] : '';
        cartItemEl.innerHTML = `
            <div class="cart-item-total">${db.formatNumberWithCommas(itemTotal)} افغانی</div>
            <div class="cart-item-quantity">
                <span class="quantity-display">${cartItem.quantity}</span>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${cartItem.name}</div>
                <div class="cart-item-price">${db.formatPrice(cartItem.price)} × ${cartItem.quantity}</div>
                <div class="stock-info" style="font-size: 0.85rem; margin-top: 4px;">
                    <span class="${product.stock > cartItem.quantity ? 'stock-available' : 'stock-out'}">
                        ${product.stock > cartItem.quantity ? 'موجودی کافی' : 'موجودی ناکافی'}
                    </span>
                </div>
            </div>
            <div class="cart-item-icon">
                <img src="${firstImage}" 
                     alt="${cartItem.name}"
                     loading="lazy"
                     width="60"
                     height="60"
                     onerror="handleImageError(this, '${db.getCategoryPlaceholder(product.category)}')">
                <div class="image-fallback" style="display: none">${db.getCategoryPlaceholder(product.category)}</div>
            </div>
        `;
        
        cartContainer.appendChild(cartItemEl);
    });
    
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    
    subtotalEl.textContent = `${db.formatNumberWithCommas(subtotal)} افغانی`;
    totalEl.textContent = `${db.formatNumberWithCommas(subtotal)} افغانی`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function handleAddToCart(productId, addBtnElement = null, fromWishlist = false) {
    const product = db.getProductById(productId);
    
    if (db.addToCart(productId, 1)) {
        updateCartCount();
        renderCart();
        
        if (addBtnElement) {
            const originalHTML = addBtnElement.innerHTML;
            addBtnElement.innerHTML = '<i class="fas fa-check"></i>';
            addBtnElement.classList.add('btn-checkmark');
            
            setTimeout(() => {
                addBtnElement.innerHTML = originalHTML;
                addBtnElement.classList.remove('btn-checkmark');
            }, 1500);
        }
        
        const cartTab = document.querySelector('.tab[data-tab="cart"]');
        if (cartTab.classList.contains('active')) {
            renderCart();
        }
        
        if (fromWishlist) {
            alert('محصول به سبد خرید اضافه شد!');
        }
    }
}

function handleToggleWishlist(productId, wishlistBtn) {
    const product = db.getProductById(productId);
    if (!product) return;
    
    db.toggleWishlist(productId);
    updateWishlistCount();
    
    if (wishlistBtn) {
        const isNowInWishlist = db.isInWishlist(productId);
        wishlistBtn.setAttribute('data-wishlist', isNowInWishlist);
        
        const heartIcon = wishlistBtn.querySelector('i');
        if (heartIcon) {
            heartIcon.style.color = isNowInWishlist ? '#f44336' : '#616161';
        }
    }
    
    const wishlistTab = document.querySelector('.tab[data-tab="wishlist"]');
    if (wishlistTab.classList.contains('active')) {
        renderWishlist();
    }
}

function handleRemoveFromWishlist(productId) {
    if (db.removeFromWishlist(productId)) {
        updateWishlistCount();
        renderWishlist();
        
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (productCard) {
            const wishlistBtn = productCard.querySelector('.wishlist-btn');
            if (wishlistBtn) {
                wishlistBtn.innerHTML = '<i class="fas fa-heart" style="color: #616161"></i>';
            }
        }
        
        alert('محصول از لیست علاقه‌مندی‌ها حذف شد!');
    }
}

function updateCartCount() {
    const count = db.getCartItemCount();
    const cartCount = document.getElementById('navCartCount');
    
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

function updateWishlistCount() {
    const count = db.getWishlistCount();
    const wishlistCount = document.getElementById('wishlistCount');
    
    if (wishlistCount) {
        wishlistCount.textContent = count;
        wishlistCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

function updateProductCount() {
    const total = db.products.length;
    const showing = db.currentSearchResults.length > db.itemsPerPage ? 
        `نمایش ${Math.min(db.itemsPerPage, db.currentSearchResults.length)} از ${db.currentSearchResults.length}` : 
        `نمایش ${db.currentSearchResults.length}`;
        
    const productCount = document.getElementById('productCount');
    if (productCount) {
        productCount.textContent = `کل محصولات: ${total} | ${showing}`;
    }
}

function updatePagination() {
    const totalPages = db.getTotalPages();
    const pagination = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pagination && prevPageBtn && nextPageBtn && pageInfo) {
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            prevPageBtn.disabled = db.currentPage === 1;
            nextPageBtn.disabled = db.currentPage === totalPages;
            pageInfo.textContent = `صفحه ${db.currentPage} از ${totalPages}`;
        } else {
            pagination.style.display = 'none';
        }
    }
}

function showInfoModal(title, content) {
    const modalTitle = document.getElementById('infoModalTitle');
    const modalContent = document.getElementById('infoModalContent');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    
    document.getElementById('infoModal').style.display = 'flex';
}

function generateBillSerial() {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const serial = `AYM-${month}-${random}-${day}`;
    db.billSerial = serial;
    return serial;
}

function promptCustomerInfo() {
    return new Promise((resolve) => {
        const name = prompt('لطفاً نام مشتری را وارد کنید:', db.customerInfo.name || '');
        if (name === null) {
            resolve(false);
            return;
        }
        
        const phone = prompt('لطفاً شماره تماس مشتری را وارد کنید:', db.customerInfo.phone || '');
        if (phone === null) {
            resolve(false);
            return;
        }
        
        const address = prompt('لطفاً آدرس مشتری را وارد کنید:', db.customerInfo.address || '');
        if (address === null) {
            resolve(false);
            return;
        }
        
        db.customerInfo = {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim()
        };
        
        resolve(true);
    });
}

async function showBill() {
    const infoConfirmed = await promptCustomerInfo();
    if (!infoConfirmed) {
        return;
    }
    
    if (db.cart.length === 0) {
        alert('سبد خرید شما خالی است!');
        return;
    }
    
    const billContent = document.getElementById('billContent');
    const billSerial = generateBillSerial();
    
    let billHTML = `
<div class="bill-header">
    <img src="/images/logo.jpg" 
         alt="فروشگاه آنلاین AYM" 
         style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); border: 3px solid #e0e0e0;">
    <h2 style="margin-bottom: 5px; font-size: 18px;">فروشگاه آنلاین AYM</h2>
    <h3 style="margin-bottom: 10px; font-size: 16px; color: #3949ab;">بل خرید</h3>
    <p style="margin: 3px 0; font-size: 14px;">تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
    <p style="margin: 3px 0; font-size: 14px;">زمان: ${new Date().toLocaleTimeString('fa-IR')}</p>
</div>

<div class="customer-info">
    <h4><i class="fas fa-user"></i> اطلاعات مشتری</h4>
    <div class="customer-info-row">
        <span class="customer-info-label">نام:</span>
        <span>${db.customerInfo.name}</span>
    </div>
    <div class="customer-info-row">
        <span class="customer-info-label">شماره تماس:</span>
        <span>${db.customerInfo.phone}</span>
    </div>
    <div class="customer-info-row">
        <span class="customer-info-label">آدرس:</span>
        <span>${db.customerInfo.address}</span>
    </div>
</div>

<table class="bill-table">
    <thead>
        <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: right;">جنس</th>
            <th style="width: 60px; text-align: center;">تعداد</th>
            <th style="width: 80px; text-align: left;">قیمت واحد</th>
            <th style="width: 90px; text-align: left;">مجموع</th>
        </tr>
    </thead>
    <tbody>
`;
    
    let total = 0;
    
    db.cart.forEach((cartItem, index) => {
        const price = db.parsePrice(cartItem.price);
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;
        
        billHTML += `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: right;">${cartItem.name}</td>
            <td style="text-align: center;">${cartItem.quantity}</td>
            <td style="text-align: left;">${db.formatNumberWithCommas(price)}</td>
            <td style="text-align: left;">${db.formatNumberWithCommas(itemTotal)} افغانی</td>
        </tr>
        `;
    });
    
    billHTML += `
    </tbody>
    <tfoot>
        <tr>
            <td colspan="4" style="text-align: right; font-weight: bold;">مجموع کل:</td>
            <td style="text-align: left; font-weight: bold; color: #00c853;">${db.formatNumberWithCommas(total)} افغانی</td>
        </tr>
    </tfoot>
</table>

<div class="bill-footer">
    <p style="font-size: 15px; color: #1a237e; margin: 0; font-weight: bold;">تشکر از خرید شما</p>
    <p style="color: #616161; margin: 5px 0 0 0;">برای پیگیری سفارش با شماره ۰۷۸۹۲۸۱۷۷۰ تماس بگیرید</p>
    <p class="bill-serial">شماره بل: ${billSerial}</p>
</div>
`;
    
    billContent.innerHTML = billHTML;
    
    document.getElementById('cartModal').style.display = 'flex';
    
    const checkoutResult = db.checkout();
    if (checkoutResult.success) {
        updateCartCount();
        renderCart();
        renderCurrentPage();
        
        setTimeout(() => {
            alert('سفارش شما با موفقیت ثبت شد! لطفاً بل خرید را برای پشتیبانی ارسال کنید.');
        }, 500);
    } else {
        alert(`موجودی کافی برای محصولات زیر وجود ندارد:\n${checkoutResult.outOfStockItems.join('\n')}\n\nلطفاً با پشتیبانی تماس بگیرید: ۰۷۸۹۲۸۱۷۷۰`);
    }
}

function shareOnWhatsApp() {
    if (!db.billSerial) {
        alert('ابتدا باید بل خرید ایجاد شود.');
        return;
    }
    
    const customerName = db.customerInfo.name || 'مشتری';
    const customerPhone = db.customerInfo.phone || 'بدون شماره';
    const customerAddress = db.customerInfo.address || 'بدون آدرس';
    const billSerial = db.billSerial;
    
    const originalCartJson = localStorage.getItem('aymShopOriginalCart');
    let originalCart = [];
    
    if (originalCartJson) {
        originalCart = JSON.parse(originalCartJson);
    } else {
        originalCart = db.cart;
    }
    
    if (originalCart.length === 0 && db.cart.length === 0) {
        alert('هیچ محصولی در سفارش وجود ندارد.');
        return;
    }
    
    const cartToShare = originalCart.length > 0 ? originalCart : db.cart;
    
    let itemsText = '';
    let total = 0;
    
    cartToShare.forEach((cartItem, index) => {
        const price = db.parsePrice(cartItem.price);
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;
        itemsText += `${index + 1}. ${cartItem.name} - ${cartItem.quantity} عدد - ${db.formatNumberWithCommas(itemTotal)} افغانی\n`;
    });
    
    const message = `📱 *سفارش جدید از فروشگاه آنلاین AYM*

🔖 *شماره بل:* ${billSerial}

👤 *مشتری:* ${customerName}
📞 *شماره تماس:* ${customerPhone}
📍 *آدرس:* ${customerAddress}

🛒 *اقلام سفارش:*
${itemsText}

💰 *مبلغ کل:* ${db.formatNumberWithCommas(total)} افغانی

📅 *تاریخ:* ${new Date().toLocaleDateString('fa-IR')}
⏰ *زمان:* ${new Date().toLocaleTimeString('fa-IR')}

_لطفاً پس از بررسی موجودی، سفارش را تایید کنید._`;
    
    const whatsappNumber = '93789281770';
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

function printBill() {
    const billContent = document.getElementById('billContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پرنت بل خرید - فروشگاه AYM</title>
            <style>
                body {
                    font-family: Tahoma, Arial, sans-serif;
                    direction: rtl;
                    text-align: right;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .bill-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                }
                .bill-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .bill-table th, .bill-table td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                }
                .bill-table th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .customer-info {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            ${billContent}
            <div style="text-align: center; margin-top: 30px;" class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3949ab; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    پرنت بل
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    بستن
                </button>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function openWhatsAppSupport() {
    const message = encodeURIComponent('سلام، از فروشگاه آنلاین AYM درخواست پشتیبانی دارم.');
    const whatsappNumber = '93789281770';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

function toggleHeaderVisibility(tabName) {
    const headerContainer = document.getElementById('headerContainer');
    
    if (tabName === 'products') {
        if (headerContainer) headerContainer.style.display = 'block';
    } else {
        if (headerContainer) headerContainer.style.display = 'none';
    }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchIcon = document.getElementById('searchIcon');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const cartBtn = document.getElementById('cartBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    const printBillBtn = document.getElementById('printBillBtn');
    const closeBillBtn = document.getElementById('closeBillBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const retryLoadingBtn = document.getElementById('retryLoadingBtn');
    const refreshProductsBtn = document.getElementById('refreshProductsBtn');
    const browseProductsBtn = document.getElementById('browseProductsBtn');
    const browseProductsWishlistBtn = document.getElementById('browseProductsWishlistBtn');
    const bottomWhatsAppBtn = document.getElementById('bottomWhatsAppBtn');
    const bottomGuideBtn = document.getElementById('bottomGuideBtn');
    const bottomHomeBtn = document.getElementById('bottomHomeBtn');
    const bottomCategoriesBtn = document.getElementById('bottomCategoriesBtn');
    
    const navHomeLink = document.getElementById('navHomeLink');
    const navCategoriesLink = document.getElementById('navCategoriesLink');
    const navAboutLink = document.getElementById('navAboutLink');
    const navContactLink = document.getElementById('navContactLink');
    const navGuideLink = document.getElementById('navGuideLink');
    
    const hamburgerHomeLink = document.getElementById('hamburgerHomeLink');
    const hamburgerCategoriesLink = document.getElementById('hamburgerCategoriesLink');
    const hamburgerAboutLink = document.getElementById('hamburgerAboutLink');
    const hamburgerContactLink = document.getElementById('hamburgerContactLink');
    const hamburgerGuideLink = document.getElementById('hamburgerGuideLink');
    
    const footerAboutLink = document.getElementById('footerAboutLink');
    const footerContactLink = document.getElementById('footerContactLink');
    const footerPrivacyLink = document.getElementById('footerPrivacyLink');
    const footerGuideLink = document.getElementById('footerGuideLink');
    const footerFaqLink = document.getElementById('footerFaqLink');
    
    // Info modal content
    const aboutContent = `
        <h3>درباره فروشگاه آنلاین AYM</h3>
        <p>فروشگاه آنلاین AYM با هدف ارائه بهترین محصولات و خدمات به مشتریان عزیز تأسیس شده است.</p>
        <h4>ماموریت ما:</h4>
        <p>ارائه محصولات با کیفیت بالا، قیمت مناسب و خدمات پس از فروش عالی به تمامی هموطنان در سراسر افغانستان.</p>
    `;
    
    const contactContent = `
        <h3>تماس با فروشگاه آنلاین AYM</h3>
        <h4>اطلاعات تماس:</h4>
        <ul>
            <li><strong>شماره تماس:</strong> ۰۷۸۹۲۸۱۷۷۰</li>
            <li><strong>آدرس:</strong> لیسه مریم، مقابل مرکز تجارتی طلا، مارکیت تجارتی جام جم منزل سوم</li>
        </ul>
    `;
    
    const guideContent = `
        <h3>راهنمای خرید از فروشگاه آنلاین AYM</h3>
        <p>برای خرید آسان و مطمئن از فروشگاه آنلاین AYM، لطفاً مراحل زیر را دنبال کنید:</p>
        <h4>مرحله ۱: مرور محصولات</h4>
        <p>از طریق تب "محصولات" می‌توانید تمامی محصولات ما را مشاهده کنید.</p>
    `;
    
    const privacyContent = `
        <h3>حریم خصوصی فروشگاه آنلاین AYM</h3>
        <p>حفظ حریم خصوصی کاربران برای ما بسیار مهم است.</p>
    `;
    
    const faqContent = `
        <h3>سوالات متداول (FAQ)</h3>
        <h4>۱. چگونه از فروشگاه آنلاین AYM خرید کنم؟</h4>
        <p>می‌توانید با مراجعه به تب محصولات، محصول مورد نظر خود را انتخاب و به سبد خرید اضافه کنید.</p>
    `;
    
    // Hamburger menu
    if (hamburgerBtn && hamburgerMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburgerMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                hamburgerMenu.classList.remove('show');
            }
        });
    }
    
    // Navigation links
    if (navHomeLink) {
        navHomeLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab[data-tab="products"]').click();
        });
    }
    
    if (navCategoriesLink) {
        navCategoriesLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderCategoryModal();
            document.getElementById('categoryModal').style.display = 'flex';
        });
    }
    
    if (navAboutLink) {
        navAboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('درباره ما', aboutContent);
        });
    }
    
    if (navContactLink) {
        navContactLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('تماس با ما', contactContent);
        });
    }
    
    if (navGuideLink) {
        navGuideLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('راهنمای خرید', guideContent);
        });
    }
    
    // Bottom menu
    if (bottomHomeBtn) {
        bottomHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab[data-tab="products"]').click();
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            bottomHomeBtn.classList.add('active');
        });
    }
    
    if (bottomCategoriesBtn) {
        bottomCategoriesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderCategoryModal();
            document.getElementById('categoryModal').style.display = 'flex';
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            bottomCategoriesBtn.classList.add('active');
        });
    }
    
    if (bottomGuideBtn) {
        bottomGuideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('راهنمای خرید', guideContent);
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            bottomGuideBtn.classList.add('active');
        });
    }
    
    if (bottomWhatsAppBtn) {
        bottomWhatsAppBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openWhatsAppSupport();
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            bottomWhatsAppBtn.classList.add('active');
        });
    }
    
    // Hamburger menu links
    if (hamburgerHomeLink) {
        hamburgerHomeLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab[data-tab="products"]').click();
            hamburgerMenu.classList.remove('show');
        });
    }
    
    if (hamburgerCategoriesLink) {
        hamburgerCategoriesLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderCategoryModal();
            document.getElementById('categoryModal').style.display = 'flex';
            hamburgerMenu.classList.remove('show');
        });
    }
    
    if (hamburgerAboutLink) {
        hamburgerAboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('درباره ما', aboutContent);
            hamburgerMenu.classList.remove('show');
        });
    }
    
    if (hamburgerContactLink) {
        hamburgerContactLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('تماس با ما', contactContent);
            hamburgerMenu.classList.remove('show');
        });
    }
    
    if (hamburgerGuideLink) {
        hamburgerGuideLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('راهنمای خرید', guideContent);
            hamburgerMenu.classList.remove('show');
        });
    }
    
    // Footer links
    if (footerAboutLink) {
        footerAboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('درباره ما', aboutContent);
        });
    }
    
    if (footerContactLink) {
        footerContactLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('تماس با ما', contactContent);
        });
    }
    
    if (footerPrivacyLink) {
        footerPrivacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('حریم خصوصی', privacyContent);
        });
    }
    
    if (footerGuideLink) {
        footerGuideLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('راهنمای خرید', guideContent);
        });
    }
    
    if (footerFaqLink) {
        footerFaqLink.addEventListener('click', (e) => {
            e.preventDefault();
            showInfoModal('سوالات متداول', faqContent);
        });
    }
    
    // Other event listeners
    if (retryLoadingBtn) {
        retryLoadingBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    if (refreshProductsBtn) {
        refreshProductsBtn.addEventListener('click', async () => {
            db.showLoading(true);
            try {
                await db.loadProductsFromAPI();
                db.extractCategories();
                renderCurrentPage();
                db.showLoading(false);
                alert('محصولات با موفقیت به‌روزرسانی شدند!');
            } catch (error) {
                alert('خطا در بارگیری مجدد محصولات: ' + error.message);
                db.showLoading(false);
            }
        });
    }
    
    if (browseProductsBtn) {
        browseProductsBtn.addEventListener('click', () => {
            document.querySelector('.tab[data-tab="products"]').click();
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            if (bottomHomeBtn) bottomHomeBtn.classList.add('active');
        });
    }
    
    if (browseProductsWishlistBtn) {
        browseProductsWishlistBtn.addEventListener('click', () => {
            document.querySelector('.tab[data-tab="products"]').click();
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            if (bottomHomeBtn) bottomHomeBtn.classList.add('active');
        });
    }
    
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            document.querySelector('.tab[data-tab="cart"]').click();
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            if (bottomHomeBtn) bottomHomeBtn.classList.add('active');
        });
    }
    
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            document.querySelector('.tab[data-tab="wishlist"]').click();
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            if (bottomHomeBtn) bottomHomeBtn.classList.add('active');
        });
    }
    
    // Search functionality
    searchIcon.addEventListener('click', () => {
        db.currentPage = 1;
        db.searchProducts(searchInput.value);
        renderCurrentPage();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        db.currentPage = 1;
        db.currentSearchResults = db.products;
        renderCurrentPage();
        clearSearchBtn.style.display = 'none';
    });
    
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim()) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
    });
    
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            db.currentPage = 1;
            db.searchProducts(searchInput.value);
            renderCurrentPage();
        }, 300);
    });
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            toggleHeaderVisibility(tabName);
            
            if (tabName === 'cart') {
                renderCart();
            } else if (tabName === 'products') {
                renderCurrentPage();
            } else if (tabName === 'wishlist') {
                renderWishlist();
            }
            
            document.querySelectorAll('.bottom-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            if (bottomHomeBtn) bottomHomeBtn.classList.add('active');
        });
    });
    
    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (db.currentPage > 1) {
            db.currentPage--;
            renderCurrentPage();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (db.currentPage < db.getTotalPages()) {
            db.currentPage++;
            renderCurrentPage();
        }
    });
    
    // Cart functionality
    addToCartBtn.addEventListener('click', () => {
        if (db.currentProductId) {
            handleAddToCart(db.currentProductId);
            closeModal(document.getElementById('productDetailModal'));
            alert('محصول به سبد خرید اضافه شد!');
        }
    });
    
    checkoutBtn.addEventListener('click', async () => {
        if (db.cart.length === 0) {
            alert('سبد خرید شما خالی است!');
            return;
        }
        
        showBill();
    });
    
    clearCartBtn.addEventListener('click', () => {
        if (db.cart.length === 0) {
            alert('سبد خرید قبلاً خالی است!');
            return;
        }
        
        if (confirm('آیا مطمئن هستید که می‌خواهید سبد خرید خود را خالی کنید؟')) {
            db.clearCart();
            updateCartCount();
            renderCart();
            renderCurrentPage();
        }
    });
    
    // Bill functionality
    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', shareOnWhatsApp);
    }
    
    if (printBillBtn) {
        printBillBtn.addEventListener('click', printBill);
    }
    
    if (closeBillBtn) {
        closeBillBtn.addEventListener('click', () => {
            closeModal(document.getElementById('cartModal'));
        });
    }
    
    // Modal closing
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
}

// ============================================
// START THE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', initializeApp);