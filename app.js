// Global variables
const tg = window.Telegram.WebApp
const navigationStack = []
let currentItems = []
let filteredItems = []

// Sample data with more categories
const dummyAds = [
  // PUBG items
  {
    id: 3673,
    title: "PUBG Conqueror Account",
    price: "150",
    image: "https://via.placeholder.com/600x600/2ea6ff/17212b?text=PUBG+Conqueror",
    category: "PUBG",
    isAdmin: true,
    description: "High-tier PUBG Mobile account with Conqueror rank, rare skins, and premium items.",
  },
  {
    id: 1550,
    title: "PUBG UC Account",
    price: "120",
    image: "https://via.placeholder.com/600x600/4caf50/17212b?text=PUBG+UC",
    category: "PUBG",
    isAdmin: false,
    description: "PUBG Mobile account with 8100 UC and premium battle pass.",
  },

  // Free Fire items
  {
    id: 2001,
    title: "Free Fire Diamond Account",
    price: "80",
    image: "https://via.placeholder.com/600x600/e91e63/17212b?text=Free+Fire+Diamond",
    category: "Free Fire",
    isAdmin: false,
    description: "Free Fire account with 50,000+ diamonds and exclusive characters.",
  },
  {
    id: 2002,
    title: "Free Fire Elite Pass",
    price: "45",
    image: "https://via.placeholder.com/600x600/ff9800/17212b?text=FF+Elite",
    category: "Free Fire",
    isAdmin: true,
    description: "Free Fire account with Elite Pass and rare bundles.",
  },

  // Mobile Legends items
  {
    id: 3001,
    title: "Mobile Legends Mythic",
    price: "200",
    image: "https://via.placeholder.com/600x600/9c27b0/17212b?text=ML+Mythic",
    category: "Mobile Legends",
    isAdmin: true,
    description: "Mobile Legends account with Mythic rank and rare skins.",
  },
  {
    id: 3002,
    title: "ML Epic Account",
    price: "90",
    image: "https://via.placeholder.com/600x600/673ab7/17212b?text=ML+Epic",
    category: "Mobile Legends",
    isAdmin: false,
    description: "Mobile Legends Epic rank account with multiple heroes.",
  },

  // CSGO items
  {
    id: 4001,
    title: "CSGO Prime Account",
    price: "300",
    image: "https://via.placeholder.com/600x600/f44336/17212b?text=CSGO+Prime",
    category: "CSGO",
    isAdmin: false,
    description: "CSGO Prime account with rare skins and high rank.",
  },
  {
    id: 4002,
    title: "CSGO Global Elite",
    price: "450",
    image: "https://via.placeholder.com/600x600/795548/17212b?text=CSGO+Global",
    category: "CSGO",
    isAdmin: true,
    description: "CSGO Global Elite account with expensive knife skins.",
  },
]

// Page navigation function - GLOBAL FUNCTION
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
  const currentNavItem = document.querySelector(`[data-page="${pageId}"]`)
  if (currentNavItem) {
    currentNavItem.classList.add("active")
    currentNavItem.classList.remove("text-tg-hint")
    console.log("Nav item activated for:", pageId)
  }
}

// Filter function - GLOBAL FUNCTION
function filterItems(category) {
  console.log("Filtering by category:", category)

  // Update button styles
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("bg-tg-button", "text-white", "active")
    btn.classList.add("bg-tg-secondary-bg", "text-tg-text")
  })

  // Find and activate the correct button
  const activeButton = document.querySelector(`[data-category="${category}"]`)
  if (activeButton) {
    activeButton.classList.remove("bg-tg-secondary-bg", "text-tg-text")
    activeButton.classList.add("bg-tg-button", "text-white", "active")
  }

  // Filter items
  let itemsToShow = currentItems
  if (category !== "all") {
    itemsToShow = currentItems.filter((item) => item.category === category)
  }

  filteredItems = itemsToShow
  renderItems(itemsToShow)
}

