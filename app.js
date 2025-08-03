// Global variables
const tg = window.Telegram.WebApp
const API_BASE_URL = "http://localhost:8000/api"
const navigationStack = []
let currentUser = null
let currentItems = []
let currentCategories = []
const Swiper = window.Swiper // Declare Swiper variable

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeTelegramWebApp()
  initializeNavigation()
  initializeEventListeners()
  loadInitialData()
})

function initializeTelegramWebApp() {
  tg.ready()
  tg.setHeaderColor("secondary_bg_color")
  tg.setBackgroundColor("secondary_bg_color")
  tg.expand()
  tg.onEvent("backButtonClicked", handleBackPress)

  // Get user data from Telegram
  const user = tg.initDataUnsafe?.user
  if (user) {
    currentUser = user
    updateProfileUI(user)
    authenticateUser(user)
  }
}

function initializeNavigation() {
  const navItems = [
    {
      id: "home-page",
      label: "Home",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',
    },
    {
      id: "buy-stars-page",
      label: "Buy Stars",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>',
    },
    {
      id: "history-page",
      label: "History",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>',
    },
    {
      id: "profile-page",
      label: "Profile",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
    },
  ]

  const navContainer = document.getElementById("bottom-nav")
  navContainer.innerHTML = ""

  navItems.forEach((item) => {
    const navElement = document.createElement("div")
    navElement.className = "nav-item flex-1 flex flex-col items-center justify-center cursor-pointer text-tg-hint"
    navElement.innerHTML = `<div class="w-6 h-6">${item.icon}</div><span class="text-xs font-medium">${item.label}</span>`

    navElement.addEventListener("click", () => {
      navigationStack.length = 0
      navigateTo({ type: "page", id: item.id })

      document.querySelectorAll("#bottom-nav .nav-item").forEach((i) => i.classList.remove("active"))
      navElement.classList.add("active")
    })
    navContainer.appendChild(navElement)
  })

  document.querySelector("#bottom-nav .nav-item").classList.add("active")

  if (navigationStack.length === 0) {
    navigateTo({ type: "page", id: "home-page" })
  }
}

function initializeEventListeners() {
  // Message sending
  document.getElementById("send-message-btn").addEventListener("click", sendMessage)
  document.getElementById("message-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  })
}

async function loadInitialData() {
  try {
    showLoading(true)
    await Promise.all([loadItems(), loadCategories(), loadBanners(), loadStarPackages()])
    showLoading(false)
  } catch (error) {
    console.error("Error loading initial data:", error)
    showLoading(false)
    showError("Failed to load data. Please try again.")
  }
}

// API Functions
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (currentUser) {
    defaultOptions.headers["X-Telegram-User"] = JSON.stringify(currentUser)
  }

  const response = await fetch(url, { ...defaultOptions, ...options })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  return response.json()
}

async function authenticateUser(user) {
  try {
    const userData = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
      }),
    })

    currentUser = { ...user, ...userData }
    updateProfileUI(currentUser)

    // Show admin panel if user is admin
    if (currentUser.role && ["general_admin", "admin", "supporter"].includes(currentUser.role)) {
      document.getElementById("admin-panel-btn").classList.remove("hidden")
    }
  } catch (error) {
    console.error("Authentication failed:", error)
  }
}

async function loadItems(category = null) {
  try {
    const endpoint = category ? `/items?category=${category}` : "/items"
    const items = await apiCall(endpoint)
    currentItems = items
    renderItems(items)
  } catch (error) {
    console.error("Error loading items:", error)
    showError("Failed to load items")
  }
}

async function loadCategories() {
  try {
    const categories = await apiCall("/categories")
    currentCategories = categories
    renderCategories(categories)
  } catch (error) {
    console.error("Error loading categories:", error)
  }
}

async function loadBanners() {
  try {
    const banners = await apiCall("/banners")
    renderBanners(banners)
  } catch (error) {
    console.error("Error loading banners:", error)
  }
}

async function loadStarPackages() {
  try {
    const packages = await apiCall("/star-packages")
    renderStarPackages(packages)
  } catch (error) {
    console.error("Error loading star packages:", error)
  }
}

async function loadPurchaseHistory() {
  try {
    const history = await apiCall("/purchases/history")
    renderPurchaseHistory(history)
  } catch (error) {
    console.error("Error loading purchase history:", error)
  }
}

async function loadMyPurchases() {
  try {
    const purchases = await apiCall("/purchases/my")
    renderMyPurchases(purchases)
  } catch (error) {
    console.error("Error loading purchases:", error)
  }
}

