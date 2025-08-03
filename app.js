// Global variables
const tg = window.Telegram.WebApp
const API_BASE_URL = "http://localhost:8000/api"
const navigationStack = []
let currentUser = null
let currentItems = []
let currentCategories = []
const Swiper = window.Swiper // Declare Swiper variable

// Declare functions before using them
function navigateTo(view) {
  navigationStack.push(view)
  updateUI(view)
}

function handleBackPress() {
  if (navigationStack.length > 1) {
    const currentView = navigationStack.pop()
    if (currentView.type === "modal") {
      const modal = document.getElementById(currentView.id)
      if (modal) {
        modal.classList.remove("opacity-100")
        setTimeout(() => {
          modal.classList.add("hidden")
        }, 300)
      }
    }
    const previousView = navigationStack[navigationStack.length - 1]
    updateUI(previousView)
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

function renderBanners(banners) {
  const container = document.getElementById("banner-container")
  container.innerHTML = banners
    .map(
      (banner) => `
        <div class="swiper-slide">
            <img src="${banner.image_url}" class="w-full h-full object-cover" alt="${banner.title}">
        </div>
    `,
    )
    .join("")

  // Initialize Swiper
  if (window.Swiper) {
    new window.Swiper(".swiper", {
      loop: true,
      autoplay: { delay: 3000 },
      pagination: {
        el: ".swiper-pagination",
      },
    })
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
  const container = document.getElementById("purchase-history-container")
  container.innerHTML = history
    .map(
      (purchase) => `
        <div class="purchase">
            <p>${purchase.item_title}</p>
            <p>Stars: ${purchase.stars}</p>
            <p>Date: ${new Date(purchase.created_at).toLocaleDateString()}</p>
        </div>
    `,
    )
    .join("")
}

function renderMyPurchases(purchases) {
  const container = document.getElementById("my-purchases-container")
  container.innerHTML = purchases
    .map(
      (purchase) => `
        <div class="purchase">
            <p>${purchase.item_title}</p>
            <p>Stars: ${purchase.stars}</p>
            <p>Date: ${new Date(purchase.created_at).toLocaleDateString()}</p>
        </div>
    `,
    )
    .join("")
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded")

  initializeTelegramWebApp()
  initializeNavigation()
  initializeEventListeners()

  // Set initial page
  if (navigationStack.length === 0) {
    navigateTo({ type: "page", id: "home-page" })
  }

  // Load initial data after a short delay to ensure UI is ready
  setTimeout(() => {
    loadInitialData()
  }, 100)
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
  if (!navContainer) {
    console.error("Bottom navigation container not found!")
    return
  }

  navContainer.innerHTML = ""

  navItems.forEach((item, index) => {
    const navElement = document.createElement("div")
    navElement.className =
      "nav-item flex-1 flex flex-col items-center justify-center cursor-pointer text-tg-hint transition-colors duration-200 py-2"
    navElement.innerHTML = `
      <div class="w-6 h-6 mb-1">${item.icon}</div>
      <span class="text-xs font-medium">${item.label}</span>
    `

    navElement.addEventListener("click", () => {
      // Clear navigation stack and navigate to selected page
      navigationStack.length = 0
      navigateTo({ type: "page", id: item.id })

      // Update active state
      document.querySelectorAll("#bottom-nav .nav-item").forEach((navItem) => {
        navItem.classList.remove("active")
        navItem.classList.add("text-tg-hint")
      })
      navElement.classList.add("active")
      navElement.classList.remove("text-tg-hint")
    })

    navContainer.appendChild(navElement)

    // Set first item as active by default
    if (index === 0) {
      navElement.classList.add("active")
      navElement.classList.remove("text-tg-hint")
    }
  })

  console.log("Navigation initialized successfully")
}

function initializeEventListeners() {
  // Message sending
  const sendBtn = document.getElementById("send-message-btn")
  const messageInput = document.getElementById("message-input")

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage)
  }

  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    })
  }
}

