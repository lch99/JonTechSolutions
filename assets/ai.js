/* JonTech AI — site-wide chat assistant + the homepage's AI UI/UX check.
 *
 * AI_ENDPOINT is the URL of the Cloudflare Worker in /worker (e.g. https://jontech-ai.<you>.workers.dev).
 * Leave it empty and the assistant answers from the built-in quick answers below,
 * and the UI/UX check hands the request over to WhatsApp instead.
 */
(function () {
  const AI_ENDPOINT = '';
  const WHATSAPP = 'https://wa.me/60195023897';

  const T = {
    en: {
      fab: 'Ask AI',
      title: 'JonTech AI',
      subOnline: 'Answers about our services & projects',
      subOffline: 'Instant answers · WhatsApp for anything else',
      hello: "Hi! I'm the JonTech assistant. Ask me about our services, past projects, or what could be automated in your business.",
      placeholder: 'Type your question…',
      send: 'Send',
      close: 'Close',
      wa: 'Chat on WhatsApp',
      foot: 'AI can make mistakes. For quotes, WhatsApp us.',
      suggest: ['What projects have you done?', 'How can AI help my business?', 'How much does it cost?'],
      error: "Sorry, I couldn't reach the assistant just now. Here's a quick answer instead:",
      busy: "Lots of questions right now — give it a minute, or WhatsApp us for a faster reply.",
      uxEmpty: 'Please enter your website address.',
      uxBad: "That doesn't look like a website address.",
      uxSteps: ['Fetching your page…', 'Reading its structure…', 'Reviewing with AI…', 'Writing your report…'],
      uxOffline: "Our live AI check is being switched on. Send us your address and we'll run the review and send you the report personally.",
      uxOfflineBtn: 'Request my free check on WhatsApp',
      uxOfflineMsg: (url) => `Hi JonTech, please run a free AI UI/UX check on my website: ${url}`,
      uxFail: 'The check failed: ',
      uxRetry: 'Try again in a moment, or ask us on WhatsApp.',
      uxScore: 'UX score',
      uxIssues: 'Top issues',
      uxWins: 'Quick wins',
      uxCta: 'Want these fixed properly? I can help.',
      uxCtaBtn: 'Talk to JonTech',
      uxCtaMsg: (url) => `Hi JonTech, I ran the AI UX check on ${url} and would like help fixing the issues.`,
      fix: 'Fix:',
      sev: { high: 'High', medium: 'Medium', low: 'Low' },
      cats: { clarity: 'Clarity', navigation: 'Navigation', mobile: 'Mobile', accessibility: 'Accessibility', conversion: 'Conversion', seo: 'SEO basics' },
    },
    ms: {
      fab: 'Tanya AI',
      title: 'JonTech AI',
      subOnline: 'Jawapan tentang perkhidmatan & projek kami',
      subOffline: 'Jawapan segera · WhatsApp untuk lain-lain',
      hello: 'Hai! Saya pembantu JonTech. Tanya saya tentang perkhidmatan kami, projek lepas, atau apa yang boleh diautomasikan dalam perniagaan anda.',
      placeholder: 'Taip soalan anda…',
      send: 'Hantar',
      close: 'Tutup',
      wa: 'Sembang di WhatsApp',
      foot: 'AI boleh tersilap. Untuk sebut harga, WhatsApp kami.',
      suggest: ['Projek apa yang pernah dibuat?', 'Bagaimana AI boleh bantu perniagaan saya?', 'Berapa kosnya?'],
      error: 'Maaf, pembantu tidak dapat dihubungi sekarang. Ini jawapan ringkas:',
      busy: 'Banyak soalan sekarang — cuba sebentar lagi, atau WhatsApp kami untuk balasan lebih pantas.',
      uxEmpty: 'Sila masukkan alamat laman web anda.',
      uxBad: 'Itu tidak kelihatan seperti alamat laman web.',
      uxSteps: ['Mengambil halaman anda…', 'Membaca strukturnya…', 'Menyemak dengan AI…', 'Menulis laporan anda…'],
      uxOffline: 'Semakan AI langsung kami sedang diaktifkan. Hantar alamat anda dan kami akan jalankan semakan serta hantar laporan kepada anda sendiri.',
      uxOfflineBtn: 'Minta semakan percuma di WhatsApp',
      uxOfflineMsg: (url) => `Hai JonTech, sila jalankan semakan UI/UX AI percuma untuk laman web saya: ${url}`,
      uxFail: 'Semakan gagal: ',
      uxRetry: 'Cuba lagi sebentar, atau tanya kami di WhatsApp.',
      uxScore: 'Markah UX',
      uxIssues: 'Isu utama',
      uxWins: 'Pembaikan pantas',
      uxCta: 'Mahu ini dibaiki dengan betul? Saya boleh bantu.',
      uxCtaBtn: 'Hubungi JonTech',
      uxCtaMsg: (url) => `Hai JonTech, saya telah jalankan semakan UX AI untuk ${url} dan perlukan bantuan membaiki isu-isunya.`,
      fix: 'Pembaikan:',
      sev: { high: 'Tinggi', medium: 'Sederhana', low: 'Rendah' },
      cats: { clarity: 'Kejelasan', navigation: 'Navigasi', mobile: 'Mudah alih', accessibility: 'Kebolehcapaian', conversion: 'Penukaran', seo: 'Asas SEO' },
    },
    zh: {
      fab: '问 AI',
      title: 'JonTech AI',
      subOnline: '解答我们的服务与项目',
      subOffline: '即时解答 · 其他问题请 WhatsApp',
      hello: '您好！我是 JonTech 助手。可以问我关于我们的服务、过往项目，或者您的业务中有哪些环节可以自动化。',
      placeholder: '输入您的问题…',
      send: '发送',
      close: '关闭',
      wa: 'WhatsApp 联系',
      foot: 'AI 可能会出错。如需报价，请 WhatsApp 联系我们。',
      suggest: ['你们做过哪些项目？', 'AI 能怎样帮助我的业务？', '费用大概多少？'],
      error: '抱歉，暂时无法连接 AI 助手。以下是简要回答：',
      busy: '现在提问的人比较多——请稍后再试，或通过 WhatsApp 获得更快回复。',
      uxEmpty: '请输入您的网址。',
      uxBad: '这看起来不像是一个网址。',
      uxSteps: ['正在获取页面…', '正在读取页面结构…', 'AI 正在审查…', '正在生成报告…'],
      uxOffline: '我们的在线 AI 检测即将开放。请把网址发给我们，我们会为您运行检测并亲自发送报告。',
      uxOfflineBtn: '通过 WhatsApp 申请免费检测',
      uxOfflineMsg: (url) => `您好 JonTech，请帮我的网站做一次免费 AI UI/UX 检测：${url}`,
      uxFail: '检测失败：',
      uxRetry: '请稍后再试，或通过 WhatsApp 联系我们。',
      uxScore: 'UX 评分',
      uxIssues: '主要问题',
      uxWins: '快速改进',
      uxCta: '想把这些问题彻底解决？我可以帮忙。',
      uxCtaBtn: '联系 JonTech',
      uxCtaMsg: (url) => `您好 JonTech，我用 AI UX 检测了 ${url}，想请您帮忙修复这些问题。`,
      fix: '改进：',
      sev: { high: '高', medium: '中', low: '低' },
      cats: { clarity: '清晰度', navigation: '导航', mobile: '移动端', accessibility: '无障碍', conversion: '转化率', seo: 'SEO 基础' },
    },
  };

  /* Quick answers used when the AI endpoint isn't set or can't be reached. */
  const QUICK = [
    {
      keys: ['price', 'cost', 'quote', 'budget', 'how much', 'harga', 'kos', 'kosnya', 'berapa', 'bajet', '价格', '费用', '多少钱', '报价', '预算'],
      en: 'Every project is quoted after a short free chat about scope — there\'s no fixed price list. Small automations usually cost far less than hiring someone to do the task by hand. WhatsApp us what you need and we\'ll give you a clear quote.',
      ms: 'Setiap projek disebut harga selepas sembang ringkas percuma tentang skop — tiada senarai harga tetap. Automasi kecil biasanya jauh lebih murah daripada mengupah orang untuk buat secara manual. WhatsApp kami keperluan anda dan kami beri sebut harga yang jelas.',
      zh: '每个项目都会在一次免费的需求沟通后报价——没有固定价目表。小型自动化通常远比雇人手动处理便宜。把您的需求 WhatsApp 给我们，我们会给出清楚的报价。',
    },
    {
      keys: ['ai', 'chatbot', 'gpt', 'claude', 'llm', 'kecerdasan', '人工智能', '机器人'],
      en: 'We use AI where it genuinely saves work: website & WhatsApp assistants (like this one), reading invoices and receipts into your system, plain-language summaries of sales or stock, AI-assisted testing, AI-written marketplace listings, and AI UI/UX reviews. Anything customer-facing keeps a human fallback.',
      ms: 'Kami guna AI di tempat yang benar-benar menjimatkan kerja: pembantu web & WhatsApp (seperti ini), membaca invois dan resit ke dalam sistem, ringkasan jualan atau stok yang mudah difahami, ujian dibantu AI, penyenaraian marketplace yang ditulis AI dan semakan UI/UX AI. Semua yang berdepan pelanggan ada sandaran manusia.',
      zh: '我们只在真正省力的地方用 AI：网站与 WhatsApp 助手（就像这个）、把发票和收据读进系统、通俗易懂的销售或库存摘要、AI 辅助测试、AI 撰写电商商品上架，以及 AI UI/UX 审查。面向客户的环节都保留人工兜底。',
    },
    {
      keys: ['kiosk', 'self-service', 'self service', 'touchscreen', '终端', '自助'],
      en: 'We built a self-service kiosk system for a scalp spa: customers choose a treatment on a touchscreen, pay by card terminal and get a printed receipt, while staff manage everything from an admin portal with reports and remote updates.',
      ms: 'Kami membina sistem kiosk layan diri untuk spa kulit kepala: pelanggan pilih rawatan di skrin sentuh, bayar melalui terminal kad dan dapat resit bercetak, manakala staf mengurus semuanya melalui portal admin dengan laporan dan kemas kini jarak jauh.',
      zh: '我们为一家头皮护理店打造了自助终端系统：顾客在触屏上选择疗程、刷卡付款并打印收据，员工则通过后台管理系统查看报表并远程更新。',
    },
    {
      keys: ['pos', 'shopee', 'lazada', 'tiktok', 'marketplace', 'inventory', 'stock', 'stok', 'inventori', 'retail', 'runcit', 'shop', 'kedai', '库存', '零售', '收银', '电商'],
      en: 'Yes — our phone-shop POS handles sales, inventory, repairs, purchasing and accounting, and its selling app keeps stock, products and orders in sync with Shopee, Lazada and TikTok Shop. It\'s in daily use.',
      ms: 'Ya — POS kedai telefon kami mengurus jualan, inventori, pembaikan, pembelian dan perakaunan, dan aplikasi jualannya menyelaraskan stok, produk dan pesanan dengan Shopee, Lazada dan TikTok Shop. Ia digunakan setiap hari.',
      zh: '可以——我们为手机店打造的 POS 涵盖销售、库存、维修、采购与会计，配套的销售应用会把库存、商品与订单和 Shopee、Lazada、TikTok Shop 保持同步，目前每天都在使用。',
    },
    {
      keys: ['property', 'real estate', 'commission', 'agent', 'condo', 'resident', 'hartanah', 'komisen', 'ejen', 'penduduk', '房地产', '佣金', '中介', '住户', '公寓'],
      en: 'Two property projects: a multi-branch agency commission system (tiers, co-agency splits, SST and withholding tax, referrals across sub-sale, rental and new projects), and a verified-residents community platform with forum, polls, defect reports and a fee tracker — there\'s a live demo on the Projects section.',
      ms: 'Dua projek hartanah: sistem komisen agensi berbilang cawangan (tahap, pembahagian ko-agensi, SST dan cukai pegangan, rujukan untuk subjual, sewaan dan projek baharu), dan platform komuniti penduduk disahkan dengan forum, undian, laporan kecacatan dan penjejak yuran — ada demo langsung di bahagian Projek.',
      zh: '两个房地产项目：多分行中介佣金系统（等级、联合代理分成、SST 与预扣税、推荐奖励，涵盖二手、租赁与新盘），以及认证住户社区平台，含论坛、投票、缺陷报告与管理费追踪——项目区有在线演示。',
    },
    {
      keys: ['school', 'education', 'learning', 'lms', 'student', 'sekolah', 'pendidikan', 'pelajar', '教育', '学习', '学生', '学校'],
      en: 'We built a memory-method learning platform for primary-school students (ages 7–12) in Singapore — flash cards, quizzes and spaced repetition, with tools for teachers and admins.',
      ms: 'Kami membina platform pembelajaran kaedah ingatan untuk murid sekolah rendah (umur 7–12) di Singapura — kad imbas, kuiz dan ulang kaji berjarak, dengan alatan untuk guru dan admin.',
      zh: '我们为新加坡的小学生（7–12 岁）打造了记忆法学习平台——闪卡、测验与间隔复习，并为老师和管理员提供管理工具。',
    },
    {
      keys: ['test', 'qa', 'playwright', 'selenium', 'bug', 'ujian', '测试', '自动化测试'],
      en: 'QA is our background. We built a Playwright end-to-end suite for a real-time gaming platform (lobby, in-game UI, WebSocket machine sync), and every system we ship is tested before handover.',
      ms: 'QA ialah latar belakang kami. Kami membina suite hujung-ke-hujung Playwright untuk platform permainan masa nyata (lobi, UI dalam permainan, penyelarasan mesin WebSocket), dan setiap sistem diuji sebelum diserahkan.',
      zh: 'QA 是我们的老本行。我们为一个实时游戏平台打造了 Playwright 端到端测试套件（大厅、游戏内界面、WebSocket 机台同步），每个交付的系统都会在交付前严格测试。',
    },
    {
      keys: ['website', 'web', 'app', 'mobile', 'android', 'ios', 'laman', 'aplikasi', '网站', '应用', '手机', 'app'],
      en: 'We build full-stack web apps (React, Node.js, MySQL) and mobile/desktop apps for operations and customers. Recent ones include a community platform, a learning platform and a commission system. Tip: try the free AI UI/UX check at the bottom of the homepage.',
      ms: 'Kami membina aplikasi web full-stack (React, Node.js, MySQL) dan aplikasi mudah alih/desktop untuk operasi dan pelanggan. Antaranya platform komuniti, platform pembelajaran dan sistem komisen. Tip: cuba semakan UI/UX AI percuma di bahagian bawah halaman utama.',
      zh: '我们开发全栈网页应用（React、Node.js、MySQL）以及面向运营和客户的移动/桌面应用，近期作品包括社区平台、学习平台和佣金系统。小提示：可以试试首页底部的免费 AI UI/UX 检测。',
    },
    {
      keys: ['contact', 'whatsapp', 'email', 'call', 'phone', 'hubungi', 'telefon', '联系', '电话', '邮件'],
      en: 'WhatsApp is fastest: +60 19-502 3897. Or email jontech.information@gmail.com — you\'ll talk directly to the engineer building your system.',
      ms: 'WhatsApp paling pantas: +60 19-502 3897. Atau e-mel jontech.information@gmail.com — anda akan bercakap terus dengan jurutera yang membina sistem anda.',
      zh: '最快是 WhatsApp：+60 19-502 3897，或发邮件至 jontech.information@gmail.com——您会直接和为您开发系统的工程师沟通。',
    },
    {
      keys: ['project', 'portfolio', 'work', 'done', 'built', 'projek', 'kerja', '项目', '作品', '案例'],
      en: 'Recent work: an agency commission system, a scalp-spa self-service kiosk, a memory-method learning platform, a phone-shop POS with Shopee/Lazada/TikTok sync, a residents community platform, a Playwright test suite, a trading research desk and an invoicing system. Ask me about any of them!',
      ms: 'Kerja terkini: sistem komisen agensi, kiosk layan diri spa kulit kepala, platform pembelajaran kaedah ingatan, POS kedai telefon dengan penyelarasan Shopee/Lazada/TikTok, platform komuniti penduduk, suite ujian Playwright, meja penyelidikan dagangan dan sistem invois. Tanya saya tentang mana-mana satu!',
      zh: '近期项目：中介佣金系统、头皮护理自助终端、记忆法学习平台、对接 Shopee/Lazada/TikTok 的手机店 POS、住户社区平台、Playwright 测试套件、交易研究工作台以及发票系统。想了解哪个都可以问我！',
    },
  ];
  const QUICK_DEFAULT = {
    en: 'I can tell you about our services, past projects, AI use cases and how we work. For anything specific to your business, a quick WhatsApp chat is best: +60 19-502 3897.',
    ms: 'Saya boleh terangkan perkhidmatan, projek lepas, kegunaan AI dan cara kami bekerja. Untuk perkara khusus perniagaan anda, sembang ringkas di WhatsApp paling baik: +60 19-502 3897.',
    zh: '我可以介绍我们的服务、过往项目、AI 应用和合作方式。如果是针对您业务的具体问题，最好直接 WhatsApp 聊一聊：+60 19-502 3897。',
  };

  const lang = () => {
    const l = (document.documentElement.lang || 'en').toLowerCase();
    return l.startsWith('zh') ? 'zh' : l.startsWith('ms') ? 'ms' : 'en';
  };
  const t = () => T[lang()];

  function quickAnswer(q) {
    const text = q.toLowerCase();
    const hit = QUICK.find((item) => item.keys.some((k) => (/^[a-z]+$/.test(k) && k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(text) : text.includes(k))));
    return (hit || QUICK_DEFAULT)[lang()];
  }

  /* Render text with clickable links/phone, never as HTML. */
  function richText(el, text) {
    const re = /(https?:\/\/[^\s)]+|\+60 ?1\d[- ]?\d{3,4} ?\d{4}|[\w.+-]+@[\w-]+\.[\w.]+)/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      const a = document.createElement('a');
      const v = m[0];
      a.textContent = v;
      a.href = v.startsWith('http') ? v : v.includes('@') ? `mailto:${v}` : WHATSAPP;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      el.appendChild(a);
      last = m.index + v.length;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
  }

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    kids.forEach((k) => k && el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k));
    return el;
  }

  async function post(path, body) {
    const res = await fetch(AI_ENDPOINT.replace(/\/$/, '') + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || `HTTP ${res.status}`); e.status = res.status; throw e; }
    return data;
  }

  /* ── CHAT WIDGET ── */
  const STORE = 'jontech-chat';
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch (e) { history = []; }
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-20))); } catch (e) {} };

  const fab = h('button', { class: 'jt-fab', type: 'button', 'aria-haspopup': 'dialog', 'aria-controls': 'jtPanel' },
    h('span', { class: 'ai-dot', 'aria-hidden': 'true', text: '✦' }), h('span', { class: 'jt-fab-label' }));
  const panel = h('div', { class: 'jt-panel', id: 'jtPanel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'jtTitle' });
  const titleEl = h('div', { class: 'jt-head-title', id: 'jtTitle' });
  const subEl = h('div', { class: 'jt-head-sub' });
  const waBtn = h('a', { class: 'jt-icon-btn', href: WHATSAPP, target: '_blank', rel: 'noopener noreferrer' });
  waBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#icon-whatsapp"/></svg>';
  const closeBtn = h('button', { class: 'jt-icon-btn', type: 'button', text: '✕' });
  const body = h('div', { class: 'jt-body', 'aria-live': 'polite' });
  const input = h('input', { type: 'text', maxlength: '600', autocomplete: 'off' });
  const sendBtn = h('button', { type: 'submit', text: '↑' });
  const form = h('form', { class: 'jt-form' }, input, sendBtn);
  const foot = h('div', { class: 'jt-foot' });
  panel.append(
    h('div', { class: 'jt-head' }, h('div', { class: 'ai-dot', 'aria-hidden': 'true', text: '✦' }), h('div', { class: 'jt-head-text' }, titleEl, subEl), waBtn, closeBtn),
    body, form, foot,
  );
  document.body.append(fab, panel);

  let busy = false;

  function bubble(role, text) {
    const el = h('div', { class: `jt-msg ${role === 'user' ? 'user' : 'bot'}` });
    richText(el, text);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function renderChat() {
    const s = t();
    fab.querySelector('.jt-fab-label').textContent = s.fab;
    titleEl.textContent = s.title;
    subEl.textContent = AI_ENDPOINT ? s.subOnline : s.subOffline;
    waBtn.setAttribute('aria-label', s.wa);
    waBtn.title = s.wa;
    closeBtn.setAttribute('aria-label', s.close);
    input.placeholder = s.placeholder;
    input.setAttribute('aria-label', s.placeholder);
    sendBtn.setAttribute('aria-label', s.send);
    foot.textContent = s.foot;
    body.textContent = '';
    bubble('bot', s.hello);
    history.forEach((m) => bubble(m.role, m.content));
    if (!history.length) {
      const chips = h('div', { class: 'jt-suggest' });
      s.suggest.forEach((q) => {
        const b = h('button', { type: 'button', text: q });
        b.addEventListener('click', () => ask(q));
        chips.appendChild(b);
      });
      body.appendChild(chips);
    }
  }

  function open() {
    panel.classList.add('open');
    fab.classList.add('hidden');
    fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => input.focus(), 50);
  }
  function close() {
    panel.classList.remove('open');
    fab.classList.remove('hidden');
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  async function ask(question) {
    const q = String(question || '').trim();
    open();
    if (!q || busy) return;
    busy = true;
    sendBtn.disabled = true;
    body.querySelector('.jt-suggest')?.remove();
    history.push({ role: 'user', content: q });
    bubble('user', q);
    const typing = h('div', { class: 'jt-msg bot jt-typing' }, h('i'), h('i'), h('i'));
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    let reply;
    if (AI_ENDPOINT) {
      try {
        reply = (await post('/chat', { messages: history })).reply;
      } catch (e) {
        reply = e.status === 429 || e.status === 503 ? t().busy : `${t().error}\n\n${quickAnswer(q)}`;
      }
    } else {
      await new Promise((r) => setTimeout(r, 500));
      reply = quickAnswer(q);
    }
    typing.remove();
    history.push({ role: 'assistant', content: reply });
    save();
    bubble('bot', reply);
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value;
    input.value = '';
    ask(q);
  });

  /* ── AI UI/UX CHECK (homepage only) ── */
  const ux = {
    form: document.getElementById('uxForm'),
    url: document.getElementById('uxUrl'),
    focus: document.getElementById('uxFocus'),
    btn: document.getElementById('uxBtn'),
    status: document.getElementById('uxStatus'),
    statusText: document.getElementById('uxStatusText'),
    msg: document.getElementById('uxMsg'),
    result: document.getElementById('uxResult'),
  };

  function normaliseUrl(raw) {
    const v = raw.trim();
    if (!v) return null;
    try {
      const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      return u.hostname.includes('.') ? u.toString() : null;
    } catch (e) { return null; }
  }

  function showMsg(text, waText) {
    ux.msg.textContent = '';
    ux.msg.appendChild(document.createTextNode(text));
    if (waText) {
      ux.msg.appendChild(h('br'));
      ux.msg.appendChild(h('a', { class: 'btn-sm', href: `${WHATSAPP}?text=${encodeURIComponent(waText)}`, target: '_blank', rel: 'noopener noreferrer', text: t().uxOfflineBtn }));
    }
    ux.msg.classList.add('show');
  }

  const colour = (n) => (n >= 75 ? '#1a8f4c' : n >= 50 ? '#e0a100' : '#e8320a');
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

  function renderReport(data) {
    const s = t();
    const r = data.report;
    const score = clamp(r.overall_score);
    const C = 2 * Math.PI * 56;
    const ring = h('div', { class: 'ux-ring' });
    ring.innerHTML = `<svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true"><circle cx="65" cy="65" r="56" fill="none" stroke="#f5f5f7" stroke-width="12"/><circle cx="65" cy="65" r="56" fill="none" stroke="${colour(score)}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>`;
    const num = h('div', { class: 'ux-ring-num' }, String(score), h('small', { text: s.uxScore }));
    ring.appendChild(num);

    const cats = h('div', { class: 'ux-cats' });
    Object.keys(s.cats).forEach((key) => {
      const c = r.categories[key];
      if (!c) return;
      const v = clamp(c.score);
      const bar = h('i');
      bar.style.background = colour(v);
      bar.dataset.w = `${v}%`;
      cats.appendChild(h('div', { class: 'ux-cat' },
        h('div', { class: 'ux-cat-head' }, h('span', { text: s.cats[key] }), h('span', { text: String(v) })),
        h('div', { class: 'ux-bar' }, bar),
        h('p', { text: c.summary })));
    });

    const issues = h('div', { class: 'ux-issues' });
    (r.issues || []).forEach((i) => {
      const sev = ['high', 'medium', 'low'].includes(i.severity) ? i.severity : 'low';
      const fix = h('p');
      fix.append(h('b', { text: s.fix }), ` ${i.fix}`);
      issues.appendChild(h('div', { class: 'ux-issue' },
        h('span', { class: `ux-sev ${sev}`, text: s.sev[sev] }),
        h('strong', {}, `${i.problem} `, h('span', { class: 'ux-issue-area', text: `· ${i.area}` })),
        fix));
    });

    const wins = h('ul', { class: 'ux-wins' });
    (r.quick_wins || []).forEach((w) => wins.appendChild(h('li', { text: w })));

    ux.result.textContent = '';
    ux.result.append(
      h('div', { class: 'ux-top' }, ring, h('div', {}, h('div', { class: 'ux-url', text: data.url }), h('div', { class: 'ux-verdict', text: r.verdict }))),
      cats,
      h('div', { class: 'ux-h', text: s.uxIssues }), issues,
      h('div', { class: 'ux-h', text: s.uxWins }), wins,
      h('div', { class: 'ux-cta' }, h('p', { text: s.uxCta }),
        h('a', { class: 'btn-sm', href: `${WHATSAPP}?text=${encodeURIComponent(s.uxCtaMsg(data.url))}`, target: '_blank', rel: 'noopener noreferrer', text: s.uxCtaBtn })),
    );
    ux.result.classList.add('show');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ring.querySelectorAll('circle')[1].setAttribute('stroke-dashoffset', String(C * (1 - score / 100)));
      ux.result.querySelectorAll('.ux-bar i').forEach((b) => { b.style.width = b.dataset.w; });
    }));
    ux.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (ux.form) {
    ux.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const s = t();
      ux.msg.classList.remove('show');
      ux.result.classList.remove('show');
      if (!ux.url.value.trim()) { showMsg(s.uxEmpty); ux.url.focus(); return; }
      const url = normaliseUrl(ux.url.value);
      if (!url) { showMsg(s.uxBad); ux.url.focus(); return; }
      if (!AI_ENDPOINT) { showMsg(s.uxOffline, s.uxOfflineMsg(url)); return; }

      ux.btn.disabled = true;
      ux.status.classList.add('show');
      let step = 0;
      ux.statusText.textContent = s.uxSteps[0];
      const timer = setInterval(() => {
        step = Math.min(step + 1, s.uxSteps.length - 1);
        ux.statusText.textContent = t().uxSteps[step];
      }, 6000);
      try {
        renderReport(await post('/audit', { url, focus: ux.focus.value, lang: lang() }));
      } catch (err) {
        const known = err.status === 400 ? err.message : t().uxRetry;
        showMsg(t().uxFail + known, t().uxOfflineMsg(url));
      } finally {
        clearInterval(timer);
        ux.status.classList.remove('show');
        ux.btn.disabled = false;
      }
    });
  }

  document.addEventListener('jontech:lang', renderChat);
  renderChat();

  window.JonTechAI = { open, ask, close };
})();
