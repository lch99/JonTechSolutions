/* JonTech AI — site-wide chat assistant, the homepage's AI UI/UX check, and the contact forms' WhatsApp hand-off.
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
      formHi: 'Hi JonTech, I sent this from your website:',
      formName: 'Name', formEmail: 'Email', formNeed: 'I need',
      formSent: 'WhatsApp has opened with your message — press send there and it reaches us directly.',
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
      formHi: 'Hai JonTech, saya menghantar ini dari laman web anda:',
      formName: 'Nama', formEmail: 'E-mel', formNeed: 'Saya perlukan',
      formSent: 'WhatsApp telah dibuka dengan mesej anda — tekan hantar di sana dan ia terus sampai kepada kami.',
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
      formHi: '您好 JonTech，这是我在网站上填写的留言：',
      formName: '姓名', formEmail: '邮箱', formNeed: '我需要',
      formSent: 'WhatsApp 已打开并填好您的留言——在那里按发送，就会直接送达我们。',
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

  /* Built-in answers, used when the AI endpoint isn't set or can't be reached.
     Each topic has the words that point to it (`keys`, any language; with `also`, the question needs
     a word from both lists), the question shown on its follow-up button (`q`: English, BM, 中文),
     the reply, and the topics to offer next. Earlier topics win ties. Keep replies to facts the
     site states — worker/src/knowledge.js is the reference. */
  const K = {
    price: ['price', 'pricing', 'cost', 'quote', 'quotation', 'budget', 'how much', 'fee', 'charge', 'rate', 'expensive', 'cheap', 'afford', 'harga', 'kos', 'kosnya', 'berapa', 'bajet', 'bayaran', 'caj', 'mahal', 'murah', 'sebut harga', '价格', '价钱', '费用', '多少钱', '报价', '预算', '收费', '贵', '便宜'],
    time: ['how long', 'timeline', 'duration', 'deadline', 'how fast', 'how soon', 'how quickly', 'week', 'month', 'urgent', 'rush', 'lead time', 'berapa lama', 'tempoh', 'bila siap', 'minggu', 'bulan', 'segera', '多久', '多长时间', '工期', '几周', '几个月', '多快'],
    pos: ['pos', 'point of sale', 'till', 'cashier', 'checkout', 'inventory', 'stock', 'retail', 'order', 'ordering', 'runcit', 'stok', 'inventori', 'kaunter', 'juruwang', 'pesanan', '收银', '库存', '零售', '点餐', '点单'],
    web: ['website', 'web', 'web app', 'webapp', 'web application', 'site', 'landing page', 'laman web', 'laman', 'tapak web', '网站', '网页'],
    mobile: ['mobile app', 'mobile', 'app', 'android', 'ios', 'iphone', 'react native', 'app store', 'play store', 'aplikasi mudah alih', 'aplikasi', '手机应用', '手机', '应用', '安卓', '苹果'],
    software: ['custom software', 'custom system', 'software', 'system', 'portal', 'back office', 'internal tool', 'erp', 'crm', 'admin panel', 'perisian', 'sistem', 'tersuai', '软件', '系统', '后台', '定制'],
    ai: ['ai', 'artificial intelligence', 'chatbot', 'gpt', 'chatgpt', 'claude', 'llm', 'machine learning', 'kecerdasan buatan', '人工智能', '机器人', '智能', '大模型'],
  };
  const TOPICS = [
    {
      id: 'hello', next: ['services', 'projects', 'pricing'],
      keys: ['hi', 'hello', 'hey', 'helo', 'hai', 'good morning', 'good afternoon', 'good evening', 'selamat pagi', 'selamat petang', 'selamat malam', 'apa khabar', '你好', '您好', '嗨', '哈喽', '早安', '在吗'],
      en: 'Hi! I can tell you what we build, show past projects, and explain pricing, timelines and how a project runs. What are you trying to fix or build?',
      ms: 'Hai! Saya boleh terangkan apa yang kami bina, projek lepas, harga, tempoh dan cara projek dijalankan. Apa yang anda ingin baiki atau bina?',
      zh: '您好！我可以介绍我们做什么、过往项目，以及报价、工期和合作流程。您想解决什么问题，或者想做什么系统？',
    },
    {
      id: 'thanks', next: ['services', 'projects'],
      keys: ['thanks', 'thank you', 'thank', 'thx', 'tq', 'appreciate', 'terima kasih', 'makasih', '谢谢', '感谢', '多谢'],
      en: "You're welcome! If you'd like to take it further, WhatsApp is the fastest way to reach the engineer: +60 19-502 3897.",
      ms: 'Sama-sama! Jika mahu teruskan, WhatsApp ialah cara terpantas untuk hubungi jurutera kami: +60 19-502 3897.',
      zh: '不客气！如果想进一步了解，WhatsApp 是联系工程师最快的方式：+60 19-502 3897。',
    },
    {
      id: 'bye', next: [],
      keys: ['bye', 'goodbye', 'see you', 'talk later', 'jumpa lagi', 'selamat tinggal', '再见', '拜拜'],
      en: "Thanks for stopping by! Whenever you're ready, WhatsApp +60 19-502 3897 — the first chat is free.",
      ms: 'Terima kasih kerana singgah! Bila-bila anda bersedia, WhatsApp +60 19-502 3897 — sembang pertama adalah percuma.',
      zh: '感谢来访！准备好了随时 WhatsApp +60 19-502 3897——首次沟通免费。',
    },
    {
      id: 'identity', next: ['services', 'contact'],
      keys: ['who are you', 'what are you', 'are you human', 'are you a human', 'are you real', 'are you a bot', 'are you a robot', 'are you ai', 'are you an ai', 'real person', 'your name', 'siapa awak', 'siapa anda', 'awak siapa', 'adakah anda manusia', 'manusia', '你是谁', '真人', '你是机器人', '你是ai', '你叫什么'],
      en: "I'm JonTech's website assistant. I answer from a prepared set of facts about our services and projects, so I'm quick but I don't know everything. For anything I can't answer, WhatsApp +60 19-502 3897 reaches the engineer directly — a real person.",
      ms: 'Saya pembantu laman web JonTech. Saya menjawab berdasarkan fakta yang disediakan tentang perkhidmatan dan projek kami, jadi saya pantas tetapi tidak tahu semuanya. Untuk soalan yang saya tidak dapat jawab, WhatsApp +60 19-502 3897 terus kepada jurutera kami — orang sebenar.',
      zh: '我是 JonTech 的网站助手，根据预先准备好的服务与项目资料来回答，所以回复很快，但并非无所不知。我答不上来的问题，可以 WhatsApp +60 19-502 3897 直接联系工程师——是真人。',
    },
    {
      // a one-word reply; only for very short messages, so "no" inside a real question doesn't land here
      id: 'ack', maxWords: 3, weight: 0.1, next: ['pricing', 'timeline', 'projects'],
      keys: ['ok', 'okay', 'yes', 'yeah', 'yep', 'sure', 'no', 'nope', 'alright', 'got it', 'i see', 'cool', 'nice', 'great', 'good', 'baik', 'ya', 'okey', 'faham', 'tidak', 'tak', '好的', '好', '嗯', '是的', '明白', '了解'],
      en: "Got it. Anything else you'd like to know — pricing, timelines or a past project?",
      ms: 'Baik. Ada apa-apa lagi yang anda ingin tahu — harga, tempoh atau projek lepas?',
      zh: '好的。还想了解什么吗——报价、工期，还是过往项目？',
    },

    // A product plus "how much" or "how long"
    {
      id: 'posPrice', base: 'pos', next: ['posTime', 'einvoice', 'consult'], keys: K.pos, also: K.price,
      q: ['How much does a POS cost?', 'Berapa kos sistem POS?', 'POS 系统多少钱？'],
      en: 'Custom POS pricing depends on scope — number of tills, inventory complexity, and integrations like e-invoicing or payment gateways. Most small-business POS projects get a fixed quote after a free scoping call, with no hidden monthly fees stacked on top.',
      ms: 'Harga POS tersuai bergantung pada skop — bilangan kaunter, kerumitan inventori, dan integrasi seperti e-invois atau gerbang pembayaran. Kebanyakan projek POS perniagaan kecil mendapat sebut harga tetap selepas panggilan skop percuma, tanpa yuran bulanan tersembunyi.',
      zh: '定制 POS 的价格取决于范围——收银台数量、库存复杂度，以及电子发票或支付网关等集成。大多数小型企业的 POS 项目都会在免费需求沟通后得到固定报价，没有隐藏的月费。',
    },
    {
      id: 'posTime', base: 'pos', next: ['posPrice', 'process', 'consult'], keys: K.pos, also: K.time,
      q: ['How long does a POS take?', 'Berapa lama untuk bina POS?', '做 POS 要多久？'],
      en: 'A single-till POS with core inventory and sales reporting typically takes 3–6 weeks from scoping to handover, depending on complexity.',
      ms: 'POS satu kaunter dengan inventori teras dan laporan jualan biasanya mengambil masa 3–6 minggu dari skop hingga penyerahan, bergantung pada kerumitan.',
      zh: '带核心库存和销售报表的单收银台 POS，从需求沟通到交付通常需要 3–6 周，视复杂度而定。',
    },
    {
      id: 'aiPrice', base: 'ai', next: ['aiCustom', 'aiWrong', 'consult'], keys: K.ai, also: K.price,
      q: ['Is AI expensive to set up?', 'Adakah AI mahal untuk disediakan?', 'AI 自动化贵吗？'],
      en: 'Cost depends on scope, but most SME automations, like WhatsApp inquiry triage or document data extraction, are far cheaper than hiring additional staff to do the same repetitive task manually. You get a clear quote after a free chat about scope.',
      ms: 'Kos bergantung pada skop, tetapi kebanyakan automasi PKS, seperti saringan pertanyaan WhatsApp atau pengekstrakan data dokumen, jauh lebih murah daripada mengupah staf tambahan untuk melakukan tugas berulang yang sama secara manual. Anda mendapat sebut harga yang jelas selepas sembang percuma tentang skop.',
      zh: '费用取决于范围，但大多数中小企业的自动化（例如 WhatsApp 咨询分类或文件数据提取）远比额外聘请员工手动处理同样的重复工作便宜。免费沟通需求后，您会得到清楚的报价。',
    },
    {
      id: 'mobilePrice', base: 'mobile', next: ['mobile', 'offline', 'consult'], keys: K.mobile, also: K.price,
      q: ['How much does a mobile app cost?', 'Berapa kos aplikasi mudah alih?', '手机应用多少钱？'],
      en: 'Cost depends on platform coverage, offline requirements, and backend complexity. Most SME field-ops or customer-facing apps get a fixed quote after a free scoping call.',
      ms: 'Kos bergantung pada liputan platform, keperluan luar talian dan kerumitan backend. Kebanyakan aplikasi operasi lapangan atau untuk pelanggan PKS mendapat sebut harga tetap selepas panggilan skop percuma.',
      zh: '费用取决于平台覆盖、离线需求和后端复杂度。大多数中小企业的外勤或面向客户应用，都会在免费需求沟通后得到固定报价。',
    },
    {
      id: 'webTime', base: 'web', next: ['pricing', 'hosting', 'consult'], keys: K.web, also: K.time,
      q: ['How long does a web app take?', 'Berapa lama untuk aplikasi web?', '网页应用要多久？'],
      en: 'A focused web app (a booking system or internal dashboard, for example) typically takes 4–8 weeks from scoping to launch, depending on scope and integrations.',
      ms: 'Aplikasi web yang fokus (contohnya sistem tempahan atau papan pemuka dalaman) biasanya mengambil masa 4–8 minggu dari skop hingga pelancaran, bergantung pada skop dan integrasi.',
      zh: '一个目标明确的网页应用（例如预约系统或内部看板），从需求沟通到上线通常需要 4–8 周，视范围和集成而定。',
    },
    {
      id: 'softwarePrice', base: 'software', next: ['timeline', 'saas', 'consult'], keys: K.software, also: K.price,
      q: ['How much does custom software cost?', 'Berapa kos perisian tersuai?', '定制软件多少钱？'],
      en: 'It depends entirely on scope — a booking system is a different project from a full back-office portal. We provide a fixed quote after a free scoping call, so there are no surprises mid-project.',
      ms: 'Ia bergantung sepenuhnya pada skop — sistem tempahan ialah projek yang berbeza daripada portal pejabat belakang yang lengkap. Kami memberi sebut harga tetap selepas panggilan skop percuma, jadi tiada kejutan di pertengahan projek.',
      zh: '完全取决于项目范围——预约系统和完整的后台管理门户是两回事。我们会在免费需求沟通后给出固定报价，项目中途不会有意外费用。',
    },

    // AI
    {
      id: 'vision', next: ['ai', 'aiCustom'],
      keys: ['face recognition', 'facial recognition', 'facial', 'computer vision', 'image recognition', 'object detection', 'cctv', 'pengecaman wajah', '人脸识别', '人脸', '图像识别', '视觉'],
      en: "Not yet — we haven't done face recognition or computer-vision projects. Our AI work is with text and documents: assistants, reading invoices and receipts, summaries, listings and reviews.",
      ms: 'Belum — kami belum pernah membuat projek pengecaman wajah atau penglihatan komputer. Kerja AI kami tertumpu pada teks dan dokumen: pembantu, membaca invois dan resit, ringkasan, penyenaraian dan semakan.',
      zh: '暂时没有——我们还没有做过人脸识别或计算机视觉项目。我们的 AI 工作集中在文字和文件：智能助手、读取发票和收据、摘要、商品上架和审查。',
    },
    {
      id: 'aiStaff', base: 'ai', next: ['aiWrong', 'aiCustom', 'automation'],
      keys: ['replace', 'replace my staff', 'replace staff', 'lose my job', 'lose jobs', 'take over jobs', 'redundant', 'ganti staf', 'gantikan', 'mengganti', '取代', '代替', '失业'],
      q: ['Will AI replace my staff?', 'Adakah AI akan ganti staf saya?', 'AI 会取代我的员工吗？'],
      en: 'No — the goal is to remove repetitive busywork so your existing team can focus on higher-value work, not to replace judgment-based roles.',
      ms: 'Tidak — matlamatnya adalah untuk membuang kerja remeh yang berulang supaya pasukan sedia ada anda boleh fokus pada kerja yang lebih bernilai, bukan untuk menggantikan peranan yang memerlukan pertimbangan.',
      zh: '不会——目标是去除重复的琐碎工作，让现有团队专注于更有价值的事，而不是取代需要判断力的岗位。',
    },
    {
      id: 'aiWrong', base: 'ai', next: ['aiCustom', 'aiPrice', 'aiStaff'],
      keys: ['wrong', 'mistake', 'error', 'hallucinate', 'hallucination', 'accurate', 'accuracy', 'reliable', 'trust', 'salah', 'silap', 'tersilap', 'tepat', 'boleh dipercayai', '出错', '错误', '准确', '可靠', '靠谱'],
      q: ['What if the AI gets it wrong?', 'Bagaimana jika AI tersilap?', 'AI 出错怎么办？'],
      en: 'We build in human review and fallback steps for anything customer-facing or high-stakes, so mistakes get caught before they matter.',
      ms: 'Kami membina semakan manusia dan langkah sandaran untuk apa-apa yang berdepan pelanggan atau berisiko tinggi, supaya kesilapan dikesan sebelum ia memberi kesan.',
      zh: '凡是面向客户或高风险的环节，我们都会加入人工审核和兜底步骤，在错误造成影响之前就把它拦下。',
    },
    {
      id: 'aiCustom', base: 'ai', next: ['aiPrice', 'aiWrong', 'consult'],
      keys: ['custom ai', 'ai for my business', 'my own ai', 'own ai', 'ai assistant', 'ai agent', 'whatsapp bot', 'whatsapp assistant', 'website assistant', 'answer my customers', 'answer customers', 'customer service', 'customer support', 'auto reply', 'auto-reply', 'faq bot', 'own data', 'my documents', 'own documents', 'knowledge base', 'train', 'ai tersuai', 'pembantu ai', 'bot whatsapp', 'jawab pelanggan', '回复客户', '客服', '定制ai', '专属ai', 'ai助手', '知识库', '训练'],
      q: ['Can you build an AI for my business?', 'Boleh bina AI untuk perniagaan saya?', '能为我的业务定制 AI 吗？'],
      en: "Yes — we build custom AI for one client at a time: assistants that know your own products, documents and FAQs, answer customers on your website or WhatsApp, and read invoices and forms into your system, with a human fallback for anything important. We're taking projects now, in any industry.",
      ms: 'Ya — kami membina AI tersuai untuk seorang pelanggan pada satu masa: pembantu yang mengenali produk, dokumen dan soalan lazim anda sendiri, menjawab pelanggan di laman web atau WhatsApp, serta membaca invois dan borang ke dalam sistem anda, dengan sandaran manusia untuk perkara penting. Kami sedang menerima projek, untuk semua industri.',
      zh: '可以——我们一次只为一位客户打造定制 AI：熟悉您自己的产品、文件和常见问题的助手，在网站或 WhatsApp 上回答客户，并把发票和表单读进您的系统，重要环节保留人工兜底。目前正在接新项目，不限行业。',
    },
    {
      id: 'docs', base: 'ai', next: ['aiPrice', 'aiWrong', 'automation'],
      keys: ['read invoices', 'read receipts', 'read', 'receipt', 'ocr', 'document', 'extract', 'extraction', 'scan', 'retype', 'retyping', 'resit', 'dokumen', 'imbas', '收据', '文件', '识别', '录入', '扫描'],
      q: ['Can AI read my invoices?', 'Boleh AI baca invois saya?', 'AI 能读取我的发票吗？'],
      en: 'Yes — AI can read invoices, receipts and forms straight into your system, so nobody retypes them. For anything high-stakes we add a human review step so mistakes are caught before they matter.',
      ms: 'Ya — AI boleh membaca invois, resit dan borang terus ke dalam sistem anda, jadi tiada siapa perlu menaip semula. Untuk perkara berisiko tinggi, kami tambah langkah semakan manusia supaya kesilapan dikesan sebelum memberi kesan.',
      zh: '可以——AI 能把发票、收据和表单直接读进您的系统，无需人工重新录入。高风险的环节我们会加入人工审核，在错误造成影响之前就把它拦下。',
    },
    {
      // weighted up: "AI" is the subject of a question even when a shop or a system is mentioned too
      id: 'ai', weight: 2.5, next: ['aiCustom', 'aiPrice', 'aiWrong'], keys: K.ai,
      q: ['How can AI help my business?', 'Bagaimana AI boleh bantu perniagaan saya?', 'AI 能怎样帮助我的业务？'],
      en: 'We use AI where it genuinely saves work: custom AI built for your business, such as website & WhatsApp assistants (like this one) that know your own products and documents, reading invoices and receipts into your system, plain-language summaries of sales or stock, AI-assisted testing, AI-written marketplace listings, and AI UI/UX reviews. Anything customer-facing keeps a human fallback.',
      ms: 'Kami guna AI di tempat yang benar-benar menjimatkan kerja: AI tersuai untuk perniagaan anda, seperti pembantu web & WhatsApp (seperti ini) yang mengenali produk dan dokumen anda sendiri, membaca invois dan resit ke dalam sistem, ringkasan jualan atau stok yang mudah difahami, ujian dibantu AI, penyenaraian marketplace yang ditulis AI dan semakan UI/UX AI. Semua yang berdepan pelanggan ada sandaran manusia.',
      zh: '我们只在真正省力的地方用 AI：为您的业务量身定制的 AI，例如熟悉您自己产品和文件的网站与 WhatsApp 助手（就像这个）、把发票和收据读进系统、通俗易懂的销售或库存摘要、AI 辅助测试、AI 撰写电商商品上架，以及 AI UI/UX 审查。面向客户的环节都保留人工兜底。',
    },

    // Products and past work
    {
      id: 'einvoice', next: ['pos', 'posPrice', 'invoicing'],
      keys: ['e-invoice', 'einvoice', 'e-invoicing', 'lhdn', 'myinvois', 'e-invois', 'einvois', '电子发票'],
      q: ['Can it handle LHDN e-invoice?', 'Boleh uruskan e-invois LHDN?', '支持 LHDN 电子发票吗？'],
      en: 'Yes — LHDN e-invoice compliance can be built directly into the system as part of the project scope.',
      ms: 'Ya — pematuhan e-invois LHDN boleh dibina terus ke dalam sistem sebagai sebahagian daripada skop projek.',
      zh: '可以——LHDN 电子发票合规可以作为项目范围的一部分直接内置到系统中。',
    },
    {
      id: 'offline', next: ['pos', 'mobile'],
      keys: ['offline', 'no internet', 'without internet', 'internet down', 'internet access', 'internet outage', 'no wifi', 'luar talian', 'tanpa internet', 'tiada internet', '离线', '断网', '没有网络', '没网'],
      q: ['Does it work without internet?', 'Boleh berfungsi tanpa internet?', '断网能用吗？'],
      en: 'No internet needed to keep working. We build offline-first: a POS till keeps selling during an outage and syncs sales and inventory once the connection is back, and field apps do the same.',
      ms: 'Tidak perlu internet untuk terus bekerja. Kami membina secara luar talian dahulu: kaunter POS terus menjual semasa gangguan dan menyegerakkan jualan serta inventori apabila sambungan kembali, begitu juga aplikasi lapangan.',
      zh: '断网也能继续工作。我们采用离线优先设计：POS 在断网时照常收银，网络恢复后自动同步销售和库存；外勤应用也是如此。',
    },
    {
      id: 'marketplace', next: ['pos', 'integration', 'ai'],
      keys: ['shopee', 'lazada', 'tiktok', 'tiktok shop', 'marketplace', 'e-commerce', 'ecommerce', 'online store', 'online shop', 'listing', 'kedai dalam talian', '电商', '网店', '上架'],
      q: ['Can you sync with Shopee and Lazada?', 'Boleh selaraskan dengan Shopee dan Lazada?', '能同步 Shopee 和 Lazada 吗？'],
      en: 'Yes. Our phone-shop POS has a selling app that keeps stock, products and orders in sync with Shopee, Lazada and TikTok Shop, so nothing is updated twice. We also use AI to draft product titles, descriptions and tags for those listings from your stock data — you approve before they go live.',
      ms: 'Ya. POS kedai telefon kami mempunyai aplikasi jualan yang menyelaraskan stok, produk dan pesanan dengan Shopee, Lazada dan TikTok Shop, jadi tiada yang perlu dikemas kini dua kali. Kami juga menggunakan AI untuk mendraf tajuk, penerangan dan tag produk bagi penyenaraian tersebut daripada data stok anda — anda luluskan sebelum ia diterbitkan.',
      zh: '可以。我们的手机店 POS 配有销售应用，把库存、商品和订单与 Shopee、Lazada、TikTok Shop 保持同步，不用重复更新。我们还用 AI 根据库存数据起草这些平台的商品标题、描述和标签——由您确认后才上架。',
    },
    {
      id: 'kiosk', next: ['pos', 'payments', 'projects'],
      keys: ['kiosk', 'self-service', 'self-order', 'self ordering', 'touchscreen', 'touch screen', 'layan diri', 'skrin sentuh', '终端', '自助', '触屏', '触摸屏'],
      q: ['What kind of kiosks have you built?', 'Kiosk jenis apa yang pernah dibina?', '你们做过什么样的自助终端？'],
      en: 'We built a self-service kiosk system for a scalp spa: customers choose a treatment on a touchscreen, pay by card terminal and get a printed receipt, while staff manage everything from an admin portal with reports and remote updates.',
      ms: 'Kami membina sistem kiosk layan diri untuk spa kulit kepala: pelanggan pilih rawatan di skrin sentuh, bayar melalui terminal kad dan dapat resit bercetak, manakala staf mengurus semuanya melalui portal admin dengan laporan dan kemas kini jarak jauh.',
      zh: '我们为一家头皮护理店打造了自助终端系统：顾客在触屏上选择疗程、刷卡付款并打印收据，员工则通过后台管理系统查看报表并远程更新。',
    },
    {
      id: 'terms', next: ['pricing', 'consult', 'contact'],
      keys: ['discount', 'promo', 'promotion', 'installment', 'instalment', 'deposit', 'payment terms', 'payment plan', 'refund', 'guarantee', 'contract', 'agreement', 'nda', 'diskaun', 'promosi', 'ansuran', 'kontrak', 'perjanjian', 'bayaran balik', 'jaminan', '折扣', '优惠', '分期', '定金', '订金', '退款', '合同', '保密协议'],
      en: "I don't have details on payment terms, deposits, discounts or contracts — those are agreed directly, along with your quote. The engineer can answer on WhatsApp: +60 19-502 3897.",
      ms: 'Saya tiada butiran tentang terma bayaran, deposit, diskaun atau kontrak — semua itu dipersetujui secara terus bersama sebut harga anda. Jurutera kami boleh menjawab di WhatsApp: +60 19-502 3897.',
      zh: '付款条件、定金、折扣或合同方面我没有具体资料——这些会在报价时直接与您商定。可以 WhatsApp 咨询工程师：+60 19-502 3897。',
    },
    {
      id: 'payments', next: ['pos', 'einvoice', 'invoicing'],
      keys: ['payment', 'payment gateway', 'payment method', 'duitnow', 'card terminal', 'credit card', 'debit card', 'fpx', 'ewallet', 'e-wallet', 'qr', 'pembayaran', 'gerbang pembayaran', '付款', '支付', '刷卡', '收款'],
      q: ['Which payment methods?', 'Kaedah pembayaran apa?', '支持哪些付款方式？'],
      en: "Systems we've built take card payments through a card terminal (the kiosk) and record bank transfers, DuitNow QR and cash (the invoicing system). Payment-gateway integration can be part of a POS or web project's scope.",
      ms: 'Sistem yang kami bina menerima bayaran kad melalui terminal kad (kiosk) dan merekod pindahan bank, DuitNow QR serta tunai (sistem invois). Integrasi gerbang pembayaran boleh dimasukkan dalam skop projek POS atau web.',
      zh: '我们做过的系统支持通过刷卡终端收款（自助终端），以及记录银行转账、DuitNow QR 和现金（发票系统）。支付网关的集成可以纳入 POS 或网站项目的范围。',
    },
    {
      id: 'hardware', next: ['pos', 'kiosk'],
      keys: ['hardware', 'printer', 'receipt printer', 'barcode', 'barcode scanner', 'scanner', 'equipment', 'perkakasan', 'pencetak', 'kod bar', 'pengimbas', '硬件', '打印机', '条码', '扫描器', '设备'],
      q: ['Which hardware does it work with?', 'Perkakasan apa yang disokong?', '支持哪些硬件？'],
      en: "Our POS and kiosk systems work with barcode scanners, receipt printers, touchscreens and card terminals. Tell us what equipment you already have and we'll check it fits.",
      ms: 'Sistem POS dan kiosk kami berfungsi dengan pengimbas kod bar, pencetak resit, skrin sentuh dan terminal kad. Beritahu kami peralatan yang anda sudah ada dan kami akan semak kesesuaiannya.',
      zh: '我们的 POS 和自助终端系统支持条码扫描器、小票打印机、触摸屏和刷卡终端。告诉我们您现有的设备，我们会确认是否适用。',
    },
    {
      id: 'booking', base: 'software', next: ['softwarePrice', 'kiosk', 'saas'],
      keys: ['booking', 'booking system', 'reservation', 'appointment system', 'schedule', 'scheduling', 'tempahan', 'sistem tempahan', '预约系统', '预订', '订位', '排班'],
      q: ['Can you build a booking system?', 'Boleh bina sistem tempahan?', '能做预约系统吗？'],
      en: 'Yes — booking systems are one of the things we build, tailored to how you take and manage appointments rather than a generic template. A focused one typically takes 4–8 weeks from scoping to launch.',
      ms: 'Ya — sistem tempahan ialah antara yang kami bina, disesuaikan dengan cara anda menerima dan mengurus temu janji, bukan templat generik. Sistem yang fokus biasanya mengambil masa 4–8 minggu dari skop hingga pelancaran.',
      zh: '可以——预约系统是我们常做的项目之一，会按您接受和管理预约的方式定制，而不是套用通用模板。目标明确的预约系统从需求沟通到上线通常需要 4–8 周。',
    },
    {
      id: 'property', next: ['projects', 'softwarePrice'],
      keys: ['property', 'real estate', 'commission', 'agent', 'agency', 'condo', 'resident', 'community', 'hartanah', 'komisen', 'ejen', 'penduduk', 'komuniti', '房地产', '佣金', '中介', '住户', '公寓', '社区'],
      q: ['Tell me about the property projects', 'Ceritakan tentang projek hartanah', '介绍一下房地产项目'],
      en: "Two property projects: a multi-branch agency commission system (tiers, co-agency splits, SST and withholding tax, referrals across sub-sale, rental and new projects), and a verified-residents community platform with forum, polls, defect reports and a fee tracker — there's a live demo on the Projects section.",
      ms: 'Dua projek hartanah: sistem komisen agensi berbilang cawangan (tahap, pembahagian ko-agensi, SST dan cukai pegangan, rujukan untuk subjual, sewaan dan projek baharu), dan platform komuniti penduduk disahkan dengan forum, undian, laporan kecacatan dan penjejak yuran — ada demo langsung di bahagian Projek.',
      zh: '两个房地产项目：多分行中介佣金系统（等级、联合代理分成、SST 与预扣税、推荐奖励，涵盖二手、租赁与新盘），以及认证住户社区平台，含论坛、投票、缺陷报告与管理费追踪——项目区有在线演示。',
    },
    {
      id: 'education', next: ['projects', 'web'],
      keys: ['school', 'education', 'learning', 'lms', 'student', 'teacher', 'tuition', 'course', 'sekolah', 'pendidikan', 'pelajar', 'pembelajaran', 'guru', '教育', '学习', '学生', '学校', '老师', '补习'],
      q: ['Tell me about the learning platform', 'Ceritakan tentang platform pembelajaran', '介绍一下学习平台'],
      en: 'We built a memory-method learning platform for primary-school students (ages 7–12) in Singapore — flash cards, quizzes and spaced repetition, with tools for teachers and admins.',
      ms: 'Kami membina platform pembelajaran kaedah ingatan untuk murid sekolah rendah (umur 7–12) di Singapura — kad imbas, kuiz dan ulang kaji berjarak, dengan alatan untuk guru dan admin.',
      zh: '我们为新加坡的小学生（7–12 岁）打造了记忆法学习平台——闪卡、测验与间隔复习，并为老师和管理员提供管理工具。',
    },
    {
      id: 'trading', next: ['projects', 'qa'],
      keys: ['trading', 'trade', 'broker', 'backtest', 'backtesting', 'stock market', 'fintech', 'dagangan', '交易', '回测', '股票'],
      en: "That's an in-house tool: a desktop trading research desk over a broker API — paper trading by default with a deliberate gate before going live, a risk-profile engine, stop management, a backtesting engine and 115 automated tests. Built with Python and Flask.",
      ms: 'Itu alatan dalaman kami: meja penyelidikan dagangan desktop yang menggunakan API broker — dagangan kertas secara lalai dengan sekatan sengaja sebelum dagangan sebenar, enjin profil risiko, pengurusan henti rugi, enjin ujian balik dan 115 ujian automatik. Dibina dengan Python dan Flask.',
      zh: '这是我们的内部工具：基于券商 API 的桌面交易研究工作台——默认模拟交易，实盘前设有专门的确认关卡，并包含风险画像引擎、止损管理、回测引擎和 115 个自动化测试。使用 Python 和 Flask 开发。',
    },
    {
      id: 'invoicing', next: ['einvoice', 'payments', 'softwarePrice'],
      keys: ['invoice', 'invoicing', 'billing', 'invois', 'bil', '发票', '账单', '开单'],
      q: ['Tell me about the invoicing system', 'Ceritakan tentang sistem invois', '介绍一下发票系统'],
      en: 'We built an invoicing and payments system: client management, invoices with line items, PDF export, and payment recording by bank transfer, DuitNow QR or cash — invoices mark themselves paid automatically. LHDN e-invoice compliance can be built into a system too.',
      ms: 'Kami membina sistem invois dan pembayaran: pengurusan pelanggan, invois dengan butiran item, eksport PDF, dan rekod bayaran melalui pindahan bank, DuitNow QR atau tunai — invois ditanda sebagai dibayar secara automatik. Pematuhan e-invois LHDN juga boleh dibina ke dalam sistem.',
      zh: '我们做过一套发票与收款系统：客户管理、带明细的发票、PDF 导出，以及银行转账、DuitNow QR 或现金的收款记录——发票会自动标记为已付。LHDN 电子发票合规也可以内置到系统中。',
    },
    {
      id: 'pos', next: ['posPrice', 'posTime', 'einvoice'], keys: K.pos,
      q: ['Tell me about your POS systems', 'Ceritakan tentang sistem POS', '介绍一下 POS 系统'],
      en: "Yes — we build custom POS systems around how your shop actually runs: sales, inventory, purchasing, staff workflows and reporting, working offline when the internet drops. Our phone-shop POS also tracks repairs and accounting and keeps stock and orders in sync with Shopee, Lazada and TikTok Shop — it's in daily use.",
      ms: 'Ya — kami membina sistem POS tersuai mengikut cara kedai anda beroperasi: jualan, inventori, pembelian, aliran kerja staf dan laporan, serta terus berfungsi apabila internet terputus. POS kedai telefon kami juga menjejak pembaikan dan perakaunan serta menyelaraskan stok dan pesanan dengan Shopee, Lazada dan TikTok Shop — ia digunakan setiap hari.',
      zh: '可以——我们按照您门店的实际运作方式打造定制 POS：销售、库存、采购、员工流程和报表，断网时照常运作。我们为手机店做的 POS 还包含维修追踪和会计，并与 Shopee、Lazada、TikTok Shop 同步库存和订单，目前每天都在使用。',
    },
    {
      id: 'itSupport', next: ['services', 'automation'],
      keys: ['laptop', 'computer repair', 'pc repair', 'fix my computer', 'fix laptop', 'repair', 'network', 'networking', 'wifi', 'router', 'antivirus', 'virus', 'helpdesk', 'it support', 'komputer rosak', 'baiki komputer', 'rangkaian', '电脑维修', '修电脑', '网络', '路由器', '杀毒'],
      en: "Our IT services are software, apps, automation and AI — hardware repair, networking and device setup aren't among them. If there's a manual process slowing your business down, though, that's exactly what we fix.",
      ms: 'Perkhidmatan IT kami ialah perisian, aplikasi, automasi dan AI — pembaikan perkakasan, rangkaian dan pemasangan peranti tidak termasuk. Namun jika ada proses manual yang melambatkan perniagaan anda, itulah yang kami selesaikan.',
      zh: '我们的 IT 服务是软件、应用、自动化和 AI——不包括硬件维修、网络搭建和设备安装。不过，如果有拖慢您业务的手工流程，这正是我们擅长解决的。',
    },
    {
      id: 'mobile', next: ['mobilePrice', 'offline', 'timeline'], keys: K.mobile,
      q: ['Do you build mobile apps?', 'Anda bina aplikasi mudah alih?', '你们做手机应用吗？'],
      en: 'Yes — with React Native we build one codebase that ships to both iOS and Android, which keeps cost and maintenance lower than two separate native apps. We also handle App Store and Play Store submission, and field apps are designed to work offline.',
      ms: 'Ya — dengan React Native, kami membina satu pangkalan kod untuk iOS dan Android, menjadikan kos dan penyelenggaraan lebih rendah berbanding dua aplikasi natif berasingan. Kami juga menguruskan penghantaran ke App Store dan Play Store, dan aplikasi lapangan direka untuk berfungsi di luar talian.',
      zh: '可以——我们用 React Native 开发一套代码，同时发布到 iOS 和 Android，比分别开发两个原生应用的成本和维护工作量更低。我们也负责 App Store 和 Play Store 的上架，外勤类应用支持离线使用。',
    },
    {
      id: 'uxcheck', next: ['web', 'contact'],
      keys: ['ux check', 'ux', 'ui ux', 'ui/ux', 'free check', 'website review', 'website audit', 'audit', 'check my website', 'check my site', 'review my website', 'review my site', 'semakan ux', 'semakan percuma', 'semak laman', '检测', '网站检测', '审查', '体检'],
      q: ['What is the free UX check?', 'Apa itu semakan UX percuma?', '免费 UX 检测是什么？'],
      en: "There's a free AI UI/UX check on the homepage: enter your website address and get a review of clarity, navigation, mobile, accessibility, conversion and SEO basics — no sign-up. https://jontech-solutions.com/#ux-check",
      ms: 'Ada semakan UI/UX AI percuma di halaman utama: masukkan alamat laman web anda dan dapatkan semakan tentang kejelasan, navigasi, paparan mudah alih, kebolehcapaian, penukaran dan asas SEO — tanpa pendaftaran. https://jontech-solutions.com/ms/#ux-check',
      zh: '首页有免费的 AI UI/UX 检测：输入您的网址，即可获得关于清晰度、导航、移动端、无障碍、转化率和 SEO 基础的审查——无需注册。https://jontech-solutions.com/zh/#ux-check',
    },
    {
      id: 'seo', next: ['uxcheck', 'web'],
      keys: ['seo', 'google', 'search engine', 'ranking', 'rank', 'enjin carian', '搜索引擎', '排名', '谷歌'],
      en: "SEO on its own isn't one of our services. The free AI UI/UX check on the homepage does review your site's SEO basics, and it's a good place to start: https://jontech-solutions.com/#ux-check",
      ms: 'SEO semata-mata bukan salah satu perkhidmatan kami. Namun semakan UI/UX AI percuma di halaman utama turut menyemak asas SEO laman anda, dan ia permulaan yang baik: https://jontech-solutions.com/ms/#ux-check',
      zh: '单独的 SEO 并不是我们的服务项目。不过首页的免费 AI UI/UX 检测会审查您网站的 SEO 基础，可以先从这里开始：https://jontech-solutions.com/zh/#ux-check',
    },
    {
      id: 'web', next: ['webTime', 'hosting', 'uxcheck'], keys: K.web,
      q: ['Do you build websites and web apps?', 'Anda bina laman dan aplikasi web?', '你们做网站和网页应用吗？'],
      en: "We build fast, modern web apps end to end — clean interfaces and reliable backends (React, Node.js, MySQL) — such as booking systems, back-office portals and dashboards. Recent ones include a residents' community platform, a learning platform and a commission system.",
      ms: 'Kami membina aplikasi web moden yang pantas dari hujung ke hujung — antara muka yang kemas dan backend yang boleh dipercayai (React, Node.js, MySQL) — seperti sistem tempahan, portal pejabat belakang dan papan pemuka. Antara yang terkini: platform komuniti penduduk, platform pembelajaran dan sistem komisen.',
      zh: '我们从前端到后端打造快速、现代的网页应用——简洁的界面、可靠的后端（React、Node.js、MySQL）——例如预约系统、后台管理门户和数据看板。近期作品包括住户社区平台、学习平台和佣金系统。',
    },

    // Automation, integration, reporting, testing
    {
      id: 'integration', next: ['marketplace', 'automation', 'pricing'],
      keys: ['integration', 'integrate', 'api', 'connect', 'sync', 'link my', 'talk to each other', 'integrasi', 'sambung', 'sambungkan', 'selaraskan', '集成', '对接', '同步', '接口', '打通'],
      q: ['Can you connect my systems?', 'Boleh sambungkan sistem saya?', '能打通我的系统吗？'],
      en: "Yes — we connect systems so data flows automatically instead of being copied by hand, using REST and marketplace APIs. One example in daily use keeps a shop's stock, products and orders in sync with Shopee, Lazada and TikTok Shop.",
      ms: 'Ya — kami menyambungkan sistem supaya data mengalir secara automatik tanpa perlu disalin secara manual, menggunakan API REST dan API marketplace. Satu contoh yang digunakan setiap hari menyelaraskan stok, produk dan pesanan kedai dengan Shopee, Lazada dan TikTok Shop.',
      zh: '可以——我们通过 REST 和电商平台 API 把系统打通，让数据自动流转，不用手动复制。一个每天都在使用的例子：把店铺的库存、商品和订单与 Shopee、Lazada、TikTok Shop 保持同步。',
    },
    {
      id: 'reporting', next: ['ai', 'automation', 'pricing'],
      keys: ['report', 'reporting', 'dashboard', 'analytics', 'kpi', 'summary', 'summaries', 'laporan', 'papan pemuka', 'ringkasan', '报表', '报告', '看板', '数据分析', '摘要'],
      q: ['Can I get automatic reports?', 'Boleh dapat laporan automatik?', '能自动生成报表吗？'],
      en: 'Yes — live dashboards and auto-generated summaries, so your team always has the numbers without asking. With AI we can add plain-language weekly summaries of sales, stock or commissions: what changed and why.',
      ms: 'Ya — papan pemuka langsung dan ringkasan yang dijana automatik, supaya pasukan anda sentiasa ada angka tanpa perlu meminta. Dengan AI, kami boleh menambah ringkasan mingguan jualan, stok atau komisen dalam bahasa mudah: apa yang berubah dan mengapa.',
      zh: '可以——实时看板和自动生成的摘要，让团队随时掌握数据，不用再去问人。借助 AI，还可以每周生成通俗易懂的销售、库存或佣金摘要：哪里变了、为什么变。',
    },
    {
      id: 'qa', next: ['stack', 'projects'],
      keys: ['test', 'testing', 'qa', 'quality assurance', 'playwright', 'selenium', 'appium', 'bug', 'load test', 'load testing', 'stress test', 'performance', 'ujian', 'pepijat', '测试', '压力测试', '质量'],
      q: ['Do you do testing and QA?', 'Anda buat ujian dan QA?', '你们做测试吗？'],
      en: 'QA is our background. We built a Playwright end-to-end suite for a real-time gaming platform (lobby, in-game UI, WebSocket machine sync) that replaced a manual QA cycle, and we set up CI/CD pipelines and load testing too. Every system we ship is tested before handover.',
      ms: 'QA ialah latar belakang kami. Kami membina suite hujung-ke-hujung Playwright untuk platform permainan masa nyata (lobi, UI dalam permainan, penyelarasan mesin WebSocket) yang menggantikan kitaran QA manual, dan kami juga menyediakan saluran CI/CD serta ujian beban. Setiap sistem diuji sebelum diserahkan.',
      zh: 'QA 是我们的老本行。我们为一个实时游戏平台打造了 Playwright 端到端测试套件（大厅、游戏内界面、WebSocket 机台同步），取代了原本的人工测试流程；我们也搭建 CI/CD 流水线和压力测试。每个交付的系统都会在交付前严格测试。',
    },
    {
      id: 'automation', next: ['integration', 'ai', 'pricing'],
      keys: ['automation', 'automate', 'automated', 'automatic', 'repetitive', 'manual', 'manually', 'data entry', 'copy paste', 'copy-paste', 'rpa', 'workflow', 'save time', 'by hand', 'key in', 'excel', 'spreadsheet', 'google sheets', 'paperwork', 'manual work', 'tedious', 'time consuming', 'automasi', 'automasikan', 'berulang', 'kerja manual', 'taip semula', '自动化', '重复', '手动', '手工', '省时间', '表格', '繁琐'],
      q: ['What can be automated?', 'Apa yang boleh diautomasikan?', '哪些工作可以自动化？'],
      en: "That's our core work. Repetitive clicks, form fills, data entry and copy-pasting between apps can be automated end to end, or the systems connected so the data flows on its own. We map your workflow first and automate the part that actually wastes time.",
      ms: 'Itulah kerja teras kami. Klik berulang, pengisian borang, kemasukan data dan salin-tampal antara aplikasi boleh diautomasikan sepenuhnya, atau sistem disambungkan supaya data mengalir sendiri. Kami petakan aliran kerja anda dahulu dan automasikan bahagian yang benar-benar membuang masa.',
      zh: '这正是我们的核心工作。重复点击、填表、数据录入以及在应用之间复制粘贴，都可以整个流程自动化，或者把系统打通，让数据自动流转。我们会先梳理您的流程，再把真正浪费时间的部分自动化。',
    },

    // Working with us
    {
      id: 'why', next: ['about', 'process', 'projects'],
      keys: ['why', 'why choose', 'why you', 'why jontech', 'different', 'difference', 'better than', 'advantage', 'compare', 'unique', 'kenapa', 'mengapa', 'kelebihan', 'beza', '为什么', '优势', '区别', '特别'],
      q: ['Why choose JonTech?', 'Kenapa pilih JonTech?', '为什么选择 JonTech？'],
      en: 'Four things. Process first: we map your workflow before writing a line of code, because bad automation just speeds up bad processes. Built to last: robust, maintainable systems, not one-off scripts. Results, not reports: working systems, clear documentation and a trained team. And you deal directly with the engineer — no account managers or middlemen.',
      ms: 'Empat perkara. Proses dahulu: kami petakan aliran kerja anda sebelum menulis sebaris kod, kerana automasi yang lemah hanya mempercepatkan proses yang lemah. Dibina untuk tahan lama: sistem yang kukuh dan mudah diselenggara, bukan skrip sekali guna. Hasil, bukan laporan: sistem yang berfungsi, dokumentasi yang jelas dan pasukan yang dilatih. Dan anda berurusan terus dengan jurutera — tiada pengurus akaun atau orang tengah.',
      zh: '四点。流程优先：动手写代码之前先梳理您的流程，因为糟糕的自动化只会让糟糕的流程跑得更快。经久耐用：稳健、易维护的系统，而不是一次性的脚本。重结果而非报告：可用的系统、清晰的文档和培训好的团队。而且您直接与工程师沟通——没有客户经理，也没有中间人。',
    },
    {
      id: 'security', next: ['ownership', 'hosting', 'contact'],
      keys: ['security', 'secure', 'safe', 'data safe', 'privacy', 'pdpa', 'confidential', 'backup', 'hack', 'hacked', 'keselamatan', 'selamat', 'privasi', 'sulit', 'sandaran', '安全', '隐私', '保密', '备份'],
      en: "With a custom system your data stays in your own system rather than inside someone else's platform, and you own the code. Client details are kept confidential — we never name clients. For specifics such as hosting, backups or access control, ask the engineer on WhatsApp: +60 19-502 3897.",
      ms: 'Dengan sistem tersuai, data anda kekal dalam sistem anda sendiri, bukan dalam platform orang lain, dan kod itu milik anda. Butiran pelanggan dirahsiakan — kami tidak pernah mendedahkan nama pelanggan. Untuk perincian seperti pengehosan, sandaran atau kawalan akses, tanya jurutera kami di WhatsApp: +60 19-502 3897.',
      zh: '使用定制系统，您的数据保存在您自己的系统里，而不是别人的平台上，源代码也归您所有。客户资料严格保密——我们从不透露客户名称。至于托管、备份或权限控制等细节，请 WhatsApp 咨询工程师：+60 19-502 3897。',
    },
    {
      id: 'ownership', next: ['saas', 'support'],
      keys: ['own', 'ownership', 'source code', 'who owns', 'vendor lock', 'lock-in', 'license', 'licence', 'subscription', 'monthly fee', 'kod sumber', 'milik', 'pemilikan', 'langganan', 'lesen', 'yuran bulanan', '源代码', '所有权', '月费', '订阅', '授权'],
      q: ['Do I own the code?', 'Adakah kod itu milik saya?', '源代码归我吗？'],
      en: "Yes — you get full source code ownership with no vendor lock-in, and no recurring per-till licence fees. That's unlike SaaS subscriptions, where your data and workflow live inside someone else's platform.",
      ms: 'Ya — anda mendapat pemilikan penuh kod sumber tanpa terikat dengan vendor, dan tiada yuran lesen berulang bagi setiap kaunter. Ini berbeza daripada langganan SaaS, di mana data dan aliran kerja anda berada dalam platform orang lain.',
      zh: '是的——您拥有完整的源代码所有权，不受供应商绑定，也没有按收银台收取的持续授权费。这和 SaaS 订阅不同：订阅时您的数据和流程都放在别人的平台上。',
    },
    {
      id: 'saas', next: ['ownership', 'softwarePrice'],
      keys: ['saas', 'off the shelf', 'off-the-shelf', 'ready made', 'ready-made', 'existing software', 'template', 'custom or', 'siap pakai', 'sedia ada di pasaran', '现成', '套装软件', '模板'],
      q: ['Custom or off-the-shelf?', 'Tersuai atau siap pakai?', '定制还是现成软件？'],
      en: "SaaS is cheaper and faster to start with if your process is fairly standard. Custom software wins once you're paying for features you never use, hitting plan limits, or your process is specific enough that no off-the-shelf tool fits cleanly — at that point ongoing SaaS fees often exceed a one-time custom build within 1–2 years.",
      ms: 'SaaS lebih murah dan cepat untuk bermula jika proses anda agak standard. Perisian tersuai lebih baik apabila anda membayar untuk ciri yang tidak digunakan, terkena had pelan, atau proses anda cukup khusus sehingga tiada alatan siap pakai yang benar-benar sesuai — ketika itu, yuran SaaS berterusan selalunya melebihi kos pembinaan tersuai sekali sahaja dalam masa 1–2 tahun.',
      zh: '如果您的流程比较标准，SaaS 起步更便宜、更快。但当您在为用不到的功能付费、碰到套餐限制，或流程特殊到没有现成工具能完全适合时，定制软件更胜一筹——这时持续的 SaaS 费用往往在 1–2 年内就超过一次性定制开发的成本。',
    },
    {
      id: 'support', next: ['ownership', 'pricing'],
      keys: ['support', 'maintenance', 'maintain', 'after launch', 'after delivery', 'after handover', 'warranty', 'bug fix', 'update', 'training', 'manual', 'documentation', 'sokongan', 'penyelenggaraan', 'selenggara', 'latihan', 'selepas siap', '维护', '售后', '支持', '培训', '保修', '更新'],
      q: ['Is there support after launch?', 'Ada sokongan selepas pelancaran?', '上线后有维护吗？'],
      en: 'Yes. Handover includes documentation, user manuals and training for your team, and we offer ongoing maintenance and feature updates afterwards, billed separately from the initial build.',
      ms: 'Ya. Penyerahan merangkumi dokumentasi, manual pengguna dan latihan untuk pasukan anda, dan kami menawarkan penyelenggaraan berterusan serta kemas kini ciri selepas itu, dicaj berasingan daripada pembinaan awal.',
      zh: '提供。交付时包含文档、用户手册和团队培训；之后我们提供持续维护和功能更新，费用与初始开发分开计算。',
    },
    {
      id: 'takeover', next: ['stack', 'contact'],
      keys: ['existing system', 'existing code', 'existing codebase', 'take over', 'takeover', 'legacy', 'current system', 'old system', 'rescue', 'previous developer', 'sistem sedia ada', 'ambil alih', 'sistem lama', '现有系统', '接手', '旧系统', '二次开发'],
      q: ['Can you take over an existing system?', 'Boleh ambil alih sistem sedia ada?', '能接手现有系统吗？'],
      en: "Yes — we regularly review and extend existing systems, not just build from scratch. Tell us what the system does and where it's falling short.",
      ms: 'Ya, kami kerap menyemak dan memperluas sistem sedia ada, bukan sekadar membina dari awal. Beritahu kami apa yang sistem itu lakukan dan di mana kekurangannya.',
      zh: '可以，我们经常审查并扩展现有系统，不只是从零开始开发。告诉我们这个系统的用途和目前的不足之处即可。',
    },
    {
      id: 'hosting', next: ['support', 'web'],
      keys: ['hosting', 'host', 'deploy', 'deployment', 'server', 'domain', 'cloud', 'aws', 'cloudflare', 'ci/cd', 'cicd', 'pipeline', 'pengehosan', 'pelayan', '托管', '部署', '服务器', '域名', '上线'],
      q: ['Do you handle hosting?', 'Anda uruskan pengehosan?', '你们负责部署吗？'],
      en: 'Yes — we set up CI/CD and deployment (Cloudflare Pages, AWS, etc.) as part of the build, and can hand over admin access or manage it on an ongoing basis.',
      ms: 'Ya — kami menyediakan CI/CD dan pelaksanaan (Cloudflare Pages, AWS, dan lain-lain) sebagai sebahagian daripada pembinaan, dan boleh menyerahkan akses admin atau menguruskannya secara berterusan.',
      zh: '是的——我们会在开发过程中搭建 CI/CD 和部署（Cloudflare Pages、AWS 等），可以把管理员权限交给您，也可以长期代为管理。',
    },
    {
      id: 'stack', next: ['takeover', 'web', 'mobile'],
      keys: ['tech stack', 'stack', 'technology', 'technologies', 'framework', 'programming language', 'react', 'node', 'node.js', 'nodejs', 'laravel', 'php', 'mysql', 'python', 'typescript', 'javascript', 'electron', 'teknologi', 'rangka kerja', '技术', '技术栈', '框架', '编程语言'],
      q: ['What technology do you use?', 'Teknologi apa yang digunakan?', '你们用什么技术？'],
      en: 'Mostly React, Node.js and MySQL for web systems; React Native and Electron for mobile, desktop and kiosk apps; Playwright for test automation; Python where it fits. We choose based on your existing systems and team, not dogma.',
      ms: 'Kebanyakannya React, Node.js dan MySQL untuk sistem web; React Native dan Electron untuk aplikasi mudah alih, desktop dan kiosk; Playwright untuk automasi ujian; Python di mana sesuai. Kami memilih berdasarkan sistem dan pasukan sedia ada anda, bukan dogma.',
      zh: '网页系统主要用 React、Node.js 和 MySQL；手机、桌面和自助终端应用用 React Native 与 Electron；测试自动化用 Playwright；合适的地方用 Python。我们会根据您现有的系统和团队来选择，而不是固守某种技术。',
    },
    {
      id: 'process', next: ['timeline', 'pricing', 'consult'],
      keys: ['how do you work', 'how does it work', 'how it works', 'how we work', 'process', 'steps', 'get started', 'getting started', 'how to start', 'how do i start', 'how can i start', 'where do i start', 'start', 'begin', 'start a project', 'what happens', 'next step', 'proses', 'langkah', 'cara kerja', 'bagaimana bermula', 'macam mana nak mula', '流程', '步骤', '怎么合作', '如何开始', '怎么开始', '合作方式'],
      q: ['How does a project run?', 'Bagaimana projek dijalankan?', '项目是怎么进行的？'],
      en: 'Four steps. 1) Understand — we map your current workflow and find what wastes time or causes errors. 2) Design — the smallest solution that removes the real bottleneck. 3) Build & test — built and tested against real data. 4) Hand over — working software, documentation and a trained team, with ongoing support available.',
      ms: 'Empat langkah. 1) Fahami — kami petakan aliran kerja semasa dan cari apa yang membuang masa atau menyebabkan kesilapan. 2) Reka bentuk — penyelesaian terkecil yang menghapuskan halangan sebenar. 3) Bina & uji — dibina dan diuji dengan data sebenar. 4) Serah — perisian yang berfungsi, dokumentasi dan pasukan yang dilatih, dengan sokongan berterusan jika diperlukan.',
      zh: '四个步骤。1）了解——梳理您现有的流程，找出浪费时间或容易出错的环节。2）设计——提出能解决真正瓶颈的最小方案。3）开发与测试——用真实数据开发并严格测试。4）交付——可用的软件、文档和培训好的团队，并可提供后续支持。',
    },
    {
      id: 'consult', next: ['contact', 'pricing'],
      keys: ['free consultation', 'consultation', 'consult', 'free call', 'scoping call', 'first call', 'book a call', 'meeting', 'appointment', 'discuss', 'obligation', 'konsultasi', 'konsultasi percuma', 'panggilan percuma', 'temu janji', 'bincang', 'berbincang', '咨询', '免费咨询', '预约', '面谈', '会议'],
      q: ['Is the first call free?', 'Adakah panggilan pertama percuma?', '首次沟通免费吗？'],
      en: 'Yes — the first scoping call is free with no obligation, and we only quote once we understand what you actually need. To get a useful first reply, tell us about your business, the problem you want solved and roughly how many people will use the system. WhatsApp: +60 19-502 3897.',
      ms: 'Ya — panggilan skop pertama adalah percuma tanpa sebarang komitmen, dan kami hanya memberi sebut harga selepas memahami apa yang anda benar-benar perlukan. Untuk maklum balas pertama yang berguna, ceritakan tentang perniagaan anda, masalah yang ingin diselesaikan dan anggaran bilangan pengguna sistem. WhatsApp: +60 19-502 3897.',
      zh: '是的——首次需求沟通免费，且没有任何义务，我们会在了解您的真正需求后才报价。想得到有用的初步回复，请告诉我们您的业务、想解决的问题，以及大约有多少人会使用系统。WhatsApp：+60 19-502 3897。',
    },
    {
      id: 'reply', next: ['contact', 'consult'],
      keys: ['how fast will', 'how fast do you reply', 'how quickly do you reply', 'response time', 'reply', 'respond', 'get back to me', 'business hours', 'opening hours', 'working hours', 'available', 'balas', 'membalas', 'waktu operasi', 'waktu bekerja', '回复', '多快回复', '营业时间', '工作时间'],
      q: ['How fast do you reply?', 'Berapa cepat anda membalas?', '多快能回复？'],
      en: 'We typically respond within 24 hours, often sooner on WhatsApp: +60 19-502 3897.',
      ms: 'Kami biasanya membalas dalam masa 24 jam, selalunya lebih cepat melalui WhatsApp: +60 19-502 3897.',
      zh: '我们通常在 24 小时内回复，通过 WhatsApp 往往更快：+60 19-502 3897。',
    },
    {
      id: 'contact', next: ['consult', 'reply'],
      keys: ['contact', 'whatsapp', 'email', 'call', 'phone', 'number', 'reach', 'talk to', 'speak to', 'talk to a human', 'hubungi', 'telefon', 'nombor', 'emel', 'e-mel', 'cakap dengan', '联系', '电话', '邮件', '邮箱', '号码', '微信'],
      q: ['How do I reach you?', 'Bagaimana hendak hubungi anda?', '怎么联系你们？'],
      en: "WhatsApp is fastest: +60 19-502 3897. Or email jontech.information@gmail.com — you'll talk directly to the engineer building your system.",
      ms: 'WhatsApp paling pantas: +60 19-502 3897. Atau e-mel jontech.information@gmail.com — anda akan bercakap terus dengan jurutera yang membina sistem anda.',
      zh: '最快是 WhatsApp：+60 19-502 3897，或发邮件至 jontech.information@gmail.com——您会直接和为您开发系统的工程师沟通。',
    },
    {
      id: 'location', next: ['contact', 'languages'],
      keys: ['where', 'located', 'location', 'based', 'office', 'address', 'malaysia', 'singapore', 'remote', 'remotely', 'near me', 'kuala lumpur', 'kl', 'penang', 'johor', 'selangor', 'di mana', 'lokasi', 'pejabat', 'alamat', '哪里', '在哪', '地点', '地址', '办公室', '马来西亚', '新加坡', '远程'],
      q: ['Where are you based?', 'Di mana anda berpangkalan?', '你们在哪里？'],
      en: "We're based in Malaysia and work with clients across Malaysia and Singapore. Everything runs remotely over video calls and WhatsApp, so your location isn't a barrier.",
      ms: 'Kami berpangkalan di Malaysia dan bekerja dengan pelanggan di seluruh Malaysia dan Singapura. Semuanya dijalankan dari jauh melalui panggilan video dan WhatsApp, jadi lokasi anda bukan halangan.',
      zh: '我们立足马来西亚，服务全马和新加坡的客户。合作全程通过视频通话和 WhatsApp 远程进行，所以您在哪里都不是问题。',
    },
    {
      id: 'languages', next: ['contact', 'location'],
      keys: ['language', 'bahasa', 'chinese', 'mandarin', 'malay', 'english', 'speak', 'bahasa cina', 'bahasa melayu', '语言', '中文', '华语', '英语', '马来语'],
      q: ['Which languages do you work in?', 'Bahasa apa yang anda gunakan?', '可以用哪些语言沟通？'],
      en: 'English, Bahasa Malaysia and Chinese. This site is available in all three too.',
      ms: 'Bahasa Inggeris, Bahasa Malaysia dan Bahasa Cina. Laman ini juga tersedia dalam ketiga-tiga bahasa.',
      zh: '英语、马来语和华语。本网站也提供这三种语言。',
    },
    {
      id: 'smb', next: ['pricing', 'services'],
      keys: ['startup', 'small business', 'sme', 'small company', 'small team', 'just starting', 'pks', 'perniagaan kecil', 'syarikat kecil', '中小企业', '小公司', '初创', '小生意'],
      en: 'Yes — startups and small businesses are exactly who we work with. Projects are scoped to the smallest solution that removes the real bottleneck, and quoted up front after a free chat.',
      ms: 'Ya — syarikat permulaan dan perniagaan kecil memang pelanggan utama kami. Setiap projek diskopkan kepada penyelesaian terkecil yang menghapuskan halangan sebenar, dan disebut harga lebih awal selepas sembang percuma.',
      zh: '是的——初创公司和小型企业正是我们的主要服务对象。我们会把项目范围定在能解决真正瓶颈的最小方案，并在免费沟通后提前报价。',
    },
    {
      id: 'about', next: ['why', 'process', 'projects'],
      keys: ['who is behind', 'about you', 'about jontech', 'about', 'team', 'company', 'founder', 'owner', 'experience', 'background', 'one person', 'freelancer', 'syarikat', 'pasukan', 'pengasas', 'pengalaman', 'latar belakang', '团队', '公司', '关于', '背景', '经验', '创始人'],
      q: ['Who is behind JonTech?', 'Siapa di sebalik JonTech?', 'JonTech 背后是谁？'],
      en: 'JonTech Solutions is a one-person studio in Malaysia, run by a software engineer with a QA and test-automation background. No account managers and no outsourcing — you talk directly to the person building your system.',
      ms: 'JonTech Solutions ialah studio seorang di Malaysia, dikendalikan oleh jurutera perisian berlatar belakang QA dan automasi ujian. Tiada pengurus akaun dan tiada penyumberan luar — anda bercakap terus dengan orang yang membina sistem anda.',
      zh: 'JonTech Solutions 是一家位于马来西亚的一人工作室，由一位具备 QA 与测试自动化背景的软件工程师经营。没有客户经理，也不外包——您直接与为您开发系统的人沟通。',
    },
    {
      id: 'industries', next: ['projects', 'services'],
      keys: ['industry', 'industries', 'sector', 'restaurant', 'cafe', 'f&b', 'clinic', 'salon', 'logistics', 'manufacturing', 'factory', 'hotel', 'industri', 'sektor', 'restoran', 'klinik', 'kilang', '行业', '餐饮', '餐厅', '诊所', '工厂', '物流'],
      q: ['Which industries have you worked in?', 'Industri apa yang pernah diceburi?', '做过哪些行业？'],
      en: "Projects so far cover real estate, beauty and wellness retail, education, consumer electronics retail, property communities, online gaming QA and finance. If your industry isn't on the list, the same building blocks usually apply — tell us how your business runs and we'll say honestly whether we can help.",
      ms: 'Projek setakat ini merangkumi hartanah, runcit kecantikan dan kesejahteraan, pendidikan, runcit elektronik pengguna, komuniti kediaman, QA permainan dalam talian dan kewangan. Jika industri anda tiada dalam senarai, asas yang sama biasanya masih terpakai — ceritakan cara perniagaan anda berjalan dan kami akan beritahu secara jujur sama ada kami boleh membantu.',
      zh: '目前的项目涵盖房地产、美容与健康零售、教育、消费电子零售、住宅社区、在线游戏 QA 和金融。如果您的行业不在其中，同样的基础模块通常也适用——告诉我们您的业务如何运作，我们会如实告知能否帮上忙。',
    },
    {
      id: 'timeline', next: ['pricing', 'process', 'consult'], keys: K.time,
      q: ['How long does it take?', 'Berapa lama masa diperlukan?', '需要多长时间？'],
      en: "It depends on scope. As a guide: a single-till POS with core inventory and sales reports typically takes 3–6 weeks, and a focused web app such as a booking system or internal dashboard 4–8 weeks, from scoping to handover. We'll confirm a timeline once we understand the scope — the first scoping call is free.",
      ms: 'Bergantung pada skop. Sebagai panduan: POS satu kaunter dengan inventori teras dan laporan jualan biasanya mengambil masa 3–6 minggu, dan aplikasi web yang fokus seperti sistem tempahan atau papan pemuka dalaman 4–8 minggu, dari skop hingga penyerahan. Kami sahkan tempoh selepas memahami skop — panggilan skop pertama adalah percuma.',
      zh: '视项目范围而定。参考：带核心库存和销售报表的单收银台 POS 通常需要 3–6 周；目标明确的网页应用（如预约系统或内部看板）通常需要 4–8 周，从需求沟通到交付。了解范围后我们会确认工期——首次需求沟通免费。',
    },
    {
      id: 'pricing', next: ['timeline', 'consult', 'contact'], keys: K.price,
      q: ['How much does it cost?', 'Berapa kosnya?', '费用大概多少？'],
      en: "There's no fixed price list — every project gets a clear, fixed quote after a short free chat about scope, so you know the cost before any work starts. Small automations usually cost far less than hiring someone to do the task by hand.",
      ms: 'Tiada senarai harga tetap — setiap projek mendapat sebut harga tetap yang jelas selepas sembang ringkas percuma tentang skop, jadi anda tahu kosnya sebelum kerja bermula. Automasi kecil biasanya jauh lebih murah daripada mengupah orang untuk membuatnya secara manual.',
      zh: '我们没有固定价目表——每个项目都会在一次简短的免费需求沟通后给出清楚的固定报价，开工前您就知道费用。小型自动化通常远比雇人手动处理便宜。',
    },
    {
      id: 'software', next: ['saas', 'softwarePrice', 'booking'], keys: K.software,
      q: ['Tell me about custom software', 'Ceritakan tentang perisian tersuai', '介绍一下定制软件'],
      en: 'Custom software means a system built around how you actually work, not a generic template: POS, booking systems, self-service kiosks, back-office portals, commission and payout engines, internal tools. You own the source code, with no vendor lock-in.',
      ms: 'Perisian tersuai bermaksud sistem yang dibina mengikut cara anda benar-benar bekerja, bukan templat generik: POS, sistem tempahan, kiosk layan diri, portal pejabat belakang, enjin komisen dan bayaran, serta alatan dalaman. Anda memiliki kod sumbernya, tanpa terikat dengan vendor.',
      zh: '定制软件是围绕您的实际运作方式打造的系统，而不是通用模板：POS、预约系统、自助终端、后台管理门户、佣金与结算引擎、内部工具等。源代码归您所有，不受供应商绑定。',
    },
    {
      id: 'demo', next: ['projects', 'property', 'consult'],
      keys: ['demo', 'live demo', 'sample', 'try it', 'show me', 'screenshot', 'see it working', 'contoh sistem', 'cuba dulu', '演示', '试用', '体验', '看看效果'],
      q: ['Is there a demo I can try?', 'Ada demo yang boleh dicuba?', '有可以试用的演示吗？'],
      en: "Yes — the residents' community platform has a live demo you can click through: https://lch99.github.io/Prop-Gather The other projects are client systems and aren't public, but I can describe any of them.",
      ms: 'Ya — platform komuniti penduduk mempunyai demo langsung yang boleh anda cuba: https://lch99.github.io/Prop-Gather Projek lain ialah sistem pelanggan dan tidak dibuka kepada umum, tetapi saya boleh terangkan mana-mana satu.',
      zh: '有——住户社区平台有可以直接体验的在线演示：https://lch99.github.io/Prop-Gather 其他项目属于客户系统，不对外公开，但我可以为您介绍任何一个。',
    },
    {
      id: 'projects', next: ['demo', 'pos', 'kiosk'],
      keys: ['project', 'portfolio', 'case study', 'case studies', 'example', 'past work', 'previous work', 'what have you built', 'what have you done', 'client', 'customer', 'reference', 'projek', 'portfolio', 'contoh', 'pelanggan', '项目', '作品', '案例', '客户'],
      q: ['What projects have you done?', 'Projek apa yang pernah dibuat?', '你们做过哪些项目？'],
      en: 'Recent work: an agency commission system, a scalp-spa self-service kiosk, a memory-method learning platform, a phone-shop POS with Shopee/Lazada/TikTok sync, a residents community platform, a Playwright test suite, a trading research desk and an invoicing system. Client names stay confidential, but ask me about any of them!',
      ms: 'Kerja terkini: sistem komisen agensi, kiosk layan diri spa kulit kepala, platform pembelajaran kaedah ingatan, POS kedai telefon dengan penyelarasan Shopee/Lazada/TikTok, platform komuniti penduduk, suite ujian Playwright, meja penyelidikan dagangan dan sistem invois. Nama pelanggan dirahsiakan, tetapi tanyalah saya tentang mana-mana satu!',
      zh: '近期项目：中介佣金系统、头皮护理自助终端、记忆法学习平台、对接 Shopee/Lazada/TikTok 的手机店 POS、住户社区平台、Playwright 测试套件、交易研究工作台以及发票系统。客户名称保密，但想了解哪个项目都可以问我！',
    },
    {
      id: 'services', next: ['software', 'ai', 'automation'],
      keys: ['service', 'what do you offer', 'services you offer', 'what do you do', 'what can you do', 'what you do', 'can you help', 'help me', 'provide', 'specialise', 'specialize', 'perkhidmatan', 'tawarkan', 'apa yang anda buat', 'boleh bantu', '服务', '做什么', '提供', '业务范围', '能帮'],
      q: ['What do you offer?', 'Apa yang anda tawarkan?', '你们提供什么服务？'],
      en: 'We build software that removes manual work for startups and small businesses: custom business systems (POS, self-service kiosks, booking and back-office portals), web and mobile apps, workflow automation and system integration, practical AI, automated reports, and QA/test automation. Which of these is closest to what you need?',
      ms: 'Kami membina perisian yang menghapuskan kerja manual untuk syarikat permulaan dan perniagaan kecil: sistem perniagaan tersuai (POS, kiosk layan diri, tempahan dan portal pejabat belakang), aplikasi web dan mudah alih, automasi aliran kerja dan integrasi sistem, AI praktikal, laporan automatik serta automasi ujian/QA. Yang mana paling hampir dengan keperluan anda?',
      zh: '我们为初创公司和小型企业开发省去手工作业的软件：定制业务系统（POS、自助终端、预约与后台管理门户）、网站与手机应用、流程自动化与系统集成、实用 AI、自动报表，以及 QA/测试自动化。哪一项最接近您的需求？',
    },
    {
      // "Can you build…?" with nothing more specific; any real topic outranks it
      id: 'canBuild', weight: 0.09, next: ['services', 'projects', 'consult'],
      keys: ['can you build', 'can you make', 'can you create', 'can you develop', 'do you build', 'do you make', 'build', 'develop', 'i need', 'i want', 'need a', 'want a', 'looking for', 'boleh buat', 'boleh bina', 'bina', 'nak buat', 'mahu buat', 'saya nak', 'saya perlukan', '能做', '可以做', '能不能做', '开发', '想做', '做一个', '需要一个', '想要'],
      en: "Quite possibly — if it's software, automation or AI for running a business, it's the kind of thing we build. Tell me a bit more (a POS, a booking system, an app, connecting two systems…), or describe it on WhatsApp and you'll get a straight answer: +60 19-502 3897.",
      ms: 'Besar kemungkinan — jika ia perisian, automasi atau AI untuk menjalankan perniagaan, itulah yang kami bina. Ceritakan lebih lanjut (POS, sistem tempahan, aplikasi, menyambung dua sistem…), atau terangkan di WhatsApp untuk jawapan terus: +60 19-502 3897.',
      zh: '很可能可以——只要是帮助经营业务的软件、自动化或 AI，都是我们做的范围。可以再说详细一点（POS、预约系统、应用、打通两个系统……），或者直接在 WhatsApp 上描述，会得到明确的答复：+60 19-502 3897。',
    },
  ];
  const FALLBACK = {
    next: ['services', 'projects', 'pricing', 'contact'],
    en: "I don't have a prepared answer for that one. I can help with our services, past projects, pricing, timelines and how we work — or the engineer can answer directly on WhatsApp: +60 19-502 3897.",
    ms: 'Saya tiada jawapan yang disediakan untuk soalan itu. Saya boleh bantu tentang perkhidmatan, projek lepas, harga, tempoh dan cara kami bekerja — atau jurutera kami boleh jawab terus di WhatsApp: +60 19-502 3897.',
    zh: '这个问题我没有现成的答案。我可以介绍我们的服务、过往项目、报价、工期和合作方式——或者直接 WhatsApp 联系工程师：+60 19-502 3897。',
  };
  // After a product answer, a bare "how much?" or "how long?" is about that product
  const FOLLOW_UP = {
    pos: { pricing: 'posPrice', timeline: 'posTime' },
    web: { timeline: 'webTime' },
    mobile: { pricing: 'mobilePrice' },
    software: { pricing: 'softwarePrice', timeline: 'webTime' },
    ai: { pricing: 'aiPrice' },
  };
  const START = ['projects', 'ai', 'pricing'];
  const LANGS = ['en', 'ms', 'zh'];

  const lang = () => {
    const l = (document.documentElement.lang || 'en').toLowerCase();
    return l.startsWith('zh') ? 'zh' : l.startsWith('ms') ? 'ms' : 'en';
  };
  const t = () => T[lang()];

  const CJK = /[㐀-鿿]/;
  // Lower-case words with single spaces around each, so " pos " can't match inside "possible".
  // Chinese has no spaces, so Latin words written next to it are split off ("AI能" → "ai 能").
  const fold = (s) => ` ${String(s).toLowerCase().replace(/([a-z0-9])(?=[㐀-鿿])|([㐀-鿿])(?=[a-z0-9])/g, '$1$2 ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  const byId = {};
  TOPICS.forEach((topic) => {
    byId[topic.id] = topic;
    topic.k = topic.keys.map((k) => fold(k).trim());
    if (topic.also) topic.a = topic.also.map((k) => fold(k).trim());
  });

  // A typo: one letter added, dropped, changed or swapped
  function near(a, b) {
    if (a === b || a[0] !== b[0] || Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    const rest = (x, y) => a.slice(i + x) === b.slice(i + y);
    return rest(1, 1) || rest(1, 0) || rest(0, 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && rest(2, 2));
  }
  // How strongly the question points at these keys. A phrase counts for more than a single word.
  function hits(keys, text, words) {
    let n = 0;
    for (const k of keys) {
      if (CJK.test(k)) { if (text.replace(/ /g, '').includes(k.replace(/ /g, ''))) n += k.length >= 3 ? 2 : 1; continue; }
      const parts = k.split(' ').length;
      if (text.includes(` ${k} `) || text.includes(` ${k}s `)) n += parts === 1 ? 1 : 3;
      // …or a typo of it — but a word that is itself a key ("system") is no typo of another ("sistem")
      else if (parts === 1 && k.length >= 5 && words.some((w) => !keys.includes(w) && near(w, k))) n += 0.6;
    }
    return n;
  }
  function score(topic, text, words) {
    if (topic.maxWords && words.length > topic.maxWords) return 0;
    const a = hits(topic.k, text, words);
    // A narrower topic ("what if the AI gets it wrong") also counts the words for its parent ("AI")
    const parent = byId[topic.base];
    if (!topic.a) return a && parent ? a + score(parent, text, words) : a * (topic.weight || 1);
    const b = a && hits(topic.a, text, words);
    return b ? a + b + 2 : 0;
  }

  // Answer in the language the question is written in; fall back to the page's language
  const MS_WORDS = /\b(apa|apakah|berapa|boleh|bolehkah|saya|anda|awak|kami|nak|mahu|macam|bagaimana|adakah|ada|tak|tidak|untuk|dengan|yang|ini|itu|kos|harga|buat|bina|perniagaan|kedai|sistem|laman|bila|mana|siapa|terima|kasih|hai|selamat|tolong|perlu|dan|atau|lama|percuma|hubungi|tentang)\b/g;
  const EN_WORDS = /\b(the|what|how|do|does|you|your|is|are|can|i|my|we|much|long|a|an|for|with|and|or|to|of|it|have|about|tell|me|please|hello|thanks|thank|which|who|where|when|will|need|want)\b/g;
  function questionLang(text) {
    if (CJK.test(text)) return 'zh';
    const ms = (text.match(MS_WORDS) || []).length, en = (text.match(EN_WORDS) || []).length;
    return ms > en ? 'ms' : en > ms ? 'en' : lang();
  }

  let lastTopic = null;
  // The reply to a question, plus the topics to offer as follow-up buttons. `id` picks the topic
  // directly (a follow-up button was pressed).
  function quickAnswer(q, id, l) {
    const text = fold(q);
    const words = text.trim().split(' ');
    const ranked = id ? [] : TOPICS.map((topic) => ({ topic, s: score(topic, text, words) })).filter((r) => r.s > 0).sort((x, y) => y.s - x.s);
    let topic = id ? byId[id] : ranked[0] && ranked[0].topic;
    const onlyHowMuch = ranked.length && ranked.every((r) => r.topic.id === 'pricing' || r.topic.id === 'timeline');
    if (onlyHowMuch && FOLLOW_UP[lastTopic] && FOLLOW_UP[lastTopic][topic.id]) topic = byId[FOLLOW_UP[lastTopic][topic.id]];
    const replyLang = l || questionLang(text);
    if (!topic) return { text: FALLBACK[replyLang], next: FALLBACK.next, lang: replyLang };
    lastTopic = topic.base || topic.id;
    // Offer the runner-up too when the question touched a second topic
    const runnerUp = !topic.a && ranked[1] && ranked[1].s >= 1 ? [ranked[1].topic.id] : [];
    const next = [...new Set([...runnerUp, ...topic.next])].filter((n) => n !== topic.id && byId[n].q).slice(0, 3);
    return { text: topic[replyLang], next, lang: replyLang };
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
    if (!history.length) suggest(START, lang());
  }

  // Buttons that ask a topic's question; pressing one answers that topic directly
  function suggest(ids, l) {
    if (!ids.length) return;
    const chips = h('div', { class: 'jt-suggest' });
    ids.forEach((id) => {
      const q = byId[id].q[LANGS.indexOf(l)];
      const b = h('button', { type: 'button', text: q });
      b.addEventListener('click', () => ask(q, id, l));
      chips.appendChild(b);
    });
    body.appendChild(chips);
    body.scrollTop = body.scrollHeight;
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

  async function ask(question, topicId, topicLang) {
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
    let quick = null;
    if (AI_ENDPOINT) {
      try {
        reply = (await post('/chat', { messages: history })).reply;
      } catch (e) {
        reply = e.status === 429 || e.status === 503 ? t().busy : `${t().error}\n\n${quickAnswer(q).text}`;
      }
    } else {
      await new Promise((r) => setTimeout(r, 500));
      quick = quickAnswer(q, topicId, topicLang);
      reply = quick.text;
    }
    typing.remove();
    history.push({ role: 'assistant', content: reply });
    save();
    bubble('bot', reply);
    if (quick) suggest(quick.next, quick.lang);
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
    ring.innerHTML = `<svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true"><circle class="ux-ring-track" cx="65" cy="65" r="56" fill="none" stroke="#f5f5f7" stroke-width="12"/><circle cx="65" cy="65" r="56" fill="none" stroke="${colour(score)}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>`;
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

  /* ── CONTACT FORMS ──
     Until a real Formspree form ID replaces the placeholder in a form's action, sending the form
     opens WhatsApp with the message filled in, so an enquiry is never posted into nowhere. */
  document.querySelectorAll('form.contact-form').forEach((f) => {
    if (!/REPLACE-WITH/.test(f.getAttribute('action') || '')) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = t();
      const v = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
      const head = [s.formHi, `${s.formName}: ${v('name')}`, `${s.formEmail}: ${v('email')}`];
      if (v('service')) head.push(`${s.formNeed}: ${v('service')}`);
      const url = `${WHATSAPP}?text=${encodeURIComponent(`${head.join('\n')}\n\n${v('message')}`)}`;
      // window.open returns nothing if the popup was blocked; then go there in this tab instead
      const win = window.open(url, '_blank');
      if (win) win.opener = null; else location.href = url;
      const note = f.querySelector('.form-success') || f.appendChild(h('p', { class: 'form-success', role: 'status' }));
      note.textContent = s.formSent;
      note.style.display = 'block';
    });
  });

  document.addEventListener('jontech:lang', renderChat);
  renderChat();

  window.JonTechAI = { open, ask, close, answer: quickAnswer };
})();
