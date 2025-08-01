// Telegram Web App Integration
const tg = window.Telegram?.WebApp || {}
const ADMIN_IDS = [12345678, 87654321] // Admin ID'larini bu yerga qo'shing

// API Base URL
const API_BASE_URL = "http://localhost:5000/api"

// Global State
let currentUser = null
let currentBalance = 0
let accounts = []
let transactions = []
let selectedFilter = "all"
let activeChats = []
let currentAccountModal = null

// Utility Functions
function showNotification(message, type = "success") {
    const notification = document.getElementById("notification")
    const notificationText = document.getElementById("notification-text")

    notificationText.textContent = message
    notification.classList.add("show")

    setTimeout(() => {
        notification.classList.remove("show")
    }, 3000)
}

function showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden")
}

function hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden")
}

function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

function formatCurrency(amount, currency = "USD") {
    if (currency === "Stars") {
        return `${amount} ⭐`
    }
    return `$${amount}`
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        showLoading()
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                ...options.headers,
            },
            ...options,
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || "API xatosi yuz berdi")
        }

        return data
    } catch (error) {
        console.error("API Error:", error)
        showNotification(error.message, "error")
        throw error
    } finally {
        hideLoading()
    }
}

// Authentication
async function authenticateUser() {
    try {
        const initData = tg.initData
        if (!initData) {
            throw new Error("Telegram ma'lumotlari topilmadi")
        }

        const response = await apiRequest("/auth/telegram", {
            method: "POST",
            body: JSON.stringify({ initData }),
        })

        localStorage.setItem("token", response.token)
        currentUser = response.user
        currentBalance = response.user.balance || 0

        updateUserProfile()
        return response
    } catch (error) {
        console.error("Authentication error:", error)
        // Fallback to demo data if authentication fails
        currentUser = {
            id: 123456789,
            first_name: "Demo",
            last_name: "User",
            username: "demo_user",
            photo_url: null,
            balance: 0,
        }
        updateUserProfile()
    }
}

// Data Loading Functions
async function loadAccounts() {
    try {
        const response = await apiRequest("/accounts")
        accounts = response.accounts || []
        renderAccounts()
    } catch (error) {
        // Fallback to demo data
        accounts = [
            {
                id: 3673,
                title: "PUBG Pro Account",
                price: 80,
                image: "https://via.placeholder.com/300x300",
                game: "PUBG",
                level: 95,
                featured: false,
                seller: "ProGamer123",
                description: "Bu akkaunt Conqueror darajasida bo'lib, barcha mashhur skinlar va qurollar mavjud. 500+ o'yin soatlari, yuqori K/D ratio va professional statistikalar bilan.",
                isAdminAccount: false,
            },
            {
                id: 1550,
                title: "Free Fire Elite",
                price: 45,
                image: "https://via.placeholder.com/300x300",
                game: "Free Fire",
                level: 67,
                featured: false,
                seller: "Admin",
                description: "Diamond darajasidagi akkaunt. Barcha premium personajlar, noyob skinlar va maxsus effektlar mavjud. Elite Pass to'liq ochilgan.",
                isAdminAccount: true,
            },
            {
                id: 1120,
                title: "ML Legend Rank",
                price: 120,
                image: "https://via.placeholder.com/300x300",
                game: "Mobile Legends",
                level: 89,
                featured: false,
                seller: "LegendPlayer",
                description: "Legend darajasidagi akkaunt. 100+ hero, barcha skinlar va maxsus effektlar. Yuqori win rate va professional statistikalar.",
                isAdminAccount: false,
            },
            {
                id: 4055,
                title: "CS:GO Prime",
                price: 95,
                image: "https://via.placeholder.com/300x300",
                game: "CS:GO",
                level: 25,
                featured: false,
                seller: "CSPro",
                description: "Prime akkaunt, Global Elite darajasi. Noyob knife va AK-47 skinlari mavjud. 2000+ soat o'yin tajribasi.",
                isAdminAccount: true,
            },
        ]
        renderAccounts()
    }
}