// Open modal function - GLOBAL FUNCTION
function openModal(adId) {
  const ad = currentItems.find((item) => item.id === adId)
  if (!ad) return

  const modal = document.getElementById("item-modal")
  modal.innerHTML = `
        <div class="h-full w-full flex flex-col">
            <div class="flex-grow overflow-y-auto">
                <img src="${ad.image}" class="w-full aspect-square object-cover">
                <div class="p-4">
                    <h2 class="text-3xl font-bold mb-2">${ad.title}</h2>
                    <p class="text-lg text-tg-hint mb-4">#${ad.id}</p>
                    <p class="text-base leading-relaxed mb-4">${ad.description}</p>
                    <div class="bg-tg-secondary-bg p-3 rounded-lg mb-4">
                        <p class="text-sm text-tg-hint mb-1">Category</p>
                        <p class="font-medium">${ad.category}</p>
                    </div>
                </div>
            </div>
            <footer class="flex-shrink-0 p-4 border-t border-gray-700/50 bg-tg-bg">
                ${
                  ad.isAdmin
                    ? `<button class="w-full bg-tg-button text-white font-bold py-4 rounded-xl">Sotib olish (${ad.price} Stars)</button>`
                    : `<div class="flex gap-3">
                        <button class="flex-1 bg-white/10 text-tg-text font-bold py-4 rounded-xl">To'g'ridan-to'g'ri</button>
                        <button class="flex-1 bg-tg-button text-white font-bold py-4 rounded-xl">Admin Orqali</button>
                    </div>`
                }
            </footer>
        </div>`

  modal.classList.remove("hidden")
  setTimeout(() => modal.classList.add("opacity-100"), 10)

  // Hide bottom nav
  document.getElementById("bottom-nav").classList.add("hidden")

  // Show back button
  tg.BackButton.show()
}

// Close modal function - GLOBAL FUNCTION
function closeModal() {
  const modal = document.getElementById("item-modal")
  modal.classList.remove("opacity-100")
  setTimeout(() => {
    modal.classList.add("hidden")
  }, 300)

  // Show bottom nav
  document.getElementById("bottom-nav").classList.remove("hidden")

  // Hide back button
  tg.BackButton.hide()
}

// Navigate to function - GLOBAL FUNCTION
function navigateTo(view) {
  navigationStack.push(view)
  updateUI(view)
}

// UI Update function
function updateUI(view) {
  document.querySelectorAll(".page, #item-modal").forEach((el) => el.classList.remove("active"))
  document.querySelectorAll("#profile-main, #help-subpage").forEach((el) => el.classList.add("hidden"))
  const bottomNav = document.getElementById("bottom-nav")

  if (view.type === "page") {
    showPage(view.id)
    bottomNav.classList.remove("hidden")
  } else if (view.type === "modal") {
    const modalEl = document.getElementById(view.id)
    modalEl.classList.remove("hidden")
    setTimeout(() => modalEl.classList.add("opacity-100"), 10)
    bottomNav.classList.add("hidden")
  } else if (view.type === "subpage") {
    const parentPage = document.getElementById("profile-page")
    parentPage.classList.add("active")
    document.getElementById("profile-main").classList.add("hidden")
    document.getElementById(view.id).classList.remove("hidden")
    bottomNav.classList.add("hidden")
  } else if (view.type === "chat") {
    showPage(view.id)
    bottomNav.classList.add("hidden")
  }

  if (navigationStack.length > 1) {
    tg.BackButton.show()
  } else {
    tg.BackButton.hide()
  }
}

function handleBackPress() {
  if (navigationStack.length > 1) {
    const currentView = navigationStack.pop()
    if (currentView.type === "modal") {
      closeModal()
    }
    const previousView = navigationStack[navigationStack.length - 1]
    updateUI(previousView)
  }
}

