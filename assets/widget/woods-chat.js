/**
 * Woods Corporation — サイト内AI受付ウィジェット
 *
 * 設置方法（</body> の直前）:
 *   <script src="/assets/woods-chat.js"
 *           data-endpoint="https://woods-chat.xxxx.workers.dev/api/chat"
 *           data-privacy="https://woods-corp.jp/privacy"
 *           defer></script>
 *
 * 依存なし・Shadow DOM なので既存CSSと衝突しません。
 */
(function () {
  'use strict';
  if (window.__WOODS_CHAT__) return;
  window.__WOODS_CHAT__ = true;

  var script = document.currentScript;
  var attr = function (n, d) {
    try {
      return (script && script.getAttribute('data-' + n)) || d;
    } catch (e) {
      return d;
    }
  };

  var cfg = {
    endpoint: attr('endpoint', ''),
    privacy: attr('privacy', ''),
    title: attr('title', 'ウッズ｜AI受付'),
    accent: attr('accent', '#c9a96e'),
    mail: attr('mail', 'contact@woods-corp.jp'),
    web3forms: attr('web3forms', ''),
    nudge: attr('nudge', '0') === '1',
  };
  if (!cfg.endpoint) {
    console.warn('[woods-chat] data-endpoint が未設定のため起動しません');
    return;
  }

  var leadEndpoint = /chat\/?$/.test(cfg.endpoint)
    ? cfg.endpoint.replace(/chat\/?$/, 'lead')
    : cfg.endpoint + '/lead';

  // 言語: data-lang > ?lang= > ブラウザ言語
  var forcedLang = '';
  try {
    forcedLang = attr('lang', '') || new URLSearchParams(location.search).get('lang') || '';
  } catch (e) {
    forcedLang = '';
  }
  var isZh = forcedLang
    ? forcedLang.indexOf('zh') === 0
    : /^zh/i.test(navigator.language || '');
  var lang = isZh ? 'zh' : 'ja';

  var T = isZh
    ? {
        launcher: '在线咨询',
        header: 'AI 接待',
        sub: '中日商务咨询',
        placeholder: '请输入您想咨询的内容',
        send: '发送',
        greeting:
          '您好，这里是 Woods Corporation 的接待 AI。关于中日商务，请问您目前在考虑哪方面的事情？',
        quick: ['中国市场进入', '交涉・合作资料条款的解读', '合作方调查', 'AI 导入'],
        contactHint: '方便留下联系方式吗？负责人会在 1 个工作日内与您联系。',
        contactBtn: '填写联系方式',
        name: '姓名',
        company: '公司名称',
        email: '邮箱（必填）',
        phone: '电话（任意）',
        consent: '同意将所填信息仅用于本次咨询的回复。',
        submit: '发送',
        sending: '发送中…',
        thanks: '已收到。负责人（田中）将在 1 个工作日内与您联系。',
        err: '连接失败。请稍后重试，或直接发送邮件至 ',
        aiNote: '本回答由 AI 生成。最终判断由负责人作出。',
        close: '关闭',
        invalidEmail: '请检查邮箱地址。',
        consentReq: '请勾选同意后再发送。',
      }
    : {
        launcher: 'ご相談',
        header: 'AI受付',
        sub: '日中ビジネスのご相談',
        placeholder: 'ご相談内容をご記入ください',
        send: '送信',
        greeting:
          'こんにちは。ウッズ・コーポレーションの受付AIです。日中ビジネスについて、いま何を検討されていますか。',
        quick: ['中国市場への進出', '交渉・提携書類条項の読み方', 'パートナー候補の調査', 'AI導入'],
        contactHint: '差し支えなければ、ご連絡先を残していただけますか。担当者より1営業日以内にご連絡します。',
        contactBtn: '連絡先を入力する',
        name: 'お名前',
        company: '会社名',
        email: 'メールアドレス（必須）',
        phone: '電話番号（任意）',
        consent: '入力した情報を、本相談への回答のみに利用することに同意します。',
        submit: '送信する',
        sending: '送信中…',
        thanks: '承りました。担当者（田中）より1営業日以内にご連絡いたします。',
        err: '通信に失敗しました。時間をおいて再度お試しいただくか、次のアドレスへご連絡ください：',
        aiNote: 'この応答はAIが生成しています。最終的な判断は担当者が行います。',
        close: '閉じる',
        invalidEmail: 'メールアドレスの形式をご確認ください。',
        consentReq: '同意にチェックを入れてから送信してください。',
      };

  /* ---------------- state ---------------- */
  var state = { open: false, busy: false, messages: [], userTurns: 0, leadSent: false, leadOpen: false };

  function sessionId() {
    try {
      var v = localStorage.getItem('woods_chat_sid');
      if (!v) {
        v = 'w' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('woods_chat_sid', v);
      }
      return v;
    } catch (e) {
      return 'w' + Date.now().toString(36);
    }
  }

  /* ---------------- DOM ---------------- */
  var host = document.createElement('div');
  host.setAttribute('data-woods-chat', '');
  var root = host.attachShadow({ mode: 'open' });

  var style = document.createElement('style');
  style.textContent = [
    ':host{all:initial}',
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.wrap{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP","Microsoft YaHei",sans-serif}',
    '.launcher{display:flex;align-items:center;gap:8px;height:52px;padding:0 18px 0 14px;border:0;border-radius:999px;background:' + cfg.accent + ';color:#151210;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.28);transition:transform .18s ease,box-shadow .18s ease}',
    '.launcher:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(0,0,0,.34)}',
    '.launcher svg{width:20px;height:20px}',
    '.panel{position:fixed;right:20px;bottom:20px;width:378px;max-width:calc(100vw - 32px);height:564px;max-height:calc(100vh - 40px);display:none;flex-direction:column;background:#16130f;color:#eae4d9;border:1px solid rgba(201,169,110,.28);border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5)}',
    '.panel.open{display:flex}',
    '.head{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(201,169,110,.10),rgba(201,169,110,0))}',
    '.dot{width:8px;height:8px;border-radius:50%;background:#5fd18a;flex:0 0 auto;box-shadow:0 0 0 4px rgba(95,209,138,.14)}',
    '.htitle{font-size:13px;font-weight:600;letter-spacing:.02em}',
    '.hsub{font-size:11px;color:#9a9287;margin-top:2px}',
    '.close{margin-left:auto;background:transparent;border:0;color:#9a9287;font-size:20px;line-height:1;cursor:pointer;padding:6px 8px;border-radius:8px}',
    '.close:hover{color:#eae4d9;background:rgba(255,255,255,.06)}',
    '.log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}',
    '.msg{max-width:86%;font-size:13.5px;line-height:1.65;padding:10px 13px;border-radius:12px;white-space:pre-wrap;word-break:break-word}',
    '.msg.a{align-self:flex-start;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);border-top-left-radius:4px}',
    '.msg.u{align-self:flex-end;background:' + cfg.accent + ';color:#17130f;border-top-right-radius:4px;font-weight:500}',
    '.msg.s{align-self:center;font-size:11.5px;color:#9a9287;text-align:center;max-width:100%;background:transparent;padding:2px}',
    '.typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:rgba(255,255,255,.06);border-radius:12px;border-top-left-radius:4px}',
    '.typing i{width:6px;height:6px;border-radius:50%;background:#9a9287;animation:b 1.2s infinite}',
    '.typing i:nth-child(2){animation-delay:.18s}.typing i:nth-child(3){animation-delay:.36s}',
    '@keyframes b{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}',
    '.quick{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px}',
    '.chip{border:1px solid rgba(201,169,110,.45);background:transparent;color:#d8c49a;font-size:12px;padding:6px 11px;border-radius:999px;cursor:pointer;transition:background .15s,color .15s}',
    '.chip:hover{background:rgba(201,169,110,.14)}',
    '.composer{display:flex;gap:8px;align-items:flex-end;padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.08)}',
    '.composer textarea{flex:1;resize:none;max-height:96px;min-height:40px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#eae4d9;font-size:13.5px;font-family:inherit;line-height:1.5;outline:none}',
    '.composer textarea:focus{border-color:rgba(201,169,110,.6)}',
    '.send{height:40px;padding:0 16px;border:0;border-radius:10px;background:' + cfg.accent + ';color:#17130f;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.send:disabled{opacity:.45;cursor:default}',
    '.foot{padding:0 14px 10px;font-size:10.5px;color:#6f685f;line-height:1.5}',
    '.lead{margin:2px 14px 8px;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:10px 12px;background:rgba(201,169,110,.05)}',
    '.lead p{font-size:11.5px;color:#c9bda8;margin-bottom:6px;line-height:1.5}',
    '.lead label{display:block;font-size:11px;color:#9a9287;margin:5px 0 2px}',
    '.lead input{width:100%;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:#eae4d9;font-size:13px;font-family:inherit;outline:none}',
    '.lead input:focus{border-color:rgba(201,169,110,.6)}',
    '.consent{display:flex;gap:7px;align-items:flex-start;margin:7px 0 2px}',
    '.consent input{margin-top:2px;accent-color:' + cfg.accent + '}',
    '.consent span{font-size:11px;color:#9a9287;line-height:1.5}',
    '.lead .send{width:100%;margin-top:8px}',
    '.err{font-size:11px;color:#e08c7a;margin-top:6px}',
    '.ok{padding:14px;text-align:center;font-size:13px;color:#b9d8bf}',
    '@media (max-width:480px){.panel{right:12px;left:12px;bottom:12px;width:auto;height:74vh;max-height:none}.wrap{right:14px;bottom:14px}}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}',
  ].join('\n');

  var wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.innerHTML = [
    '<button class="launcher" type="button" aria-label="' + T.launcher + '">',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    '<span>' + T.launcher + '</span>',
    '</button>',
    '<div class="panel" role="dialog" aria-modal="false" aria-label="' + T.header + '">',
    '<div class="head"><span class="dot"></span><div><div class="htitle"></div><div class="hsub"></div></div>',
    '<button class="close" type="button" aria-label="' + T.close + '">&times;</button></div>',
    '<div class="log" role="log" aria-live="polite"></div>',
    '<div class="quick"></div>',
    '<div class="composer"><textarea rows="1" placeholder="' + T.placeholder + '" aria-label="' + T.placeholder + '"></textarea>',
    '<button class="send" type="button">' + T.send + '</button></div>',
    '<div class="foot"></div>',
    '</div>',
  ].join('');

  root.appendChild(style);
  root.appendChild(wrap);

  var launcher = wrap.querySelector('.launcher');
  var panel = wrap.querySelector('.panel');
  var log = wrap.querySelector('.log');
  var quick = wrap.querySelector('.quick');
  var ta = wrap.querySelector('textarea');
  var sendBtn = wrap.querySelector('.send');
  var foot = wrap.querySelector('.foot');
  var closeBtn = wrap.querySelector('.close');

  wrap.querySelector('.htitle').textContent = cfg.title;
  wrap.querySelector('.hsub').textContent = T.sub;
  foot.textContent = T.aiNote;

  /* ---------------- rendering ---------------- */
  function scroll() {
    log.scrollTop = log.scrollHeight;
  }

  function bubble(role, text) {
    var d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = String(text).replace(/\*\*/g, '');
    log.appendChild(d);
    scroll();
    return d;
  }

  function typing(on) {
    var ex = log.querySelector('.typing');
    if (on) {
      if (ex) return;
      var d = document.createElement('div');
      d.className = 'typing';
      d.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(d);
      scroll();
    } else if (ex) {
      ex.remove();
    }
  }

  function renderQuick(list) {
    quick.textContent = '';
    (list || []).forEach(function (label) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function () {
        send(label);
      });
      quick.appendChild(b);
    });
  }

  /* ---------------- conversation ---------------- */
  function push(role, content) {
    state.messages.push({ role: role, content: content });
    if (state.messages.length > 24) state.messages = state.messages.slice(-24);
  }

  function send(text) {
    var value = String(text || ta.value || '').trim();
    if (!value || state.busy) return;

    ta.value = '';
    autosize();
    state.busy = true;
    sendBtn.disabled = true;

    bubble('u', value);
    push('user', value);
    state.userTurns += 1;
    renderQuick([]);
    typing(true);

    fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId(),
        messages: state.messages.slice(-16),
        page: location.pathname + location.hash,
        lang: lang,
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        typing(false);
        var reply = (data && data.reply) || T.err + ' ' + cfg.mail;
        bubble('a', reply);
        push('assistant', reply);

        if (state.userTurns >= 3 && !state.leadSent && !state.leadOpen) {
          showLead('');
        }
      })
      .catch(function () {
        typing(false);
        bubble('s', T.err + ' ' + cfg.mail);
      })
      .then(function () {
        state.busy = false;
        sendBtn.disabled = false;
        ta.focus();
      });
  }

  /* ---------------- lead form ---------------- */
  function showLead(prefill) {
    if (state.leadOpen || state.leadSent) return;
    state.leadOpen = true;

    var box = document.createElement('div');
    box.className = 'lead';
    box.innerHTML = [
      '<p>' + T.contactHint + '</p>',
      '<label>' + T.name + '</label><input name="name" type="text" autocomplete="name">',
      '<label>' + T.company + '</label><input name="company" type="text" autocomplete="organization">',
      '<label>' + T.email + '</label><input name="email" type="email" autocomplete="email" required>',
      '<label>' + T.phone + '</label><input name="phone" type="tel" autocomplete="tel">',
      '<div class="consent"><input type="checkbox" id="wc-consent"><span>' + T.consent + '</span></div>',
      '<button class="send" type="button">' + T.submit + '</button>',
      '<div class="err" hidden></div>',
    ].join('');

    renderQuick([]);
    log.appendChild(box);

    var email = box.querySelector('input[name=email]');
    var consent = box.querySelector('#wc-consent');
    var btn = box.querySelector('.send');
    var err = box.querySelector('.err');

    if (prefill && /^\S+@\S+\.\S+$/.test(prefill)) email.value = prefill;

    requestAnimationFrame(function () {
      log.scrollTop = Math.max(0, box.offsetTop - 10);
      (email.value ? box.querySelector('input[name=name]') : email).focus();
    });

    btn.addEventListener('click', function () {
      var val = function (n) {
        var e = box.querySelector('input[name=' + n + ']');
        return e ? e.value.trim() : '';
      };
      var mail = val('email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
        err.textContent = T.invalidEmail;
        err.hidden = false;
        return;
      }
      if (!consent.checked) {
        err.textContent = T.consentReq;
        err.hidden = false;
        return;
      }
      err.hidden = true;
      btn.disabled = true;
      btn.textContent = T.sending;

      // 通知の送信方法：Web3Forms（既存フォームと同じ）か、自前のWorker か
      var transcriptText = state.messages
        .map(function (m) {
          return (m.role === 'user' ? '相談者' : 'AI') + '：' + m.content;
        })
        .join('\n');

      var request;
      if (cfg.web3forms) {
        var fd = new FormData();
        fd.append('access_key', cfg.web3forms);
        fd.append('subject', '【サイトAI受付】' + (val('company') || val('name') || 'お名前未記入') + '様からの新規相談');
        fd.append('from_name', 'Woods AI受付');
        fd.append('name', val('name'));
        fd.append('company', val('company'));
        fd.append('email', mail);
        fd.append('phone', val('phone'));
        fd.append('page', location.href);
        fd.append('message', transcriptText);
        fd.append('botcheck', '');
        request = fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
      } else {
        request = fetch(leadEndpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId(),
            contact: {
              name: val('name'),
              company: val('company'),
              email: mail,
              phone: val('phone'),
              consent: true,
            },
            transcript: state.messages,
            page: location.pathname + location.hash,
            lang: lang,
          }),
        });
      }

      request
        .then(function (r) {
          if (!r.ok) throw new Error('lead');
          return r.json();
        })
        .then(function (data) {
          if (data && data.success === false) throw new Error('lead');
          state.leadSent = true;
          state.leadOpen = false;
          box.remove();
          bubble('s', T.thanks);
          renderQuick([]);
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = T.submit;
          err.textContent = T.err + ' ' + cfg.mail;
          err.hidden = false;
        });
    });
  }

  /* ---------------- open / close ---------------- */
  function autosize() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
  }

  function open() {
    if (state.open) return;
    state.open = true;
    panel.classList.add('open');
    launcher.style.display = 'none';

    if (state.messages.length === 0) {
      bubble('a', T.greeting);
      push('assistant', T.greeting);
      renderQuick(T.quick);
    }
    setTimeout(function () {
      ta.focus();
    }, 120);
  }

  function close() {
    state.open = false;
    panel.classList.remove('open');
    launcher.style.display = '';
  }

  launcher.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  sendBtn.addEventListener('click', function () {
    send();
  });
  ta.addEventListener('input', autosize);
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.open) close();
  });

  if (cfg.nudge) {
    setTimeout(function () {
      if (!state.open) {
        try {
          var n = document.createElement('div');
          n.className = 'msg a';
          n.textContent = T.greeting;
          n.style.position = 'fixed';
          n.style.right = '20px';
          n.style.bottom = '86px';
          n.style.zIndex = '2147482999';
          n.style.maxWidth = '260px';
          n.style.fontSize = '12.5px';
          n.addEventListener('click', function () {
            n.remove();
            open();
          });
          root.appendChild(n);
          setTimeout(function () {
            n.remove();
          }, 12000);
        } catch (e) {}
      }
    }, 25000);
  }

  function mount() {
    document.body.appendChild(host);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.WoodsChat = {
    open: open,
    close: close,
    // 動作確認用（本番では使わない）
    debugLead: function () {
      open();
      setTimeout(function () {
        showLead('');
      }, 200);
    },
  };
})();
