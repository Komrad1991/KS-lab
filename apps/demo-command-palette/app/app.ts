import {html} from 'lit';
import {App, TiniComponent} from '@tinijs/core';
import {Router} from '@tinijs/router';
import {CommandService, autoRegisterRoutesFromRouter} from '@tinijs/toolbox';
import '@tinijs/ui';
import type {TiniCommandPalette} from '@tinijs/ui';

customElements.get('app-root') ??
  (App()(
    class DemoAppRoot extends TiniComponent {
      protected render() {
        return html`<slot></slot>`;
      }
    }
  ) as unknown as CustomElementConstructor);

const service = new CommandService();
let currentTheme =
  (localStorage.getItem('cp-theme') as 'light' | 'dark') || 'light';

const setPageTheme = (theme: 'light' | 'dark') => {
  document.body.dataset.theme = theme;
  document.body.style.margin = '0';
  document.body.style.minHeight = '100vh';
  document.body.style.fontFamily =
    "'Segoe UI', Inter, ui-sans-serif, system-ui, sans-serif";
  document.body.style.background =
    theme === 'light'
      ? 'radial-gradient(circle at top, #dbeafe 0%, #f8fafc 45%, #e2e8f0 100%)'
      : 'radial-gradient(circle at top, #1e293b 0%, #0f172a 48%, #020617 100%)';
  document.body.style.color = theme === 'light' ? '#172033' : '#e2e8f0';
};

setPageTheme(currentTheme);

const appRoot =
  (document.querySelector('app-root') as HTMLElement | null) ??
  (document.createElement('app-root') as HTMLElement);

document.body.innerHTML = '';
if (!appRoot.isConnected) {
  document.body.appendChild(appRoot);
}

const app = document.createElement('main');
app.style.maxWidth = '960px';
app.style.margin = '0 auto';
app.style.padding = '64px 24px 80px';
app.innerHTML = `
  <section style="display:grid;gap:20px;">
    <div style="display:grid;gap:10px;">
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.72;">
        TiniJS Demo
      </div>
      <h1 style="margin:0;font-size:clamp(32px, 6vw, 56px);line-height:1.05;">
        Command Palette
      </h1>
      <p style="margin:0;max-width:720px;font-size:18px;line-height:1.6;opacity:.84;">
        Открой палитру через кнопку ниже или сочетание <strong>Ctrl+K</strong>,
        потом попробуй поиск, хоткеи, команды с аргументами и навигацию по роутам.
      </p>
    </div>
    <div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));">
      <article style="padding:18px;border-radius:24px;border:1px solid rgba(148,163,184,.28);background:rgba(255,255,255,.62);backdrop-filter:blur(14px);">
        <h2 style="margin:0 0 10px;font-size:18px;">Quick Checks</h2>
        <p style="margin:0 0 8px;">1. Нажми <strong>Open Palette</strong>, <strong>Ctrl+K</strong> или <strong>Ctrl+Shift+P</strong>.</p>
        <p style="margin:0 0 8px;">2. Найди <strong>Say Hello</strong> и выполни команду.</p>
        <p style="margin:0 0 8px;">3. Запусти <strong>Search Commands</strong> и введи аргумент.</p>
        <p style="margin:0 0 8px;">4. Запусти <strong>Async Task</strong> и попробуй отменить через <strong>Esc</strong>.</p>
        <p style="margin:0;">5. Выполни <strong>Fail Command</strong> и проверь текст ошибки в палитре.</p>
      </article>
      <article style="padding:18px;border-radius:24px;border:1px solid rgba(148,163,184,.28);background:rgba(255,255,255,.62);backdrop-filter:blur(14px);">
        <h2 style="margin:0 0 10px;font-size:18px;">Expected Commands</h2>
        <p style="margin:0 0 8px;"><strong>Say Hello</strong>, <strong>Async Task</strong>, <strong>Search Commands</strong>, <strong>Fail Command</strong></p>
        <p style="margin:0;">Navigation: <strong>Go to Home</strong>, <strong>Go to About</strong>, <strong>Go to Contact</strong></p>
      </article>
    </div>
  </section>
`;
appRoot.replaceChildren(app);

const actionRow = document.createElement('div');
actionRow.style.display = 'flex';
actionRow.style.flexWrap = 'wrap';
actionRow.style.gap = '12px';
actionRow.style.marginTop = '24px';
app.appendChild(actionRow);

const statusCard = document.createElement('section');
statusCard.style.marginTop = '20px';
statusCard.style.padding = '18px';
statusCard.style.borderRadius = '24px';
statusCard.style.border = '1px solid rgba(148,163,184,.28)';
statusCard.style.background = 'rgba(15,23,42,.08)';
statusCard.style.backdropFilter = 'blur(12px)';

const statusTitle = document.createElement('div');
statusTitle.textContent = 'Live Status';
statusTitle.style.fontSize = '12px';
statusTitle.style.letterSpacing = '.14em';
statusTitle.style.textTransform = 'uppercase';
statusTitle.style.opacity = '0.7';
statusTitle.style.marginBottom = '8px';
statusCard.appendChild(statusTitle);

const statusText = document.createElement('div');
statusText.dataset.testid = 'live-status';
statusText.style.fontSize = '16px';
statusText.style.lineHeight = '1.6';
statusText.textContent =
  'Palette is ready. Click "Open Palette" or press Ctrl+K.';
statusCard.appendChild(statusText);
app.appendChild(statusCard);