// Render functions
function renderItems(items) {
  const container = document.getElementById("card-container")
  if (!container) return

  container.innerHTML = items
    .map(
      (ad, index) => `
        <div onclick="openModal(${ad.id})" class="flex flex-col rounded-2xl ${ad.isAdmin ? "bg-blue-900/40" : "bg-tg-bg"} overflow-hidden transition-transform active:scale-95 cursor-pointer opacity-0" style="animation: fade-in 0.5s ease forwards ${index * 0.1}s;">
            <img class="w-full h-auto aspect-square object-cover" src="${ad.image}" alt="${ad.title}">
            <div class="p-3">
                <p class="font-semibold truncate">${ad.title}</p>
                <p class="text-xs text-tg-hint">#${ad.id}</p>
                <div class="flex justify-between items-center mt-3">
                    <div class="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold py-2 px-3 rounded-lg">
                        <svg class="w-4 h-4" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0L0 4.66667V14L8 9.33333L16 14V4.66667L8 0Z" fill="white"/>
                        </svg>
                        ${ad.price}
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

// Chat functions - GLOBAL FUNCTIONS
function sendMessage() {
  const input = document.getElementById("message-input")
  const message = input.value.trim()
  if (!message) return

  addMessage(message, "sent")
  input.value = ""

  // Simulate response after 1 second
  setTimeout(() => {
    addMessage("Rahmat! Sizning xabaringiz qabul qilindi. Tez orada javob beramiz.", "received")
  }, 1000)
}

function selectImage() {
  document.getElementById("image-input").click()
}

function addMessage(text, type, imageUrl = null) {
  const messagesContainer = document.getElementById("chat-messages")
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`

  const now = new Date()
  const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0")

  let content = `<p>${text}</p>`
  if (imageUrl) {
    content += `<img src="${imageUrl}" alt="Sent image">`
  }
  content += `<span class="text-xs opacity-70">${time}</span>`

  messageDiv.innerHTML = content
  messagesContainer.appendChild(messageDiv)
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

// Initialize navigation
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

  navItems.forEach((item, index) => {
    const navElement = document.createElement("div")
    navElement.className =
      "nav-item flex-1 flex flex-col items-center justify-center cursor-pointer text-tg-hint transition-colors duration-200 py-2"
    navElement.setAttribute("data-page", item.id)
    navElement.innerHTML = `<div class="w-6 h-6 mb-1">${item.icon}</div><span class="text-xs font-medium">${item.label}</span>`

    navElement.addEventListener("click", () => {
      showPage(item.id)
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

// Initialize category filters
function initializeCategoryFilters() {
  const categoryButtons = document.querySelectorAll(".category-btn")

  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.getAttribute("data-category")
      filterItems(category)
    })
  })

  console.log("Category filters initialized successfully")
}

// Initialize profile menu
function initializeProfileMenu() {
  const menuItems = document.querySelectorAll(".profile-menu-item")

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      const action = this.getAttribute("data-action")

      switch (action) {
        case "my-purchases":
          navigateTo({ type: "page", id: "my-purchases-page" })
          break
        case "help":
          navigateTo({ type: "subpage", id: "help-subpage" })
          break
        case "support":
          navigateTo({ type: "chat", id: "chat-page" })
          break
      }
    })
  })

  console.log("Profile menu initialized successfully")
}

// Initialize chat
function initializeChat() {
  const sendBtn = document.getElementById("send-message-btn")
  const selectImageBtn = document.getElementById("select-image-btn")
  const messageInput = document.getElementById("message-input")

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage)
  }

  if (selectImageBtn) {
    selectImageBtn.addEventListener("click", selectImage)
  }

  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    })
  }

  console.log("Chat initialized successfully")
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initializing...")

  // Initialize Telegram WebApp
  tg.ready()
  tg.setHeaderColor("secondary_bg_color")
  tg.setBackgroundColor("secondary_bg_color")
  tg.expand()
  tg.onEvent("backButtonClicked", handleBackPress)

  // Initialize user profile
  const user = tg.initDataUnsafe?.user
  if (user) {
    const profilePhoto = document.getElementById("profile-photo")
    if (user.photo_url) {
      profilePhoto.src = user.photo_url
    } else {
      profilePhoto.src = "/placeholder.svg?height=96&width=96"
    }
    document.getElementById("profile-name").textContent = user.first_name + (user.last_name ? " " + user.last_name : "")
  }

  // Set current items and render
  currentItems = dummyAds
  filteredItems = dummyAds
  renderItems(dummyAds)

  // Initialize Swiper
  if (window.Swiper) {
    setTimeout(() => {
      new window.Swiper(".swiper", {
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        effect: "slide",
        speed: 500,
      })
      console.log("Swiper initialized successfully")
    }, 500)
  }

  // Initialize all components
  initializeNavigation()
  initializeCategoryFilters()
  initializeProfileMenu()
  initializeChat()

  console.log("App initialized successfully")
})

// Handle image selection
document.addEventListener("change", (e) => {
  if (e.target.id === "image-input") {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        addMessage("Rasm yuborildi", "sent", e.target.result)

        // Simulate response
        setTimeout(() => {
          addMessage("Rasm qabul qilindi. Rahmat!", "received")
        }, 1000)
      }
      reader.readAsDataURL(file)
    }
  }
})

console.log("App.js loaded successfully!")
