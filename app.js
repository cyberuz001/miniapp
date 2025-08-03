// Global variables
const tg = window.Telegram.WebApp
const API_BASE_URL = "http://localhost:8000/api"
const navigationStack = []
let currentUser = null
let currentItems = []
let filteredItems = []
let currentCategories = []
const Swiper = window.Swiper // Declare Swiper variable

// Page navigation function - GLOBAL FUNCTION
window.showPage = (pageId) => {
  console.log("Showing page:", pageId)

  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })

  // Show selected page
  const targetPage = document.getElementById(pageId)
  if (targetPage) {
    targetPage.classList.add("active")
    console.log("Page activated:", pageId)
  } else {
    console.error("Page not found:", pageId)
  }

  // Update navigation active state
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
    item.classList.add("text-tg-hint")
  })

  // Find and activate current nav item
  const currentNavItem = document.querySelector(`[onclick="showPage('${pageId}')"]`)
  if (currentNavItem) {
    currentNavItem.classList.add("active")
    currentNavItem.classList.remove("text-tg-hint")
    console.log("Nav item activated for:", pageId)
  }
}

// Filter function - GLOBAL FUNCTION
window.filterItems = (category) => {
  console.log("Filtering by category:", category)

  // Update button styles
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("bg-tg-button", "text-white", "active")
    btn.classList.add("bg-tg-secondary-bg", "text-tg-text")
  })

  // Find and activate the correct button
  const activeButton = document.querySelector(`[onclick="filterItems('${category}')"]`)
  if (activeButton) {
    activeButton.classList.remove("bg-tg-secondary-bg", "text-tg-text")
    activeButton.classList.add("bg-tg-button", "text-white", "active")
  }

  // Filter items
  let itemsToShow = currentItems
  if (category !== "all") {
    itemsToShow = currentItems.filter((item) => item.category === category)
  }

  renderItems(itemsToShow)
}

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

// Page navigation function
function showPage(pageId) {
  console.log("Showing page:", pageId)

  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })

  // Show selected page
  const targetPage = document.getElementById(pageId)
  if (targetPage) {
    targetPage.classList.add("active")
  }

  // Update navigation active state
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
    item.classList.add("text-tg-hint")
  })

  // Find and activate current nav item
  const currentNavItem = document.querySelector(`[onclick="showPage('${pageId}')"]`)
  if (currentNavItem) {
    currentNavItem.classList.add("active")
    currentNavItem.classList.remove("text-tg-hint")
  }
}