async function loadTransactions() {
    try {
        const response = await apiRequest("/transactions")
        transactions = response.transactions || []
        renderTransactions()
    } catch (error) {
        // Fallback to demo data
        transactions = [
            {
                id: "tx001",
                type: "purchase",
                title: "PUBG Pro Account sotib olindi",
                amount: 80,
                currency: "USD",
                date: "2024-01-15T10:30:00Z",
                status: "completed",
                description: "Akkaunt #3673 muvaffaqiyatli sotib olindi",
            },
            {
                id: "tx002",
                type: "stars",
                title: "500 Stars sotib olindi",
                amount: 8.99,
                currency: "USD",
                date: "2024-01-14T15:20:00Z",
                status: "completed",
                description: "+50 bonus Stars bilan",
            },
            {
                id: "tx003",
                type: "ad",
                title: "E'lon reklamasi",
                amount: 50,
                currency: "Stars",
                date: "2024-01-13T09:15:00Z",
                status: "completed",
                description: "Free Fire Elite akkaunt uchun 7 kunlik reklama",
            },
        ]
        renderTransactions()
    }
}

// Modal Functions
function openAccountModal(accountId) {
    const account = accounts.find((acc) => acc.id === accountId)
    if (!account) return

    currentAccountModal = account
    const modal = document.getElementById("account-modal")

    // Fill modal content
    document.getElementById("modal-title").textContent = account.title
    document.getElementById("modal-image").src = account.image
    document.getElementById("modal-account-title").textContent = account.title
    document.getElementById("modal-account-id").textContent = `#${account.id}`
    document.getElementById("modal-price").textContent = `$${account.price}`
    document.getElementById("modal-game").textContent = account.game
    document.getElementById("modal-seller").textContent = account.seller
    document.getElementById("modal-description").textContent = account.description

    // Show/hide level
    const levelElement = document.getElementById("modal-level")
    if (account.level) {
        levelElement.classList.remove("hidden")
        levelElement.querySelector("span:last-child").textContent = account.level
    } else {
        levelElement.classList.add("hidden")
    }

    // Show admin menu if user is admin
    const adminMenuContainer = document.getElementById("admin-menu-container")
    if (currentUser && ADMIN_IDS.includes(currentUser.id)) {
        adminMenuContainer.classList.remove("hidden")
    } else {
        adminMenuContainer.classList.add("hidden")
    }

    // Show modal
    modal.classList.add("active")
    document.body.style.overflow = "hidden"
}

function closeAccountModal() {
    const modal = document.getElementById("account-modal")
    modal.classList.add("closing")

    setTimeout(() => {
        modal.classList.remove("active", "closing")
        document.body.style.overflow = "auto"
        currentAccountModal = null
    }, 300)
}

function openChatModal(accountId) {
    const account = accounts.find((acc) => acc.id === accountId)
    if (!account) return

    // Deduct stars for admin purchase
    if (currentBalance < 10) {
        showNotification("Admin orqali sotib olish uchun kamida 10 Stars kerak", "error")
        return
    }

    currentBalance -= 10
    updateUserProfile()

    // Add to active chats
    const chatId = Date.now()
    activeChats.push({
        id: chatId,
        accountId: accountId,
        accountTitle: account.title,
        status: "active",
        messages: [
            {
                type: "system",
                text: `${account.title} uchun admin bilan bog'lanish o'rnatildi. 10 Stars to'landi.`,
                timestamp: new Date(),
            },
            {
                type: "received",
                text: `Assalomu alaykum! ${account.title} akkauntini sotib olish uchun murojaat qildingiz. Tez orada sizga akkaunt ma'lumotlarini yuboraman.`,
                timestamp: new Date(),
            },
        ],
    })

    updateActiveChatCount()

    const modal = document.getElementById("chat-modal")
    loadChatMessages(chatId)
    modal.classList.add("active")
    document.body.style.overflow = "hidden"

    showNotification("Admin bilan chat boshlandi. 10 Stars to'landi.")
    closeAccountModal()
}

function closeChatModal() {
    const modal = document.getElementById("chat-modal")
    modal.classList.remove("active")
    document.body.style.overflow = "auto"
}