const historyCard = document.createElement('section');
historyCard.style.marginTop = '20px';
historyCard.style.padding = '18px';
historyCard.style.borderRadius = '24px';
historyCard.style.border = '1px solid rgba(148,163,184,.28)';
historyCard.style.background = 'rgba(15,23,42,.08)';
historyCard.style.backdropFilter = 'blur(12px)';

const historyTitle = document.createElement('div');
historyTitle.textContent = 'Recent Commands';
historyTitle.style.fontSize = '12px';
historyTitle.style.letterSpacing = '.14em';
historyTitle.style.textTransform = 'uppercase';
historyTitle.style.opacity = '0.7';
historyTitle.style.marginBottom = '8px';
historyCard.appendChild(historyTitle);

const historyList = document.createElement('div');
historyList.dataset.testid = 'recent-commands';
historyList.style.display = 'grid';
historyList.style.gap = '8px';
historyCard.appendChild(historyList);
app.appendChild(historyCard);

const setStatus = (text: string) => {
  statusText.textContent = text;
};

const renderHistory = () => {
  const recent = service.getRecentCommands(5);
  historyList.innerHTML = '';

  if (!recent.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No commands executed yet.';
    empty.style.opacity = '0.72';
    historyList.appendChild(empty);
    return;
  }

  recent.forEach(command => {
    const item = document.createElement('div');
    item.dataset.testid = 'recent-command-item';
    item.textContent = command.name;
    item.style.padding = '10px 12px';
    item.style.borderRadius = '14px';
    item.style.background = 'rgba(255,255,255,.52)';
    item.style.border = '1px solid rgba(148,163,184,.2)';
    historyList.appendChild(item);
  });
};

const originalRunCommand = service.runCommand.bind(service);
service.runCommand = async (...args) => {
  await originalRunCommand(...args);
  renderHistory();
};

service.registerCommand(
  'hello',
  'Say Hello',
  'Shows a hello message',
  undefined,
  () => {
    setStatus('Hello command executed successfully.');
  },
  ['greet'],
  'Demo'
);

service.registerCommand(
  'async-task',
  'Async Task',
  'Simulates an async task with cancellation',
  undefined,
  async (_args, signal) => {
    signal?.addEventListener(
      'abort',
      () => {
        setStatus('Async task cancelled.');
      },
      {once: true}
    );
    for (let i = 0; i < 5; i++) {
      if (signal?.aborted) throw new Error('Task cancelled');
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus(`Async task step ${i + 1} of 5...`);
    }
    setStatus('Async task completed.');
  },
  ['async'],
  'Demo'
);

service.registerCommand(
  'fail-command',
  'Fail Command',
  'Throws an error to test palette error handling',
  undefined,
  () => {
    throw new Error('Demo failure: command crashed intentionally.');
  },
  ['error', 'fail'],
  'Demo',
  undefined,
  undefined,
  false
);

service.registerCommand(
  'search-commands',
  'Search Commands',
  'Enter a search query',
  undefined,
  args => {
    setStatus(`Search command executed with query: ${args?.query ?? ''}`);
  },
  ['search'],
  'Demo',
  undefined,
  [{name: 'query', type: 'string', description: 'Search query'}],
  false
);

const router = new Router(
  [
    {path: '/', title: 'Home', component: 'demo-home-page'},
    {path: '/about', title: 'About', component: 'demo-about-page'},
    {path: '/contact', title: 'Contact', component: 'demo-contact-page'},
  ],
  {}
);
router.init();

autoRegisterRoutesFromRouter(service, router);
service.registerShortcut('Ctrl+Shift+H', 'hello');
service.registerShortcut('g h', 'hello');
service.registerShortcut('Ctrl+Shift+A', 'async-task');
service.registerShortcut('Ctrl+Shift+E', 'fail-command');
service.registerShortcut('Ctrl+Shift+F', 'search-commands');

const palette = document.createElement(
  'tini-command-palette'
) as TiniCommandPalette;
palette.commandService = service;
palette.theme = currentTheme;
palette.family = 'tini';

appRoot.appendChild(palette);

const themeBtn = document.createElement('button');
themeBtn.textContent = currentTheme === 'light' ? 'Dark mode' : 'Light mode';
themeBtn.style.border = '0';
themeBtn.style.borderRadius = '999px';
themeBtn.style.padding = '12px 18px';
themeBtn.style.font = '600 14px/1 inherit';
themeBtn.style.cursor = 'pointer';
themeBtn.style.background = '#2563eb';
themeBtn.style.color = '#fff';
themeBtn.addEventListener('click', () => {
  const newTheme = palette.theme === 'light' ? 'dark' : 'light';
  palette.theme = newTheme;
  currentTheme = newTheme;
  setPageTheme(newTheme);
  localStorage.setItem('cp-theme', newTheme);
  themeBtn.textContent = newTheme === 'light' ? 'Dark mode' : 'Light mode';
  setStatus(`Theme switched to ${newTheme}.`);
});
actionRow.appendChild(themeBtn);

const openBtn = document.createElement('button');
openBtn.textContent = 'Open Palette';
openBtn.style.border = '0';
openBtn.style.borderRadius = '999px';
openBtn.style.padding = '12px 18px';
openBtn.style.font = '600 14px/1 inherit';
openBtn.style.cursor = 'pointer';
openBtn.style.background = 'rgba(15, 23, 42, 0.08)';
openBtn.style.color = 'inherit';
openBtn.addEventListener('click', () => {
  palette.open();
  setStatus('Palette opened. Try typing "hello", or open it with Ctrl+K / Ctrl+Shift+P.');
});
actionRow.appendChild(openBtn);

document.title = 'Command Palette Demo';
renderHistory();
