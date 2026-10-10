// Main JS - interactions
(function () {
  'use strict';

  // === Theme toggle ===
  const themeBtn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored) root.setAttribute('data-theme', stored);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // === Nav scroll state ===
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // === Scroll reveal ===
  const revealTargets = document.querySelectorAll(
    '.section-head, .glass, .terminal, .tool, .stack-row, .res-card, .note, .cheat-list li, .now-card, .edu-card, .contact-link, .ai-prep-banner, .study-cta, .pipeline-viz, .blueprint, .track-switcher, .projects-grid, .rag-arch, .rag-node, .read-card, .hub-cta, .hub-head'
  );
  revealTargets.forEach((el) => el.classList.add('scroll-reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('visible'));
  }

  // === Study Hub track switcher ===
  const tabs = document.querySelectorAll('.track-tab');
  const contents = document.querySelectorAll('.track-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.track;
      tabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab);
      });
      contents.forEach((c) => c.classList.toggle('active', c.dataset.track === target));

      const newCards = document.querySelectorAll(`.track-content[data-track="${target}"] .scroll-reveal`);
      newCards.forEach((el) => {
        el.classList.remove('visible');
        setTimeout(() => el.classList.add('visible'), 50);
      });
    });
  });

  // === Smooth scroll w/ offset for sticky nav ===
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // === Footer year ===
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // ============================================================
  // INTERACTIVE TERMINAL — real working CLI
  // ============================================================
  const term = {
    output: document.getElementById('terminal-output'),
    form: document.getElementById('terminal-form'),
    input: document.getElementById('terminal-input'),
    history: [],
    historyIdx: -1,
  };

  if (term.form && term.input && term.output) {
    const termEl = document.getElementById('interactive-terminal');
    if (termEl) {
      termEl.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
        term.input.focus();
      });
    }

    // Make hint commands clickable to auto-fill
    document.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('t-cmd-hint')) {
        const txt = e.target.textContent.trim();
        // Only auto-fill if it looks like a real command (not a section anchor)
        if (!txt.startsWith('#') && !txt.startsWith('cat ')) {
          term.input.value = txt;
          term.input.focus();
        } else if (txt.startsWith('cat ')) {
          term.input.value = txt;
          term.input.focus();
        }
      }
    });

    term.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = term.input.value.trim();
      if (!cmd) return;
      term.history.push(cmd);
      term.historyIdx = term.history.length;
      runCommand(cmd);
      term.input.value = '';
    });

    term.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (term.historyIdx > 0) {
          term.historyIdx -= 1;
          term.input.value = term.history[term.historyIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (term.historyIdx < term.history.length - 1) {
          term.historyIdx += 1;
          term.input.value = term.history[term.historyIdx] || '';
        } else {
          term.historyIdx = term.history.length;
          term.input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = term.input.value.trim().toLowerCase();
        if (!partial) return;
        const match = Object.keys(commands).find((c) => c.startsWith(partial));
        if (match) term.input.value = match;
      }
    });
  }

  function appendLine(html) {
    if (!term.output) return;
    const div = document.createElement('div');
    div.className = 't-line';
    div.innerHTML = html;
    term.output.appendChild(div);
    term.output.scrollTop = term.output.scrollHeight;
  }

  function echoPrompt(cmd) {
    appendLine('<span class="t-prompt">visitor@deven:~$</span> <span class="t-history">' + escapeHtml(cmd) + '</span>');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ----- COMMANDS -----
  const commands = {
    help: () => {
      appendLine('<span class="t-section">Available commands:</span>');
      const list = [
        ['help', 'show this list'],
        ['whoami', 'about me'],
        ['skills', 'tech I work with'],
        ['projects', 'featured AI projects'],
        ['experience', 'work history'],
        ['education', 'degree & certs'],
        ['certs', 'certifications'],
        ['resources', 'free study guides I publish'],
        ['contact', 'how to reach me'],
        ['github', 'open my GitHub'],
        ['linkedin', 'open my LinkedIn'],
        ['ls', 'list portfolio sections'],
        ['cat &lt;file&gt;', 'show file (about.md, capabilities.json, readme.md)'],
        ['date', 'current date/time'],
        ['echo &lt;text&gt;', 'echo back text'],
        ['theme', 'toggle dark / light'],
        ['clear', 'clear the terminal'],
        ['exit', 'goodbye'],
      ];
      list.forEach((row) => {
        appendLine('<span class="t-cmd-hint">' + row[0] + '</span> &nbsp; <span class="t-out">' + row[1] + '</span>');
      });
      appendLine('<span class="t-out" style="margin-top:0.6rem;display:inline-block;">Tip: ↑/↓ to navigate history, Tab to autocomplete</span>');
    },

    whoami: () => {
      appendLine('<span class="t-out">Deven Kalathiya — AI Engineer based in Mumbai 🇮🇳</span>');
      appendLine('<span class="t-out">I build AI agents that listen, reason, use tools and get real work done in production.</span>');
      appendLine('<span class="t-out">4× AWS Certified · 1× Microsoft Certified · B.E. CSE (CGPA 9.143)</span>');
    },

    skills: () => {
      appendLine('<span class="t-section">// Agentic AI &amp; LLMs</span>');
      appendLine('<span class="t-out">LangGraph · LangChain · Claude API · OpenAI API · MCP · Multi-Agent Systems · Tool Calling</span>');
      appendLine('<span class="t-section">// RAG, Search &amp; Speech</span>');
      appendLine('<span class="t-out">RAG · Embeddings · pgvector · OpenSearch · Whisper · Ollama · Amazon Bedrock · Amazon Q</span>');
      appendLine('<span class="t-section">// Languages &amp; Frameworks</span>');
      appendLine('<span class="t-out">Python · TypeScript · JavaScript · FastAPI · SQL</span>');
      appendLine('<span class="t-section">// Cloud &amp; Infrastructure</span>');
      appendLine('<span class="t-out">AWS · Docker · Kubernetes · Terraform · GitHub Actions · Jenkins</span>');
    },

    stack: () => commands.skills(),

    projects: () => {
      appendLine('<span class="t-section">// Featured Projects</span>');
      const projs = [
        ['01', 'Meeting Intelligence Agent', 'LangGraph · Claude · Whisper · FastAPI', 'https://github.com/deven1003/meeting-intelligence-agent-showcase'],
        ['02', 'InvestWise AI', 'LangGraph · LangChain · Claude · TypeScript', 'https://github.com/deven1003/investwise-ai-showcase'],
        ['03', 'ShopEasy Support Agent', 'LangGraph · LangChain · Claude · RAG', 'https://github.com/deven1003/shopeasy-support-agent'],
      ];
      projs.forEach((p) => {
        appendLine('<span class="t-prompt">' + p[0] + '</span> <a class="t-link" href="' + p[3] + '" target="_blank" rel="noreferrer"><strong>' + p[1] + '</strong></a>');
        appendLine('&nbsp;&nbsp;&nbsp;&nbsp;<span class="t-out">' + p[2] + '</span>');
      });
    },

    experience: () => {
      appendLine('<span class="t-section">// AI Engineer @ Feedspot · Jun 2024 – Present</span>');
      appendLine('<span class="t-out">◇ RAG + pgvector semantic search over millions of podcast episodes</span>');
      appendLine('<span class="t-out">◇ Production LLM integrations: Claude API, OpenAI API, Amazon Bedrock, Amazon Q</span>');
      appendLine('<span class="t-out">▹ AI-assisted pipeline automation, +30% processing efficiency</span>');
      appendLine('<span class="t-out">▹ Large-scale web crawling, microservices, CI/CD and monitoring</span>');
    },

    education: () => {
      appendLine('<span class="t-section">// Education</span>');
      appendLine('<span class="t-out">🎓 B.E. Computer Science &amp; Engineering · VCET (2020-2024) · CGPA 9.143</span>');
      commands.certs();
    },

    certs: () => {
      appendLine('<span class="t-section">// Certifications</span>');
      appendLine('<span class="t-success">✓ 4× AWS Certified (incl. Cloud Practitioner &amp; AI Practitioner)</span>');
      appendLine('<span class="t-success">✓ 1× Microsoft Certified</span>');
    },

    resources: () => {
      appendLine('<span class="t-section">// Free study guides</span>');
      appendLine('<span class="t-out">🐳 Docker          · <a class="t-link" href="https://deven1003.github.io/study-vault-docker/" target="_blank" rel="noreferrer">study-vault-docker</a></span>');
      appendLine('<span class="t-out">⎈ Kubernetes      · <a class="t-link" href="https://deven1003.github.io/study-vault-kubernetes/" target="_blank" rel="noreferrer">study-vault-kubernetes</a></span>');
      appendLine('<span class="t-out">☁ AWS Cloud Prac. · <a class="t-link" href="https://deven1003.github.io/study-vault-aws-cloud-practitioner/" target="_blank" rel="noreferrer">study-vault-aws-cloud-practitioner</a></span>');
      appendLine('<span class="t-out">◇ AWS AI Prac.    · <a class="t-link" href="https://deven1003.github.io/study-vault-aws-ai-practitioner/" target="_blank" rel="noreferrer">study-vault-aws-ai-practitioner</a></span>');
    },

    vault: () => commands.resources(),

    contact: () => {
      appendLine('<span class="t-section">// Contact</span>');
      appendLine('<span class="t-out">✉ <a class="t-link" href="mailto:devengkalathiya@gmail.com">devengkalathiya@gmail.com</a></span>');
      appendLine('<span class="t-out">in <a class="t-link" href="https://www.linkedin.com/in/deven-kalathiya/" target="_blank" rel="noreferrer">linkedin.com/in/deven-kalathiya</a></span>');
      appendLine('<span class="t-out">⌥ <a class="t-link" href="https://github.com/deven1003" target="_blank" rel="noreferrer">github.com/deven1003</a></span>');
    },

    github: () => {
      appendLine('<span class="t-out">→ opening github.com/deven1003 ...</span>');
      window.open('https://github.com/deven1003', '_blank', 'noreferrer');
    },

    linkedin: () => {
      appendLine('<span class="t-out">→ opening linkedin.com/in/deven-kalathiya ...</span>');
      window.open('https://www.linkedin.com/in/deven-kalathiya/', '_blank', 'noreferrer');
    },

    ls: () => {
      appendLine('<pre class="t-tree">portfolio/' +
        '\n├── about/' +
        '\n├── stack/' +
        '\n├── experience/' +
        '\n├── projects/' +
        '\n├── resources/' +
        '\n├── education/' +
        '\n└── contact/</pre>');
    },

    cat: (args) => {
      const file = (args[0] || '').toLowerCase();
      if (!file) {
        appendLine('<span class="t-error">cat: missing file. Try: <span class="t-cmd-hint">cat about.md</span></span>');
        return;
      }
      const files = {
        'about.md': () => {
          appendLine('<span class="t-section"># About</span>');
          appendLine('<span class="t-out">I am an AI Engineer building agentic AI systems that run in production.</span>');
          appendLine('<span class="t-out">Focus: multi-agent workflows, RAG, voice AI, and AI outputs you can verify.</span>');
          appendLine('<span class="t-out">Stack: LangGraph · Claude · MCP · RAG · Whisper, on AWS infrastructure.</span>');
        },
        'capabilities.json': () => {
          appendLine('<pre class="t-tree">{' +
            '\n  "agentic_ai": ["LangGraph", "LangChain", "Claude", "OpenAI", "MCP"],' +
            '\n  "rag": ["Embeddings", "pgvector", "OpenSearch", "Bedrock"],' +
            '\n  "speech": ["Whisper", "Voice agents"],' +
            '\n  "lang": ["Python", "TypeScript", "FastAPI", "SQL"],' +
            '\n  "infra": ["AWS", "Docker", "Kubernetes", "Terraform"]' +
            '\n}</pre>');
        },
        'readme.md': () => {
          appendLine('<span class="t-section"># Deven Kalathiya — Portfolio</span>');
          appendLine('<span class="t-out">AI Engineer portfolio: agentic AI projects, experience and stack.</span>');
          appendLine('<span class="t-out">Type <span class="t-cmd-hint">help</span> to navigate.</span>');
        },
      };
      if (files[file]) files[file]();
      else appendLine('<span class="t-error">cat: ' + escapeHtml(file) + ': No such file. Try: about.md, capabilities.json, readme.md</span>');
    },

    echo: (args) => {
      appendLine('<span class="t-out">' + escapeHtml(args.join(' ')) + '</span>');
    },

    date: () => {
      appendLine('<span class="t-out">' + new Date().toString() + '</span>');
    },

    theme: () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      appendLine('<span class="t-success">→ theme switched to ' + next + '</span>');
    },

    clear: () => {
      term.output.innerHTML = '';
      appendLine('<span class="t-welcome">// Terminal cleared. Type <span class="t-cmd-hint">help</span> for commands.</span>');
    },

    exit: () => {
      appendLine('<span class="t-out">// Goodbye 👋 — refresh the page to come back.</span>');
      term.input.disabled = true;
      term.input.placeholder = 'session ended';
    },

    sudo: () => {
      appendLine('<span class="t-error">[sudo] password for visitor:</span>');
      appendLine('<span class="t-error">visitor is not in the sudoers file. This incident will be reported. 😈</span>');
    },

    quit: () => commands.exit(),
  };

  function runCommand(raw) {
    echoPrompt(raw);
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (commands[cmd]) {
      try {
        commands[cmd](args);
      } catch (err) {
        appendLine('<span class="t-error">error: ' + escapeHtml(err.message) + '</span>');
      }
    } else if (cmd === 'rm' && args.includes('-rf')) {
      appendLine('<span class="t-error">nice try 😅 — this is a static site.</span>');
    } else if (cmd === 'hello' || cmd === 'hi' || cmd === 'hey') {
      appendLine('<span class="t-out">👋 hey! type <span class="t-cmd-hint">help</span> to see what I can do.</span>');
    } else if (cmd === ':q' || cmd === ':wq') {
      commands.exit();
    } else {
      appendLine('<span class="t-error">command not found: ' + escapeHtml(cmd) + ' — type <span class="t-cmd-hint">help</span> for the list</span>');
    }
  }

  // ============================================================
  // FLOATING SIDE DOCK (right rail)
  // ============================================================
  const dock = {
    el: document.getElementById('side-dock'),
    toggle: document.getElementById('side-dock-toggle'),
    btns: document.querySelectorAll('.side-dock-btn'),
  };

  if (dock.el) {
    // Show dock after scrolling past hero (~250px in)
    const updateDockVisibility = () => {
      if (window.scrollY > 250) {
        dock.el.classList.add('visible');
      } else {
        dock.el.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', updateDockVisibility, { passive: true });
    updateDockVisibility();

    // Collapse / expand toggle (persisted)
    const dockCollapsed = localStorage.getItem('sideDockCollapsed') === '1';
    if (dockCollapsed) dock.el.classList.add('collapsed');
    if (dock.toggle) {
      dock.toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = dock.el.classList.toggle('collapsed');
        localStorage.setItem('sideDockCollapsed', isCollapsed ? '1' : '0');
        dock.toggle.setAttribute('aria-label', isCollapsed ? 'Expand dock' : 'Collapse dock');
      });
    }
  }

  // ============================================================
  // EXPANDABLE SECTIONS (Know more / Show less)
  // ============================================================
  document.querySelectorAll('[data-expandable-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('[data-expandable]');
      if (!wrapper) return;
      const isExpanded = wrapper.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', isExpanded);
      // Smooth scroll into view if collapsing from below the fold
      if (!isExpanded) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // (Drawer overlay system removed — Study Vault is now an inline section linking to 4 GitHub Pages sites.)
})();