function loadChatMessages(chatId) {
    const chat = activeChats.find((c) => c.id === chatId)
    if (!chat) return

    const messagesContainer = document.getElementById("chat-messages")
    messagesContainer.innerHTML = ""

    chat.messages.forEach((message) => {
        const messageDiv = document.createElement("div")
        messageDiv.className = `message ${message.type}`
        messageDiv.textContent = message.text
        messagesContainer.appendChild(messageDiv)
    })

    messagesContainer.scrollTop = messagesContainer.scrollHeight
}

function sendChatMessage() {
    const input = document.getElementById("chat-input")
    const message = input.value.trim()

    if (!message) return

    // Add user message
    const messagesContainer = document.getElementById("chat-messages")
    const messageDiv = document.createElement("div")
    messageDiv.className = "message sent"
    messageDiv.textContent = message
    messagesContainer.appendChild(messageDiv)

    input.value = ""
    messagesContainer.scrollTop = messagesContainer.scrollHeight

    // Simulate admin response
    setTimeout(() => {
        const adminResponse = document.createElement("div")
        adminResponse.className = "message received"
        adminResponse.textContent = "Xabaringiz qabul qilindi. Tez orada javob beraman."
        messagesContainer.appendChild(adminResponse)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }, 1000)
}

function completeSale() {
    if (!currentAccountModal) return

    const confirmed = confirm("Sotib olib berish tugatilganini tasdiqlaysizmi?")
    if (!confirmed) return

    // Remove from active chats
    activeChats = activeChats.filter((chat) => chat.accountId !== currentAccountModal.id)
    updateActiveChatCount()

    showNotification("Sotish jarayoni tugatildi va chat yopildi")
    closeAccountModal()
    closeChatModal()
}

function openAdminPurchases() {
    if (activeChats.length === 0) {
        showNotification("Hozircha faol chatlar yo'q")
        return
    }

    // For demo, just open the first active chat
    const firstChat = activeChats[0]
    openChatModal(firstChat.accountId)
}

function updateActiveChatCount() {
    const countElement = document.getElementById("active-chats-count")
    countElement.textContent = activeChats.length
}

// Rendering Functions
function renderAccounts() {
    const container = document.getElementById("accounts-grid")
    const filteredAccounts = selectedFilter === "all" ? accounts : accounts.filter((account) => account.game === selectedFilter)

    container.innerHTML = filteredAccounts
        .map(
            (account, index) => `
        <div class="card-hover glass rounded-2xl overflow-hidden transition-all duration-300 ${account.isAdminAccount ? "admin-card" : ""}" 
             style="animation: fadeIn 0.5s ease-out ${index * 0.1}s both;"
             onclick="openAccountModal(${account.id})">
            <div class="relative">
                <img src="${account.image}" alt="${account.title}" 
                     class="w-full aspect-square object-cover">
                ${
                    account.level
                        ? `
                    <div class="absolute top-2 left-2">
                        <span class="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                            LVL ${account.level}
                        </span>
                    </div>
                `
                        : ""
                }
            </div>
            
            <div class="p-3">
                <p class="font-semibold truncate text-white">${account.title}</p>
                <p class="text-xs text-tg-hint mb-3">#${account.id}</p>
                
                <div class="flex justify-between items-center">
                    <button class="btn-primary text-white font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">
                        <svg class="w-4 h-4" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0L0 4.66667V14L8 9.33333L16 14V4.66667L8 0Z" fill="white"/>
                        </svg>
                        $${account.price}
                    </button>
                    
                    <button class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                            onclick="event.stopPropagation(); addToCart(${account.id})">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `,
        )
        .join("")
}

function renderCarousel() {
    const wrapper = document.getElementById("carousel-wrapper")
    const carouselAds = [
        { id: 1, image: "https://via.placeholder.com/600x360", title: "Top O'yinlar" },
        { id: 2, image: "https://via.placeholder.com/600x360", title: "Maxsus Taklif" },
        { id: 3, image: "https://via.placeholder.com/600x360", title: "Yangi Akkauntlar" },
    ]

    wrapper.innerHTML = carouselAds
        .map(
            (ad) => `
        <div class="swiper-slide">
            <div class="relative h-full">
                <img src="${ad.image}" alt="${ad.title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div class="absolute bottom-4 left-4">
                    <h3 class="text-xl font-bold text-white">${ad.title}</h3>
                </div>
            </div>
        </div>
    `,
        )
        .join("")
}