async function loadInitialData() {
  try {
    showLoading(true)

    // Load sample data if API is not available
    if (!navigator.onLine || API_BASE_URL.includes("localhost")) {
      console.log("Loading sample data...")
      loadSampleData()
    } else {
      await Promise.all([loadItems(), loadCategories(), loadBanners(), loadStarPackages()])
    }

    showLoading(false)
  } catch (error) {
    console.error("Error loading initial data:", error)
    showLoading(false)

    // Load sample data as fallback
    console.log("Loading sample data as fallback...")
    loadSampleData()
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

function renderCategories(categories) {
  const container = document.getElementById("category-filters")
  container.innerHTML = `
    <button data-category="all" class="category-btn bg-tg-button text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">All</button>
    ${categories
      .map(
        (cat) => `
        <button data-category="${cat.name}" class="category-btn bg-tg-secondary-bg text-tg-text px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap">${cat.name}</button>
    `,
      )
      .join("")}
  `

  // Add event listeners to category buttons
  container.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const category = e.target.getAttribute("data-category")
      filterByCategory(category === "all" ? null : category)
    })
  })
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
  if (!container) return

  container.innerHTML = items
    .map(
      (item, index) => `
        <div onclick="openModal('${item._id}')" class="flex flex-col rounded-2xl ${item.is_admin_item ? "bg-blue-900/40" : "bg-tg-secondary-bg"} overflow-hidden transition-transform active:scale-95 cursor-pointer opacity-0" style="animation: fade-in 0.5s ease forwards ${index * 0.1}s;">
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

// Filter Functions
function filterByCategory(categoryName) {
  console.log("Filtering by category:", categoryName)

  // Update button styles
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("bg-tg-button", "text-white")
    btn.classList.add("bg-tg-secondary-bg", "text-tg-text")
  })

  // Find and highlight the active button
  const activeButton = categoryName
    ? document.querySelector(`[data-category="${categoryName}"]`)
    : document.querySelector(`[data-category="all"]`)

  if (activeButton) {
    activeButton.classList.remove("bg-tg-secondary-bg", "text-tg-text")
    activeButton.classList.add("bg-tg-button", "text-white")
  }

  // Filter items
  let filteredItems = currentItems
  if (categoryName) {
    filteredItems = currentItems.filter((item) => item.category && item.category.name === categoryName)
  }

  renderItems(filteredItems)
}

// Item Functions
function openModal(itemId) {
  const item = currentItems.find((i) => i._id === itemId)
  if (!item) return

  const modal = document.getElementById("item-modal")
  if (!modal) return

  modal.innerHTML = `
    <div class="h-full w-full flex flex-col">
        <div class="flex-grow overflow-y-auto">
            <img src="${item.image_url}" class="w-full aspect-square object-cover" alt="${item.title}">
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
}

function showPurchaseModal(itemId, type) {
  const item = currentItems.find((i) => i._id === itemId)
  if (!item) return

  const modal = document.getElementById("purchase-modal")
  const details = document.getElementById("purchase-details")

  if (!modal || !details) return

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
  const modal = document.getElementById("purchase-modal")
  if (modal) {
    modal.classList.add("hidden")
  }
}

// Utility Functions
function updateProfileUI(user) {
  const profilePhoto = document.getElementById("profile-photo")
  const profileName = document.getElementById("profile-name")
  const profileRole = document.getElementById("profile-role")
  const userBalance = document.getElementById("user-balance")

  if (profilePhoto) {
    profilePhoto.src = user.photo_url || "/placeholder.svg?height=96&width=96"
  }

  if (profileName) {
    profileName.textContent = user.first_name + (user.last_name ? " " + user.last_name : "")
  }

  if (profileRole) {
    profileRole.textContent = user.role ? user.role.replace("_", " ").toUpperCase() : "USER"
  }

  if (userBalance) {
    userBalance.textContent = user.balance || 0
  }
}

function showLoading(show) {
  const indicator = document.getElementById("loading-indicator")
  if (indicator) {
    if (show) {
      indicator.classList.remove("hidden")
    } else {
      indicator.classList.add("hidden")
    }
  }
}

function showError(message) {
  if (tg && tg.showAlert) {
    tg.showAlert(message)
  } else {
    alert(message)
  }
}

function showSuccess(message) {
  if (tg && tg.showAlert) {
    tg.showAlert(message)
  } else {
    alert(message)
  }
}

function showInfo(message) {
  if (tg && tg.showAlert) {
    tg.showAlert(message)
  } else {
    alert(message)
  }
}