function renderBanners(banners) {
  const container = document.getElementById("banner-container")
  if (!container) {
    console.error("Banner container not found!")
    return
  }

  container.innerHTML = banners
    .map(
      (banner) => `
            <div class="swiper-slide">
                <img src="${banner.image_url}" class="w-full h-full object-cover rounded-lg" alt="${banner.title}">
            </div>
        `,
    )
    .join("")

  // Initialize Swiper after content is loaded
  setTimeout(() => {
    if (window.Swiper) {
      try {
        const swiper = new window.Swiper(".swiper", {
          loop: true,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
          effect: "slide",
          speed: 500,
        })
        console.log("Swiper initialized successfully:", swiper)
      } catch (error) {
        console.error("Swiper initialization failed:", error)
      }
    } else {
      console.error("Swiper library not loaded!")
    }
  }, 500)
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
    filteredItems = items
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
      filterItems(category === "all" ? null : category)
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
  const container = document.getElementById("items-container")
  if (!container) return

  container.innerHTML = items
    .map(
      (item, index) => `
        <div onclick="openItemModal('${item.id}')" class="flex flex-col rounded-2xl ${item.isAdmin ? "bg-blue-900/40" : "bg-tg-secondary-bg"} overflow-hidden transition-transform active:scale-95 cursor-pointer opacity-0" style="animation: fade-in 0.5s ease forwards ${index * 0.1}s;">
            <img class="w-full h-auto aspect-square object-cover" src="${item.image || "/placeholder.svg?height=200&width=200"}" alt="${item.title}">
            <div class="p-3">
                <p class="font-semibold truncate">${item.title}</p>
                <p class="text-xs text-tg-hint">#${item.id}</p>
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
function filterItems(category) {
  console.log("Filtering by category:", category)

  // Update button styles
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("bg-tg-button", "text-white", "active")
    btn.classList.add("bg-tg-secondary-bg", "text-tg-text")
  })

  // Find and activate the correct button
  const activeButton = document.querySelector(`[onclick="filterItems('${category}')"]`)
  if (activeButton) {
    activeButton.classList.remove("bg-tg-secondary-bg", "text-tg-text")
    activeButton.classList.add("bg-tg-button", "text-white", "active")
  }

  // Filter items
  if (category === "all") {
    filteredItems = currentItems
  } else {
    filteredItems = currentItems.filter((item) => item.category === category)
  }

  renderItems(filteredItems)
}

// Item Functions
function openItemModal(itemId) {
  const item = currentItems.find((i) => i.id === itemId)
  if (!item) return

  console.log("Opening modal for item:", item.title)

  // Create modal HTML
  const modalHTML = `
        <div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onclick="closeModal(event)">
            <div class="bg-tg-bg rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-hidden" onclick="event.stopPropagation()">
                <div class="p-4 border-b border-gray-700/50">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-bold">Item Details</h3>
                        <button onclick="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="overflow-y-auto max-h-96">
                    <img src="${item.image}" class="w-full aspect-square object-cover" alt="${item.title}">
                    <div class="p-4">
                        <h2 class="text-xl font-bold mb-2">${item.title}</h2>
                        <p class="text-tg-hint mb-2">#${item.id}</p>
                        <p class="text-sm leading-relaxed mb-4">${item.description}</p>
                        <div class="bg-tg-secondary-bg p-3 rounded-lg mb-4">
                            <p class="text-sm text-tg-hint mb-1">Category</p>
                            <p class="font-medium">${item.category}</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-700/50">
                    <button onclick="purchaseItem('${item.id}')" class="w-full bg-tg-button text-white font-bold py-3 rounded-xl">
                        Buy for ${item.price} Stars
                    </button>
                </div>
            </div>
        </div>
    `

  // Add modal to body
  const modalDiv = document.createElement("div")
  modalDiv.id = "item-modal"
  modalDiv.innerHTML = modalHTML
  document.body.appendChild(modalDiv)
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget) return

  const modal = document.getElementById("item-modal")
  if (modal) {
    modal.remove()
  }
}

function purchaseItem(itemId) {
  const item = currentItems.find((i) => i.id === itemId)
  if (!item) return

  console.log("Purchasing item:", item.title)

  // Show success message
  if (tg && tg.showAlert) {
    tg.showAlert(`Successfully purchased ${item.title} for ${item.price} stars!`)
  } else {
    alert(`Successfully purchased ${item.title} for ${item.price} stars!`)
  }

  closeModal()
}

// Profile functions
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

// Utility Functions
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
    { _id: "3", name: "Mobile Legend" },
    { _id: "4", name: "CSGO" },
  ]

  // Sample items
  const sampleItems = [
    {
      id: "1001",
      title: "PUBG Conqueror Account",
      description: "High-tier PUBG Mobile account with Conqueror rank, rare skins, and premium items.",
      price: 150,
      image: "https://via.placeholder.com/300x300/2ea6ff/ffffff?text=PUBG+Conqueror",
      category: "PUBG",
      isAdmin: true,
    },
    {
      id: "1002",
      title: "Free Fire Diamond Account",
      description: "Free Fire account with 50,000+ diamonds and exclusive characters.",
      price: 80,
      image: "https://via.placeholder.com/300x300/e91e63/ffffff?text=Free+Fire+Diamond",
      category: "Free Fire",
      isAdmin: false,
    },
    {
      id: "1003",
      title: "PUBG UC Account",
      description: "PUBG Mobile account with 8100 UC and premium battle pass.",
      price: 120,
      image: "https://via.placeholder.com/300x300/4caf50/ffffff?text=PUBG+UC",
      category: "PUBG",
      isAdmin: true,
    },
    {
      id: "1004",
      title: "Free Fire Elite Pass",
      description: "Free Fire account with Elite Pass and rare bundles.",
      price: 45,
      image: "https://via.placeholder.com/300x300/ff9800/ffffff?text=FF+Elite",
      category: "Free Fire",
      isAdmin: false,
    },
    {
      id: "1005",
      title: "Mobile Legend Mythic",
      description: "Mobile Legend account with Mythic rank and rare skins.",
      price: 200,
      image: "https://via.placeholder.com/300x300/9c27b0/ffffff?text=ML+Mythic",
      category: "Mobile Legend",
      isAdmin: true,
    },
    {
      id: "1006",
      title: "CSGO Prime Account",
      description: "CSGO Prime account with rare skins and high rank.",
      price: 300,
      image: "https://via.placeholder.com/300x300/f44336/ffffff?text=CSGO+Prime",
      category: "CSGO",
      isAdmin: false,
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
    {
      _id: "b3",
      title: "New Arrivals",
      image_url: "https://via.placeholder.com/600x360/4caf50/ffffff?text=New+Arrivals",
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
  filteredItems = sampleItems
  currentCategories = sampleCategories

  // Render data
  renderItems(sampleItems)
  renderCategories(sampleCategories)
  renderBanners(sampleBanners)

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
  closeModal()
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

console.log("App.js loaded successfully!")