function renderFilterButtons() {
    const container = document.getElementById("filter-buttons")
    const filters = ["all", "PUBG", "Free Fire", "Mobile Legends", "CS:GO"]
    const filterLabels = {
        all: "Barchasi",
        PUBG: "PUBG",
        "Free Fire": "Free Fire",
        "Mobile Legends": "Mobile Legends",
        "CS:GO": "CS:GO",
    }

    container.innerHTML = filters
        .map(
            (filter) => `
        <button class="whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            selectedFilter === filter
                ? "btn-primary text-white"
                : "border border-primary text-primary hover:bg-primary hover:text-white"
        }" onclick="filterAccounts('${filter}')">
            ${filterLabels[filter]}
        </button>
    `,
        )
        .join("")
}

function renderStarPackages() {
    const container = document.getElementById("star-packages")
    const packages = [
        {
            id: 1,
            stars: 100,
            price: 1.99,
            bonus: 0,
            icon: "star",
            popular: false,
            color: "from-blue-500 to-cyan-400",
        },
        {
            id: 2,
            stars: 500,
            price: 8.99,
            bonus: 50,
            icon: "zap",
            popular: true,
            color: "from-purple-500 to-pink-500",
        },
        {
            id: 3,
            stars: 1000,
            price: 16.99,
            bonus: 150,
            icon: "crown",
            popular: false,
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: 4,
            stars: 2500,
            price: 39.99,
            bonus: 500,
            icon: "gem",
            popular: false,
            color: "from-emerald-500 to-teal-500",
        },
    ]

    const iconSvgs = {
        star: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>',
        zap: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>',
        crown: '<path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1a5 5 0 0110 0v1a2 2 0 01-2 2H6a2 2 0 01-2-2zm0-5a2 2 0 012-2h8a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" clip-rule="evenodd"></path>',
        gem: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 010 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>',
    }

    container.innerHTML = packages
        .map(
            (pkg) => `
        <div class="glass rounded-2xl p-4 card-hover ${pkg.popular ? "ring-2 ring-primary" : ""}">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r ${pkg.color} rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            ${iconSvgs[pkg.icon]}
                        </svg>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-bold text-lg">${pkg.stars} Stars</p>
                            ${pkg.popular ? '<span class="bg-primary text-white text-xs px-2 py-1 rounded-full">MASHHUR</span>' : ""}
                        </div>
                        ${pkg.bonus > 0 ? `<p class="text-sm text-green-400">+${pkg.bonus} bonus Stars</p>` : ""}
                        <p class="text-sm text-tg-hint">Jami: ${pkg.stars + pkg.bonus} Stars</p>
                    </div>
                </div>
                
                <div class="text-right">
                    <p class="text-xl font-bold text-primary">$${pkg.price}</p>
                    <button class="btn-primary text-white px-4 py-2 rounded-lg mt-2 font-medium"
                            onclick="purchaseStars(${pkg.id})">
                        Sotib Olish
                    </button>
                </div>
            </div>
        </div>
    `,
        )
        .join("")
}