// Sample data loading
function loadSampleData() {
  // Sample categories
  const sampleCategories = [
    { _id: "1", name: "PUBG" },
    { _id: "2", name: "Free Fire" },
    { _id: "3", name: "Call of Duty" },
    { _id: "4", name: "Clash of Clans" },
  ]

  // Sample items
  const sampleItems = [
    {
      _id: "1001",
      item_id: "1001",
      title: "PUBG Conqueror Account",
      description: "High-tier PUBG Mobile account with Conqueror rank, rare skins, and premium items.",
      price: 150,
      image_url: "https://via.placeholder.com/300x300/2ea6ff/ffffff?text=PUBG+Conqueror",
      is_admin_item: true,
      category: { name: "PUBG" },
    },
    {
      _id: "1002",
      item_id: "1002",
      title: "Free Fire Diamond Account",
      description: "Free Fire account with 50,000+ diamonds and exclusive characters.",
      price: 80,
      image_url: "https://via.placeholder.com/300x300/e91e63/ffffff?text=Free+Fire+Diamond",
      is_admin_item: false,
      category: { name: "Free Fire" },
    },
    {
      _id: "1003",
      item_id: "1003",
      title: "PUBG UC Account",
      description: "PUBG Mobile account with 8100 UC and premium battle pass.",
      price: 120,
      image_url: "https://via.placeholder.com/300x300/4caf50/ffffff?text=PUBG+UC",
      is_admin_item: true,
      category: { name: "PUBG" },
    },
    {
      _id: "1004",
      item_id: "1004",
      title: "Free Fire Elite Pass",
      description: "Free Fire account with Elite Pass and rare bundles.",
      price: 45,
      image_url: "https://via.placeholder.com/300x300/ff9800/ffffff?text=FF+Elite",
      is_admin_item: false,
      category: { name: "Free Fire" },
    },
    {
      _id: "1005",
      item_id: "1005",
      title: "Call of Duty Legendary",
      description: "COD Mobile account with legendary weapons and skins.",
      price: 200,
      image_url: "https://via.placeholder.com/300x300/9c27b0/ffffff?text=COD+Legendary",
      is_admin_item: true,
      category: { name: "Call of Duty" },
    },
    {
      _id: "1006",
      item_id: "1006",
      title: "Clash of Clans Max",
      description: "Maxed out Clash of Clans account with all troops and buildings.",
      price: 300,
      image_url: "https://via.placeholder.com/300x300/f44336/ffffff?text=COC+Max",
      is_admin_item: false,
      category: { name: "Clash of Clans" },
    },
  ]

  // Sample banners
  const sampleBanners = [
    {
      _id: "b1",
      title: "Top Games Sale",
      image_url: "https://via.placeholder.com/600x360/2ea6ff/ffffff?text=Top+Games+Sale",
    },
    {
      _id: "b2",
      title: "Special Offer",
      image_url: "https://via.placeholder.com/600x360/e91e63/ffffff?text=Special+Offer",
    },
  ]

  // Sample star packages
  const sampleStarPackages = [
    {
      _id: "sp1",
      stars: 100,
      price: 0.99,
      description: "Starter pack - 100 stars",
    },
    {
      _id: "sp2",
      stars: 500,
      price: 4.99,
      description: "Popular pack - 500 stars",
    },
    {
      _id: "sp3",
      stars: 1000,
      price: 9.99,
      description: "Best value - 1000 stars",
    },
  ]

  // Set global variables
  currentItems = sampleItems
  currentCategories = sampleCategories

  // Render data
  renderItems(sampleItems)
  renderCategories(sampleCategories)
  renderBanners(sampleBanners)
  renderStarPackages(sampleStarPackages)

  console.log("Sample data loaded successfully")
}

// Stub functions for missing functionality
async function sendMessage() {
  console.log("Sending message")
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

function confirmPurchase() {
  console.log("Confirming purchase")
  closePurchaseModal()
}

// Admin functions
function showUserManagement() {
  showInfo("User management feature coming soon")
}

function showRoleAssignment() {
  showInfo("Role assignment feature coming soon")
}

function showAddItem() {
  showInfo("Add item feature coming soon")
}

function showManageItems() {
  showInfo("Manage items feature coming soon")
}

// Navigation Functions
function updateUI(view) {
  document.querySelectorAll(".page, #item-modal").forEach((el) => el.classList.add("hidden"))
  document.querySelectorAll("#profile-main, #help-subpage").forEach((el) => el.classList.add("hidden"))

  const bottomNav = document.getElementById("bottom-nav")

  if (view.type === "page") {
    const pageEl = document.getElementById(view.id)
    if (pageEl) {
      pageEl.classList.remove("hidden")
      if (view.id === "profile-page") {
        const profileMain = pageEl.querySelector("#profile-main")
        if (profileMain) {
          profileMain.classList.remove("hidden")
        }
      }
      if (view.id === "history-page") {
        loadPurchaseHistory()
      }
      if (view.id === "my-purchases-page") {
        loadMyPurchases()
      }
    }
    if (bottomNav) {
      bottomNav.classList.remove("hidden")
    }
  } else if (view.type === "modal") {
    const modalEl = document.getElementById(view.id)
    if (modalEl) {
      modalEl.classList.remove("hidden")
      setTimeout(() => modalEl.classList.add("opacity-100"), 10)
    }
    if (bottomNav) {
      bottomNav.classList.add("hidden")
    }
  } else if (view.type === "subpage") {
    const parentPage = document.getElementById("profile-page")
    if (parentPage) {
      parentPage.classList.remove("hidden")
    }
    const subpage = document.getElementById(view.id)
    if (subpage) {
      subpage.classList.remove("hidden")
    }
    if (bottomNav) {
      bottomNav.classList.add("hidden")
    }
  }

  if (navigationStack.length > 1) {
    tg.BackButton.show()
  } else {
    tg.BackButton.hide()
  }
}