// Render Functions
function renderItems(items) {
  const container = document.getElementById("card-container")
  container.innerHTML = items
    .map(
      (item, index) => `
        <div onclick="openModal('${item._id}')" class="flex flex-col rounded-2xl ${item.is_admin_item ? "bg-blue-900/40" : "bg-tg-bg"} overflow-hidden transition-transform active:scale-95 cursor-pointer opacity-0" style="animation: fade-in 0.5s ease forwards ${index * 0.1}s;">
            <img class="w-full h-auto aspect-square object-cover" src="${item.image_url || "/placeholder.svg?height=200&width=200"}" alt="${item.title}">
            <div class="p-3">
                <p class="font-semibold truncate">${item.title}</p>
                <p class="text-xs text-tg-hint">#${item.item_id}</p>
                <div class="flex justify-between items-center mt-3">
                    <div class="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold py-2 px-3 rounded-lg">
                        <svg class="w-4 h-4" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0L0 4.66667V14L8 9.33333L16 14V4.66667L8 0Z" fill="white"/>
                        </svg>
                        ${item.price}
                    </div>
                    <div class="w-9 h-9 flex items-center justify-center bg-white/10 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-white">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.093-.826l1.821-6.831c.13-.483-.145-.996-.644-1.17a48.11 48.11 0 00-1.821-.545A48.11 48.11 0 007.5 4.5M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderCategories(categories) {
  const container = document.getElementById("category-filters")
  container.innerHTML = `
        <button onclick="filterByCategory(null)" class="category-btn bg-tg-button text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">All</button>
        ${categories
          .map(
            (cat) => `
            <button onclick="filterByCategory('${cat._id}')" class="category-btn bg-tg-secondary-bg px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">${cat.name}</button>
        `,
          )
          .join("")}
    `
}

function renderBanners(banners) {
  const container = document.getElementById("banner-container")
  container.innerHTML = banners
    .map(
      (banner) => `
        <div class="swiper-slide">
            <img src="${banner.image_url || "/placeholder.svg?height=360&width=600"}" class="w-full h-full object-cover">
        </div>
    `,
    )
    .join("")

  // Initialize Swiper
  if (Swiper) {
    new Swiper(".swiper", {
      loop: true,
      autoplay: { delay: 3000 },
      pagination: {
        el: ".swiper-pagination",
      },
    })
  } else {
    console.error("Swiper is not defined")
  }
}

function renderStarPackages(packages) {
  const container = document.getElementById("star-packages")
  container.innerHTML = packages
    .map(
      (pkg) => `
        <div class="bg-tg-secondary-bg p-4 rounded-xl flex justify-between items-center">
            <div>
                <h3 class="font-bold">${pkg.stars} Stars</h3>
                <p class="text-tg-hint text-sm">${pkg.description}</p>
            </div>
            <button onclick="buyStars('${pkg._id}')" class="bg-tg-button text-white px-4 py-2 rounded-lg">
                $${pkg.price}
            </button>
        </div>
    `,
    )
    .join("")
}

function renderPurchaseHistory(history) {
  const container = document.getElementById("history-container")
  if (history.length === 0) {
    container.innerHTML = '<p class="text-tg-hint text-center">No purchase history yet.</p>'
    return
  }

  container.innerHTML = history
    .map(
      (purchase) => `
        <div class="bg-tg-secondary-bg p-4 rounded-xl mb-3">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold">${purchase.item.title}</h3>
                    <p class="text-tg-hint text-sm">${new Date(purchase.created_at).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold">${purchase.price} Stars</p>
                    <p class="text-xs ${purchase.status === "completed" ? "text-green-400" : "text-yellow-400"}">${purchase.status}</p>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderMyPurchases(purchases) {
  const container = document.getElementById("purchases-container")
  if (purchases.length === 0) {
    container.innerHTML = '<p class="text-tg-hint text-center">No purchases yet.</p>'
    return
  }

  container.innerHTML = purchases
    .map(
      (purchase) => `
        <div class="bg-tg-secondary-bg p-4 rounded-xl mb-3">
            <h3 class="font-bold mb-2">${purchase.item.title}</h3>
            <div class="space-y-1 text-sm">
                <p><span class="text-tg-hint">Login:</span> ${purchase.credentials.login}</p>
                <p><span class="text-tg-hint">Password:</span> ${purchase.credentials.password}</p>
                <p><span class="text-tg-hint">Purchase Date:</span> ${new Date(purchase.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// Navigation Functions
function updateUI(view) {
  document.querySelectorAll(".page, #item-modal").forEach((el) => el.classList.add("hidden"))
  document.querySelectorAll("#profile-main, #help-subpage").forEach((el) => el.classList.add("hidden"))

  const bottomNav = document.getElementById("bottom-nav")

  if (view.type === "page") {
    const pageEl = document.getElementById(view.id)
    pageEl.classList.remove("hidden")
    if (view.id === "profile-page") {
      pageEl.querySelector("#profile-main").classList.remove("hidden")
    }
    if (view.id === "history-page") {
      loadPurchaseHistory()
    }
    if (view.id === "my-purchases-page") {
      loadMyPurchases()
    }
    bottomNav.classList.remove("hidden")
  } else if (view.type === "modal") {
    const modalEl = document.getElementById(view.id)
    modalEl.classList.remove("hidden")
    setTimeout(() => modalEl.classList.add("opacity-100"), 10)
    bottomNav.classList.add("hidden")
  } else if (view.type === "subpage") {
    const parentPage = document.getElementById("profile-page")
    parentPage.classList.remove("hidden")
    document.getElementById(view.id).classList.remove("hidden")
    bottomNav.classList.add("hidden")
  }

  if (navigationStack.length > 1) {
    tg.BackButton.show()
  } else {
    tg.BackButton.hide()
  }
}

function navigateTo(view) {
  navigationStack.push(view)
  updateUI(view)
}

function handleBackPress() {
  if (navigationStack.length > 1) {
    const currentView = navigationStack.pop()
    if (currentView.type === "modal") {
      const modal = document.getElementById(currentView.id)
      modal.classList.remove("opacity-100")
      setTimeout(() => {
        modal.classList.add("hidden")
      }, 300)
    }
    const previousView = navigationStack[navigationStack.length - 1]
    updateUI(previousView)
  }
}

// Item Functions
async function openModal(itemId) {
  try {
    const item = currentItems.find((i) => i._id === itemId)
    if (!item) return

    const modal = document.getElementById("item-modal")
    modal.innerHTML = `
            <div class="h-full w-full flex flex-col">
                <div class="flex-grow overflow-y-auto">
                    <img src="${item.image_url || "/placeholder.svg?height=400&width=400"}" class="w-full aspect-square object-cover">
                    <div class="p-4">
                        <h2 class="text-3xl font-bold mb-2">${item.title}</h2>
                        <p class="text-lg text-tg-hint mb-4">#${item.item_id}</p>
                        <p class="text-base leading-relaxed mb-4">${item.description}</p>
                        <div class="bg-tg-secondary-bg p-3 rounded-lg">
                            <p class="text-sm text-tg-hint mb-1">Category</p>
                            <p class="font-medium">${item.category?.name || "General"}</p>
                        </div>
                    </div>
                </div>
                <footer class="flex-shrink-0 p-4 border-t border-gray-700/50 bg-tg-bg">
                    ${
                      item.is_admin_item
                        ? `<button onclick="showPurchaseModal('${item._id}', 'admin')" class="w-full bg-tg-button text-white font-bold py-4 rounded-xl">Buy via Admin (${item.price} Stars)</button>`
                        : `<div class="flex gap-3">
                            <button onclick="showPurchaseModal('${item._id}', 'direct')" class="flex-1 bg-white/10 text-tg-text font-bold py-4 rounded-xl">Direct Purchase</button>
                            <button onclick="showPurchaseModal('${item._id}', 'admin')" class="flex-1 bg-tg-button text-white font-bold py-4 rounded-xl">Via Admin</button>
                        </div>`
                    }
                </footer>
            </div>`
    navigateTo({ type: "modal", id: "item-modal" })
  } catch (error) {
    console.error("Error opening modal:", error)
    showError("Failed to load item details")
  }
}

function showPurchaseModal(itemId, type) {
  const item = currentItems.find((i) => i._id === itemId)
  if (!item) return

  const modal = document.getElementById("purchase-modal")
  const details = document.getElementById("purchase-details")

  details.innerHTML = `
        <div class="text-center">
            <h4 class="font-bold mb-2">${item.title}</h4>
            <p class="text-2xl font-bold text-tg-link mb-2">${item.price} Stars</p>
            <p class="text-sm text-tg-hint">Purchase Type: ${type === "admin" ? "Via Admin" : "Direct"}</p>
        </div>
    `

  modal.classList.remove("hidden")
  modal.dataset.itemId = itemId
  modal.dataset.purchaseType = type
}

function closePurchaseModal() {
  document.getElementById("purchase-modal").classList.add("hidden")
}

async function confirmPurchase() {
  const modal = document.getElementById("purchase-modal")
  const itemId = modal.dataset.itemId
  const purchaseType = modal.dataset.purchaseType

  try {
    const result = await apiCall("/purchases/create", {
      method: "POST",
      body: JSON.stringify({
        item_id: itemId,
        purchase_type: purchaseType,
      }),
    })

    closePurchaseModal()
    showSuccess("Purchase successful!")

    // Update user balance
    if (currentUser) {
      currentUser.balance = result.new_balance
      updateProfileUI(currentUser)
    }
  } catch (error) {
    console.error("Purchase failed:", error)
    showError("Purchase failed. Please try again.")
  }
}

// Filter Functions
function filterByCategory(categoryId) {
  // Update button styles
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("bg-tg-button", "text-white")
    btn.classList.add("bg-tg-secondary-bg")
  })

  event.target.classList.remove("bg-tg-secondary-bg")
  event.target.classList.add("bg-tg-button", "text-white")

  // Filter items
  loadItems(categoryId)
}

// Chat Functions
async function sendMessage() {
  const input = document.getElementById("message-input")
  const message = input.value.trim()

  if (!message) return

  try {
    await apiCall("/chat/send", {
      method: "POST",
      body: JSON.stringify({
        message: message,
        chat_type: "support",
      }),
    })

    input.value = ""
    loadChatMessages()
  } catch (error) {
    console.error("Failed to send message:", error)
    showError("Failed to send message")
  }
}

async function loadChatMessages() {
  try {
    const messages = await apiCall("/chat/messages")
    renderChatMessages(messages)
  } catch (error) {
    console.error("Failed to load messages:", error)
  }
}

function renderChatMessages(messages) {
  const container = document.getElementById("chat-messages")
  container.innerHTML = messages
    .map(
      (msg) => `
        <div class="mb-4 ${msg.sender_id === currentUser?.id ? "text-right" : "text-left"}">
            <div class="inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender_id === currentUser?.id ? "bg-tg-button text-white" : "bg-tg-secondary-bg"
            }">
                <p>${msg.message}</p>
                <p class="text-xs opacity-70 mt-1">${new Date(msg.created_at).toLocaleTimeString()}</p>
            </div>
        </div>
    `,
    )
    .join("")

  container.scrollTop = container.scrollHeight
}

// Admin Functions
async function showUserManagement() {
  // Implementation for user management
  showInfo("User management feature coming soon")
}

async function showRoleAssignment() {
  // Implementation for role assignment
  showInfo("Role assignment feature coming soon")
}

async function showAddItem() {
  // Implementation for adding items
  showInfo("Add item feature coming soon")
}

async function showManageItems() {
  // Implementation for managing items
  showInfo("Manage items feature coming soon")
}

// Utility Functions
function updateProfileUI(user) {
  const profilePhoto = document.getElementById("profile-photo")
  const profileName = document.getElementById("profile-name")
  const profileRole = document.getElementById("profile-role")
  const userBalance = document.getElementById("user-balance")

  if (user.photo_url) {
    profilePhoto.src = user.photo_url
  } else {
    profilePhoto.src = "/placeholder.svg?height=96&width=96"
  }

  profileName.textContent = user.first_name + (user.last_name ? " " + user.last_name : "")
  profileRole.textContent = user.role ? user.role.replace("_", " ").toUpperCase() : "USER"
  userBalance.textContent = user.balance || 0
}

function showLoading(show) {
  const indicator = document.getElementById("loading-indicator")
  if (show) {
    indicator.classList.remove("hidden")
  } else {
    indicator.classList.add("hidden")
  }
}

function showError(message) {
  tg.showAlert(message)
}

function showSuccess(message) {
  tg.showAlert(message)
}

function showInfo(message) {
  tg.showAlert(message)
}

async function buyStars(packageId) {
  try {
    const result = await apiCall("/payments/buy-stars", {
      method: "POST",
      body: JSON.stringify({
        package_id: packageId,
      }),
    })

    showSuccess("Stars purchased successfully!")

    // Update user balance
    if (currentUser) {
      currentUser.balance = result.new_balance
      updateProfileUI(currentUser)
    }
  } catch (error) {
    console.error("Failed to buy stars:", error)
    showError("Failed to purchase stars")
  }
}