function renderTransactions() {
    const container = document.getElementById("transactions-list")

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="glass rounded-2xl p-8 text-center">
                <svg class="w-12 h-12 text-tg-hint mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0M8 7v10a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"></path>
                </svg>
                <p class="text-tg-hint">Hozircha amallar mavjud emas</p>
            </div>
        `
        return
    }

    const getTransactionIcon = (type) => {
        const icons = {
            purchase: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>',
            sale: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>',
            stars: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>',
            ad: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>',
        }
        return icons[type] || icons.purchase
    }

    const getStatusClass = (status) => {
        const classes = {
            completed: "status-completed",
            pending: "status-pending",
            cancelled: "status-cancelled",
        }
        return classes[status] || "bg-gray-500"
    }

    const getStatusText = (status) => {
        const texts = {
            completed: "Bajarildi",
            pending: "Kutilmoqda",
            cancelled: "Bekor qilindi",
        }
        return texts[status] || "Noma'lum"
    }

    container.innerHTML = transactions
        .map(
            (transaction) => `
        <div class="glass rounded-2xl p-4 card-hover">
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3">
                    <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            ${getTransactionIcon(transaction.type)}
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-white truncate">${transaction.title}</h3>
                        <p class="text-sm text-tg-hint mt-1">${transaction.description}</p>
                        <p class="text-xs text-tg-hint mt-2">${formatDate(transaction.date)}</p>
                    </div>
                </div>
                
                <div class="text-right flex-shrink-0 ml-4">
                    <p class="font-bold text-lg ${
                        transaction.type === "sale"
                            ? "text-green-400"
                            : transaction.type === "purchase"
                                ? "text-red-400"
                                : "text-primary"
                    }">
                        ${transaction.type === "sale" ? "+" : "-"}${formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <span class="text-xs px-2 py-1 rounded-full ${getStatusClass(transaction.status)} text-white mt-2 inline-block">
                        ${getStatusText(transaction.status)}
                    </span>
                </div>
            </div>
        </div>
    `,
        )
        .join("")
}

function renderHistoryFilters() {
    const container = document.getElementById("history-filters")
    const filters = [
        { key: "all", label: "Barchasi" },
        { key: "purchase", label: "Xaridlar" },
        { key: "sale", label: "Sotuvlar" },
        { key: "stars", label: "Stars" },
        { key: "ad", label: "Reklama" },
    ]

    container.innerHTML = filters
        .map(
            (filter) => `
        <button class="whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            selectedFilter === filter.key
                ? "btn-primary text-white"
                : "border border-primary text-primary hover:bg-primary hover:text-white"
        }" onclick="filterTransactions('${filter.key}')">
            ${filter.label}
        </button>
    `,
        )
        .join("")
}

function renderBottomNavigation() {
    const container = document.getElementById("bottom-nav")
    const navItems = [
        { id: "home-page", label: "Home", icon: "home" },
        { id: "buy-stars-page", label: "Stars", icon: "star" },
        { id: "history-page", label: "History", icon: "history" },
        { id: "profile-page", label: "Profile", icon: "user" },
    ]

    const iconSvgs = {
        home: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>',
        star: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>',
        history: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        user: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>',
    }

    container.innerHTML = navItems
        .map(
            (item) => `
        <div class="flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors nav-item ${
            document.getElementById(item.id).classList.contains("active")
                ? "text-primary"
                : "text-tg-hint hover:text-primary"
        }" onclick="showPage('${item.id}', this)">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${iconSvgs[item.icon]}
            </svg>
            <span class="text-xs font-medium">${item.label}</span>
        </div>
    `,
        )
        .join("")
}

function updateUserProfile() {
    if (!currentUser) return

    const profilePhoto = document.getElementById("profile-photo")
    const profileName = document.getElementById("profile-name")
    const profileUsername = document.getElementById("profile-username")
    const profileBalance = document.getElementById("profile-balance")
    const currentBalanceEl = document.getElementById("current-balance")
    const adminBadge = document.getElementById("admin-badge")
    const adminPanelItem = document.getElementById("admin-panel-item")

    if (currentUser.photo_url) {
        profilePhoto.src = currentUser.photo_url
    } else {
        profilePhoto.src = "https://via.placeholder.com/96x96"
    }

    profileName.textContent = `${currentUser.first_name}${currentUser.last_name ? " " + currentUser.last_name : ""}`

    if (currentUser.username) {
        profileUsername.textContent = `@${currentUser.username}`
        profileUsername.classList.remove("hidden")
    }

    profileBalance.textContent = `${currentBalance} ⭐`
    currentBalanceEl.textContent = `${currentBalance} Stars`

    // Check if user is admin
    if (ADMIN_IDS.includes(currentUser.id)) {
        adminBadge.classList.remove("hidden")
        adminPanelItem.classList.remove("hidden")
    }

    updateActiveChatCount()
}

// Event Handlers
function showPage(pageId, navElement) {
    // Hide all pages
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active")
        page.classList.add("hidden")
    })

    // Show selected page
    const targetPage = document.getElementById(pageId)
    targetPage.classList.remove("hidden")
    targetPage.classList.add("active")

    // Update navigation
    if (navElement) {
        document.querySelectorAll(".nav-item").forEach((item) => {
            item.classList.remove("text-primary")
            item.classList.add("text-tg-hint")
        })
        navElement.classList.remove("text-tg-hint")
        navElement.classList.add("text-primary")
    }
}

function filterAccounts(game) {
    selectedFilter = game
    renderAccounts()
    renderFilterButtons()
}

function filterTransactions(type) {
    selectedFilter = type
    const filteredTransactions = type === "all" ? transactions : transactions.filter((t) => t.type === type)

    // Re-render with filtered data
    const originalTransactions = transactions
    transactions = filteredTransactions
    renderTransactions()
    transactions = originalTransactions

    renderHistoryFilters()
}

async function purchaseAccount(accountId) {
    try {
        const account = accounts.find((acc) => acc.id === accountId)
        if (!account) {
            throw new Error("Akkaunt topilmadi")
        }

        const confirmed = confirm(`${account.title} akkauntini $${account.price}ga sotib olishni xohlaysizmi?`)
        if (!confirmed) return

        const response = await apiRequest("/accounts/purchase", {
            method: "POST",
            body: JSON.stringify({ accountId }),
        })

        showNotification("Akkaunt muvaffaqiyatli sotib olindi!")
        loadTransactions() // Refresh transaction history
    } catch (error) {
        showNotification("Xarid amalga oshmadi: " + error.message, "error")
    }
}

async function purchaseStars(packageId) {
    try {
        const response = await apiRequest("/stars/purchase", {
            method: "POST",
            body: JSON.stringify({ packageId }),
        })

        currentBalance = response.newBalance
        updateUserProfile()
        showNotification("Stars muvaffaqiyatli sotib olindi!")
    } catch (error) {
        showNotification("Stars sotib olishda xatolik: " + error.message, "error")
    }
}

function addToCart(accountId) {
    const account = accounts.find((acc) => acc.id === accountId)
    if (account) {
        showNotification(`${account.title} savatga qo'shildi`)
    }
}

