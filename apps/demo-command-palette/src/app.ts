import { CommandService } from '@tinijs/toolbox'
import { TiniCommandPalette } from '@tinijs/ui'
import { Router } from '@tinijs/router'
import { autoRegisterRoutesFromRouter } from '@tinijs/toolbox'

// Create service
const service = new CommandService()

// Register some commands
service.registerCommand(
  'hello',
  'Say Hello',
  'Shows a hello message',
  undefined,
  () => {
    alert('Hello from Command Palette!')
  },
  ['greet'],
  'Demo'
)

service.registerCommand(
  'navigate-home',
  'Go to Home',
  'Navigate to home page',
  undefined,
  () => {
    // Navigation handled by router command
  },
  ['navigate'],
  'Navigation'
)

service.registerCommand(
  'async-task',
  'Async Task',
  'Simulates an async task with cancellation',
  undefined,
  async (signal) => {
    for (let i = 0; i < 5; i++) {
      if (signal.aborted) throw new Error('Task cancelled')
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Task step', i + 1)
    }
    alert('Async task completed')
  },
  ['async'],
  'Demo'
)

service.registerCommand(
  'search-commands',
  'Search Commands',
  'Enter a search query',
  undefined,
  (args) => {
    alert(`You searched for: ${args?.query}`)
  },
  ['search'],
  'Demo',
  undefined,
  [
    { name: 'query', type: 'string', description: 'Search query' }
  ]
)

// Setup router
const router = new Router(
  [
    { path: '/', title: 'Home' },
    { path: '/about', title: 'About' },
    { path: '/contact', title: 'Contact' }
  ],
  {}
)
router.init()

// Auto-register navigation commands
autoRegisterRoutesFromRouter(service, router)

// Create palette
const palette = new TiniCommandPalette()
palette.commandService = service
// Set theme based on localStorage or system
const savedTheme = localStorage.getItem('cp-theme') as 'light' | 'dark' || 'light'
palette.theme = savedTheme

// Append palette to body
document.body.appendChild(palette)

// Add toggle theme button
const themeBtn = document.createElement('button')
themeBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️'
themeBtn.style.position = 'fixed'
themeBtn.style.top = '10px'
themeBtn.style.right = '10px'
themeBtn.addEventListener('click', () => {
  const newTheme = palette.theme === 'light' ? 'dark' : 'light'
  palette.theme = newTheme
  localStorage.setItem('cp-theme', newTheme)
  themeBtn.textContent = newTheme === 'light' ? '🌙' : '☀️'
})
document.body.appendChild(themeBtn)

// Also add a button to manually open palette (optional)
const openBtn = document.createElement('button')
openBtn.textContent = 'Open Palette'
openBtn.style.position = 'fixed'
openBtn.style.top = '50px'
openBtn.style.right = '10px'
openBtn.addEventListener('click', () => palette.open())
document.body.appendChild(openBtn)

// Update page title
document.title = 'Command Palette Demo'