function requestUserPhone() {
    if (tg && tg.requestPhone) {
        tg.requestPhone()
    }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Initialize Telegram WebApp
        if (tg.ready) {
            tg.ready()
            tg.setHeaderColor && tg.setHeaderColor("secondary_bg_color")
            tg.setBackgroundColor && tg.setBackgroundColor("secondary_bg_color")
            tg.expand && tg.expand()
        }

        // Modal event listeners
        document.getElementById("close-modal").addEventListener("click", closeAccountModal)
        document.getElementById("close-chat").addEventListener("click", closeChatModal)

        // Admin menu
        document.getElementById("admin-menu-btn").addEventListener("click", (e) => {
            e.stopPropagation()
            const menu = document.getElementById("admin-menu")
            menu.classList.toggle("active")
        })

        document.getElementById("complete-sale-btn").addEventListener("click", completeSale)

        // Purchase buttons
        document.getElementById("direct-purchase-btn").addEventListener("click", () => {
            if (currentAccountModal) {
                purchaseAccount(currentAccountModal.id)
            }
        })

        document.getElementById("admin-purchase-btn").addEventListener("click", () => {
            if (currentAccountModal) {
                openChatModal(currentAccountModal.id)
            }
        })

        // Chat functionality
        document.getElementById("send-message").addEventListener("click", sendChatMessage)
        document.getElementById("chat-input").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendChatMessage()
            }
        })

        // Close modals when clicking outside
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal")) {
                if (e.target.id === "account-modal") closeAccountModal()
                if (e.target.id === "chat-modal") closeChatModal()
            }

            // Close admin menu when clicking outside
            if (!e.target.closest("#admin-menu-container")) {
                document.getElementById("admin-menu").classList.remove("active")
            }
        })

        // Authenticate user
        await authenticateUser()

        // Load initial data
        await Promise.all([loadAccounts(), loadTransactions()])

        // Render UI components
        renderCarousel()
        renderFilterButtons()
        renderStarPackages()
        renderHistoryFilters()
        renderBottomNavigation()

        // Initialize Swiper
        if (window.Swiper) {
            new window.Swiper(".swiper", {
                loop: true,
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                },
            })
        }

        // Show home page by default
        showPage("home-page", document.querySelector(".nav-item"))
    } catch (error) {
        console.error("Initialization error:", error)
        showNotification("Ilovani yuklashda xatolik yuz berdi", "error")
    }
})
