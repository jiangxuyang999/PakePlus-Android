/* ═══════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════ */
const WS_HOST = window.location.hostname;
const WS_URL = `ws://${WS_HOST}:8080`;
const API = window.location.origin;

const CHARACTERS = ["语嫣","芷柔","刘小贝","清漪","婉清","可馨","任彤"];
const CHAR_PINYIN = {
  "语嫣":"yuyan","芷柔":"zhirou","刘小贝":"liuxiaobei",
  "清漪":"qingyi","婉清":"wanqing","可馨":"kexin","任彤":"rentong"
};
const CHAR_COLORS = {
  "语嫣":"#ff6b8a","芷柔":"#ff9eb5","刘小贝":"#b388ff",
  "清漪":"#64b5f6","婉清":"#ffab7a","可馨":"#ffe082","任彤":"#81c784"
};
const CHAR_EMOJI = {
  "语嫣":"👩‍🎨","芷柔":"🐰","刘小贝":"🎸",
  "清漪":"👔","婉清":"👩‍💼","可馨":"🐱","任彤":"📚"
};

// Weather emoji mapping
const WEATHER_EMOJI = {
  "晴":"☀️","多云":"⛅","阴":"☁️","小雨":"🌧️","大雨":"🌧️","雷阵雨":"⛈️","阵雨":"🌦️"
};

// Map positions (percent-based in map container: left%, top%) —竖版600×1100
const HOME_POSITIONS = {
  "语嫣":"13,74","芷柔":"13,74","刘小贝":"27,76",
  "清漪":"77,28","婉清":"70,51","可馨":"70,51","任彤":"13,6",
  "宝宝":"30,7"
};

const PLACE_NAMES = {
  "13,74":"南岸·语嫣芷柔家","27,76":"南岸·小贝loft","77,28":"CBD·清漪家",
  "70,51":"滨江·婉清可馨家","13,6":"大学城·任彤宿舍","30,7":"大学城·宝宝宿舍",
  "8,79":"南岸美院","84,56":"婉清公司","77,27":"清漪公司",
  "22,11":"城北大学","12,14":"大学食堂","30,85":"南岸咖啡馆",
  "58,54":"沿江步道","24,80":"老街小面","82,64":"老张牛肉面",
  "36,7":"蜜雪冰城","68,28":"M out品酒坊","90,35":"山堂茶室",
  "73,26":"国金中心","88,14":"创客空间","82,18":"纯K KTV",
  "12,15":"校园湖","28,16":"篮球场","80,36":"星巴克臻选",
  "90,28":"空中花园","8,32":"滨江公园","14,40":"猫岛咖啡",
  "22,48":"社区超市","16,56":"周末市集","6,64":"老茶馆",
  "12,50":"单向空间","72,58":"CGV影城","58,54":"甜时光下午茶",
  "36,84":"美院画材店","5,95":"南岸美术馆","55,80":"江边灯塔",
  "72,85":"港区老面馆","88,88":"灯塔观景台","80,92":"樱花小径",
  "65,78":"游艇码头","30,36":"河滨花园","35,55":"滨江步道"
};

// Reverse map: location name → coordinates for real-time pin movement
// Built dynamically by fetching server locations + matching frontend POI data
var LOCATION_COORDS = {};
var _LOCATION_MATCHERS = []; // {test: function, coord: string}

// District → coordinate hints for smart matching
var _DISTRICT_COORDS = {
  '南岸': ['13,74','27,76','24,80','30,85','8,79','36,84','20,70'],
  '滨江': ['70,51','58,54','72,58','65,60'],
  'CBD':  ['77,28','73,26','90,35','80,45','75,35'],
  '大学城': ['13,6','30,7','22,11','12,14','28,16','30,20','15,10'],
};
// Build initial mapping from PLACE_NAMES
(function(){
  Object.keys(PLACE_NAMES).forEach(function(k){ LOCATION_COORDS[PLACE_NAMES[k]] = k; });
  // Home positions as name→coord fallback
  Object.keys(HOME_POSITIONS).forEach(function(name){
    var key = HOME_POSITIONS[name];
    var loc = PLACE_NAMES[key];
    if(loc && LOCATION_COORDS[loc]) return;
    LOCATION_COORDS[key] = key;
  });
})();

// Fetch server locations and build smart matchers
function _initLocationCoords(){
  fetch('/api/locations').then(function(r){return r.json()}).then(function(data){
    var locs = data.locations || {};
    Object.keys(locs).forEach(function(id){
      var info = locs[id];
      var name = info.name;
      if(LOCATION_COORDS[name]) return; // already mapped exactly
      // Smart match: find best POI match by district + keyword
      var district = info.district || '';
      var candidates = _DISTRICT_COORDS[district] || [];
      var best = null;
      // Try to find PLACE_NAMES entry that shares keywords with this name
      Object.keys(PLACE_NAMES).forEach(function(coord){
        var pname = PLACE_NAMES[coord];
        // Check if any meaningful keyword matches (skip common words)
        var kw = name.replace(/[·（(]/g,' ').replace(/[）)]/g,'').split(' ').filter(function(w){return w.length>=2;});
        for(var i=0;i<kw.length;i++){
          if(pname.indexOf(kw[i]) !== -1 || kw[i].indexOf(pname.slice(0,2)) !== -1){
            best = coord;
            break;
          }
        }
      });
      if(best){
        LOCATION_COORDS[name] = best;
      } else {
        // Fallback: if district known, use first district coordinate
        if(candidates.length > 0){
          LOCATION_COORDS[name] = candidates[0];
        }
      }
    });
  }).catch(function(){});
}
// Call on load
_initLocationCoords();

function _avatarUrl(pinyin){
  // Fix: 刘小贝的 avatar 文件名是 xiaobei.png 不是 liuxiaobei.png
  if (pinyin === 'liuxiaobei') return '/avatars/xiaobei.png?v=9';
  return '/avatars/'+pinyin+'.png?v=9';
}
// Avatar initial colors (deterministic per name)
var _avtColors = {
  yuyan:'#ff6b8a', zhirou:'#ff9eb5', liuxiaobei:'#b388ff',
  qingyi:'#64b5f6', wanqing:'#9575cd', kexin:'#4db6ac', rentong:'#ff8a65', baobao:'#ffab40'
};
function _avtInitial(pinyin){
  var map = {yuyan:'语',zhirou:'芷',liuxiaobei:'贝',qingyi:'清',wanqing:'婉',kexin:'可',rentong:'彤',baobao:'宝'};
  return map[pinyin] || pinyin[0] || '?';
}
function _avtColor(pinyin){
  return _avtColors[pinyin] || '#999';
}

/* ═══════════════════════════════════════════
   DOM HELPERS
   ═══════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Toast
let toastTimer = null;
function toast(msg, dur=2000){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), dur);
}

/* ═══════════════════════════════════════════
   TAB SWITCHING
   ═══════════════════════════════════════════ */
let currentTab = 'chat';
function switchTab(tab){
  if(currentTab === tab) return;
  currentTab = tab;
  // Update pages
  $$('.page').forEach(p=>p.classList.remove('active'));
  const pageEl = document.getElementById('page-'+tab);
  if(pageEl) pageEl.classList.add('active');
  // Update tab buttons
  $$('.tab-btn').forEach(b=>b.classList.remove('active'));
  const btnEl = document.getElementById('tabBtn-'+tab);
  if(btnEl) btnEl.classList.add('active');
  // Clear chat badge when entering chat
  if(tab === 'chat'){
    const badge = document.getElementById('chatBadge');
    badge.textContent = '';
    _ensureStatusBar();
    setTimeout(()=>{
      const list = document.getElementById('msgList');
      if(list) list.scrollTop = list.scrollHeight;
    },100);
  }
  // Hide map sheet when leaving map tab
  if(tab !== 'map'){
    const sheet = document.getElementById('mapInfoCard');
    if(sheet) sheet.classList.remove('visible');
  }
  // Trigger tab-specific refresh
  if(tab === 'map') refreshMap();
  if(tab === 'chars') refreshCharacters();
  if(tab === 'world') refreshWorld();
}

/* ═══════════════════════════════════════════
   WEBSOCKET (Chat Tab)
   ═══════════════════════════════════════════ */
let ws = null;
let wsReconnectAttempts = 0;
let wsReconnectTimer = null;

var pollTimer;  // global, used by connectWS polling
var lastPollTime = 0;  // global, used by HTTP message polling
var _msgCounter = 0;  // global, used by multi-select row IDs
var _multiSelectMode = false;  // global, used by multi-select mode toggle
var _selectedMsgRows = [];
var _historyLoaded = false;  // guard against race: saveChatHistory before loadChatHistory completes
function connectWS(){
  // Always start HTTP polling — works even when WebSocket is blocked
  updateConnStatus('online');
  // lastPollTime stays at 0 so first poll catches all queued messages (init_queue etc.)
  if(pollTimer) clearInterval(pollTimer);
  // Defer first poll until history loaded to prevent race:
  // saveChatHistory() from handleWSMessage would overwrite localStorage
  // before user messages from loadChatHistory are in the DOM
  function _startPolling(){
    // After history load, set lastPollTime to server time before first real poll,
    // so already-rendered history (from localStorage) is not re-fetched.
    fetch(API+'/api/chat/poll?since=0').then(function(r){return r.json()}).then(function(d){
      if(d.now) lastPollTime = d.now;
      pollMessages();
      pollTimer = setInterval(pollMessages, 1000);
    }).catch(function(){
      // Fallback: poll normally (risk of dupes but better than no polling)
      pollMessages();
      pollTimer = setInterval(pollMessages, 1000);
    });
  }
  if(_historyLoaded){ _startPolling(); }
  else {
    var _prc=setInterval(function(){ if(_historyLoaded){ clearInterval(_prc); _startPolling(); } }, 50);
    // Safety: force start after 5s even if history load hangs
    setTimeout(function(){ if(!_historyLoaded){ _historyLoaded=true; } }, 5000);
  }
  // Fetch goals for character cards
  fetchGoals();

  // Also try WebSocket (may be blocked by Chrome LNA, but try anyway)
  if(ws && ws.readyState === WebSocket.OPEN) return;
  try { ws = new WebSocket(WS_URL); }
  catch(e){ console.log('[WS] WebSocket not available, using HTTP polling'); return; }

  ws.onopen = () => {
    console.log('[WS] connected');
    wsReconnectAttempts = 0;
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      handleWSMessage(data);
    } catch(err) {}
  };

  ws.onclose = () => {
    console.log('[WS] closed');
    scheduleReconnect();
  };

  ws.onerror = () => {
    // WebSocket failed — HTTP polling already active, so just close silently
    try { ws.close(); } catch(e){}
  };
}

function scheduleReconnect(){
  if(wsReconnectTimer) return;
  const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 30000);
  wsReconnectAttempts++;
  console.log('[WS] Reconnecting in '+delay+'ms (attempt '+wsReconnectAttempts+')');
  wsReconnectTimer = setTimeout(()=>{
    wsReconnectTimer = null;
    connectWS();
  }, delay);
}

function updateConnStatus(status){
  const dot = document.getElementById('connDot');
  const label = document.getElementById('connLabel');
  if(!dot||!label) return;
  dot.className = 'conn-dot ' + (status==='online'?'online':'offline');
  if(status==='online') label.textContent = '已连接';
  else if(status==='connecting') label.textContent = '连接中...';
  else label.textContent = '已断开';
}

var _seenMsgTs = [];  // ordered array for predictable dedup
var _lastMsgTime = 0;

function _renderMsg(msg){
  var list = document.getElementById('msgList');
  if(!list) return;
  var emptyEl = list.querySelector('.empty-state');
  if(emptyEl) emptyEl.remove();
  var typingEl = list.querySelector('.msg-typing');
  if(typingEl) typingEl.remove();

  var isAtBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;

  var role = msg.role || 'char';
  var charName = msg.char || '';
  var pinyin = CHAR_PINYIN[charName] || '';
  var color = CHAR_COLORS[charName] || '#888';
  var isUser = (role === 'user');

  // Time divider (if > 5 min gap)
  var msgTime = msg.time || Date.now();
  if(_lastMsgTime && (msgTime - _lastMsgTime) > 300000){
    var td = document.createElement('div');
    td.className = 'time-divider';
    var d = new Date(msgTime);
    td.innerHTML = '<span>'+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+'</span>';
    list.appendChild(td);
  }
  _lastMsgTime = msgTime;

  var row = document.createElement('div');
  row.className = 'msg-row '+(isUser ? 'self' : 'other');
  if(msg._id) row.setAttribute('data-msgid', msg._id);

  // Avatar HTML
  var avtColor = _avtColor(pinyin);
  var avtHTML;
  if(isUser){
    avtHTML = '<div class="msg-avatar" style="background:'+_avtColor('baobao')+'" title="我">'+
      '<img src="'+_avatarUrl('baobao')+'" alt="我" loading="eager" style="width:100%;height:100%;object-fit:cover">'+
      '</div>';
  } else {
    avtHTML = '<div class="msg-avatar" style="background:'+avtColor+'22" title="'+charName+'">'+
      '<img src="'+_avatarUrl(pinyin)+'" alt="'+charName+'" loading="eager" style="width:100%;height:100%;object-fit:cover">'+
      '</div>';
  }

  // Sender name
  var senderHTML = '';
  if(!isUser && charName){
    var loc = (charStateCache[charName]||{}).location || '';
    senderHTML = '<div class="msg-sender" style="color:'+color+'">'+charName+
      (loc?' <span style="font-size:9px;color:var(--text2);font-weight:400">📍'+loc+'</span>':'')+
      '</div>';
  }

  // Time
  var timeStr = ('0'+new Date(msgTime).getHours()).slice(-2)+':'+('0'+new Date(msgTime).getMinutes()).slice(-2);

  // Build bubble based on type
  var bubbleHTML = '';
  var msgType = msg.type || 'text';

	  if(msgType === 'image'){
	    var imgUrl = msg.imageUrl || msg.url || '';
	    var thumbUrl = msg.thumbUrl || msg.thumbnail || imgUrl;
	    senderHTML = '<div class="msg-sender" style="color:'+color+'">'+charName+' 发来一张照片</div>';
	    bubbleHTML =
	      '<div class="msg-bubble img-bubble" '+
	        'data-image-url="'+escapeAttr(imgUrl)+'" '+
	        'data-thumb-url="'+escapeAttr(thumbUrl)+'" '+
	        'onclick="showImageModal(this.dataset.imageUrl,this.dataset.thumbUrl)" '+
	        'style="position:relative;padding:3px;overflow:hidden;min-width:206px;min-height:156px;">'+
	        '<div class="img-skeleton" '+
	          'style="position:absolute;inset:3px;z-index:2;min-width:200px;min-height:150px;'+
	          'border-radius:5px;overflow:hidden;'+
	          'background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);'+
	          'background-size:200% 100%;animation:shimmer 1.5s infinite;'+
	          'display:flex;align-items:center;justify-content:center;'+
	          'font-size:13px;color:var(--text2);line-height:1.4;text-align:center;padding:8px;'+
	          'pointer-events:none;">加载中...</div>'+
	        '<img src="'+escapeAttr(thumbUrl)+'" '+
	          'data-full-src="'+escapeAttr(imgUrl)+'" '+
	          'data-thumb-src="'+escapeAttr(thumbUrl)+'" '+
	          'loading="eager" decoding="async" '+
	          'style="width:100%;min-width:200px;min-height:150px;max-width:260px;max-height:260px;'+
	          'visibility:visible;opacity:1;display:block;position:relative;z-index:1;'+
	          'object-fit:cover;border-radius:5px;" '+
	          'onload="var sk=this.previousElementSibling;if(sk)sk.style.display=\'none\';" '+
	          'onerror="var sk=this.previousElementSibling;var full=this.getAttribute(\'data-full-src\')||\'\';'+
	            'if(full && this.getAttribute(\'data-fallbacked\')!==\'1\'){'+
	              'this.setAttribute(\'data-fallbacked\',\'1\');'+
	              'this.src=(full.split(\'?\')[0]+\'?v=\'+Date.now());return;}'+
	            'if(sk){sk.style.display=\'flex\';sk.textContent=\'🖼 点击重试\';sk.style.pointerEvents=\'auto\';sk.style.cursor=\'pointer\';'+
	            'sk.onclick=function(e){e.stopPropagation();var i=this.nextElementSibling;if(i){i.removeAttribute(\'data-fallbacked\');i.src=(i.getAttribute(\'data-full-src\')||i.src).split(\'?\')[0]+\'?v=\'+Date.now();}};}" '+
	        '>'+
	      '</div>';
	  } else if(msgType === 'voice'){
    var voiceUrl = msg.voiceUrl || msg.url || '';
    var voiceId = 'v-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
    senderHTML = '<div class="msg-sender" style="color:'+color+'">'+charName+' 语音消息</div>';
    bubbleHTML = '<div class="msg-bubble voice-bubble" onclick="playVoice(this,\''+escapeAttr(voiceUrl)+'\',\''+voiceId+'\')">'+
      '<span class="play-icon">▶️</span>'+
      '<div class="voice-bar"><div class="voice-bar-fill" id="'+voiceId+'"></div></div>'+
      '<span style="font-size:11px;color:var(--text2)">🔊</span>'+
      '</div>';
  } else {
    // Text message
    var displayText;
    if(msg.html && msg.html.length > 0){
      // From history: use pre-rendered HTML with line breaks intact
      displayText = msg.html;
    } else {
      var text = msg.text || '';
// Strip [语音] markers from display (voice bubble icon handles the indicator)
      text = text.replace(/\[语音\]\s*/g, '');
      text = text.replace(/\s*\[图片:[^\]]+\]/g, '');
      text = text.replace(/（([^）]+)）\s*"([^"]+)"/g, '（$1）\n$2');
      text = text.replace(/"([^"]+)"/g, '$1');
      displayText = escapeHtml(text).replace(/\n/g,'<br>');
      if(isUser) displayText = escapeHtml(text);
    }
    bubbleHTML = '<div class="msg-bubble">'+displayText+'</div>';
  }

  // Add checkbox for multi-select mode
  var cbWrap = '<div class="msg-checkbox-wrap"><div class="msg-checkbox" data-row-id="'+(_msgCounter++)+'"></div></div>';
  row.dataset.rowId = _msgCounter-1;
  row.innerHTML = cbWrap + avtHTML +
    '<div class="msg-col">'+
    senderHTML +
    bubbleHTML +
    '<div class="msg-time">'+timeStr+'</div>'+
    '</div>';

  // Click to toggle multi-select
  row.addEventListener('click', function(e){
    if(_multiSelectMode){
      e.stopPropagation();
      _toggleMsgRow(row);
    }
  });

  // Long press → action menu
  var pressTimer, pressX, pressY;
  row.addEventListener('touchstart', function(e){
    var t = e.touches[0];
    pressX = t.clientX; pressY = t.clientY;
    pressTimer = setTimeout(function(){ _showMsgActions(row); }, 600);
  }, {passive: true});
  row.addEventListener('touchend', function(){ clearTimeout(pressTimer); });
  row.addEventListener('touchmove', function(e){
    var t = e.touches[0];
    if(Math.abs(t.clientX-pressX)>10 || Math.abs(t.clientY-pressY)>10) clearTimeout(pressTimer);
  }, {passive: true});

  list.appendChild(row);
  if(isAtBottom){
    requestAnimationFrame(function(){ list.scrollTop = list.scrollHeight; });
  }
}

function _showMsgActions(row){
  // Don't show action menu in multi-select mode
  if(_multiSelectMode) return;

  // Get message text for copy
  var bubble = row.querySelector('.msg-bubble');
  var msgText = '';
  var isImage = bubble && bubble.classList.contains('img-bubble');
  var isVoice = bubble && bubble.classList.contains('voice-bubble');
  if(!isImage && !isVoice && bubble){
    msgText = bubble.textContent || '';
  }

  var overlay = document.createElement('div');
  overlay.className = 'msg-action-overlay';
  overlay.innerHTML =
    '<div class="msg-action-menu">'+
      (!isImage && !isVoice && msgText ? '<button class="msg-action-item" data-action="copy"><span class="icon">📋</span> 复制</button>' : '')+
      '<button class="msg-action-item" data-action="multi"><span class="icon">☑️</span> 多选</button>'+
      '<button class="msg-action-item danger" data-action="delete"><span class="icon">🗑</span> 删除</button>'+
    '</div>';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e){
    var btn = e.target.closest('.msg-action-item');
    if(btn){
      var action = btn.dataset.action;
      overlay.remove();
      if(action === 'copy'){
        _copyMsgText(msgText);
      } else if(action === 'multi'){
        _enterMultiSelect();
      } else if(action === 'delete'){
        _confirmDeleteSingle(row);
      }
    }
  });
  // Tap outside to close
  setTimeout(function(){
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) overlay.remove();
    });
  }, 50);
}

function _copyMsgText(text){
  if(!text) return;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      toast('✅ 已复制');
    }).catch(function(){
      _fallbackCopy(text);
    });
  } else {
    _fallbackCopy(text);
  }
}

function _fallbackCopy(text){
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast('✅ 已复制');
  } catch(e){ toast('❌ 复制失败'); }
  document.body.removeChild(ta);
}

function _confirmDeleteSingle(row){
  var overlay = document.createElement('div');
  overlay.className = 'msg-action-overlay';
  overlay.innerHTML = '<div class="msg-delete-dialog">'+
    '<p>删除这条消息？</p>'+
    '<div class="dd-btns">'+
    '<button class="dd-btn-cancel">取消</button>'+
    '<button class="dd-btn-confirm">删除</button>'+
    '</div></div>';
  overlay.querySelector('.dd-btn-cancel').onclick = function(){ overlay.remove(); };
  overlay.querySelector('.dd-btn-confirm').onclick = function(){
    row.remove();
    overlay.remove();
    saveChatHistory();
  };
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function _enterMultiSelect(){
  _multiSelectMode = true;
  _selectedMsgRows = [];
  var rows = document.querySelectorAll('#msgList .msg-row');
  rows.forEach(function(r){ r.classList.add('multi-select-mode'); });
  _updateMultiSelectBar();
}

function _exitMultiSelect(){
  _multiSelectMode = false;
  _selectedMsgRows = [];
  var rows = document.querySelectorAll('#msgList .msg-row');
  rows.forEach(function(r){
    r.classList.remove('multi-select-mode', 'selected');
    var cb = r.querySelector('.msg-checkbox');
    if(cb) cb.classList.remove('checked');
  });
  _updateMultiSelectBar();
}

function _toggleMsgRow(row){
  if(!_multiSelectMode) return;
  var cb = row.querySelector('.msg-checkbox');
  if(!cb) return;
  var idx = _selectedMsgRows.indexOf(row);
  if(idx >= 0){
    _selectedMsgRows.splice(idx, 1);
    cb.classList.remove('checked');
    row.classList.remove('selected');
  } else {
    _selectedMsgRows.push(row);
    cb.classList.add('checked');
    row.classList.add('selected');
  }
  _updateMultiSelectBar();
}

function _updateMultiSelectBar(){
  var bar = document.getElementById('multiSelectBar');
  var count = _selectedMsgRows.length;
  if(!_multiSelectMode){
    if(bar) bar.classList.remove('active');
    return;
  }
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'multiSelectBar';
    bar.className = 'multi-select-bar';
    bar.innerHTML =
      '<span class="sel-count">已选 <strong id="selCount">0</strong> 条</span>'+
      '<button class="ms-btn ms-btn-primary" id="msCopyAll">复制</button>'+
      '<button class="ms-btn ms-btn-danger" id="msDelete">删除</button>'+
      '<button class="ms-btn ms-btn-cancel" id="msCancel">取消</button>';
    document.body.appendChild(bar);
    document.getElementById('msCopyAll').onclick = _copySelectedMsgs;
    document.getElementById('msDelete').onclick = _confirmDeleteSelected;
    document.getElementById('msCancel').onclick = _exitMultiSelect;
  }
  document.getElementById('selCount').textContent = count;
  if(count > 0){
    bar.classList.add('active');
  } else {
    // Keep bar visible but show "select messages" state
    bar.classList.add('active');
  }
}

function _copySelectedMsgs(){
  var texts = [];
  _selectedMsgRows.forEach(function(row){
    var bubble = row.querySelector('.msg-bubble');
    if(bubble && !bubble.classList.contains('img-bubble') && !bubble.classList.contains('voice-bubble')){
      var t = bubble.textContent || '';
      if(t.trim()) texts.push(t.trim());
    }
  });
  if(texts.length === 0){ toast('选中的消息无可复制内容'); return; }
  var full = texts.join('\n---\n');
  _copyMsgText(full);
  _exitMultiSelect();
}

function _confirmDeleteSelected(){
  if(_selectedMsgRows.length === 0) return;
  var overlay = document.createElement('div');
  overlay.className = 'msg-action-overlay';
  overlay.innerHTML = '<div class="msg-delete-dialog">'+
    '<p>删除选中的 '+_selectedMsgRows.length+' 条消息？</p>'+
    '<div class="dd-btns">'+
    '<button class="dd-btn-cancel">取消</button>'+
    '<button class="dd-btn-confirm">删除</button>'+
    '</div></div>';
  overlay.querySelector('.dd-btn-cancel').onclick = function(){ overlay.remove(); };
  overlay.querySelector('.dd-btn-confirm').onclick = function(){
    _deleteSelectedMsgs();
    overlay.remove();
  };
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function _deleteSelectedMsgs(){
  _selectedMsgRows.forEach(function(row){ row.remove(); });
  var count = _selectedMsgRows.length;
  _exitMultiSelect();
  saveChatHistory();
  toast('✅ 已删除 '+count+' 条消息');
}

function clearChatHistory(){
  var dialog = document.createElement('div');
  dialog.className = 'msg-delete-overlay';
  dialog.innerHTML = '<div class="msg-delete-dialog">'+
    '<p>清空所有聊天记录？<br><small style="color:var(--text2)">此操作不可恢复</small></p>'+
    '<div class="dd-btns">'+
    '<button class="dd-btn-cancel">取消</button>'+
    '<button class="dd-btn-confirm">清空</button>'+
    '</div></div>';
  dialog.querySelector('.dd-btn-cancel').onclick = function(){ dialog.remove(); };
  dialog.querySelector('.dd-btn-confirm').onclick = function(){
    localStorage.removeItem(CHAT_STORAGE_KEY);
    // Clear IndexedDB too
    idbOpen().then(function(db){
      var tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).clear();
      tx.oncomplete = function(){ db.close(); };
    }).catch(function(){});
    var list = document.getElementById('msgList');
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>欢迎来到江城<br>输入消息开始对话</p></div>';
    _lastMsgTime = 0;
    _seenMsgTs = [];
    // Also clear server-side message queue
    fetch(API + '/api/clear_queue', {method:'POST'}).catch(function(){});
    dialog.remove();
  };
  dialog.addEventListener('click', function(e){ if(e.target === dialog) dialog.remove(); });
  document.body.appendChild(dialog);
}

function togglePins(){
  var pins = document.querySelectorAll('.map-pin');
  var shown = localStorage.getItem('pinVisible') !== '0';
  pins.forEach(function(p){ p.style.display = shown ? 'none' : ''; });
  localStorage.setItem('pinVisible', shown ? '0' : '1');
  var btn = document.getElementById('pinToggleBtn');
  if(btn) btn.textContent = shown ? '👤 显示' : '👤 隐藏';
}


// ── enhanced typing indicator ──
var _typingTimers = {};
function addTypingIndicator(char){
  var list = document.getElementById('msgList');
  if(!list) return;
  // Don't show if already showing for this char
  var existing = list.querySelector('.msg-typing[data-char="'+char+'"]');
  if(existing) {
    clearTimeout(_typingTimers[char]);
    _typingTimers[char] = setTimeout(function(){ removeTypingIndicator(char); }, 8000);
    return;
  }
  var div = document.createElement('div');
  div.className = 'msg-typing';
  div.setAttribute('data-char', char);
  div.innerHTML =
    '<span style="color:'+(CHAR_COLORS[char]||'#ccc')+'">'+(char||'AI')+' 正在输入</span>'+
    '<span class="typing-dots"><span></span><span></span><span></span></span>';
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
  clearTimeout(_typingTimers[char]);
  _typingTimers[char] = setTimeout(function(){ removeTypingIndicator(char); }, 8000);
}
function removeTypingIndicator(char){
  var list = document.getElementById('msgList');
  if(!list) return;
  var el = list.querySelector('.msg-typing[data-char="'+char+'"]');
  if(el) el.remove();
  delete _typingTimers[char];
}

function handleWSMessage(msg){
  // Dedup by timestamp (ordered array, predictable behavior)
  if(msg._ts && _seenMsgTs.indexOf(msg._ts) >= 0) return;
  if(msg._ts){
    _seenMsgTs.push(msg._ts);
    if(_seenMsgTs.length > 200) _seenMsgTs = _seenMsgTs.slice(-100);
  }

  switch(msg.type){
    case 'chat':
      var text = msg.text || '';
      var charPattern = /^(\S+):\s*/;
      var lines = text.split(/\n(?=\S+:)/);
      if(lines.length > 1){
        lines.forEach(function(line, i){
          var m = line.match(charPattern);
          var c = m ? m[1] : (msg.char || '');
          var t = line.replace(charPattern, '').trim();
          if(t) setTimeout(function(){
            _renderMsg({role:'char', char:c, type:'text', text:t, time:Date.now(), _id:msg._ts});
          }, i * 1000);
        });
      } else {
        _renderMsg({role:'char', char:msg.char, type:'text', text:text, time:Date.now(), _id:msg._ts});
      }
      break;
    case 'image':
      _renderMsg({role:'char', char:msg.char, type:'image', imageUrl:msg.url, thumbUrl:msg.thumbnail||msg.url, time:Date.now(), _id:msg._ts});
      break;
    case 'voice':
      _renderMsg({role:'char', char:msg.char, type:'voice', voiceUrl:msg.url, time:Date.now(), _id:msg._ts});
      break;
    case 'typing':
      addTypingIndicator(msg.char);
      break;
    case 'pleasure_update':
      if(msg.data){
        Object.entries(msg.data).forEach(function(e){
          charStateCache[e[0]] = Object.assign({}, charStateCache[e[0]]||{}, e[1]);
        });
        if(expandedChar) renderCharCtrl(expandedChar);
        refreshCharStatusBar();
      }
      break;
    case 'state_update':
      if(msg.states){
        Object.entries(msg.states).forEach(function(e){
          var name = e[0];
          var state = e[1];
          charStateCache[name] = Object.assign({}, charStateCache[name]||{}, state);
          // Real-time map: move pin if location changed
          var locName = state.location_name;
          var pinyin = CHAR_PINYIN[name];
          if(locName && pinyin && LOCATION_COORDS[locName]){
            var coords = LOCATION_COORDS[locName].split(',');
            if(coords.length === 2){
              var pin = document.getElementById('pin-'+pinyin);
              if(pin){
                pin.style.left = coords[0]+'%';
                pin.style.top = coords[1]+'%';
                pin.style.transition = 'left .8s ease, top .8s ease';
                pin.style.display = '';
              }
            }
          }
        });
        // Re-aggregate: build fresh position map from DOM
        var posGroups = {};
        CHARACTERS.forEach(function(n){
          var p = document.getElementById('pin-'+CHAR_PINYIN[n]);
          if(!p) return;
          var k = Math.round(parseFloat(p.style.left)) + ',' + Math.round(parseFloat(p.style.top));
          if(!posGroups[k]) posGroups[k] = [];
          posGroups[k].push(n);
        });
        // Clear all old badges
        document.querySelectorAll('.pin-count-badge').forEach(function(b){b.remove();});
        // Recreate badges, hide overflow pins
        Object.keys(posGroups).forEach(function(k){
          var names = posGroups[k];
          if(names.length < 2) return;
          var first = document.getElementById('pin-'+CHAR_PINYIN[names[0]]);
          if(!first) return;
          var badge = document.createElement('div');
          badge.className = 'pin-count-badge';
          badge.textContent = '+' + (names.length - 1);
          badge.style.cssText = 'position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:'+(CHAR_COLORS[names[0]]||'#888')+';color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:12;box-shadow:0 1px 4px rgba(0,0,0,.25)';
          first.appendChild(badge);
          for(var i=1;i<names.length;i++){
            var op = document.getElementById('pin-'+CHAR_PINYIN[names[i]]);
            if(op) op.style.display = 'none';
          }
        });
        refreshCharStatusBar();
      }
      break;
      case 'new_photo':
        if(msg.char && msg.url){
          var pinyin = CHAR_PINYIN[msg.char];
          if(pinyin){
            var grid = document.getElementById('photoGrid_'+pinyin);
            if(grid) showCharPopup(msg.char);
          }
        }
        break;
    }

  // Badge on chat tab if not looking at it
  if(currentTab !== 'chat'){
    var badge = document.getElementById('chatBadge');
    var current = parseInt(badge.textContent) || 0;
    if(msg.type !== 'typing') badge.textContent = current + 1;
  }

  // Persist all visible message types to localStorage
  if(msg.type === 'chat' || msg.type === 'image' || msg.type === 'voice'){
    saveChatHistory();
  }
}

function showImageModal(url, thumbUrl){
  thumbUrl = thumbUrl || url;  // fallback if no thumbnail
  var modal = document.createElement('div');
  modal.className = 'img-modal';
  modal.innerHTML = '<div class="close-btn">✕</div>'+
    '<div class="modal-spinner"></div>'+
    '<img src="'+thumbUrl+'" style="cursor:pointer;display:block" loading="eager">'+
    '<div class="modal-err" style="display:none;color:rgba(255,255,255,.6);font-size:14px;cursor:pointer">加载失败，点击重试</div>';
  document.body.appendChild(modal);

  var img = modal.querySelector('img');
  var spinner = modal.querySelector('.modal-spinner');
  var errEl = modal.querySelector('.modal-err');
  var fullLoaded = false;

  function showFull(){
    fullLoaded = true;
    spinner.style.display = 'none';
    errEl.style.display = 'none';
    img.style.filter = 'blur(0px)';
  }

  // Show thumbnail immediately (already in DOM via src attr)
  if(thumbUrl !== url){
    // Thumbnail shown; preload full image in background
    var preload = new Image();
    var loadTimeout = setTimeout(function(){
      if(!fullLoaded){ spinner.style.display = 'none'; errEl.style.display = 'block'; }
    }, 10000);
    preload.onload = function(){
      clearTimeout(loadTimeout);
      img.src = preload.src;
      showFull();
    };
    preload.onerror = function(){
      clearTimeout(loadTimeout);
      // Full image failed but thumbnail is already visible — show subtle error
      if(!fullLoaded){ errEl.style.display = 'block'; spinner.style.display = 'none'; }
    };
    preload.src = url;
  } else {
    // No separate thumbnail; spinner while loading the only URL
    img.style.display = 'none';
    spinner.style.display = 'block';
    var preload2 = new Image();
    var loadTimeout2 = setTimeout(function(){
      if(!fullLoaded){ spinner.style.display = 'none'; errEl.style.display = 'block'; }
    }, 10000);
    preload2.onload = function(){
      clearTimeout(loadTimeout2);
      img.src = preload2.src;
      img.style.display = 'block';
      showFull();
    };
    preload2.onerror = function(){
      clearTimeout(loadTimeout2);
      spinner.style.display = 'none';
      errEl.style.display = 'block';
    };
    preload2.src = url;
  }

  modal.querySelector('.close-btn').onclick = function(){ modal.remove(); };
  modal.addEventListener('click', function(e){ if(e.target === modal) modal.remove(); });
  img.addEventListener('click', function(e){ e.stopPropagation(); modal.remove(); });

  // Retry handler
  errEl.onclick = function(e){
    e.stopPropagation();
    errEl.style.display = 'none';
    spinner.style.display = 'block';
    var retryUrl = url.split('?')[0] + '?v=' + Date.now();
    var retryImg = new Image();
    retryImg.onload = function(){
      img.src = retryImg.src;
      img.style.display = 'block';
      showFull();
    };
    retryImg.onerror = function(){
      spinner.style.display = 'none';
      errEl.style.display = 'block';
    };
    retryImg.src = retryUrl;
  };
}
async function handleFileUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 20*1024*1024){ toast('文件太大，最大 20MB'); return; }
  if(!file.type.startsWith('image/')){ toast('只支持图片文件'); return; }

  toast('⏳ 上传中...');
  const formData = new FormData();
  formData.append('file', file);

  try {
    const r = await fetch(`${API}/api/photos/${_uploadPinyin}/upload`, {
      method: 'POST',
      body: formData,
    });
    const d = await r.json();
    if(d.ok){
      toast('✅ 已添加到'+_uploadChar+'的美照');
      // Cache locally via Service Worker
      if('caches' in window){
        try {
          const cache = await caches.open('jc_v3');
          if(d.url) cache.add(d.url);
          if(d.thumbnail && d.thumbnail !== d.url) cache.add(d.thumbnail);
        } catch(_){}
      }
      // Refresh photo gallery
      const grid = document.getElementById('photoGrid_'+_uploadPinyin);
      if(grid){
        const thumb = d.thumbnail || d.url;
        grid.insertAdjacentHTML('beforeend',
          '<img src="'+thumb+'" onclick="showImageModal(\''+d.url+'\')" onerror="this.style.display=\'none\'">');
      }
    } else {
      toast('❌ '+(d.error||'上传失败'));
    }
  } catch(ex){
    toast('❌ 网络错误: '+ex.message);
  }
  // Reset file input for re-upload of same file
  e.target.value = '';
}

var _currentVoice = null;  // global: prevent overlapping playback

function playVoice(el, url, voiceId){
  // If clicking the same voice that was playing, just stop (toggle)
  if(_currentVoice && _currentVoice.url === url){
    try { _currentVoice.audio.pause(); } catch(e){}
    el.querySelector('.play-icon').textContent = '▶️';
    var oldFill = document.getElementById(voiceId);
    if(oldFill) oldFill.style.width = '0';
    if(_currentVoice.animId) cancelAnimationFrame(_currentVoice.animId);
    _currentVoice = null;
    return;
  }

  // Stop any other playing voice
  if(_currentVoice){
    try { _currentVoice.audio.pause(); } catch(e){}
    if(_currentVoice.el){
      _currentVoice.el.querySelector('.play-icon').textContent = '▶️';
      var prevFill = document.getElementById(_currentVoice.voiceId);
      if(prevFill) prevFill.style.width = '0';
    }
    if(_currentVoice.animId) cancelAnimationFrame(_currentVoice.animId);
    _currentVoice = null;
  }

  const icon = el.querySelector('.play-icon');
  const fill = document.getElementById(voiceId);
  const audio = new Audio(url);
  icon.textContent = '⏸️';
  let startTime = Date.now();
  let animId;
  let duration = 5; // fallback

  audio.onloadedmetadata = ()=>{
    duration = audio.duration || 5;
  };

  function anim(){
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed/(duration*1000), 1);
    if(fill) fill.style.width = (progress*100)+'%';
    if(progress < 1 && !audio.paused) animId = requestAnimationFrame(anim);
  }
  audio.play();
  anim();
  _currentVoice = {audio, el, voiceId, animId, url};

  audio.onended = ()=>{
    icon.textContent = '▶️';
    if(fill) fill.style.width = '0';
    cancelAnimationFrame(animId);
    _currentVoice = null;
  };
  audio.onerror = ()=>{
    icon.textContent = '▶️';
    toast('无法播放语音');
    _currentVoice = null;
  };
}

function pollMessages(){
  fetch(`${API}/api/chat/poll?since=${lastPollTime}`)
    .then(r=>r.json())
    .then(data=>{
      const msgs = data.messages || [];
      if(data.now) lastPollTime = data.now;
      // Pace messages like Feishu bot: stagger with 500ms-1s delays
      // so they appear naturally one by one, not all at once
      msgs.forEach(function(m, i){
        setTimeout(function(){ handleWSMessage(m); }, i * 800);
      });
      refreshCharStatusBar();
    })
    .catch(()=>{});
}

function sendMessage(){
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if(!text) return;
  input.value = '';
  input.focus();

  // Render user message on RIGHT side (WeChat style)
  _renderMsg({role:'user', type:'text', text:text, time:Date.now()});
  saveChatHistory();

  // Send via WebSocket or HTTP
  if(ws && ws.readyState === WebSocket.OPEN){
    addTypingIndicator('');
    ws.send(JSON.stringify({type:'chat', text:text}));
  } else {
    fetch(API+'/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text:text})
    }).then(function(r){return r.json()})
      .then(function(data){
        if(data.ok || data.queued){
          addTypingIndicator('');
        } else {
          toast('发送失败: '+(data.error||'未知错误'));
        }
      })
      .catch(function(e){ toast('网络错误: '+e.message); });
  }
}

function triggerUpload(pinyin, charName){
  _uploadPinyin = pinyin;
  _uploadChar = charName;
  document.getElementById('photoUploadInput').click();
}


function renderMap(){
  const container = document.getElementById('mapContainer');
  container.innerHTML = `<svg viewBox="0 0 600 1100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <!-- ═══ GRADIENTS ═══ -->
  <linearGradient id="gradRiver" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#9bc5d4"/>
    <stop offset="30%" stop-color="#7aafc0"/>
    <stop offset="50%" stop-color="#6a9eb0"/>
    <stop offset="70%" stop-color="#7aafc0"/>
    <stop offset="100%" stop-color="#9bc5d4"/>
  </linearGradient>
  <linearGradient id="gradRiverShallow" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#b8d8e4" stop-opacity="0.6"/>
    <stop offset="50%" stop-color="#8abcd0" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#b8d8e4" stop-opacity="0.6"/>
  </linearGradient>
  <linearGradient id="gradDusk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff9a85" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="#c4b0e0" stop-opacity="0.05"/>
  </linearGradient>
  <linearGradient id="gradNight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#3a2522" stop-opacity="0.07"/>
    <stop offset="100%" stop-color="#4a3530" stop-opacity="0.04"/>
  </linearGradient>
  <linearGradient id="gradBridge" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#d8d0c4"/>
    <stop offset="100%" stop-color="#c0b8a8"/>
  </linearGradient>
  <linearGradient id="gradCbdTower" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#c8c8d0"/>
    <stop offset="30%" stop-color="#b8bcc8"/>
    <stop offset="100%" stop-color="#a0a4b0"/>
  </linearGradient>
  <linearGradient id="gradCbdTower2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#d4d0cc"/>
    <stop offset="100%" stop-color="#b0aca8"/>
  </linearGradient>
  <linearGradient id="gradLake" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#90c0d4"/>
    <stop offset="100%" stop-color="#6aacbe"/>
  </linearGradient>

  <!-- ═══ PATTERNS ═══ -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <line x1="40" y1="0" x2="40" y2="40" stroke="rgba(180,170,155,0.06)"/>
    <line x1="0" y1="40" x2="40" y2="40" stroke="rgba(180,170,155,0.06)"/>
  </pattern>
  <pattern id="buildUnivTex" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" width="8" height="8" fill="rgba(0,0,0,0.02)"/>
    <line x1="0" y1="4" x2="8" y2="4" stroke="rgba(0,0,0,0.03)" stroke-width="0.5"/>
    <line x1="4" y1="0" x2="4" y2="8" stroke="rgba(0,0,0,0.02)" stroke-width="0.3"/>
  </pattern>
  <pattern id="buildCbdWin" width="6" height="8" patternUnits="userSpaceOnUse">
    <rect x="1" y="1" width="4" height="3" rx="0.5" fill="rgba(255,255,255,0.12)"/>
    <rect x="1" y="5" width="4" height="3" rx="0.5" fill="rgba(255,255,255,0.06)"/>
  </pattern>
  <pattern id="roofTile" width="6" height="4" patternUnits="userSpaceOnUse">
    <path d="M 0,4 L 3,0 L 6,4" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="0.4"/>
  </pattern>
  <pattern id="buildResTex" width="6" height="10" patternUnits="userSpaceOnUse">
    <rect x="0.5" y="0.5" width="2.5" height="3.5" rx="0.3" fill="rgba(255,255,255,0.08)"/>
    <rect x="3.5" y="0.5" width="2" height="3.5" rx="0.3" fill="rgba(255,255,255,0.05)"/>
    <rect x="0.5" y="5" width="2.5" height="3.5" rx="0.3" fill="rgba(255,255,255,0.07)"/>
    <rect x="3.5" y="5" width="2" height="3.5" rx="0.3" fill="rgba(255,255,255,0.04)"/>
  </pattern>

  <!-- ═══ FILTERS ═══ -->
  <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
    <feOffset dx="0" dy="1"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.15"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glowGreen">
    <feGaussianBlur stdDeviation="0.8" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- ═══ BASE BACKGROUND ═══ -->
<rect width="600" height="1100" fill="#f9f3e6"/>
<rect width="600" height="1100" fill="url(#grid)"/>

<!-- ═══ RIVER — 江城江 ═══ -->
<g id="river">
  <!-- Main river body -->
  <path d="M 250,0 Q 260,100 268,200 Q 275,300 278,400 Q 282,500 276,600 Q 270,700 268,800 Q 265,900 260,1000 Q 255,1050 250,1100 L 340,1100 Q 345,1050 342,1000 Q 338,900 335,800 Q 332,700 330,600 Q 328,500 332,400 Q 335,300 338,200 Q 342,100 350,0 Z" fill="url(#gradRiver)"/>
  <!-- River highlight streak -->
  <path d="M 285,0 Q 288,200 292,400 Q 295,600 290,800 Q 287,1000 285,1100 L 305,1100 Q 308,1000 306,800 Q 304,600 307,400 Q 310,200 305,0 Z" fill="rgba(255,255,255,0.10)"/>
  <!-- Riverbank gradient west -->
  <path d="M 250,0 Q 260,100 268,200 Q 275,300 278,400 Q 282,500 276,600 Q 270,700 268,800 Q 265,900 260,1000 Q 255,1050 250,1100 L 265,1100 Q 268,1050 272,1000 Q 275,900 278,800 Q 280,700 282,600 Q 284,500 282,400 Q 280,300 278,200 Q 272,100 265,0 Z" fill="rgba(140,200,220,0.18)"/>
  <!-- Riverbank gradient east -->
  <path d="M 340,1100 Q 345,1050 342,1000 Q 338,900 335,800 Q 332,700 330,600 Q 328,500 332,400 Q 335,300 338,200 Q 342,100 350,0 L 335,0 Q 328,100 325,200 Q 320,300 318,400 Q 315,500 318,600 Q 320,700 325,800 Q 328,900 332,1000 Q 335,1050 340,1100 Z" fill="rgba(140,200,220,0.18)"/>

  <!-- Wave lines -->
  <g stroke="#8abcd0" stroke-width="0.5" fill="none" opacity="0.4">
    <path d="M 262,50 Q 268,54 274,50 Q 280,46 286,50 Q 292,54 298,50"/>
    <path d="M 264,130 Q 270,134 276,130 Q 282,126 288,130 Q 294,134 300,130"/>
    <path d="M 268,210 Q 274,214 280,210 Q 286,206 292,210"/>
    <path d="M 270,290 Q 276,294 282,290 Q 288,286 294,290"/>
    <path d="M 272,370 Q 278,374 284,370 Q 290,366 296,370"/>
    <path d="M 270,450 Q 276,454 282,450 Q 288,446 294,450"/>
    <path d="M 268,530 Q 274,534 280,530 Q 286,526 292,530"/>
    <path d="M 266,610 Q 272,614 278,610 Q 284,606 290,610"/>
    <path d="M 264,690 Q 270,694 276,690 Q 282,686 288,690"/>
    <path d="M 262,770 Q 268,774 274,770 Q 280,766 286,770"/>
    <path d="M 260,850 Q 266,854 272,850 Q 278,846 284,850"/>
    <path d="M 258,930 Q 264,934 270,930 Q 276,926 282,930"/>
    <path d="M 256,1010 Q 262,1014 268,1010 Q 274,1006 280,1010"/>
  </g>

  <!-- River label -->
  <text x="298" y="555" fill="rgba(70,130,150,0.35)" font-size="26" font-family="serif" text-anchor="middle" letter-spacing="18" font-style="italic">江城江</text>

  <!-- Sailboat 1 -->
  <g transform="translate(310, 180)" opacity="0.55">
    <path d="M -6,3 L 6,3 L 4,6 L -4,6 Z" fill="#d4c8b0"/>
    <line x1="0" y1="3" x2="0" y2="-8" stroke="#8a7a6a" stroke-width="0.8"/>
    <path d="M 0,-8 L -5,-2 L 0,-3 Z" fill="#f0e8d8"/>
    <path d="M 0,-8 L 6,-1 L 0,-3 Z" fill="#e8ddd0"/>
  </g>
  <!-- Sailboat 2 -->
  <g transform="translate(295, 440)" opacity="0.45">
    <path d="M -5,3 L 5,3 L 3.5,5 L -3.5,5 Z" fill="#c8bcac"/>
    <line x1="0" y1="3" x2="0" y2="-7" stroke="#8a7a6a" stroke-width="0.7"/>
    <path d="M 0,-7 L 5,-1 L 0,-2 Z" fill="#f5ede4"/>
  </g>
  <!-- Sailboat 3 (small, south) -->
  <g transform="translate(305, 750)" opacity="0.4">
    <path d="M -4,2 L 4,2 L 3,4 L -3,4 Z" fill="#d0c8b8"/>
    <line x1="0" y1="2" x2="0" y2="-6" stroke="#8a7a6a" stroke-width="0.6"/>
    <path d="M 0,-6 L -4,-1 L 0,-2 Z" fill="#f0e4d8"/>
    <path d="M 0,-6 L 4.5,0 L 0,-2 Z" fill="#e4d8cc"/>
  </g>

  <!-- Small island in river -->
  <ellipse cx="295" cy="650" rx="18" ry="10" fill="#d0dcc0" opacity="0.5"/>
  <ellipse cx="295" cy="648" rx="12" ry="7" fill="#c5d8b8" opacity="0.6"/>
  <circle cx="289" cy="646" r="1.5" fill="#8ab080" opacity="0.5"/>
  <circle cx="295" cy="644" r="1.8" fill="#90b888" opacity="0.5"/>
  <circle cx="300" cy="647" r="1.3" fill="#8ab080" opacity="0.5"/>
</g>

<!-- ═══ 江城大桥 ═══ -->
<g id="bridge">
  <!-- Bridge deck -->
  <rect x="0" y="259" width="600" height="12" rx="2" fill="url(#gradBridge)" stroke="#b0a898" stroke-width="0.8"/>
  <!-- Deck surface highlight -->
  <rect x="0" y="260" width="600" height="3" fill="rgba(255,255,255,0.3)" rx="1"/>
  <!-- Bridge railing top -->
  <line x1="0" y1="259" x2="600" y2="259" stroke="#c8c0b0" stroke-width="1.5"/>
  <line x1="0" y1="271" x2="600" y2="271" stroke="#c0b8a8" stroke-width="0.8"/>

  <!-- West tower (left bank) -->
  <rect x="238" y="243" width="10" height="28" rx="1.5" fill="#c8bca8" stroke="#a89880" stroke-width="0.8"/>
  <rect x="236" y="255" width="14" height="4" fill="#b8ac98"/>
  <line x1="243" y1="243" x2="243" y2="259" stroke="#d8d0c0" stroke-width="0.5"/>

  <!-- East tower (right bank) -->
  <rect x="354" y="243" width="10" height="28" rx="1.5" fill="#c8bca8" stroke="#a89880" stroke-width="0.8"/>
  <rect x="352" y="255" width="14" height="4" fill="#b8ac98"/>
  <line x1="359" y1="243" x2="359" y2="259" stroke="#d8d0c0" stroke-width="0.5"/>

  <!-- Suspension cables - west side -->
  <path d="M 228,246 Q 233,250 238,255" stroke="#a89880" stroke-width="0.6" fill="none" opacity="0.7"/>
  <path d="M 228,248 Q 233,252 238,258" stroke="#a89880" stroke-width="0.6" fill="none" opacity="0.5"/>
  <!-- Suspension cables - east side -->
  <path d="M 364,246 Q 369,250 374,255" stroke="#a89880" stroke-width="0.6" fill="none" opacity="0.7"/>
  <path d="M 364,248 Q 369,252 374,258" stroke="#a89880" stroke-width="0.6" fill="none" opacity="0.5"/>
  <!-- Main cable arc -->
  <path d="M 243,245 Q 301,230 359,245" stroke="#b8a898" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M 243,247 Q 301,233 359,247" stroke="#c8b8a8" stroke-width="0.8" fill="none" opacity="0.4"/>

  <!-- Bridge label -->
  <text x="300" y="252" font-size="7" fill="rgba(100,85,65,0.55)" text-anchor="middle" font-family="sans-serif" font-weight="600">江城大桥</text>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- 大学城 DISTRICT (NORTHWEST, x:5-250, y:15-255) -->
<!-- ═══════════════════════════════════════════ -->
<g id="district-university">
  <!-- District background -->
  <rect x="5" y="15" width="245" height="240" rx="8" fill="rgba(165,148,186,0.10)"/>

  <!-- Decorative campus border top -->
  <path d="M 5,15 Q 125,20 250,15" stroke="rgba(140,120,170,0.15)" stroke-width="2" fill="none"/>

  <!-- ── ROADS ── -->
  <!-- Main horizontal: 学府路 (y=85) -->
  <rect x="5" y="80" width="245" height="10" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="5" y1="85" x2="250" y2="85" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
  <!-- Main vertical (y=15-255, x=125) -->
  <rect x="120" y="15" width="10" height="240" fill="#e4dcd0" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="125" y1="15" x2="125" y2="255" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
  <!-- 大学路 (y=145) -->
  <rect x="5" y="141" width="120" height="8" fill="#e4dcd0" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <!-- Side street right side -->
  <rect x="125" y="141" width="120" height="8" fill="#e4dcd0" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <!-- Small paths / walkways -->
  <path d="M 30,85 L 30,145" stroke="rgba(200,190,175,0.4)" stroke-width="3" fill="none" stroke-dasharray="3,3"/>
  <path d="M 95,85 L 95,145" stroke="rgba(200,190,175,0.4)" stroke-width="3" fill="none" stroke-dasharray="3,3"/>
  <path d="M 170,85 L 170,145" stroke="rgba(200,190,175,0.4)" stroke-width="3" fill="none" stroke-dasharray="3,3"/>
  <path d="M 200,145 L 200,220" stroke="rgba(200,190,175,0.4)" stroke-width="3" fill="none" stroke-dasharray="3,3"/>
  <path d="M 60,145 L 60,220" stroke="rgba(200,190,175,0.4)" stroke-width="3" fill="none" stroke-dasharray="3,3"/>

  <!-- ── BUILDINGS ── -->
  <!-- Library (chengbei_library: 35,105) - larger academic building -->
  <rect x="25" y="40" width="38" height="30" rx="1.5" fill="#d8c8b0" stroke="#b8a080" stroke-width="0.8"/>
  <rect x="25" y="40" width="38" height="4" fill="#c8b898"/>
  <rect x="25" y="40" width="38" height="30" fill="url(#buildUnivTex)"/>
  <line x1="28" y1="55" x2="60" y2="55" stroke="rgba(0,0,0,0.05)" stroke-width="0.8"/>
  <line x1="28" y1="60" x2="60" y2="60" stroke="rgba(0,0,0,0.05)" stroke-width="0.8"/>
  <!-- Library wing -->
  <rect x="22" y="50" width="8" height="16" rx="1" fill="#d4c4ac" stroke="#b8a080" stroke-width="0.6"/>

  <!-- 任彤宿舍 (rentong_dorm: 80,60) - student dorm -->
  <rect x="68" y="45" width="24" height="20" rx="1" fill="#e0d4c0" stroke="#c0ac8c" stroke-width="0.6"/>
  <rect x="68" y="45" width="24" height="3" fill="#8a7060"/>
  <rect x="68" y="45" width="24" height="20" fill="url(#buildResTex)"/>
  <path d="M 66,45 L 80,38 L 94,45" fill="#8a6050" stroke="#705040" stroke-width="0.5"/>

  <!--宝宝宿舍 (baobao_dorm: 180,80) -->
  <rect x="168" y="52" width="26" height="22" rx="1" fill="#e4d8c8" stroke="#c4b090" stroke-width="0.6"/>
  <rect x="168" y="52" width="26" height="3" fill="#8a7060"/>
  <rect x="168" y="52" width="26" height="22" fill="url(#buildResTex)"/>
  <path d="M 166,52 L 181,44 L 196,52" fill="#8a6050" stroke="#705040" stroke-width="0.5"/>

  <!-- 食堂 (chengbei_cafeteria: 110,145) - wide low building -->
  <rect x="95" y="120" width="32" height="18" rx="1.5" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="95" y="120" width="32" height="18" fill="url(#buildUnivTex)"/>
  <rect x="95" y="120" width="32" height="4" fill="#c0b090" rx="1"/>
  <rect x="98" y="127" width="6" height="8" fill="rgba(255,255,255,0.15)" rx="0.5"/>
  <rect x="108" y="127" width="6" height="8" fill="rgba(255,255,255,0.15)" rx="0.5"/>
  <rect x="118" y="127" width="6" height="8" fill="rgba(255,255,255,0.10)" rx="0.5"/>

  <!-- Academic building cluster -->
  <rect x="150" y="110" width="22" height="28" rx="1" fill="#d4c4ac" stroke="#b8a080" stroke-width="0.7"/>
  <rect x="150" y="110" width="22" height="28" fill="url(#buildUnivTex)"/>
  <rect x="150" y="110" width="22" height="4" fill="#b8a080"/>
  <line x1="153" y1="120" x2="169" y2="120" stroke="rgba(0,0,0,0.04)" stroke-width="0.6"/>
  <line x1="153" y1="126" x2="169" y2="126" stroke="rgba(0,0,0,0.04)" stroke-width="0.6"/>

  <rect x="178" y="108" width="18" height="26" rx="1" fill="#d8ccb8" stroke="#bcac90" stroke-width="0.7"/>
  <rect x="178" y="108" width="18" height="26" fill="url(#buildUnivTex)"/>
  <rect x="178" y="108" width="18" height="3.5" fill="#bcac90"/>

  <!-- Teaching buildings -->
  <rect x="40" y="95" width="20" height="25" rx="1" fill="#dcd0bc" stroke="#c0b090" stroke-width="0.6"/>
  <rect x="40" y="95" width="20" height="25" fill="url(#buildUnivTex)"/>
  <rect x="40" y="95" width="20" height="3" fill="#c0b090"/>
  <rect x="65" y="100" width="16" height="22" rx="1" fill="#d8ccb4" stroke="#bcac8c" stroke-width="0.6"/>
  <rect x="65" y="100" width="16" height="22" fill="url(#buildUnivTex)"/>
  <rect x="65" y="100" width="16" height="3" fill="#bcac8c"/>

  <!-- 体育馆 (chengbei_gym: 60,200) - large round-edged -->
  <rect x="45" y="180" width="35" height="22" rx="3" fill="#d4ccc0" stroke="#b8a898" stroke-width="0.8"/>
  <rect x="45" y="180" width="35" height="5" fill="#b8a898" rx="2"/>
  <rect x="45" y="180" width="35" height="22" fill="url(#buildUnivTex)"/>
  <!-- Dome top -->
  <path d="M 47,180 Q 62,172 78,180" fill="#c8bcac" stroke="#b0a090" stroke-width="0.5"/>

  <!-- Research building -->
  <rect x="88" y="175" width="16" height="28" rx="1" fill="#d0c4b0" stroke="#b8a888" stroke-width="0.7"/>
  <rect x="88" y="175" width="16" height="28" fill="url(#buildUnivTex)"/>
  <rect x="88" y="175" width="16" height="3.5" fill="#b8a888"/>
  <line x1="90" y1="184" x2="102" y2="184" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
  <line x1="90" y1="190" x2="102" y2="190" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
  <line x1="90" y1="196" x2="102" y2="196" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>

  <!-- Small buildings cluster -->
  <rect x="8" y="165" width="15" height="12" rx="1" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.5"/>
  <rect x="8" y="165" width="15" height="3" fill="#b09880"/>
  <rect x="25" y="168" width="14" height="14" rx="1" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.5"/>
  <rect x="25" y="168" width="14" height="3" fill="#b09880"/>

  <!-- Tiny campus garden -->
  <rect x="135" y="195" width="20" height="14" rx="3" fill="rgba(200,218,180,0.35)"/>
  <circle cx="142" cy="200" r="1.8" fill="#a0c090" opacity="0.5"/>
  <circle cx="150" cy="203" r="1.5" fill="#98b888" opacity="0.5"/>

  <!-- ── GREEN SPACES ── -->
  <!-- Main campus lawn -->
  <ellipse cx="155" cy="165" rx="35" ry="22" fill="#d4e4cc" stroke="#b8d0a8" stroke-width="0.8" opacity="0.85"/>
  <!-- Trees on lawn -->
  <circle cx="135" cy="158" r="3" fill="#a0c490" opacity="0.7"/>
  <circle cx="142" cy="155" r="2.5" fill="#b0cc98" opacity="0.7"/>
  <circle cx="150" cy="160" r="2.8" fill="#98b888" opacity="0.7"/>
  <circle cx="160" cy="156" r="3" fill="#a8c898" opacity="0.7"/>
  <circle cx="168" cy="162" r="2.2" fill="#b0cc98" opacity="0.7"/>
  <circle cx="175" cy="168" r="2.5" fill="#a0c490" opacity="0.7"/>
  <circle cx="145" cy="170" r="2.5" fill="#b8d4a4" opacity="0.6"/>

  <!-- Sports field area -->
  <ellipse cx="220" cy="195" rx="25" ry="18" fill="#d0e0c4" stroke="#b8d0a0" stroke-width="0.6" opacity="0.8"/>
  <!-- Track -->
  <ellipse cx="220" cy="195" rx="22" ry="15" fill="none" stroke="rgba(180,160,140,0.3)" stroke-width="2"/>
  <ellipse cx="220" cy="195" rx="22" ry="15" fill="none" stroke="rgba(200,50,30,0.15)" stroke-width="2" stroke-dasharray="3,2"/>
  <!-- Football field lines -->
  <line x1="205" y1="188" x2="235" y2="188" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
  <line x1="205" y1="202" x2="235" y2="202" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
  <circle cx="220" cy="195" r="4" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>

  <!-- Small garden near dorms -->
  <ellipse cx="200" cy="100" rx="18" ry="14" fill="#c8dcc0" stroke="#b0cca0" stroke-width="0.5" opacity="0.7"/>
  <circle cx="192" cy="96" r="1.8" fill="#98c080" opacity="0.6"/>
  <circle cx="198" cy="93" r="2" fill="#a0c888" opacity="0.6"/>
  <circle cx="205" cy="97" r="1.5" fill="#90b878" opacity="0.6"/>
  <circle cx="208" cy="103" r="1.8" fill="#a0c888" opacity="0.6"/>

  <!-- Flower beds near main road -->
  <circle cx="50" cy="82" r="2" fill="#e8a0b0" opacity="0.4"/>
  <circle cx="55" cy="81" r="1.5" fill="#f0c0a0" opacity="0.4"/>
  <circle cx="60" cy="83" r="1.8" fill="#e8a8b8" opacity="0.4"/>

  <!-- Small pond -->
  <ellipse cx="82" cy="72" rx="8" ry="5" fill="#90c4d8" stroke="#7ab4c8" stroke-width="0.5" opacity="0.7"/>
  <ellipse cx="82" cy="71" rx="5" ry="3" fill="#a0d4e8" opacity="0.4"/>

  <!-- Trees along road -->
  <circle cx="10" cy="82" r="2.2" fill="#90b878" opacity="0.5"/>
  <circle cx="70" cy="82" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="140" cy="82" r="2.2" fill="#90b878" opacity="0.5"/>
  <circle cx="220" cy="82" r="2" fill="#98c080" opacity="0.5"/>

  <!-- ── DISTRICT LABEL ── -->
  <text x="127" y="30" fill="rgba(100,80,140,0.45)" font-size="16" font-weight="700" font-family="sans-serif" letter-spacing="10" text-anchor="middle">大学城</text>

  <!-- ── ROAD LABELS ── -->
  <text x="127" y="79" font-size="6.5" fill="rgba(120,100,70,0.40)" text-anchor="middle" font-family="sans-serif" font-weight="500">学府路</text>
  <text x="127" y="158" font-size="6.5" fill="rgba(120,100,70,0.40)" text-anchor="middle" font-family="sans-serif" font-weight="500">大学路</text>
</g>

<!-- ═══ 江城西岸中段 — 滨江公园 + 住宅区 ═══ -->
<g id="district-west-mid">
  <!-- District background fill -->
  <rect x="5" y="255" width="245" height="485" rx="6" fill="rgba(160,185,140,0.06)"/>

  <!-- Main vertical road connecting 大学城 to 南岸 -->
  <rect x="130" y="255" width="8" height="485" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.5" rx="2"/>
  <line x1="134" y1="255" x2="134" y2="740" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>

  <!-- Horizontal cross streets -->
  <rect x="5" y="350" width="245" height="6" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.4" rx="2"/>
  <rect x="5" y="500" width="245" height="6" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.4" rx="2"/>
  <rect x="5" y="640" width="245" height="6" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.4" rx="2"/>

  <!-- East-west connector to bridge area -->
  <rect x="138" y="260" width="200" height="5" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.3" rx="1" opacity="0.6"/>

  <!-- Riverside road -->
  <rect x="5" y="275" width="245" height="8" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="5" y1="279" x2="250" y2="279" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="127" y="274" font-size="6" fill="rgba(120,100,70,0.40)" text-anchor="middle" font-family="sans-serif">滨江西路</text>

  <!-- Residential blocks along river -->
  <rect x="15" y="295" width="28" height="22" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="15" y="295" width="28" height="3" fill="#b89880"/>
  <rect x="50" y="290" width="24" height="24" rx="1.5" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="50" y="290" width="24" height="3" fill="#b89880"/>
  <rect x="80" y="298" width="30" height="20" rx="1.5" fill="#e4dcd0" stroke="#c8bc9c" stroke-width="0.6"/>
  <rect x="80" y="298" width="30" height="3" fill="#b89880"/>

  <!-- More residential -->
  <rect x="15" y="340" width="26" height="28" rx="1.5" fill="#d8d0c0" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="15" y="340" width="26" height="3" fill="#ac9080"/>
  <rect x="48" y="335" width="32" height="22" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="48" y="335" width="32" height="3" fill="#ac9080"/>
  <rect x="88" y="345" width="22" height="26" rx="1.5" fill="#d4ccbc" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="88" y="345" width="22" height="3" fill="#ac9080"/>

  <!-- Small shops / market area -->
  <rect x="18" y="395" width="14" height="12" rx="1" fill="#e8d8c4" stroke="#c8b498" stroke-width="0.5"/>
  <rect x="35" y="393" width="12" height="14" rx="1" fill="#e4d4c0" stroke="#c4b090" stroke-width="0.5"/>
  <rect x="50" y="397" width="15" height="10" rx="1" fill="#e8dcc8" stroke="#c8b898" stroke-width="0.5"/>
  <!-- Small road through shops -->
  <rect x="12" y="410" width="60" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>

  <!-- Riverside park -->
  <ellipse cx="210" cy="340" rx="35" ry="45" fill="#d0e0c4" stroke="#b8cfa0" stroke-width="0.8" opacity="0.8"/>
  <circle cx="195" cy="320" r="2.5" fill="#a0c490"/>
  <circle cx="210" cy="315" r="3" fill="#98b888"/>
  <circle cx="225" cy="325" r="2" fill="#a8c898"/>
  <circle cx="200" cy="345" r="2.8" fill="#a0c490"/>
  <circle cx="218" cy="350" r="2.2" fill="#b0cca0"/>
  <circle cx="205" cy="360" r="2.5" fill="#98b888"/>
  <!-- Park paths -->
  <path d="M 195,340 Q 210,335 225,340" stroke="rgba(180,170,150,0.3)" stroke-width="2" fill="none"/>
  <path d="M 210,350 Q 215,360 210,370" stroke="rgba(180,170,150,0.3)" stroke-width="2" fill="none"/>

  <!-- Mid-level residential cluster -->
  <rect x="15" y="440" width="32" height="24" rx="1.5" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="15" y="440" width="32" height="3.5" fill="#b49880"/>
  <rect x="55" y="445" width="26" height="20" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="55" y="445" width="26" height="3" fill="#b49880"/>
  <rect x="90" y="438" width="22" height="26" rx="1.5" fill="#d8d0c0" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="90" y="438" width="22" height="3.5" fill="#b49880"/>

  <!-- Small cross streets -->
  <rect x="5" y="425" width="120" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="5" y="490" width="120" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>

  <!-- More blocks further south -->
  <rect x="18" y="510" width="28" height="22" rx="1.5" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="18" y="510" width="28" height="3" fill="#b09880"/>
  <rect x="52" y="505" width="24" height="25" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="52" y="505" width="24" height="3" fill="#b09880"/>
  <rect x="84" y="515" width="26" height="20" rx="1.5" fill="#d8d0c0" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="84" y="515" width="26" height="3" fill="#b09880"/>

  <!-- Community garden -->
  <ellipse cx="200" cy="480" rx="20" ry="18" fill="#d4e4cc" stroke="#b8d0a8" stroke-width="0.6" opacity="0.7"/>
  <circle cx="193" cy="475" r="2" fill="#a0c490"/>
  <circle cx="205" cy="478" r="2.5" fill="#98b888"/>
  <circle cx="198" cy="488" r="2" fill="#a8c898"/>

  <!-- More buildings south -->
  <rect x="15" y="560" width="30" height="22" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="15" y="560" width="30" height="3" fill="#b09880"/>
  <rect x="52" y="555" width="26" height="24" rx="1.5" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="52" y="555" width="26" height="3" fill="#b09880"/>
  <rect x="86" y="565" width="22" height="20" rx="1.5" fill="#d4ccbc" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="86" y="565" width="22" height="3" fill="#b09880"/>

  <!-- Side road -->
  <rect x="5" y="595" width="115" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>

  <!-- Old town area -->
  <rect x="18" y="620" width="18" height="16" rx="1" fill="#d8ccb8" stroke="#bca888" stroke-width="0.5"/>
  <rect x="18" y="620" width="18" height="3" fill="#a08870"/>
  <rect x="42" y="618" width="16" height="18" rx="1" fill="#d4c8b4" stroke="#b8a484" stroke-width="0.5"/>
  <rect x="42" y="618" width="16" height="3" fill="#a08870"/>
  <rect x="64" y="625" width="20" height="14" rx="1" fill="#dcd0c0" stroke="#c0ac90" stroke-width="0.5"/>
  <rect x="64" y="625" width="20" height="3" fill="#a08870"/>

  <!-- Small canal / creek flowing toward river -->
  <path d="M 120,580 Q 160,590 200,640 Q 230,670 250,700" stroke="#8abcd0" stroke-width="2.5" fill="none" opacity="0.3" stroke-linecap="round"/>

  <!-- Neighborhood courtyard garden -->
  <rect x="120" y="540" width="18" height="14" rx="3" fill="rgba(200,218,180,0.35)"/>
  <circle cx="126" cy="545" r="1.8" fill="#a0c090" opacity="0.5"/>
  <circle cx="132" cy="548" r="1.5" fill="#98b888" opacity="0.5"/>
  <path d="M 124,550 Q 129,547 134,550" stroke="rgba(180,170,150,0.25)" stroke-width="1" fill="none"/>

  <!-- Trees along canal -->
  <circle cx="145" cy="595" r="1.8" fill="#98c080" opacity="0.5"/>
  <circle cx="165" cy="605" r="2" fill="#a0c490" opacity="0.5"/>
  <circle cx="185" cy="618" r="1.5" fill="#98c080" opacity="0.5"/>
  <circle cx="210" cy="640" r="2.2" fill="#a0c490" opacity="0.5"/>

  <!-- Area label -->
  <text x="127" y="350" fill="rgba(100,140,100,0.30)" font-size="14" font-weight="600" font-family="sans-serif" letter-spacing="8" text-anchor="middle">滨江生活区</text>

  <!-- Southeast residential cluster -->
  <rect x="140" y="560" width="28" height="22" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="140" y="560" width="28" height="3" fill="#b09880"/>
  <rect x="175" y="555" width="24" height="24" rx="1.5" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="175" y="555" width="24" height="3" fill="#b09880"/>
  <rect x="205" y="562" width="30" height="20" rx="1.5" fill="#e4dcd0" stroke="#c8bc9c" stroke-width="0.6"/>
  <rect x="205" y="562" width="30" height="3" fill="#b09880"/>

  <!-- Mid cluster -->
  <rect x="145" y="610" width="30" height="22" rx="1.5" fill="#d8d0c0" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="145" y="610" width="30" height="3" fill="#ac9080"/>
  <rect x="182" y="608" width="26" height="24" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="182" y="608" width="26" height="3" fill="#ac9080"/>
  <rect x="215" y="615" width="22" height="18" rx="1.5" fill="#d4ccbc" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="215" y="615" width="22" height="3" fill="#ac9080"/>

  <!-- South cluster -->
  <rect x="150" y="660" width="26" height="20" rx="1.5" fill="#dcd4c4" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="150" y="660" width="26" height="3" fill="#b09880"/>
  <rect x="183" y="658" width="28" height="22" rx="1.5" fill="#e0d8c8" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="183" y="658" width="28" height="3" fill="#b09880"/>
  <rect x="218" y="665" width="20" height="18" rx="1.5" fill="#d8d0c0" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="218" y="665" width="20" height="3" fill="#b09880"/>

  <!-- Small green space -->
  <ellipse cx="200" cy="580" rx="16" ry="12" fill="#d4e4cc" stroke="#b8d0a8" stroke-width="0.5" opacity="0.6"/>
  <circle cx="195" cy="576" r="1.5" fill="#a0c490"/>
  <circle cx="206" cy="580" r="2" fill="#98b888"/>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- 江北新区 (EAST BANK TOP, x:345-595, y:0-270) -->
<!-- ═══════════════════════════════════════════ -->
<g id="district-east-top">
  <rect x="345" y="5" width="250" height="265" rx="6" fill="rgba(155,175,195,0.06)"/>

  <!-- Riverside promenade -->
  <rect x="345" y="60" width="6" height="200" fill="#d8d4c8" rx="1"/>

  <!-- Ferry terminal -->
  <rect x="355" y="80" width="35" height="18" rx="2" fill="#d0c8b8" stroke="#b0a090" stroke-width="0.6"/>
  <rect x="355" y="80" width="35" height="3" fill="#a89880"/>
  <text x="372" y="94" font-size="5" fill="rgba(100,80,60,0.4)" text-anchor="middle" font-family="sans-serif">⛴ 江北渡口</text>

  <!-- Warehouse/office buildings -->
  <rect x="400" y="30" width="35" height="25" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="400" y="30" width="35" height="3.5" fill="#a89880"/>
  <rect x="445" y="25" width="40" height="30" rx="1.5" fill="#d4ccc0" stroke="#b4a484" stroke-width="0.6"/>
  <rect x="445" y="25" width="40" height="4" fill="#a89880"/>
  <rect x="495" y="35" width="30" height="22" rx="1.5" fill="#dcd4c4" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="495" y="35" width="30" height="3" fill="#a89880"/>

  <!-- More buildings -->
  <rect x="410" y="85" width="28" height="22" rx="1.5" fill="#e0d8c8" stroke="#c0b090" stroke-width="0.6"/>
  <rect x="410" y="85" width="28" height="3" fill="#a89880"/>
  <rect x="450" y="80" width="32" height="26" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="450" y="80" width="32" height="3.5" fill="#a89880"/>
  <rect x="495" y="90" width="25" height="20" rx="1.5" fill="#dcd4c4" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="495" y="90" width="25" height="3" fill="#a89880"/>

  <!-- Additional office/residential blocks -->
  <rect x="360" y="140" width="28" height="22" rx="1.5" fill="#dcd4c4" stroke="#bca890" stroke-width="0.6"/>
  <rect x="360" y="140" width="28" height="3.5" fill="#a08870"/>
  <rect x="400" y="145" width="30" height="26" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="400" y="145" width="30" height="4" fill="#a08870"/>
  <rect x="445" y="135" width="26" height="24" rx="1.5" fill="#e0d8c8" stroke="#c0b090" stroke-width="0.6"/>
  <rect x="445" y="135" width="26" height="3.5" fill="#a08870"/>

  <!-- South section buildings -->
  <rect x="370" y="195" width="32" height="20" rx="1.5" fill="#d4ccc0" stroke="#b4a484" stroke-width="0.6"/>
  <rect x="370" y="195" width="32" height="3.5" fill="#a08870"/>
  <rect x="415" y="200" width="26" height="24" rx="1.5" fill="#dcd4c4" stroke="#bca890" stroke-width="0.6"/>
  <rect x="415" y="200" width="26" height="3.5" fill="#a08870"/>
  <rect x="455" y="190" width="34" height="28" rx="1.5" fill="#e0d8c8" stroke="#c0b090" stroke-width="0.6"/>
  <rect x="455" y="190" width="34" height="4" fill="#a08870"/>
  <rect x="505" y="195" width="28" height="22" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="505" y="195" width="28" height="3.5" fill="#a08870"/>

  <!-- Small plaza with fountain -->
  <rect x="490" y="140" width="22" height="18" rx="4" fill="rgba(210,220,200,0.35)"/>
  <circle cx="501" cy="147" r="3" fill="none" stroke="#90b8d0" stroke-width="0.8" opacity="0.5"/>
  <circle cx="501" cy="147" r="1.5" fill="#fff" opacity="0.4"/>

  <!-- Riverside park -->
  <ellipse cx="530" cy="180" rx="28" ry="32" fill="#d0e0c4" stroke="#b8cfa0" stroke-width="0.6" opacity="0.7"/>
  <circle cx="520" cy="168" r="2.2" fill="#a0c490"/>
  <circle cx="535" cy="175" r="1.8" fill="#98b888"/>
  <circle cx="525" cy="185" r="2" fill="#a8c898"/>
  <circle cx="540" cy="190" r="2.5" fill="#a0c490"/>
  <path d="M 520,180 Q 530,175 540,180" stroke="rgba(180,170,150,0.3)" stroke-width="1.5" fill="none"/>

  <!-- Road -->
  <rect x="345" y="125" width="250" height="7" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <rect x="440" y="5" width="7" height="260" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.5" rx="2"/>

  <!-- Roof garden / plaza area -->
  <rect x="360" y="160" width="30" height="20" fill="rgba(200,215,185,0.4)" rx="3"/>
  <circle cx="370" cy="168" r="1.5" fill="#a0c090" opacity="0.6"/>
  <circle cx="378" cy="170" r="1.2" fill="#a8c898" opacity="0.6"/>

  <!-- Label -->
  <text x="470" y="20" fill="rgba(110,135,160,0.35)" font-size="14" font-weight="600" font-family="sans-serif" letter-spacing="8" text-anchor="middle">江北新区</text>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- CBD DISTRICT (NORTHEAST, x:345-595, y:270-500) -->
<!-- ═══════════════════════════════════════════ -->
<g id="district-cbd">
  <!-- District background -->
  <rect x="345" y="270" width="250" height="230" rx="8" fill="rgba(140,165,190,0.10)"/>

  <!-- ── ROAD GRID ── -->
  <!-- CBD大道 (main vertical x=445) -->
  <rect x="441" y="270" width="8" height="230" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="445" y1="270" x2="445" y2="500" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <!-- 中央大街 (main horizontal y=385) -->
  <rect x="345" y="381" width="250" height="8" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="345" y1="385" x2="595" y2="385" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <!-- Side streets -->
  <rect x="345" y="320" width="96" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="449" y="320" width="146" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="345" y="440" width="96" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="449" y="440" width="146" height="5" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <!-- Vertical side streets -->
  <rect x="520" y="270" width="5" height="115" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="520" y="393" width="5" height="107" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="395" y="270" width="5" height="115" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="395" y="393" width="5" height="107" fill="#e4dcd0" stroke="#c8bca8" stroke-width="0.3" rx="1"/>

  <!-- Walking paths in park area -->
  <path d="M 380,385 Q 390,400 400,385" stroke="rgba(190,180,165,0.3)" stroke-width="2" fill="none" stroke-dasharray="2,2"/>

  <!-- ── BUILDINGS ── -->
  <!-- 国金中心 (cbd_office: 460,310) - tallest landmark -->
  <rect x="452" y="276" width="16" height="38" rx="1.5" fill="url(#gradCbdTower)" stroke="#9098a8" stroke-width="0.8"/>
  <rect x="452" y="276" width="16" height="38" fill="url(#buildCbdWin)"/>
  <rect x="452" y="276" width="16" height="5" fill="#a0a8b8" rx="1"/>
  <!-- Antenna/spire -->
  <line x1="460" y1="276" x2="460" y2="268" stroke="#8890a0" stroke-width="1.5"/>
  <circle cx="460" cy="267" r="1.5" fill="#c04040" opacity="0.7"/>
  <!-- Adjacent tower wing -->
  <rect x="470" y="285" width="12" height="28" rx="1" fill="url(#gradCbdTower2)" stroke="#a8a4a0" stroke-width="0.7"/>
  <rect x="470" y="285" width="12" height="28" fill="url(#buildCbdWin)"/>

  <!--清漪公寓 (qingyi_apt: 520,350) - luxury tower -->
  <rect x="508" y="320" width="18" height="35" rx="1.5" fill="url(#gradCbdTower2)" stroke="#b0aca4" stroke-width="0.8"/>
  <rect x="508" y="320" width="18" height="35" fill="url(#buildCbdWin)"/>
  <rect x="508" y="320" width="18" height="4" fill="#c0bcb4" rx="1"/>
  <!-- Penthouse/roof structure -->
  <rect x="512" y="314" width="10" height="6" rx="1" fill="#d0ccc8" stroke="#b0aca4" stroke-width="0.5"/>
  <rect x="515" y="310" width="4" height="4" fill="#c8c4c0"/>

  <!-- Plaza / breathing space between towers -->
  <rect x="488" y="335" width="18" height="14" rx="2" fill="rgba(210,220,200,0.35)"/>
  <circle cx="494" cy="340" r="1.5" fill="#a0c090" opacity="0.5"/>
  <circle cx="500" cy="343" r="1.2" fill="#a8c898" opacity="0.5"/>
  <circle cx="497" cy="346" r="1" fill="#90b880" opacity="0.4"/>

  <!-- Office tower cluster -->
  <rect x="532" y="290" width="14" height="42" rx="1" fill="url(#gradCbdTower)" stroke="#8890a0" stroke-width="0.7"/>
  <rect x="532" y="290" width="14" height="42" fill="url(#buildCbdWin)"/>
  <rect x="532" y="290" width="14" height="5" fill="#98a0b0" rx="1"/>

  <rect x="550" y="282" width="12" height="45" rx="1" fill="url(#gradCbdTower)" stroke="#8090a0" stroke-width="0.7"/>
  <rect x="550" y="282" width="12" height="45" fill="url(#buildCbdWin)"/>
  <rect x="550" y="282" width="12" height="4" fill="#90a0b0" rx="1"/>
  <line x1="556" y1="282" x2="556" y2="274" stroke="#788898" stroke-width="1.2"/>

  <!-- Medium office buildings -->
  <rect x="360" y="295" width="22" height="22" rx="1" fill="url(#gradCbdTower2)" stroke="#a8a4a0" stroke-width="0.7"/>
  <rect x="360" y="295" width="22" height="22" fill="url(#buildCbdWin)"/>
  <rect x="360" y="295" width="22" height="4" fill="#b8b4b0" rx="1"/>

  <rect x="386" y="288" width="18" height="28" rx="1" fill="url(#gradCbdTower)" stroke="#9098a8" stroke-width="0.7"/>
  <rect x="386" y="288" width="18" height="28" fill="url(#buildCbdWin)"/>
  <rect x="386" y="288" width="18" height="4" fill="#a0a8b8" rx="1"/>

  <rect x="410" y="292" width="20" height="24" rx="1" fill="url(#gradCbdTower2)" stroke="#a8a4a0" stroke-width="0.7"/>
  <rect x="410" y="292" width="20" height="24" fill="url(#buildCbdWin)"/>
  <rect x="410" y="292" width="20" height="4" fill="#b8b4b0" rx="1"/>

  <!-- Lower building row -->
  <rect x="350" y="335" width="25" height="16" rx="1" fill="#d8d4cc" stroke="#b8b4ac" stroke-width="0.6"/>
  <rect x="350" y="335" width="25" height="16" fill="url(#buildCbdWin)"/>
  <rect x="350" y="335" width="25" height="3" fill="#c0b8b0" rx="1"/>
  <rect x="380" y="330" width="20" height="18" rx="1" fill="#d4d0c8" stroke="#b4b0a8" stroke-width="0.6"/>
  <rect x="380" y="330" width="20" height="18" fill="url(#buildCbdWin)"/>
  <rect x="380" y="330" width="20" height="3" fill="#c0b8b0" rx="1"/>

  <!-- 山堂茶室 (shantang_tea: 550,430) - traditional style -->
  <rect x="536" y="405" width="20" height="14" rx="1" fill="#d8c8b0" stroke="#a89070" stroke-width="0.7"/>
  <path d="M 533,405 L 546,396 L 559,405" fill="#8a6050" stroke="#6a4030" stroke-width="0.5"/>
  <rect x="539" y="407" width="5" height="6" fill="rgba(255,255,255,0.15)" rx="0.5"/>
  <rect x="547" y="407" width="5" height="6" fill="rgba(255,255,255,0.10)" rx="0.5"/>

  <!-- Restaurant/retail row -->
  <rect x="555" y="350" width="16" height="12" rx="1" fill="#e0d4c4" stroke="#c0ac8c" stroke-width="0.5"/>
  <rect x="555" y="350" width="16" height="3" fill="#b89878"/>
  <rect x="570" y="348" width="14" height="14" rx="1" fill="#dcd0c0" stroke="#c0ac8c" stroke-width="0.5"/>
  <rect x="570" y="348" width="14" height="3" fill="#b89878"/>

  <!-- Lower CBD buildings south of main road -->
  <rect x="360" y="398" width="20" height="20" rx="1" fill="url(#gradCbdTower2)" stroke="#a8a4a0" stroke-width="0.6"/>
  <rect x="360" y="398" width="20" height="20" fill="url(#buildCbdWin)"/>
  <rect x="360" y="398" width="20" height="3" fill="#b8b4b0" rx="1"/>
  <rect x="385" y="400" width="22" height="18" rx="1" fill="#d8d4cc" stroke="#b4b0a8" stroke-width="0.6"/>
  <rect x="385" y="400" width="22" height="18" fill="url(#buildCbdWin)"/>
  <rect x="385" y="400" width="22" height="3" fill="#c0b8b0" rx="1"/>
  <rect x="412" y="395" width="18" height="22" rx="1" fill="url(#gradCbdTower)" stroke="#9098a8" stroke-width="0.6"/>
  <rect x="412" y="395" width="18" height="22" fill="url(#buildCbdWin)"/>
  <rect x="412" y="395" width="18" height="3.5" fill="#a0a8b8" rx="1"/>

  <!-- East side buildings -->
  <rect x="530" y="400" width="16" height="18" rx="1" fill="#d8d4cc" stroke="#b4b0a8" stroke-width="0.6"/>
  <rect x="530" y="400" width="16" height="18" fill="url(#buildCbdWin)"/>
  <rect x="530" y="400" width="16" height="3" fill="#c0b8b0" rx="1"/>
  <rect x="550" y="402" width="14" height="16" rx="1" fill="#d4d0c8" stroke="#b0aca4" stroke-width="0.6"/>
  <rect x="550" y="402" width="14" height="16" fill="url(#buildCbdWin)"/>

  <!-- Edge buildings -->
  <rect x="568" y="420" width="20" height="16" rx="1" fill="url(#gradCbdTower2)" stroke="#a8a4a0" stroke-width="0.6"/>
  <rect x="568" y="420" width="20" height="16" fill="url(#buildCbdWin)"/>
  <rect x="568" y="420" width="20" height="3" fill="#b8b4b0" rx="1"/>

  <!-- CBD south edge buildings -->
  <rect x="350" y="455" width="24" height="16" rx="1" fill="#d8d4cc" stroke="#b4b0a8" stroke-width="0.6"/>
  <rect x="350" y="455" width="24" height="16" fill="url(#buildCbdWin)"/>
  <rect x="350" y="455" width="24" height="3" fill="#c0b8b0" rx="1"/>
  <rect x="378" y="458" width="20" height="14" rx="1" fill="#d4d0c8" stroke="#b0aca4" stroke-width="0.6"/>
  <rect x="378" y="458" width="20" height="14" fill="url(#buildCbdWin)"/>

  <!-- ── CENTRAL PARK (cbd_park: 380,420) ── -->
  <!-- Park area -->
  <ellipse cx="455" cy="430" rx="35" ry="28" fill="#d0e0c8" stroke="#b0c8a0" stroke-width="0.8" opacity="0.8"/>
  <!-- Park lake -->
  <ellipse cx="462" cy="435" rx="15" ry="10" fill="url(#gradLake)" stroke="#7ab4c8" stroke-width="0.6" opacity="0.75"/>
  <ellipse cx="462" cy="433" rx="10" ry="6" fill="rgba(255,255,255,0.10)"/>
  <!-- Fountain in lake center -->
  <circle cx="462" cy="435" r="2.5" fill="rgba(255,255,255,0.3)"/>
  <circle cx="462" cy="433" r="1" fill="rgba(255,255,255,0.5)"/>

  <!-- Park trees -->
  <circle cx="430" cy="420" r="3.5" fill="#a0c490" opacity="0.7"/>
  <circle cx="435" cy="416" r="3" fill="#b0cc98" opacity="0.7"/>
  <circle cx="440" cy="422" r="2.8" fill="#98b888" opacity="0.7"/>
  <circle cx="480" cy="418" r="3" fill="#a8c898" opacity="0.7"/>
  <circle cx="486" cy="422" r="2.8" fill="#90b878" opacity="0.7"/>
  <circle cx="478" cy="445" r="3.2" fill="#a0c490" opacity="0.7"/>
  <circle cx="445" cy="448" r="2.5" fill="#b0cc98" opacity="0.7"/>
  <circle cx="440" cy="442" r="2.2" fill="#b8d4a4" opacity="0.6"/>
  <circle cx="490" cy="440" r="2.5" fill="#98b888" opacity="0.6"/>
  <circle cx="425" cy="432" r="2.5" fill="#a8c898" opacity="0.7"/>

  <!-- Park benches (tiny rectangles) -->
  <rect x="470" y="420" width="5" height="1.5" fill="#b89870" opacity="0.5" rx="0.5"/>
  <rect x="445" y="448" width="5" height="1.5" fill="#b89870" opacity="0.5" rx="0.5"/>

  <!-- ── PLAZA ── -->
  <rect x="490" y="390" width="16" height="16" rx="2" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.4" opacity="0.6"/>
  <circle cx="498" cy="398" r="3" fill="rgba(255,255,255,0.2)" stroke="rgba(180,160,140,0.3)" stroke-width="0.5"/>

  <!-- Sidewalk trees -->
  <circle cx="350" cy="382" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="400" cy="382" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="498" cy="382" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="550" cy="382" r="2" fill="#98c080" opacity="0.5"/>

  <!-- ── DISTRICT LABEL ── -->
  <text x="470" y="302" fill="rgba(80,110,140,0.45)" font-size="15" font-weight="700" font-family="sans-serif" letter-spacing="8" text-anchor="middle">中央商务区</text>

  <!-- ── ROAD LABELS ── -->
  <text x="445" y="378" font-size="6.5" fill="rgba(120,100,70,0.40)" text-anchor="middle" font-family="sans-serif" font-weight="500">中央大街</text>
  <text x="455" y="268" font-size="7" fill="rgba(120,100,70,0.42)" text-anchor="start" font-family="sans-serif" font-weight="500">CBD大道</text>
</g>

<!-- Transition zone: CBD → 滨江 -->
<rect x="345" y="500" width="250" height="10" fill="rgba(160,170,160,0.04)"/>

<!-- ═══════════════════════════════════════════ -->
<!-- 滨江新城 DISTRICT (EAST, x:345-595, y:510-730) -->
<!-- ═══════════════════════════════════════════ -->
<g id="district-riverside">
  <!-- District background -->
  <rect x="345" y="510" width="250" height="220" rx="8" fill="rgba(120,175,155,0.10)"/>

  <!-- ── ROADS ── -->
  <!-- 滨江路 (vertical x=460) -->
  <rect x="456" y="510" width="8" height="220" fill="#e4dcd0" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="460" y1="510" x2="460" y2="730" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <!-- 沿江路 (horizontal y=620) -->
  <rect x="345" y="616" width="250" height="8" fill="#e4dcd0" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="345" y1="620" x2="595" y2="620" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <!-- Side streets -->
  <rect x="345" y="565" width="115" height="5" fill="#e0d8cc" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="468" y="565" width="127" height="5" fill="#e0d8cc" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="345" y="680" width="115" height="5" fill="#e0d8cc" stroke="#c8bca8" stroke-width="0.3" rx="1"/>
  <rect x="468" y="680" width="127" height="5" fill="#e0d8cc" stroke="#c8bca8" stroke-width="0.3" rx="1"/>

  <!-- ── BUILDINGS ── -->
  <!-- 江景公寓 (binjiang_apt: 420,560) - residential towers -->
  <rect x="405" y="535" width="16" height="28" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.7"/>
  <rect x="405" y="535" width="16" height="28" fill="url(#buildResTex)"/>
  <rect x="405" y="535" width="16" height="4" fill="#b8a888" rx="1"/>
  <line x1="408" y1="545" x2="418" y2="545" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
  <line x1="408" y1="552" x2="418" y2="552" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
  <!-- Adjacent tower -->
  <rect x="424" y="530" width="14" height="32" rx="1" fill="#ddd4c8" stroke="#c0b494" stroke-width="0.7"/>
  <rect x="424" y="530" width="14" height="32" fill="url(#buildResTex)"/>
  <rect x="424" y="530" width="14" height="4" fill="#b4a484" rx="1"/>
  <!-- Low connecting structure -->
  <rect x="417" y="550" width="7" height="10" fill="#d8d0c0" stroke="#c0b494" stroke-width="0.4"/>

  <!-- More residential -->
  <rect x="370" y="528" width="18" height="22" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.6"/>
  <rect x="370" y="528" width="18" height="22" fill="url(#buildResTex)"/>
  <rect x="370" y="528" width="18" height="3.5" fill="#bcac90" rx="1"/>

  <rect x="472" y="525" width="20" height="24" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.6"/>
  <rect x="472" y="525" width="20" height="24" fill="url(#buildResTex)"/>
  <rect x="472" y="525" width="20" height="4" fill="#b8a888" rx="1"/>
  <rect x="500" y="530" width="16" height="20" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.6"/>
  <rect x="500" y="530" width="16" height="20" fill="url(#buildResTex)"/>
  <rect x="500" y="530" width="16" height="3.5" fill="#bcac90" rx="1"/>

  <rect x="525" y="520" width="18" height="26" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.6"/>
  <rect x="525" y="520" width="18" height="26" fill="url(#buildResTex)"/>
  <rect x="525" y="520" width="18" height="4" fill="#b8a888" rx="1"/>

  <!-- 万达广场 (wanda_plaza: 520,650) - large mall -->
  <rect x="500" y="630" width="50" height="28" rx="2" fill="#e0d8cc" stroke="#c0b498" stroke-width="0.8"/>
  <rect x="500" y="630" width="50" height="6" fill="#c0b090" rx="2"/>
  <!-- Mall entrances -->
  <rect x="508" y="640" width="10" height="14" fill="rgba(255,255,255,0.12)" rx="1"/>
  <rect x="526" y="640" width="10" height="14" fill="rgba(255,255,255,0.10)" rx="1"/>
  <rect x="544" y="640" width="3" height="14" fill="rgba(255,255,255,0.08)" rx="0.5"/>
  <!-- Mall sign -->
  <rect x="515" y="634" width="20" height="4" fill="rgba(200,50,40,0.4)" rx="1"/>

  <!-- South residential -->
  <rect x="360" y="590" width="20" height="22" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.6"/>
  <rect x="360" y="590" width="20" height="22" fill="url(#buildResTex)"/>
  <rect x="360" y="590" width="20" height="3.5" fill="#bcac90" rx="1"/>
  <rect x="385" y="595" width="18" height="18" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.6"/>
  <rect x="385" y="595" width="18" height="18" fill="url(#buildResTex)"/>

  <rect x="472" y="590" width="16" height="18" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.6"/>
  <rect x="472" y="590" width="16" height="18" fill="url(#buildResTex)"/>
  <rect x="472" y="590" width="16" height="3" fill="#bcac90" rx="1"/>

  <!-- Riverside low-rise residential -->
  <rect x="350" y="655" width="22" height="16" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.6"/>
  <rect x="350" y="655" width="22" height="16" fill="url(#buildResTex)"/>
  <rect x="350" y="655" width="22" height="3" fill="#b8a888" rx="1"/>
  <rect x="378" y="658" width="20" height="14" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.6"/>
  <rect x="378" y="658" width="20" height="14" fill="url(#buildResTex)"/>

  <rect x="470" y="650" width="18" height="16" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.6"/>
  <rect x="470" y="650" width="18" height="16" fill="url(#buildResTex)"/>
  <rect x="470" y="650" width="18" height="3" fill="#b8a888" rx="1"/>

  <!-- Eastern edge residential -->
  <rect x="555" y="600" width="16" height="20" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.6"/>
  <rect x="555" y="600" width="16" height="20" fill="url(#buildResTex)"/>
  <rect x="555" y="600" width="16" height="3.5" fill="#bcac90" rx="1"/>
  <rect x="560" y="655" width="18" height="18" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.6"/>
  <rect x="560" y="655" width="18" height="18" fill="url(#buildResTex)"/>

  <!-- Bottom area mixed-use -->
  <rect x="395" y="695" width="24" height="16" rx="1" fill="#e0d8cc" stroke="#c4b8a0" stroke-width="0.5"/>
  <rect x="395" y="695" width="24" height="3" fill="#b8a888" rx="1"/>
  <rect x="555" y="700" width="20" height="16" rx="1" fill="#e4dcd0" stroke="#c8bca0" stroke-width="0.5"/>
  <rect x="555" y="700" width="20" height="3" fill="#bcac90" rx="1"/>

  <!-- ── RIVERSIDE PROMENADE (binjiang_riverside: 360,580) ── -->
  <!-- Boardwalk -->
  <rect x="345" y="575" width="15" height="40" rx="1" fill="#d8ccb8" stroke="#c0b090" stroke-width="0.4" opacity="0.6"/>
  <line x1="348" y1="580" x2="348" y2="610" stroke="rgba(0,0,0,0.05)" stroke-width="0.3"/>
  <line x1="352" y1="580" x2="352" y2="610" stroke="rgba(0,0,0,0.05)" stroke-width="0.3"/>
  <line x1="356" y1="580" x2="356" y2="610" stroke="rgba(0,0,0,0.05)" stroke-width="0.3"/>
  <!-- Cherry trees along riverside -->
  <circle cx="350" cy="580" r="3" fill="#e8b8c8" opacity="0.5"/>
  <circle cx="355" cy="590" r="2.8" fill="#e8c0d0" opacity="0.5"/>
  <circle cx="350" cy="600" r="3.2" fill="#e8b8c8" opacity="0.4"/>
  <circle cx="354" cy="610" r="2.5" fill="#e8c0d0" opacity="0.45"/>

  <!-- ── GREEN SPACES ── -->
  <!-- Riverside linear park -->
  <ellipse cx="350" cy="625" rx="12" ry="30" fill="#d0e4c8" stroke="#b8d4a8" stroke-width="0.6" opacity="0.75"/>
  <circle cx="346" cy="608" r="2" fill="#98c080" opacity="0.6"/>
  <circle cx="352" cy="618" r="1.8" fill="#a0c888" opacity="0.6"/>
  <circle cx="348" cy="630" r="2.2" fill="#90b878" opacity="0.6"/>
  <circle cx="354" cy="640" r="1.8" fill="#98c080" opacity="0.6"/>

  <!-- Small garden area -->
  <ellipse cx="540" cy="570" rx="18" ry="14" fill="#d0e4cc" stroke="#b8d4a8" stroke-width="0.5" opacity="0.7"/>
  <circle cx="532" cy="565" r="2.2" fill="#a0c490" opacity="0.6"/>
  <circle cx="540" cy="562" r="2.5" fill="#b0cc98" opacity="0.6"/>
  <circle cx="548" cy="567" r="2" fill="#98b888" opacity="0.6"/>
  <circle cx="536" cy="575" r="2" fill="#a8c898" opacity="0.6"/>

  <!-- Street trees -->
  <circle cx="420" cy="617" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="500" cy="617" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="385" cy="562" r="1.8" fill="#a0c888" opacity="0.5"/>

  <!-- ── DISTRICT LABEL ── -->
  <text x="470" y="541" fill="rgba(70,140,120,0.45)" font-size="15" font-weight="700" font-family="sans-serif" letter-spacing="8" text-anchor="middle">滨江新城</text>

  <!-- ── ROAD LABELS ── -->
  <text x="465" y="506" font-size="7" fill="rgba(120,100,70,0.40)" text-anchor="start" font-family="sans-serif" font-weight="500">滨江路</text>
  <text x="465" y="614" font-size="7" fill="rgba(120,100,70,0.40)" text-anchor="middle" font-family="sans-serif" font-weight="500">沿江路</text>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- 南岸艺术区 DISTRICT (SOUTHWEST, x:5-250, y:740-1080) -->
<!-- ═══════════════════════════════════════════ -->
<g id="district-southarts">
  <!-- District background -->
  <rect x="5" y="740" width="245" height="340" rx="8" fill="rgba(210,160,110,0.10)"/>

  <!-- ── ROADS ── -->
  <!-- 南岸路 (main horizontal y=805) -->
  <rect x="5" y="801" width="245" height="8" fill="#e4dcd0" stroke="#c4b8a4" stroke-width="0.5" rx="2"/>
  <line x1="5" y1="805" x2="250" y2="805" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <!-- 梧桐街 (y=870) -->
  <rect x="5" y="866" width="245" height="8" fill="#e0d8cc" stroke="#c8bca8" stroke-width="0.5" rx="2"/>
  <line x1="5" y1="870" x2="250" y2="870" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  <!-- Vertical (south branch x=130) -->
  <rect x="126" y="740" width="8" height="340" fill="#e0d8cc" stroke="#c8bca8" stroke-width="0.5" rx="2"/>
  <line x1="130" y1="740" x2="130" y2="1080" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  <!-- Small alleys -->
  <path d="M 5,925 L 130,925" stroke="#e0d8cc" stroke-width="4" stroke-linecap="round"/>
  <path d="M 130,925 L 250,925" stroke="#e0d8cc" stroke-width="4" stroke-linecap="round"/>
  <path d="M 5,980 L 130,980" stroke="#e0d8cc" stroke-width="4" stroke-linecap="round"/>
  <path d="M 130,980 L 250,980" stroke="#e0d8cc" stroke-width="4" stroke-linecap="round"/>
  <!-- Winding alley -->
  <path d="M 5,1025 Q 60,1020 65,1030 Q 70,1040 130,1035" stroke="#e0d8cc" stroke-width="3" stroke-linecap="round"/>

  <!-- ── BUILDINGS ── -->
  <!-- 老洋房 (nanan_home: 80,810) - historic house -->
  <rect x="62" y="795" width="28" height="22" rx="1" fill="#e0d4c4" stroke="#c0a888" stroke-width="0.8"/>
  <path d="M 58,795 L 76,784 L 94,795" fill="#a08060" stroke="#806048" stroke-width="0.6"/>
  <rect x="62" y="795" width="28" height="22" fill="url(#buildUnivTex)"/>
  <!-- Windows -->
  <rect x="66" y="800" width="5" height="6" fill="rgba(255,255,255,0.15)" rx="0.5"/>
  <rect x="75" y="800" width="5" height="6" fill="rgba(255,255,255,0.12)" rx="0.5"/>
  <rect x="84" y="800" width="4" height="6" fill="rgba(255,255,255,0.10)" rx="0.5"/>
  <rect x="66" y="809" width="5" height="6" fill="rgba(255,255,255,0.10)" rx="0.5"/>
  <rect x="75" y="809" width="5" height="6" fill="rgba(255,255,255,0.08)" rx="0.5"/>
  <!-- Chimney -->
  <rect x="85" y="784" width="3" height="10" fill="#987860"/>

  <!-- 刘小贝loft (xiaobei_loft: 160,830) - loft style -->
  <rect x="145" y="815" width="22" height="20" rx="1" fill="#dcd4c8" stroke="#b8a488" stroke-width="0.7"/>
  <rect x="145" y="815" width="22" height="20" fill="url(#buildResTex)"/>
  <rect x="145" y="815" width="22" height="4" fill="#a89070" rx="1"/>
  <!-- Large loft windows -->
  <rect x="149" y="822" width="6" height="10" fill="rgba(255,255,255,0.15)" rx="0.5"/>
  <rect x="157" y="822" width="6" height="10" fill="rgba(255,255,255,0.12)" rx="0.5"/>

  <!-- 气球海艺术展 (qiqiu_hai: 220,850) - old factory/warehouse -->
  <rect x="205" y="835" width="35" height="22" rx="2" fill="#d8d0c4" stroke="#b0a090" stroke-width="0.8"/>
  <!-- Sawtooth roof (factory style) -->
  <path d="M 205,835 L 212,828 L 219,835 L 226,828 L 233,835 L 240,828" fill="none" stroke="#988878" stroke-width="0.8"/>
  <line x1="205" y1="835" x2="240" y2="835" stroke="#a89880" stroke-width="0.5"/>
  <!-- Factory windows -->
  <rect x="210" y="842" width="5" height="8" fill="rgba(255,255,255,0.12)" rx="0.5"/>
  <rect x="218" y="842" width="5" height="8" fill="rgba(255,255,255,0.10)" rx="0.5"/>
  <rect x="226" y="842" width="5" height="8" fill="rgba(255,255,255,0.12)" rx="0.5"/>

  <!-- 转角咖啡馆 (nanan_cafe: 180,920) -->
  <rect x="168" y="905" width="18" height="16" rx="1" fill="#e4d8c8" stroke="#c4ac88" stroke-width="0.7"/>
  <path d="M 166,905 L 177,898 L 188,905" fill="#a08060" stroke="#806048" stroke-width="0.5"/>
  <rect x="171" y="908" width="4" height="6" fill="rgba(255,255,255,0.12)" rx="0.5"/>
  <rect x="178" y="908" width="4" height="6" fill="rgba(255,255,255,0.10)" rx="0.5"/>
  <!-- Awning -->
  <path d="M 168,909 L 186,909" stroke="#c08060" stroke-width="1.5" opacity="0.5"/>

  <!-- 陶艺工坊 (taoyi_workshop: 60,940) -->
  <rect x="44" y="925" width="22" height="18" rx="1" fill="#e0d4c4" stroke="#c0a888" stroke-width="0.7"/>
  <rect x="44" y="925" width="22" height="18" fill="url(#buildUnivTex)"/>
  <rect x="44" y="925" width="22" height="4" fill="#a89070" rx="1"/>
  <!-- Kiln chimney -->
  <rect x="58" y="918" width="4" height="7" fill="#886858" rx="0.5"/>
  <!-- Workshop windows -->
  <rect x="48" y="932" width="5" height="5" fill="rgba(255,255,255,0.12)" rx="0.3"/>
  <rect x="56" y="932" width="5" height="5" fill="rgba(255,255,255,0.10)" rx="0.3"/>

  <!-- MAO Livehouse (mao_livehouse: 230,970) -->
  <rect x="212" y="955" width="28" height="20" rx="1" fill="#d0c8b8" stroke="#a89880" stroke-width="0.8"/>
  <rect x="212" y="955" width="28" height="5" fill="#605050"/>
  <!-- Neon sign bar -->
  <rect x="218" y="957" width="16" height="2" fill="rgba(220,60,80,0.5)" rx="0.5"/>
  <!-- Doors -->
  <rect x="220" y="965" width="5" height="8" fill="rgba(0,0,0,0.15)" rx="0.5"/>
  <rect x="228" y="965" width="5" height="8" fill="rgba(0,0,0,0.10)" rx="0.5"/>

  <!-- 独立画室 (nanan_studio: 100,1000) -->
  <rect x="84" y="988" width="24" height="18" rx="1" fill="#e4dcd0" stroke="#c0b090" stroke-width="0.7"/>
  <!-- Skylight roof -->
  <path d="M 88,988 L 96,982 L 104,988" fill="rgba(255,255,255,0.2)" stroke="#c0b090" stroke-width="0.5"/>
  <rect x="84" y="988" width="24" height="18" fill="url(#buildUnivTex)"/>
  <!-- Large windows -->
  <rect x="88" y="996" width="8" height="8" fill="rgba(255,255,255,0.15)" rx="0.5"/>
  <rect x="98" y="996" width="7" height="8" fill="rgba(255,255,255,0.10)" rx="0.5"/>

  <!-- Mixed small buildings north of road -->
  <rect x="15" y="760" width="18" height="16" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.6"/>
  <path d="M 13,760 L 24,753 L 35,760" fill="#9a7868" stroke="#7a5848" stroke-width="0.4"/>
  <rect x="15" y="760" width="18" height="16" fill="url(#buildResTex)"/>

  <rect x="40" y="758" width="16" height="14" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.6"/>
  <path d="M 38,758 L 48,752 L 58,758" fill="#9a7868" stroke="#7a5848" stroke-width="0.4"/>

  <rect x="92" y="755" width="20" height="18" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="92" y="755" width="20" height="18" fill="url(#buildResTex)"/>
  <rect x="92" y="755" width="20" height="3.5" fill="#bcac90" rx="1"/>

  <rect x="170" y="762" width="18" height="20" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.6"/>
  <rect x="170" y="762" width="18" height="20" fill="url(#buildResTex)"/>
  <rect x="170" y="762" width="18" height="3.5" fill="#bcac90" rx="1"/>

  <rect x="195" y="758" width="16" height="22" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="195" y="758" width="16" height="22" fill="url(#buildResTex)"/>
  <rect x="195" y="758" width="16" height="3" fill="#bcac90" rx="1"/>

  <!-- Buildings between roads -->
  <rect x="18" y="812" width="20" height="16" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="18" y="812" width="20" height="16" fill="url(#buildResTex)"/>
  <rect x="18" y="812" width="20" height="3" fill="#bcac90" rx="1"/>

  <rect x="110" y="818" width="16" height="20" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.6"/>
  <path d="M 108,818 L 118,811 L 128,818" fill="#8a6050" stroke="#6a4030" stroke-width="0.4"/>

  <!-- Breathing courtyard -->
  <rect x="55" y="798" width="24" height="16" rx="4" fill="rgba(200,218,180,0.35)"/>
  <circle cx="62" cy="804" r="2" fill="#a0c090" opacity="0.5"/>
  <circle cx="72" cy="806" r="1.5" fill="#98b888" opacity="0.5"/>
  <circle cx="67" cy="810" r="1.8" fill="#a8c898" opacity="0.4"/>
  <path d="M 60,808 Q 67,804 74,808" stroke="rgba(180,170,150,0.25)" stroke-width="1" fill="none"/>

  <rect x="150" y="870" width="18" height="16" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.6"/>
  <rect x="150" y="870" width="18" height="16" fill="url(#buildResTex)"/>

  <!-- South area shops/buildings -->
  <rect x="12" y="880" width="16" height="14" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.5"/>
  <path d="M 10,880 L 20,873 L 30,880" fill="#9a7868" stroke="#7a5848" stroke-width="0.4"/>

  <rect x="70" y="878" width="18" height="16" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.5"/>
  <rect x="70" y="878" width="18" height="16" fill="url(#buildResTex)"/>

  <rect x="135" y="930" width="16" height="14" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.5"/>
  <path d="M 133,930 L 143,923 L 153,930" fill="#8a6050" stroke="#6a4030" stroke-width="0.4"/>

  <rect x="10" y="935" width="14" height="12" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.5"/>

  <rect x="80" y="940" width="15" height="12" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.5"/>

  <!-- Bottom south buildings -->
  <rect x="8" y="1005" width="22" height="14" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.5"/>
  <rect x="8" y="1005" width="22" height="3" fill="#bcac90" rx="1"/>

  <rect x="145" y="1000" width="16" height="14" rx="1" fill="#e0d8c8" stroke="#c0b494" stroke-width="0.5"/>
  <path d="M 143,1000 L 153,993 L 163,1000" fill="#9a7868" stroke="#7a5848" stroke-width="0.4"/>

  <rect x="170" y="1010" width="18" height="12" rx="1" fill="#e4dcd0" stroke="#c4b898" stroke-width="0.5"/>

  <!-- ── GREEN SPACES ── -->
  <!--梧桐树 along 梧桐街 (signature trees) -->
  <circle cx="20" cy="868" r="3.5" fill="#98c080" opacity="0.6"/>
  <circle cx="40" cy="867" r="3.2" fill="#a0c888" opacity="0.6"/>
  <circle cx="60" cy="868" r="3.5" fill="#90b878" opacity="0.6"/>
  <circle cx="155" cy="867" r="3.2" fill="#98c080" opacity="0.6"/>
  <circle cx="175" cy="868" r="3.5" fill="#a0c888" opacity="0.6"/>
  <circle cx="195" cy="867" r="3" fill="#90b878" opacity="0.6"/>
  <circle cx="215" cy="868" r="3.5" fill="#98c080" opacity="0.6"/>
  <circle cx="235" cy="867" r="3.2" fill="#a0c888" opacity="0.6"/>

  <!-- Small park south -->
  <ellipse cx="200" cy="945" rx="20" ry="18" fill="#d0e4c8" stroke="#b8d4a8" stroke-width="0.6" opacity="0.7"/>
  <circle cx="192" cy="938" r="2.5" fill="#98c080" opacity="0.6"/>
  <circle cx="200" cy="935" r="2.8" fill="#a0c888" opacity="0.6"/>
  <circle cx="208" cy="940" r="2.2" fill="#90b878" opacity="0.6"/>
  <circle cx="195" cy="948" r="2.5" fill="#a8c898" opacity="0.6"/>
  <circle cx="205" cy="950" r="2" fill="#b0cc98" opacity="0.5"/>
  <!-- Tiny pond -->
  <ellipse cx="200" cy="955" rx="5" ry="3.5" fill="#8abcd0" opacity="0.5"/>

  <!-- Larger park area -->
  <ellipse cx="30" cy="1065" rx="30" ry="22" fill="#d0e4cc" stroke="#b8d4a8" stroke-width="0.6" opacity="0.75"/>
  <circle cx="18" cy="1058" r="3" fill="#98c080" opacity="0.6"/>
  <circle cx="28" cy="1055" r="2.5" fill="#a0c888" opacity="0.6"/>
  <circle cx="38" cy="1058" r="2.8" fill="#90b878" opacity="0.6"/>
  <circle cx="20" cy="1068" r="2.5" fill="#a8c898" opacity="0.6"/>
  <circle cx="35" cy="1070" r="2.2" fill="#b0cc98" opacity="0.5"/>
  <circle cx="45" cy="1065" r="2.5" fill="#98c080" opacity="0.6"/>

  <!-- Street trees on south side -->
  <circle cx="12" cy="802" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="55" cy="802" r="2" fill="#a0c888" opacity="0.5"/>
  <circle cx="200" cy="802" r="2" fill="#98c080" opacity="0.5"/>
  <circle cx="240" cy="802" r="2" fill="#a0c888" opacity="0.5"/>

  <!-- Small flower patches -->
  <circle cx="100" cy="802" r="1.5" fill="#e8a0b0" opacity="0.35"/>
  <circle cx="105" cy="803" r="1.3" fill="#f0c0a0" opacity="0.35"/>
  <circle cx="110" cy="801" r="1.5" fill="#e0b0c0" opacity="0.35"/>

  <!-- ── DISTRICT LABEL ── -->
  <text x="127" y="757" fill="rgba(160,120,70,0.48)" font-size="16" font-weight="700" font-family="sans-serif" letter-spacing="8" text-anchor="middle">南岸艺术区</text>

  <!-- ── ROAD LABELS ── -->
  <text x="135" y="800" font-size="7" fill="rgba(120,100,70,0.42)" text-anchor="middle" font-family="sans-serif" font-weight="500">南岸路</text>
  <text x="135" y="865" font-size="7" fill="rgba(120,100,70,0.42)" text-anchor="middle" font-family="sans-serif" font-weight="500">梧桐街</text>
  <text x="10" y="923" font-size="6" fill="rgba(120,100,70,0.30)" text-anchor="start" font-family="sans-serif">小巷</text>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- METRO LINES -->
<!-- ═══════════════════════════════════════════ -->
<g id="metro-lines">
  <!-- Line 1 (Red) - West bank: 大学城站 → 南岸站 -->
  <!-- Underground, shown as dashed line -->
  <path d="M 135,222 Q 130,350 132,500 Q 134,650 133,800 Q 132,920 135,1038" stroke="#e0556a" stroke-width="4" fill="none" stroke-dasharray="6,4" opacity="0.55"/>
  <!-- Crossing river via tunnel -->
  <path d="M 135,1038 Q 140,1055 155,1058 Q 250,1060 350,1040 Q 420,1020 438,950 Q 445,850 445,700" stroke="#e0556a" stroke-width="4" fill="none" stroke-dasharray="6,4" opacity="0.55"/>

  <!-- Line 2 (Blue) - East bank: CBD站 → 滨江站 -->
  <path d="M 445,468 Q 440,530 443,620 Q 445,660 445,688" stroke="#5b9ecf" stroke-width="4" fill="none" stroke-dasharray="6,4" opacity="0.55"/>

  <!-- ═ Stations ═ -->
  <!-- 大学城站 (135, 235) -->
  <g transform="translate(135,228)">
    <circle cx="0" cy="0" r="6" fill="#fff" stroke="#e0556a" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="3" fill="#e0556a"/>
    <text x="12" y="4" font-size="7.5" fill="#c04455" font-weight="700" font-family="sans-serif">大学城站</text>
    <text x="12" y="13" font-size="5.5" fill="#c0445588" font-family="sans-serif">M1</text>
  </g>

  <!-- 南岸站 (135, 1050) -->
  <g transform="translate(135,1040)">
    <circle cx="0" cy="0" r="6" fill="#fff" stroke="#e0556a" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="3" fill="#e0556a"/>
    <text x="12" y="4" font-size="7.5" fill="#c04455" font-weight="700" font-family="sans-serif">南岸站</text>
    <text x="12" y="13" font-size="5.5" fill="#c0445588" font-family="sans-serif">M1</text>
  </g>

  <!-- CBD站 (445, 480) -->
  <g transform="translate(445,472)">
    <circle cx="0" cy="0" r="6" fill="#fff" stroke="#5b9ecf" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="3" fill="#5b9ecf"/>
    <text x="10" y="4" font-size="7.5" fill="#4078a8" font-weight="700" font-family="sans-serif">CBD站</text>
    <text x="10" y="13" font-size="5.5" fill="#4078a888" font-family="sans-serif">M2</text>
  </g>

  <!-- 滨江站 (445, 700) -->
  <g transform="translate(445,692)">
    <circle cx="0" cy="0" r="6" fill="#fff" stroke="#5b9ecf" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="3" fill="#5b9ecf"/>
    <text x="10" y="4" font-size="7.5" fill="#4078a8" font-weight="700" font-family="sans-serif">滨江站</text>
    <text x="10" y="13" font-size="5.5" fill="#4078a888" font-family="sans-serif">M2</text>
  </g>

  <!-- Metro interchange indicator at CBD -->
  <g transform="translate(445,472)">
    <rect x="-8" y="-8" width="16" height="16" rx="3" fill="none" stroke="#888" stroke-width="0.8" stroke-dasharray="2,1" opacity="0.4"/>
  </g>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- 江城港区 (EAST BANK BOTTOM, x:345-595, y:730-1100) -->
<!-- ═══════════════════════════════════════════ -->
<g id="district-east-bottom">
  <rect x="345" y="730" width="250" height="370" rx="6" fill="rgba(155,180,170,0.06)"/>

  <!-- Warehouse / port buildings -->
  <rect x="360" y="745" width="40" height="28" rx="1.5" fill="#d4ccc0" stroke="#b4a484" stroke-width="0.7"/>
  <rect x="360" y="745" width="40" height="4" fill="#a08870"/>
  <rect x="415" y="750" width="35" height="22" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="415" y="750" width="35" height="3.5" fill="#a08870"/>
  <rect x="465" y="740" width="30" height="30" rx="1.5" fill="#d0c8b8" stroke="#b0a080" stroke-width="0.7"/>
  <rect x="465" y="740" width="30" height="4" fill="#a08870"/>
  <rect x="510" y="755" width="28" height="24" rx="1.5" fill="#dcd4c4" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="510" y="755" width="28" height="3" fill="#a08870"/>

  <!-- Dock / pier -->
  <rect x="345" y="800" width="12" height="40" fill="#c8bca8" stroke="#a89880" stroke-width="0.5" rx="1"/>
  <rect x="348" y="805" width="6" height="30" fill="rgba(0,0,0,0.04)"/>

  <!-- More buildings -->
  <rect x="370" y="810" width="32" height="24" rx="1.5" fill="#e0d8c8" stroke="#c0b090" stroke-width="0.6"/>
  <rect x="370" y="810" width="32" height="3.5" fill="#a08870"/>
  <rect x="415" y="805" width="36" height="28" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="415" y="805" width="36" height="4" fill="#a08870"/>
  <rect x="465" y="815" width="28" height="22" rx="1.5" fill="#dcd4c4" stroke="#bcac90" stroke-width="0.6"/>
  <rect x="465" y="815" width="28" height="3" fill="#a08870"/>
  <rect x="508" y="808" width="32" height="26" rx="1.5" fill="#d4ccc0" stroke="#b4a484" stroke-width="0.6"/>
  <rect x="508" y="808" width="32" height="3.5" fill="#a08870"/>

  <!-- Harbor / marina area -->
  <rect x="345" y="860" width="8" height="50" fill="#c4b8a4" stroke="#a89880" stroke-width="0.5" rx="1"/>
  <ellipse cx="530" cy="920" rx="35" ry="40" fill="#b8d4e0" stroke="#8abcd0" stroke-width="0.6" opacity="0.3"/>
  <text x="530" y="922" font-size="8" fill="rgba(60,120,140,0.4)" text-anchor="middle" font-family="sans-serif">⛵ 游艇码头</text>

  <!-- Industrial buildings near port -->
  <rect x="370" y="870" width="34" height="22" rx="1" fill="#ccc4b4" stroke="#b0a090" stroke-width="0.6"/>
  <rect x="370" y="870" width="34" height="3" fill="#988870"/>
  <rect x="420" y="875" width="28" height="18" rx="1" fill="#d0c8b8" stroke="#b4a484" stroke-width="0.6"/>
  <rect x="420" y="875" width="28" height="3" fill="#988870"/>

  <!-- Seaside park on east edge -->
  <ellipse cx="560" y="990" rx="30" ry="45" fill="#d0e0c4" stroke="#b8cfa0" stroke-width="0.7" opacity="0.75"/>
  <circle cx="552" cy="968" r="2.5" fill="#a0c490"/>
  <circle cx="565" cy="980" r="2" fill="#98b888"/>
  <circle cx="555" cy="995" r="3" fill="#a8c898"/>
  <circle cx="568" cy="1005" r="2.2" fill="#a0c490"/>
  <path d="M 555,985 Q 560,980 565,985" stroke="rgba(180,170,150,0.3)" stroke-width="1.5" fill="none"/>

  <!-- Lighthouse beacon -->
  <rect x="555" y="940" width="5" height="18" rx="1" fill="#d0c8b8"/>
  <circle cx="557" cy="938" r="3" fill="#f0e0a0" opacity="0.5"/>

  <!-- Road -->
  <rect x="345" y="850" width="200" height="6" fill="#e8e0d4" stroke="#c4b8a4" stroke-width="0.4" rx="2"/>
  <rect x="460" y="730" width="6" height="170" fill="#e4dcd0" stroke="#c0b8a4" stroke-width="0.4" rx="2"/>

  <!-- Label -->
  <text x="470" y="770" fill="rgba(100,140,130,0.35)" font-size="14" font-weight="600" font-family="sans-serif" letter-spacing="8" text-anchor="middle">江城港区</text>

  <!-- South residential cluster -->
  <rect x="370" y="920" width="30" height="24" rx="1.5" fill="#dcd4c4" stroke="#bca890" stroke-width="0.6"/>
  <rect x="370" y="920" width="30" height="3.5" fill="#a08870"/>
  <rect x="415" y="915" width="26" height="26" rx="1.5" fill="#d8d0c0" stroke="#b8a888" stroke-width="0.6"/>
  <rect x="415" y="915" width="26" height="4" fill="#a08870"/>
  <rect x="455" y="925" width="32" height="20" rx="1.5" fill="#e0d8c8" stroke="#c0b090" stroke-width="0.6"/>
  <rect x="455" y="925" width="32" height="3.5" fill="#a08870"/>
  <rect x="500" y="918" width="28" height="24" rx="1.5" fill="#d4ccc0" stroke="#b4a484" stroke-width="0.6"/>
  <rect x="500" y="918" width="28" height="3.5" fill="#a08870"/>

  <!-- Harbor warehouse cluster -->
  <rect x="370" y="970" width="34" height="20" rx="1.5" fill="#ccc4b4" stroke="#b0a090" stroke-width="0.6"/>
  <rect x="370" y="970" width="34" height="3.5" fill="#988870"/>
  <rect x="420" y="975" width="28" height="18" rx="1.5" fill="#d0c8b8" stroke="#b4a484" stroke-width="0.6"/>
  <rect x="420" y="975" width="28" height="3" fill="#988870"/>
  <rect x="465" y="965" width="26" height="24" rx="1.5" fill="#c8c0b0" stroke="#aca090" stroke-width="0.6"/>
  <rect x="465" y="965" width="26" height="3.5" fill="#988870"/>

  <!-- Seaside promenade park -->
  <ellipse cx="540" cy="1045" rx="25" ry="35" fill="#d0e0c4" stroke="#b8cfa0" stroke-width="0.6" opacity="0.7"/>
  <circle cx="532" cy="1030" r="2" fill="#a0c490"/>
  <circle cx="545" cy="1040" r="2.5" fill="#98b888"/>
  <circle cx="535" cy="1055" r="2" fill="#a8c898"/>
  <circle cx="548" cy="1060" r="1.8" fill="#a0c490"/>
  <path d="M 535,1045 Q 542,1040 548,1045" stroke="rgba(180,170,150,0.25)" stroke-width="1.5" fill="none"/>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- DECORATIVE ELEMENTS -->
<!-- ═══════════════════════════════════════════ -->
<g id="decorations" pointer-events="none">
  <!-- ═ Clouds ═ -->
  <g opacity="0.25">
    <ellipse cx="80" cy="12" rx="25" ry="8" fill="#fff"/>
    <ellipse cx="72" cy="10" rx="15" ry="6" fill="#fff"/>
    <ellipse cx="90" cy="9" rx="12" ry="5" fill="#fff"/>
  </g>
  <g opacity="0.20">
    <ellipse cx="450" cy="18" rx="30" ry="9" fill="#fff"/>
    <ellipse cx="440" cy="16" rx="18" ry="7" fill="#fff"/>
    <ellipse cx="462" cy="15" rx="14" ry="6" fill="#fff"/>
  </g>
  <g opacity="0.18">
    <ellipse cx="200" cy="495" rx="20" ry="7" fill="#fff"/>
    <ellipse cx="193" cy="493" rx="12" ry="5" fill="#fff"/>
    <ellipse cx="210" cy="492" rx="10" ry="4" fill="#fff"/>
  </g>
  <g opacity="0.22">
    <ellipse cx="500" cy="715" rx="22" ry="8" fill="#fff"/>
    <ellipse cx="511" cy="713" rx="14" ry="6" fill="#fff"/>
  </g>

  <!-- ═ Compass rose (tiny, top-left) ═ -->
  <g transform="translate(575,20)" opacity="0.3">
    <circle cx="0" cy="0" r="8" fill="none" stroke="#a09080" stroke-width="0.8"/>
    <polygon points="0,-7 2,-1 0,-3 -2,-1" fill="#c0a0a0"/>
    <polygon points="0,7 2,1 0,3 -2,1" fill="#a0a0a0"/>
    <polygon points="-7,0 -1,2 -3,0 -1,-2" fill="#a0a0a0"/>
    <polygon points="7,0 1,2 3,0 1,-2" fill="#a0a0a0"/>
    <text x="0" y="-10" font-size="5" fill="#a09080" text-anchor="middle" font-family="serif" font-weight="700">N</text>
  </g>

  <!-- ═ Small pedestrian bridge in 南岸 ═ -->
  <g transform="translate(100, 920)" opacity="0.4">
    <path d="M -8,5 Q 0,0 8,5" fill="none" stroke="#b0a090" stroke-width="1.5"/>
    <line x1="-6" y1="5" x2="-6" y2="8" stroke="#b0a090" stroke-width="1"/>
    <line x1="6" y1="5" x2="6" y2="8" stroke="#b0a090" stroke-width="1"/>
  </g>

  <!-- ═ Canal in 南岸 ═ -->
  <path d="M 10,860 Q 15,872 12,885 Q 8,898 15,908" stroke="#8abcd0" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>
  <path d="M 10,860 Q 15,872 12,885 Q 8,898 15,908" stroke="#a0d0e4" stroke-width="1.5" fill="none" opacity="0.3" stroke-linecap="round"/>

  <!-- ═ Water fountain in CBD plaza ═ -->
  <g transform="translate(498, 398)" opacity="0.4">
    <circle cx="0" cy="0" r="4" fill="none" stroke="#8abcd0" stroke-width="0.8"/>
    <circle cx="0" cy="0" r="1.5" fill="#fff" opacity="0.5"/>
    <path d="M 0,0 L -1,-3 M 0,0 L 1,-3 M 0,0 L -2,-2 M 0,0 L 2,-2" stroke="#a0d0e4" stroke-width="0.5" opacity="0.5"/>
  </g>

  <!-- ═ Fishing pier on east riverbank ═ -->
  <g transform="translate(342, 350)" opacity="0.35">
    <rect x="0" y="0" width="8" height="12" fill="#d0c8b8" stroke="#b0a090" stroke-width="0.4" rx="1"/>
    <line x1="1" y1="2" x2="1" y2="10" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>
    <line x1="3" y1="2" x2="3" y2="10" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>
    <line x1="5" y1="2" x2="5" y2="10" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>
    <line x1="7" y1="2" x2="7" y2="10" stroke="rgba(0,0,0,0.05)" stroke-width="0.5"/>
  </g>

  <!-- ═ Marina docks on east riverbank south ═ -->
  <g transform="translate(340, 680)" opacity="0.35">
    <rect x="0" y="0" width="5" height="15" fill="#d0c8b8" stroke="#b0a090" stroke-width="0.4" rx="0.5"/>
    <rect x="0" y="18" width="5" height="12" fill="#d0c8b8" stroke="#b0a090" stroke-width="0.4" rx="0.5"/>
  </g>

  <!-- ═ Lighthouse/beacon at south end ═ -->
  <g transform="translate(180, 1075)" opacity="0.3">
    <rect x="-2" y="-8" width="4" height="8" fill="#c8b8a0" stroke="#a89078" stroke-width="0.5"/>
    <circle cx="0" cy="-10" r="2.5" fill="#f0e0a0" stroke="#c8b898" stroke-width="0.5"/>
    <circle cx="0" cy="-10" r="1" fill="#fff" opacity="0.4"/>
  </g>
</g>

<!-- ═══════════════════════════════════════════ -->
<!-- TIME OVERLAY (hidden by default, used for day/night) -->
<!-- ═══════════════════════════════════════════ -->
<rect id="timeOverlay" x="0" y="0" width="600" height="1100" fill="none" pointer-events="none"/>

</svg>`;

  /* Weather badge */
  fetch(`${API}/api/world`).then(r=>r.json()).then(w=>{
    const badge = document.getElementById('mapWeatherBadge');
    if(badge){
      const wmoji = {'晴':'☀️','多云':'⛅','阴':'☁️','小雨':'🌧️','大雨':'🌧️','雷阵雨':'⛈️','雾':'🌫️','雪':'❄️'};
      const wd = w.weather || {};
      badge.innerHTML = (wmoji[wd.weather]||'🌤️')+' '+(wd.description||(wd.weather+' · '+(wd.temperature||24)+'°C'));
    }
  }).catch(()=>{});

  /* ═══ POI OVERLAYS (HTML, positioned by %) ═══ */
  container.insertAdjacentHTML('beforeend',

/* ═══════════════════════════════════════
   LANDMARK POIs (poi-lg) — 25 locations from location_graph.json
   Position calculation: left% = x/6, top% = y/11
   ═══════════════════════════════════════ */

/* ── 大学城 (x:5-250, y:15-255) ── */

/* 任彤宿舍 (80,60) → left=13.3%, top=5.5% */
'<div class="poi-lg poi-home" style="left:13.3%;top:5.5%" onclick="showPOI(\'任彤宿舍\',\'单人宿舍，书桌上堆着建筑系图纸和模型材料，床头贴着你送她的拍立得\')"><div class="poi-icon">📚</div><div class="poi-lg-name">任彤宿舍</div></div>'+

/* 宝宝宿舍 (180,80) → left=30%, top=7.3% */
'<div class="poi-lg" style="left:30%;top:7.3%" onclick="showPOI(\'宝宝宿舍\',\'你的地盘！桌上放着笔记本电脑和外接显示器，角落堆着快乐水\')"><div class="poi-icon">🏠</div><div class="poi-lg-name">宝宝宿舍</div></div>'+

/* 城北大学·一食堂 (110,145) → left=18.3%, top=13.2% */
'<div class="poi-lg" style="left:18.3%;top:13.2%" onclick="showPOI(\'城北大学·一食堂\',\'最大食堂，一楼大众窗口二楼小炒，饭点人声鼎沸\')"><div class="poi-icon">🍱</div><div class="poi-lg-name">一食堂</div></div>'+

/* 城北大学·图书馆 (35,105) → left=5.8%, top=9.5% */
'<div class="poi-lg" style="left:5.8%;top:9.5%" onclick="showPOI(\'城北大学·图书馆\',\'五层现代图书馆，自习区常年满座，靠窗单人隔间适合安静看书\')"><div class="poi-icon">📖</div><div class="poi-lg-name">图书馆</div></div>'+

/* 城北大学·操场 (225,180) → left=37.5%, top=16.4% */
'<div class="poi-lg" style="left:37.5%;top:16.4%" onclick="showPOI(\'城北大学·操场\',\'标准跑道加足球场，看台角落是情侣偷偷接吻的地方\')"><div class="poi-icon">🏃</div><div class="poi-lg-name">操场</div></div>'+

/* 城北大学·体育馆 (60,200) → left=10%, top=18.2% */
'<div class="poi-lg" style="left:10%;top:18.2%" onclick="showPOI(\'城北大学·体育馆\',\'室内体育馆，篮球场羽毛球场加小型游泳池\')"><div class="poi-icon">🏋️</div><div class="poi-lg-name">体育馆</div></div>'+

/* 大学城地铁站 (135,235) → left=22.5%, top=21.4% */
'<div class="poi-lg" style="left:22.5%;top:21.4%" onclick="showPOI(\'大学城地铁站\',\'🚇 地铁1号线北端起点，站外一排共享单车和摩的\')"><div class="poi-icon">🚇</div><div class="poi-lg-name">大学城站</div></div>'+

/* ── CBD (x:345-595, y:270-500) ── */

/* 清漪服务公寓 (520,350) → left=86.7%, top=31.8% */
'<div class="poi-lg" style="left:86.7%;top:31.8%" onclick="showPOI(\'清漪的家\',\'高端服务式公寓45层，房间在32楼，窗外是城市天际线\')"><div class="poi-icon">🏙️</div><div class="poi-lg-name">清漪的家</div></div>'+

/* CBD·中海国际写字楼 (460,310) → left=76.7%, top=28.2% */
'<div class="poi-lg" style="left:76.7%;top:28.2%" onclick="showPOI(\'清漪公司\',\'CBD核心甲级写字楼，28层走廊尽头落地玻璃俯瞰CBD\')"><div class="poi-icon">👔</div><div class="poi-lg-name">中海国际</div></div>'+

/* 山堂茶室 (550,430) → left=91.7%, top=39.1% */
'<div class="poi-lg" style="left:91.7%;top:39.1%" onclick="showPOI(\'山堂茶室\',\'藏在高楼夹缝里的老茶室，木质门槛磨得发亮，包间有榻榻米\')"><div class="poi-icon">🍵</div><div class="poi-lg-name">山堂茶室</div></div>'+

/* CBD·中心公园 (380,420) → left=63.3%, top=38.2% */
'<div class="poi-lg" style="left:63.3%;top:38.2%" onclick="showPOI(\'CBD中心公园\',\'城市中心公园，大片草坪加人工湖，湖边长椅是午饭热门位\')"><div class="poi-icon">🌳</div><div class="poi-lg-name">中心公园</div></div>'+

/* CBD地铁站 (445,480) → left=74.2%, top=43.6% */
'<div class="poi-lg" style="left:74.2%;top:43.6%" onclick="showPOI(\'CBD地铁站\',\'🚇 全城最繁忙换乘枢纽，三层挑高穹顶电子天幕\')"><div class="poi-icon">🚇</div><div class="poi-lg-name">CBD站</div></div>'+

/* ── 滨江新城 (x:345-595, y:510-730) ── */

/* 江景公寓 (420,560) → left=70%, top=50.9% */
'<div class="poi-lg" style="left:70%;top:50.9%" onclick="showPOI(\'婉清+可馨的家\',\'江景高层合租，客厅整面落地窗正对江面，晚上看对岸CBD灯光\')"><div class="poi-icon">🐱</div><div class="poi-lg-name">婉清+可馨的家</div></div>'+

/* 沿江步道 (360,580) → left=60%, top=52.7% */
'<div class="poi-lg" style="left:60%;top:52.7%" onclick="showPOI(\'沿江步道\',\'沿江木栈道，一排樱花树。江风很大，傍晚夕阳染红江面\')"><div class="poi-icon">🌉</div><div class="poi-lg-name">沿江步道</div></div>'+

/* 万达广场 (520,650) → left=86.7%, top=59.1% */
'<div class="poi-lg" style="left:86.7%;top:59.1%" onclick="showPOI(\'万达广场\',\'滨江最大商业综合体，地上六层。四楼电影院永远排队\')"><div class="poi-icon">🏢</div><div class="poi-lg-name">万达广场</div></div>'+

/* 滨江地铁站 (445,700) → left=74.2%, top=63.6% */
'<div class="poi-lg" style="left:74.2%;top:63.6%" onclick="showPOI(\'滨江地铁站\',\'🚇 出站就是万达B1入口，早晚高峰通勤人流很大\')"><div class="poi-icon">🚇</div><div class="poi-lg-name">滨江站</div></div>'+

/* ── 南岸艺术区 (x:5-250, y:740-1080) ── */

/* 老洋房 (80,810) → left=10%, top=72% */
'<div class="poi-lg" style="left:10%;top:72%" onclick="showPOI(\'语嫣+芷柔的家\',\'两层老洋房，木质楼梯嘎吱响。一楼客厅改成共用画室，颜料画架散落四处\')"><div class="poi-icon">👩‍🎨</div><div class="poi-lg-name">语嫣+芷柔的家</div></div>'+

/* 刘小贝loft (160,830) → left=30%, top=73% */
'<div class="poi-lg" style="left:30%;top:73%" onclick="showPOI(\'小贝的Loft\',\'挑高4.5米的小空间，楼下小厨房沙发，楼上阁楼床，墙上贴满她拍的照片\')"><div class="poi-icon">🎸</div><div class="poi-lg-name">小贝的Loft</div></div>'+

/* 梧桐街 (130,870) → left=22%, top=78% */
'<div class="poi-lg" style="left:22%;top:78%" onclick="showPOI(\'梧桐街\',\'南岸最美街道，两排法国梧桐遮天蔽日。沿街独立书店黑胶店手作工作室\')"><div class="poi-icon">🍂</div><div class="poi-lg-name">梧桐街</div></div>'+

/* 转角咖啡馆 (180,920) → left=34%;top=82% */
'<div class="poi-lg" style="left:34%;top:82%" onclick="showPOI(\'转角咖啡馆\',\'自家烘焙豆子，手冲很正。靠窗四个沙发座，下午阳光斜照，店猫会跳上膝盖\')"><div class="poi-icon">☕</div><div class="poi-lg-name">转角咖啡馆★</div></div>'+

/* 气球海艺术展 (220,850) → left=38%;top=75% */
'<div class="poi-lg" style="left:38%;top:75%" onclick="showPOI(\'气球海艺术展\',\'旧厂房改造沉浸式艺术展，上万只粉色白色气球悬浮，中央巨型气球装置灯光暧昧\')"><div class="poi-icon">🎈</div><div class="poi-lg-name">气球海艺术展 ⭐</div></div>'+

/* 陶艺工坊 (60,940) → left=6%;top=88% */
'<div class="poi-lg" style="left:6%;top:88%" onclick="showPOI(\'陶艺工坊\',\'藏在梧桐街后面，满墙素坯和釉料罐子。拉坯机嗡嗡转，空气里有湿润泥土味\')"><div class="poi-icon">🏺</div><div class="poi-lg-name">陶艺工坊</div></div>'+

/* MAO Livehouse (230,970) → left=42%;top=87% */
'<div class="poi-lg" style="left:42%;top:87%" onclick="showPOI(\'MAO Livehouse\',\'南岸最躁的livehouse，周五晚上总有本地乐队。灯光昏暗音响巨大啤酒便宜\')"><div class="poi-icon">🎵</div><div class="poi-lg-name">MAO</div></div>'+

/* 独立画室 (100,1000) → left=15%;top=92% */
'<div class="poi-lg" style="left:15%;top:92%" onclick="showPOI(\'独立画室\',\'对外开放画室，提供画架和基本画材。落地窗对着南岸旧街坡道，下午光线极好\')"><div class="poi-icon">🎨</div><div class="poi-lg-name">独立画室</div></div>'+

/* 南岸地铁站 (135,1050) → left=24%;top=97% */
'<div class="poi-lg" style="left:24%;top:97%" onclick="showPOI(\'南岸地铁站\',\'🚇 站内马赛克瓷砖拼成江景壁画，出站就是梧桐街南端\')"><div class="poi-icon">🚇</div><div class="poi-lg-name">南岸站</div></div>'+

/* ═══════════════════════════════════════
   VENUE DOT POIs (poi-lg) — decorative venues
   ═══════════════════════════════════════ */

/* ── 江北新区 decorative (east top) ── */
'<div class="poi-lg" style="left:68%;top:8%" onclick="showPOI(\'江北渡口\',\'江城最老的渡轮码头\')"><div class="poi-icon">⛴</div><div class="poi-lg-name">江北渡口</div></div>'+
'<div class="poi-lg" style="left:75%;top:12%" onclick="showPOI(\'蜜雪冰城\',\'江北新区的奶茶店\')"><div class="poi-icon">🧋</div><div class="poi-lg-name">蜜雪冰城</div></div>'+
'<div class="poi-lg" style="left:88%;top:14%" onclick="showPOI(\'创客空间\',\'年轻人的共享办公社区\')"><div class="poi-icon">🚀</div><div class="poi-lg-name">创客空间</div></div>'+
'<div class="poi-lg" style="left:82%;top:18%" onclick="showPOI(\'纯K KTV\',\'江北新区新开的KTV\')"><div class="poi-icon">🎤</div><div class="poi-lg-name">纯K KTV</div></div>'+

/* ── 大学城 decorative ── */
'<div class="poi-lg" style="left:28%;top:16%" onclick="showPOI(\'篮球场\',\'标准篮球场，傍晚很多人来打球\')"><div class="poi-icon">🏀</div><div class="poi-lg-name">篮球场</div></div>'+
'<div class="poi-lg" style="left:12%;top:15%" onclick="showPOI(\'校园湖\',\'小小的人工湖，冬天会结薄冰\')"><div class="poi-icon">🦆</div><div class="poi-lg-name">校园湖</div></div>'+

/* ── CBD decorative ── */
'<div class="poi-lg" style="left:65%;top:27%" onclick="showPOI(\'M out 品酒坊\',\'清漪谈生意常来的高级酒吧\')"><div class="poi-icon">🍷</div><div class="poi-lg-name">M out 品酒坊</div></div>'+
'<div class="poi-lg" style="left:80%;top:36%" onclick="showPOI(\'星巴克臻选\',\'CBD上班族的续命站，永远满座\')"><div class="poi-icon">☕</div><div class="poi-lg-name">星巴克臻选</div></div>'+
'<div class="poi-lg" style="left:90%;top:28%" onclick="showPOI(\'空中花园\',\'写字楼屋顶花园，晚上看城市夜景很美\')"><div class="poi-icon">🌿</div><div class="poi-lg-name">空中花园</div></div>'+

/* ── 滨江生活区 decorative (west mid) ── */
'<div class="poi-lg" style="left:8%;top:32%" onclick="showPOI(\'滨江公园\',\'沿江而建的社区公园，晨练的人很多\')"><div class="poi-icon">🌳</div><div class="poi-lg-name">滨江公园</div></div>'+
'<div class="poi-lg" style="left:14%;top:40%" onclick="showPOI(\'猫岛咖啡\',\'安静的小咖啡馆，适合一个人看书\')"><div class="poi-icon">🐱</div><div class="poi-lg-name">猫岛咖啡</div></div>'+
'<div class="poi-lg" style="left:22%;top:48%" onclick="showPOI(\'社区超市\',\'24小时便利店，半夜饿了就来这里\')"><div class="poi-icon">🏪</div><div class="poi-lg-name">社区超市</div></div>'+
'<div class="poi-lg" style="left:16%;top:56%" onclick="showPOI(\'周末市集\',\'每周末开放，独立艺术家摆摊卖手作\')"><div class="poi-icon">🎪</div><div class="poi-lg-name">周末市集</div></div>'+
'<div class="poi-lg" style="left:6%;top:64%" onclick="showPOI(\'老茶馆\',\'开了几十年的老茶馆，普洱很正\')"><div class="poi-icon">🍵</div><div class="poi-lg-name">老茶馆</div></div>'+
'<div class="poi-lg" style="left:12%;top:50%" onclick="showPOI(\'单向空间\',\'藏在社区里的独立书店，安静又有品味\')"><div class="poi-icon">📖</div><div class="poi-lg-name">单向空间</div></div>'+
'<div class="poi-lg" style="left:30%;top:36%" onclick="showPOI(\'河滨花园\',\'沿江的小花园，月季和薰衣草开得很盛\')"><div class="poi-icon">🌺</div><div class="poi-lg-name">河滨花园</div></div>'+
'<div class="poi-lg" style="left:35%;top:55%" onclick="showPOI(\'滨江步道入口\',\'通往沿江步道的入口，早晚跑步的人很多\')"><div class="poi-icon">🏃</div><div class="poi-lg-name">滨江步道</div></div>'+

/* ── 滨江新城 decorative ── */
'<div class="poi-lg" style="left:72%;top:58%" onclick="showPOI(\'CGV影城\',\'情侣约会首选，万达广场四楼\')"><div class="poi-icon">🎬</div><div class="poi-lg-name">CGV影城</div></div>'+
'<div class="poi-lg" style="left:58%;top:54%" onclick="showPOI(\'甜时光下午茶\',\'婉清和可馨周末常来的甜品店\')"><div class="poi-icon">🍰</div><div class="poi-lg-name">甜时光下午茶</div></div>'+
'<div class="poi-lg" style="left:82%;top:64%" onclick="showPOI(\'老张牛肉面\',\'滨江最有名的面馆，开了二十年\')"><div class="poi-icon">🍜</div><div class="poi-lg-name">老张牛肉面</div></div>'+

/* ── 南岸艺术区 decorative ── */
'<div class="poi-lg" style="left:36%;top:84%" onclick="showPOI(\'美院画材店\',\'语嫣常来买颜料，各种画材应有尽有\')"><div class="poi-icon">🎨</div><div class="poi-lg-name">美院画材店</div></div>'+
'<div class="poi-lg" style="left:5%;top:95%" onclick="showPOI(\'南岸美术馆\',\'旧仓库改造，每个月都有新展览\')"><div class="poi-icon">🖼️</div><div class="poi-lg-name">南岸美术馆</div></div>'+

/* ── 江城港区 decorative (east bottom) ── */
'<div class="poi-lg" style="left:55%;top:80%" onclick="showPOI(\'江边灯塔\',\'江城港口的旧灯塔，看日落最佳地点\')"><div class="poi-icon">🗼</div><div class="poi-lg-name">江边灯塔</div></div>'+
'<div class="poi-lg" style="left:65%;top:78%" onclick="showPOI(\'游艇码头\',\'停靠着数十艘私人游艇\')"><div class="poi-icon">⛵</div><div class="poi-lg-name">游艇码头</div></div>'+
'<div class="poi-lg" style="left:72%;top:85%" onclick="showPOI(\'港区老面馆\',\'开了三十年的苍蝇馆子，味道一绝\')"><div class="poi-icon">🍜</div><div class="poi-lg-name">港区老面馆</div></div>'+
'<div class="poi-lg" style="left:88%;top:88%" onclick="showPOI(\'灯塔观景台\',\'俯瞰整个江城港口\')"><div class="poi-icon">🗼</div><div class="poi-lg-name">灯塔观景台</div></div>'+
'<div class="poi-lg" style="left:80%;top:92%" onclick="showPOI(\'樱花小径\',\'春天开满樱花的小路，本地人才知道\')"><div class="poi-icon">🌸</div><div class="poi-lg-name">樱花小径</div></div>');

  /* Add character pins */
  CHARACTERS.forEach(name => {
    const pinyin = CHAR_PINYIN[name];
    const [l, t] = (HOME_POSITIONS[name] || '50,50').split(',').map(Number);
    const color = CHAR_COLORS[name];
    const pin = document.createElement('div');
    pin.className = 'map-pin';
    pin.id = 'pin-'+pinyin;
    pin.style.cssText = 'left:'+l+'%;top:'+t+'%';
    pin.innerHTML =
      '<div class="map-pin-ring" style="border-color:'+color+'"></div>'+
      '<div class="map-pin-avatar" style="background:'+color+'22;color:'+color+';border-color:'+color+'">'+
      '<img src="'+_avatarUrl(pinyin)+'" alt="'+name+'" loading="eager" style="width:100%;height:100%;border-radius:50%;object-fit:cover">'+
      '</div>'+
      '<div class="map-pin-label">'+(CHAR_EMOJI[name]||'')+' '+name+'</div>';
    pin.addEventListener('click', (e)=>{ e.stopPropagation(); showCharWheel(name); });
    pin.addEventListener('touchend', (e)=>{ e.stopPropagation(); showCharWheel(name); });
    container.appendChild(pin);
  });

  // Add 宝宝 (user) pin
  (function(){
    var pin = document.createElement("div");
    pin.className = "map-pin";
    pin.id = "pin-baobao";
    pin.style.cssText = "left:30%;top:7.3%";
    pin.innerHTML =
      '<div class="map-pin-ring" style="border-color:#ffd700"></div>'+
      '<div class="map-pin-avatar" style="background:rgba(255,215,0,.15);color:#c8a000;border:3px solid #ffd700;box-shadow:0 0 16px rgba(255,215,0,.3)">'+
      '<img src="/avatars/baobao.jpg?v=9" alt="宝宝" loading="eager" style="width:100%;height:100%;border-radius:50%;object-fit:cover">'+
      '</div>'+
      '<div class="map-pin-label">👑 宝宝</div>';
    pin.addEventListener("click", function(e){ e.stopPropagation(); });
    container.appendChild(pin);
  })();

  // Honor saved pin visibility state
  if(localStorage.getItem('pinVisible') === '0'){
    document.querySelectorAll('.map-pin').forEach(function(p){ p.style.display = 'none'; });
    var btn = document.getElementById('pinToggleBtn');
    if(btn) btn.textContent = '👤 显示';
  }

  /* Initialize dynamic map features */
  setTimeout(function(){
    addMapMarkers();
    addDistrictGlows();
    addWorldTimeline();
    addNightBtn();
    startMapAnimations();
  }, 300);
}


/* ═══════════════════════════════════════════
   Map Dynamic Features — markers, glow, timeline, day/night, animations
   ═══════════════════════════════════════════ */

var _mapAnimFrame = null;
var _mapNightMode = false;
var _mapBoatAngle = 0;
var _mapRiverShimmer = 0;

function addMapMarkers(){
  /* Breathing animation for character pins on the map */
  var pins = document.querySelectorAll('.map-pin');
  pins.forEach(function(pin){
    var circle = pin.querySelector('circle');
    if(circle){
      var r = parseFloat(circle.getAttribute('r') || '8');
      var origR = r;
      var phase = Math.random() * Math.PI * 2;
      var start = Date.now();
      function breathe(){
        var t = (Date.now() - start) / 1000;
        var scale = 1 + 0.15 * Math.sin(t * 1.5 + phase);
        circle.setAttribute('r', origR * scale);
        if(circle.hasAttribute('data-breathing'))
          requestAnimationFrame(breathe);
      }
      circle.setAttribute('data-breathing', '1');
      requestAnimationFrame(breathe);
    }
  });
}

function addDistrictGlows(){
  /* Color-tinted semi-transparent overlays for each district */
  var districts = [
    {id:'nanan', name:'南岸', cx:22, cy:50, rx:28, ry:45, color:'#ff9eb5', opacity:0.06},
    {id:'binjiang', name:'滨江', cx:70, cy:55, rx:22, ry:38, color:'#ffab7a', opacity:0.06},
    {id:'cbd', name:'CBD', cx:80, cy:20, rx:18, ry:25, color:'#64b5f6', opacity:0.06},
    {id:'daxuecheng', name:'大学城', cx:21, cy:10, rx:22, ry:18, color:'#81c784', opacity:0.06}
  ];
  var svg = document.querySelector('#page-map svg');
  if(!svg) return;
  // Remove old glow group if exists
  var old = document.getElementById('districtGlowGroup');
  if(old) old.remove();
  var group = document.createElementNS('http://www.w3.org/2000/svg','g');
  group.id = 'districtGlowGroup';
  group.setAttributeNS(null,'pointer-events','none');
  districts.forEach(function(d){
    var ell = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    ell.setAttributeNS(null,'cx',(d.cx/100)*600);
    ell.setAttributeNS(null,'cy',(d.cy/100)*1100);
    ell.setAttributeNS(null,'rx',(d.rx/100)*600);
    ell.setAttributeNS(null,'ry',(d.ry/100)*1100);
    ell.setAttributeNS(null,'fill',d.color);
    ell.setAttributeNS(null,'opacity',d.opacity);
    ell.classList.add('district-glow-'+d.id);
    group.appendChild(ell);
  });
  svg.appendChild(group);

  /* Animate glow pulsation */
  var glows = group.querySelectorAll('ellipse');
  var start = Date.now();
  function pulseGlows(){
    var t = (Date.now() - start) / 1000;
    glows.forEach(function(g, i){
      var pulse = 0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.2);
      var base = d => { return i===0?0.06:(i===1?0.06:(i===2?0.06:0.06)); };
      g.setAttributeNS(null,'opacity', base(i) * (0.7 + 0.3 * pulse));
    });
    if(group.isConnected) requestAnimationFrame(pulseGlows);
  }
  requestAnimationFrame(pulseGlows);
}

function addWorldTimeline(){
  /* Timeline showing today's events at bottom of map page */
  var container = document.querySelector('#page-map .page-content');
  if(!container) return;
  var old = document.getElementById('worldTimeline');
  if(old) old.remove();
  var tl = document.createElement('div');
  tl.id = 'worldTimeline';
  tl.style.cssText = 'padding:12px 16px;margin:0;background:var(--card);border-top:1px solid var(--bg3);font-size:13px;color:var(--text2);';
  tl.innerHTML = '<div style="font-weight:600;margin-bottom:6px;color:var(--text)">' +
    '⏳ 今日时间线 <span style="font-size:11px;opacity:0.6" id="tlDate"></span></div>' +
    '<div id="tlEvents" style="max-height:120px;overflow-y:auto;font-size:12px;line-height:1.8"></div>';
  container.appendChild(tl);
  refreshTimeline();
}

function refreshTimeline(){
  var dateEl = document.getElementById('tlDate');
  var eventsEl = document.getElementById('tlEvents');
  if(!dateEl || !eventsEl) return;
  var now = new Date();
  var weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
  dateEl.textContent = now.getMonth()+1+'月'+now.getDate()+'日 '+weekdays[now.getDay()];
  // Fetch from world state
  try {
    fetch(API+'/api/status').then(function(r){ return r.json(); }).then(function(d){
      var events = d.events || [];
      if(!events.length){ eventsEl.innerHTML = '<div style="opacity:0.5">今天还没有事件记录</div>'; return; }
      var html = '';
      events.slice(-8).forEach(function(e){
        var t = (e.time||'').slice(11,16) || '--:--';
        var icon = ({move:'📍',arrive:'🏠',speak:'💬',photo_taken:'📸',micro_event:'✨',state_change:'🔄',user_input:'👤'})[e.type] || '▪';
        var char = e.char || '';
        var text = '';
        try { var d2=typeof e.data==='string'?JSON.parse(e.data):e.data; text = d2.text || d2.location_name || JSON.stringify(d2).slice(0,40); } catch(ex){}
        html += '<div><span style="color:var(--accent)">'+t+'</span> ' + icon + ' ' +
          (char ? '<b style="color:var(--accent2)">'+char+'</b> ':'') + text + '</div>';
      });
      eventsEl.innerHTML = html;
    }).catch(function(){});
  } catch(e){}
}

function addNightBtn(){
  /* Day/night toggle button on the map */
  var container = document.querySelector('#page-map .map-container');
  if(!container) return;
  var old = document.getElementById('nightBtn');
  if(old) return;
  var btn = document.createElement('button');
  btn.id = 'nightBtn';
  btn.textContent = '🌙 夜景';
  btn.style.cssText = 'position:absolute;top:10px;right:10px;z-index:10;background:var(--card);border:1px solid var(--bg3);border-radius:20px;padding:6px 14px;font-size:13px;color:var(--text);cursor:pointer;box-shadow:var(--shadow);';
  btn.onclick = function(){
    _mapNightMode = !_mapNightMode;
    this.textContent = _mapNightMode ? '☀️ 白天' : '🌙 夜景';
    var overlay = document.getElementById('nightOverlay');
    if(_mapNightMode){
      if(!overlay){
        overlay = document.createElement('div');
        overlay.id = 'nightOverlay';
        overlay.style.cssText = 'position:absolute;inset:0;background:rgba(5,5,25,0.35);pointer-events:none;z-index:2;transition:background 1.5s ease;border-radius:8px;mix-blend-mode:multiply;';
        container.appendChild(overlay);
      } else { overlay.style.display = 'block'; }
    } else {
      if(overlay) overlay.style.display = 'none';
    }
  };
  container.appendChild(btn);
}

function startMapAnimations(){
  /* River shimmer + sailboat animations using requestAnimationFrame */
  if(_mapAnimFrame) cancelAnimationFrame(_mapAnimFrame);

  var svg = document.querySelector('#page-map svg');
  if(!svg) return;

  // Find river paths and sailboats
  var riverPaths = svg.querySelectorAll('[id*="river"],[class*="river"],path[id*="jiang"]');
  var boats = svg.querySelectorAll('[id*="boat"],[class*="boat"]');

  if(!riverPaths.length && !boats.length){
    console.log('[MapAnim] No river paths or boats found, skipping');
    return;
  }

  var start = Date.now();
  function animate(ts){
    var t = (ts - start) / 1000;

    // River shimmer: toggle stroke opacity on river elements
    if(riverPaths.length){
      var shimmer = 0.5 + 0.5 * Math.sin(t * 0.8);
      riverPaths.forEach(function(p){
        var origOpacity = parseFloat(p.getAttribute('stroke-opacity') || '0.6');
        p.setAttributeNS(null,'stroke-opacity', origOpacity * (0.85 + 0.15 * shimmer));
      });
    }

    // Sailboat sway
    if(boats.length){
      boats.forEach(function(boat, i){
        var origT = boat.getAttribute('transform') || '';
        if(!origT) return;
        // Apply gentle rocking
        var sway = Math.sin(t * 1.2 + i * 0.7) * 1.5;
        var newT = origT.replace(/rotate\([^)]*\)/g, '') + ' rotate('+sway+')';
        boat.setAttributeNS(null,'transform', newT);
      });
    }

    _mapAnimFrame = requestAnimationFrame(animate);
  }

  _mapAnimFrame = requestAnimationFrame(animate);
  console.log('[MapAnim] Started animations');
}


function showPOI(name, desc){
  const card = document.getElementById('mapInfoCard');
  let emoji = '📍';
  try {
    const el = event && event.currentTarget;
    if (el) {
      const icon = el.querySelector('.poi-icon');
      if (icon) {
        emoji = icon.textContent.trim();
      } else if (el.classList.contains('poi-dot')) {
        const t = el.childNodes[0];
        if (t && t.textContent) emoji = t.textContent.trim();
      }
    }
  } catch(e) {}
  card.innerHTML =
    '<div class="map-info-hd">'+
    '<div style="font-size:18px">'+emoji+'</div>'+
    '<div><div class="map-info-name">'+name+'</div>'+
    '<div class="map-info-meta">'+desc+'</div></div>'+
    '</div>';
  card.classList.add('visible');
  card.scrollIntoView({behavior:'smooth'});
}

function showCharWheel(name){
  // Use actual DOM pin positions (not static HOME_POSITIONS) so moved characters are grouped correctly
  var pin = document.getElementById('pin-' + CHAR_PINYIN[name]);
  if(!pin){ showCharPopup(name); return; }
  var left = Math.round(parseFloat(pin.style.left) || 0);
  var top = Math.round(parseFloat(pin.style.top) || 0);
  var charsAtPos = [];
  CHARACTERS.forEach(function(c){
    var cp = document.getElementById('pin-' + CHAR_PINYIN[c]);
    if(!cp) return;
    var cl = Math.round(parseFloat(cp.style.left) || 0);
    var ct = Math.round(parseFloat(cp.style.top) || 0);
    if(cl === left && ct === top) charsAtPos.push(c);
  });
  if(charsAtPos.length <= 1){ showCharPopup(name); return; }

  // Build a mini wheel popup
  var existing = document.getElementById('charWheel');
  if(existing) existing.remove();

  var wheel = document.createElement('div');
  wheel.id = 'charWheel';
  wheel.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);z-index:200;display:flex;gap:12px;padding:12px 16px;background:rgba(255,255,255,.95);border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,.15);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);';

  charsAtPos.forEach(function(c){
    var btn = document.createElement('div');
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:6px;border-radius:14px;transition:transform .15s;min-width:52px;';
    btn.innerHTML = '<div style="width:44px;height:44px;border-radius:50%;overflow:hidden;border:2px solid '+(CHAR_COLORS[c]||'#ccc')+'"><img src="'+_avatarUrl(CHAR_PINYIN[c]||'')+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent=\''+(CHAR_EMOJI[c]||'')+'\';this.parentElement.style.fontSize=\'20px\';this.parentElement.style.display=\'flex\';this.parentElement.style.alignItems=\'center\';this.parentElement.style.justifyContent=\'center\'"></div><span style="font-size:10px;font-weight:600;color:var(--text)">'+(CHAR_EMOJI[c]||'')+' '+c+'</span>';
    btn.addEventListener('click', function(e){ e.stopPropagation(); wheel.remove(); showCharPopup(c); });
    btn.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); wheel.remove(); showCharPopup(c); });
    wheel.appendChild(btn);
  });

  // Close button
  var close = document.createElement('div');
  close.style.cssText = 'position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.1);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:#999';
  close.textContent = '\u2715';
  close.addEventListener('click', function(e){ e.stopPropagation(); wheel.remove(); });
  close.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); wheel.remove(); });
  wheel.appendChild(close);

  document.body.appendChild(wheel);

  // Auto-dismiss when tapping elsewhere
  setTimeout(function(){
    var dismiss = function(e){ if(!wheel.contains(e.target)){ wheel.remove(); document.removeEventListener('click',dismiss); document.removeEventListener('touchstart',dismiss); } };
    document.addEventListener('click', dismiss);
    document.addEventListener('touchstart', dismiss);
  }, 100);
}

async function showCharPopup(name){
  console.log('[showCharPopup] tapped:', name);
  const card = document.getElementById('mapInfoCard');
  const pinyin = CHAR_PINYIN[name];
  if (!pinyin) { card.innerHTML = '<div style="text-align:center;padding:20px;color:var(--red)">未找到角色: '+name+'</div>'; return; }
  card.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px">加载中...</div>';
  card.classList.add('visible');
  card.scrollIntoView({behavior:'smooth'});

  try {
    const [stRes, phRes] = await Promise.all([
      fetch(`${API}/api/status`).then(r=>r.json()),
      fetch(`${API}/api/photos/${pinyin}`).then(r=>r.json()).catch(()=>({photos:[]}))
    ]);
    const states = stRes.states || {};
    const s = states[name] || {};
    const photos = phRes.photos || [];

    let photosHtml =
      '<div class="map-info-section"><h4>📷 照片 <button class="upload-btn" onclick="event.stopPropagation();triggerUpload(\''+pinyin+'\',\''+name+'\')" title="添加照片">＋</button></h4><div class="map-photo-grid" id="photoGrid_'+pinyin+'">';
    if(photos.length > 0){
              photosHtml += photos.map(function(p){
        var fullUrl = '/photos/'+pinyin+'/'+encodeURIComponent(p);
        return '<div class="photo-item">'+
          '<div class="photo-item-loading">加载中…</div>'+
          '<img src="'+escapeAttr(fullUrl)+'" data-full-url="'+escapeAttr(fullUrl)+'" loading="eager" decoding="async" '+
          'onclick="showImageModal(this.dataset.fullUrl, this.currentSrc||this.src)" '+
          'onload="var ld=this.parentElement.querySelector(\'.photo-item-loading\');if(ld)ld.remove();" '+
          'onerror="handlePhotoWallImgError(this)">'+
          '<button class="photo-del-btn" onclick="event.stopPropagation();deletePhoto(\''+pinyin+'\',\''+escapeAttr(p)+'\',this)" title="删除">✕</button>'+
          '</div>';
      }).join('');
    } else {
      photosHtml += '<p style="font-size:12px;color:var(--text2)">暂无照片</p>';
    }
    photosHtml += '</div></div>';

    card.innerHTML =
      '<div class="map-info-hd">'+
      '<div class="map-info-avt" style="background:'+CHAR_COLORS[name]+'22;color:'+CHAR_COLORS[name]+';border:2px solid '+CHAR_COLORS[name]+'">'+
      '<img src="'+_avatarUrl(pinyin)+'" alt="'+name+'" loading="eager">'+
      '</div>'+
      '<div>'+
      '<div class="map-info-name">'+(CHAR_EMOJI[name]||'')+' '+name+'</div>'+
      '<div class="map-info-meta">'+(s.mood||'--')+' · '+(s.location||'未知位置')+'</div>'+
      '</div>'+
      '</div>'+
      '<div class="map-info-section"><h4>当前活动</h4><p>'+(s.activity||s.scene||s.narration||'暂无')+'</p></div>'+
      '<div class="map-info-section"><h4>状态</h4><p>'+(s.state||'--')+' · '+(s.pose||'')+' '+ (s.target ? '→ '+s.target : '') +'</p></div>'+
      '<div class="map-info-section"><h4>高潮次数</h4><p>'+(s.orgasm_count||0)+' 次 · '+(s.stage||'平静')+'</p></div>'+
      photosHtml;
    console.log('[showCharPopup] loaded info for:', name);
  } catch(e){
    console.error('[showCharPopup] failed:', name, e);
    card.innerHTML = '<div style="text-align:center;padding:20px;color:var(--red)">加载失败: '+e.message+'<br><small>请检查网络连接后重试</small></div>';
  }
}

async function refreshMap(){
  if(currentTab !== 'map') return;
  console.log('[refreshMap] refreshing map positions...');
  try {
    const r = await fetch(`${API}/api/status`);
    const data = await r.json();
    const positions = data.positions || {};
    const states = data.states || {};

    // Update pin positions
    for(const [pinyin, pos] of Object.entries(positions)){
      const pin = document.getElementById('pin-'+pinyin);
      if(pin){
        if(pos && typeof pos.x === 'number' && typeof pos.y === 'number'){
          pin.style.left = pos.x + '%';
          pin.style.top = pos.y + '%';
          pin.style.transition = 'left 3s ease, top 3s ease';
        }
      }
    }

    // Travel status — add/remove traveling animation
    for(const [name, state] of Object.entries(states)){
      const pinyin = CHAR_PINYIN[name];
      const pin = document.getElementById('pin-'+pinyin);
      if(pin){
        if((state.travel && state.travel.active) || state.travel_started){
          pin.classList.add('traveling');
        } else {
          pin.classList.remove('traveling');
        }
      }
    }

    // Re-aggregate overlapping pins after position update
    _reaggregatePins();

    // Update weather badge with game time + weather
    try {
      const worldRes = await fetch(`${API}/api/world`).then(r=>r.json());
      const gt = worldRes.game_time || {};
      const wd = worldRes.weather || {};
      const badge = document.getElementById('mapWeatherBadge');
      if(badge){
        const wmoji = {'晴':'☀️','多云':'⛅','阴':'☁️','小雨':'🌧️','大雨':'🌧️','雷阵雨':'⛈️','雾':'🌫️','雪':'❄️'};
        var m = gt.month || 5, d = gt.day || 17, h = gt.hour || 10, min = gt.minute || 0;
        badge.textContent = (wmoji[wd.weather]||'🌤️')+' '+m+'/'+d+' '+h+':'+String(min).padStart(2,'0')+' · '+(wd.temperature||26)+'°C';
      }
    } catch(e) {}
  } catch(e){
    console.error('refreshMap error:', e);
  }
}

/* ═══════════════════════════════════════════
   CHARACTERS TAB
   ═══════════════════════════════════════════ */
let expandedChar = null;
let selectedZone = 'vag';
let charStateCache = {};
let goalsCache = {};

async function fetchGoals(){
  try {
    const r = await fetch(`${API}/api/world`);
    const w = await r.json();
    goalsCache = w.goals || {};
  } catch(e){}
}



async function refreshCharacters(){
  if(currentTab !== 'chars') return;
  try {
    const r = await fetch(`${API}/api/status`);
    const data = await r.json();
    const states = data.states || {};
    fetchGoals().then(()=>renderCharCards(states));
    const now = new Date();
    document.getElementById('charRefreshLabel').textContent =
      '🔄 '+now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  } catch(e){}
}

// Pleasure polling
async function pollPleasure(){
  if(currentTab !== 'chars' || !expandedChar) return;
  try {
    const r = await fetch(`${API}/api/pleasure`);
    const pd = await r.json();
    if(!pd || !expandedChar || !pd[expandedChar]) return;
    const p = pd[expandedChar];
    charStateCache[expandedChar] = {...(charStateCache[expandedChar]||{}), ...p};
    renderCharCtrl(expandedChar);
  } catch(e){}
}

/* ═══════════════════════════════════════════
   WORLD TAB — 增强版：天气/游戏时间/事件日志/目标
   ═══════════════════════════════════════════ */


async function refreshWorld(){
  if(currentTab !== 'world') return;
  const content = document.getElementById('worldContent');
  if(!content) return;

  try {
    const [stRes, histRes, worldRes] = await Promise.all([
      fetch(`${API}/api/status`).then(r=>r.json()).catch(()=>({})),
      fetch(`${API}/api/history`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/api/world`).then(r=>r.json()).catch(()=>({}))
    ]);

    const states = stRes.states || {};
    const history = Array.isArray(histRes) ? histRes : [];
    const weather = worldRes.weather || {};
    const gameTime = worldRes.game_time || {};
    const events = worldRes.events || [];
    const goals = worldRes.goals || {};

    let html = '';

    // ── 天气卡片 ──
    const weatherIcon = WEATHER_EMOJI[weather.weather] || '🌤️';
    html += '<div class="world-card">'+
      '<h3><span class="icon">'+weatherIcon+'</span> 天气</h3>'+
      '<div class="weather-row">'+
      '<div class="weather-icon">'+weatherIcon+'</div>'+
      '<div class="weather-info">'+
      '<div class="weather-temp">'+(weather.temperature||24)+'°C</div>'+
      '<div class="weather-desc">'+(weather.description||'多云转晴')+' · 江城</div>'+
      '</div>'+
      '</div>'+
      '</div>';

    // ── 游戏时间 ──
    if(gameTime.day || gameTime.date){
      html += '<div class="world-card">'+
        '<h3><span class="icon">🕐</span> 游戏时间</h3>'+
        '<div style="display:flex;gap:24px;font-size:14px">'+
        '<div><span style="color:var(--text2)">日期</span> '+(gameTime.date||'--')+'</div>'+
        '<div><span style="color:var(--text2)">星期</span> '+(gameTime.day||'--')+'</div>'+
        '<div><span style="color:var(--text2)">时间</span> '+((gameTime.hour||'--')+':'+(gameTime.minute||'00'))+'</div>'+
        '</div>'+
        '</div>';
    }

    // ── 角色目标 ──
    html += '<div class="world-card">'+
      '<h3><span class="icon">🎯</span> 角色目标</h3>';
    if(Object.keys(goals).length > 0){
      for(const [name, g] of Object.entries(goals)){
        const color = CHAR_COLORS[name] || '#888';
        const st = g.short_term || {};
        const goalText = st.goal || g.short_term || '暂无';
        const progress = st.progress || g.progress || 0;
        html += '<div class="goal-item">'+
          '<span class="goal-char-tag" style="background:'+color+'22;color:'+color+'">'+(CHAR_EMOJI[name]||'')+' '+name+'</span>'+
          '<span class="goal-text">'+goalText+'</span>'+
          '<span class="goal-progress">'+progress+'%</span>'+
          '</div>'+
          '<div class="goal-bar-wrap"><div class="goal-bar-fill" style="width:'+progress+'%"></div></div>';
      }
    } else {
      // Fallback: show activity from status
      for(const name of CHARACTERS){
        const s = states[name] || {};
        const color = CHAR_COLORS[name] || '#888';
        const act = s.goal || s.objective || s.activity || '暂无目标';
        html += '<div class="goal-item">'+
          '<span class="goal-char-tag" style="background:'+color+'22;color:'+color+'">'+(CHAR_EMOJI[name]||'')+' '+name+'</span>'+
          '<span class="goal-text">'+act+'</span>'+
          '</div>';
      }
    }
    html += '</div>';

    // ── 近期事件 ──
    html += '<div class="world-card">'+
      '<h3><span class="icon">📰</span> 近期事件</h3>';
    if(history.length > 0){
      history.slice(-15).reverse().forEach(h => {
        const color = CHAR_COLORS[h.char] || '#888';
        html += '<div class="goal-item">'+
          '<span class="goal-char-tag" style="background:'+color+'22;color:'+color+'">'+(h.char||'')+'</span>'+
          '<span class="goal-text">'+(h.action||'')+' <span style="font-size:11px;color:var(--text2)">'+(h.detail||'')+'</span></span>'+
          '<span class="goal-progress">'+(h.time||'')+'</span>'+
          '</div>';
      });
    } else {
      html += '<div style="text-align:center;padding:12px;color:var(--text2);font-size:13px">暂无事件记录</div>';
    }
    html += '</div>';

    // ── 状态概览（按区域分组） ──
    html += '<div class="world-card">'+
      '<h3><span class="icon">📍</span> 角色状态</h3>';
    for(const name of CHARACTERS){
      const s = states[name] || {};
      const color = CHAR_COLORS[name] || '#888';
      html += '<div class="timeline-item">'+
        '<div class="timeline-dot" style="background:'+color+'"></div>'+
        '<div class="timeline-content">'+
        '<strong>'+(CHAR_EMOJI[name]||'')+' '+name+'</strong>'+
        '<span style="color:var(--text2)"> — '+(s.location||'未知')+' · '+(s.mood||'--')+'</span>'+
        '</div>'+
        '</div>';
    }
    html += '</div>';

    content.innerHTML = html;

    const now = new Date();
    document.getElementById('worldTimeLabel').textContent =
      '🕐 '+now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');

    // Load NSFW daily records
    loadRecords(content);
  } catch(e){
    content.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p>加载失败: '+e.message+'</p></div>';
  }
}

/* ═══════════════════════════════════════════
   DAILY RECORDS — 色色记录
   ═══════════════════════════════════════════ */
let recordsData = [];
let recordsOffset = 0;
const RECORDS_PAGE = 10;

async function loadRecords(contentEl){
  try {
    const r = await fetch(`${API}/api/records`);
    const d = await r.json();
    recordsData = (d.records || []).slice(0, RECORDS_PAGE);
    recordsOffset = recordsData.length;
    renderRecords(contentEl);
  } catch(e){
    // Silently fail — records are optional
  }
}

function renderRecords(contentEl){
  // Remove existing records section if present
  const oldSec = document.getElementById('recordsSection');
  if(oldSec) oldSec.remove();

  const section = document.createElement('div');
  section.id = 'recordsSection';
  section.className = 'records-section';
  section.style.marginTop = '8px';

  let html = '<div class="world-card">'+
    '<div class="records-title">'+
    '<h3><span class="icon">📖</span>色色记录</h3>'+
    '<span class="records-count">共 '+(recordsOffset > 0 ? recordsOffset : 0)+' 篇</span>'+
    '</div>';

  if(recordsData.length === 0){
    html += '<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px">'+
      '还没有色色记录<br><span style="font-size:11px;opacity:.7">发生够劲的色色场景后，每天凌晨自动生成</span></div>';
  } else {
    for(const rec of recordsData){
      const levelClass = rec.nsfw_level || 'light';
      const levelLabel = {heavy:'激烈',moderate:'中等',light:'轻度'}[levelClass] || levelClass;
      const chars = rec.characters_involved || [];
      const highlights = rec.highlights || [];
      const date = rec.date || '';
      const title = rec.title || '无题';
      const summary = rec.summary || '';
      const fullText = rec.full_text || '';
      const wordCount = rec.word_count || 0;

      html += '<div class="record-card" data-idx="'+recordsData.indexOf(rec)+'" onclick="toggleRecordCard(this)">'+
        '<div class="record-card-hd">'+
        '<span class="record-date">'+escapeHtml(date)+'</span>'+
        '<span class="record-title-text">'+escapeHtml(title)+'</span>'+
        '<span class="record-level '+levelClass+'">'+levelLabel+'</span>'+
        '</div>'+
        '<div class="record-meta">'+
        chars.map(c => '<span class="record-char-tag" style="border-color:'+(CHAR_COLORS[c]||'#888')+';color:'+(CHAR_COLORS[c]||'#888')+'">'+(CHAR_EMOJI[c]||'')+' '+c+'</span>').join('')+
        highlights.map(h => '<span class="record-highlight-tag">'+escapeHtml(h)+'</span>').join('')+
        '</div>'+
        '<div class="record-summary">'+escapeHtml(summary)+(summary.length > 180 ? '...' : '')+'</div>'+
        '<div class="record-expand-hint"></div>'+
        '</div>';
    }

    // Show full text button
    if(recordsData.length > 0){
      html += '<button class="record-load-more" onclick="event.stopPropagation();showRecordModal(recordsData[recordsData.length-1], true)" style="margin-bottom:6px">📖 查看最近一篇全文</button>';
    }

    // Load more button
    const totalRecords = recordsOffset; // We need total count from API
    if(recordsOffset >= RECORDS_PAGE){
      html += '<button class="record-load-more" id="loadMoreBtn" onclick="loadMoreRecords(event)">加载更多记录 ▼</button>';
    }
  }

  html += '</div>';
  section.innerHTML = html;
  contentEl.appendChild(section);
}

function toggleRecordCard(card){
  card.classList.toggle('expanded');
}

let _totalRecordCount = 0;
async function loadMoreRecords(e){
  e.stopPropagation();
  const btn = e.target;
  btn.disabled = true;
  btn.textContent = '加载中...';
  try {
    const r = await fetch(`${API}/api/records`);
    const d = await r.json();
    const allRecords = d.records || [];
    _totalRecordCount = allRecords.length;
    const nextBatch = allRecords.slice(recordsOffset, recordsOffset + RECORDS_PAGE);
    recordsData = recordsData.concat(nextBatch);
    recordsOffset = recordsData.length;
    const contentEl = document.getElementById('worldContent');
    if(contentEl) renderRecords(contentEl);
  } catch(ex){
    btn.textContent = '加载失败，点此重试';
    btn.disabled = false;
  }
}

function showRecordModal(rec, fromBtn){
  if(fromBtn) event.stopPropagation();
  document.querySelectorAll('.record-modal-overlay').forEach(el=>el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'record-modal-overlay';
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) overlay.remove();
  });

  const date = rec.date || '';
  const title = rec.title || '无题';
  const chars = (rec.characters_involved || []).join('、');
  const fullText = rec.full_text || rec.summary || '';
  const levelLabel = {heavy:'激烈',moderate:'中等',light:'轻度'}[rec.nsfw_level] || '';
  const wordCount = rec.word_count || 0;

  overlay.innerHTML =
    '<div class="record-modal-box">'+
    '<button class="record-modal-close" onclick="this.closest(\'.record-modal-overlay\').remove()">✕</button>'+
    '<h2>'+escapeHtml(title)+'</h2>'+
    '<div class="record-modal-meta">'+
    '📅 '+escapeHtml(date)+' · '+
    '👤 '+escapeHtml(chars)+' · '+
    '🔥 '+levelLabel+' · '+
    '📝 '+wordCount+'字'+
    '</div>'+
    '<div class="record-modal-body">'+escapeHtml(fullText)+'</div>'+
    '</div>';
  document.body.appendChild(overlay);
}

/* ═══════════════════════════════════════════
   DECISION SYSTEM
   ═══════════════════════════════════════════ */
async function checkDecision(){
  try {
    const r = await fetch(`${API}/api/decision`);
    const d = await r.json();
    const entries = Object.entries(d);
    if(entries.length > 0){
      showDecision(entries[0][0], entries[0][1]);
    }
  } catch(e){}
}

function showDecision(charName, decision){
  document.querySelectorAll('.decision-overlay').forEach(el=>el.remove());
  const overlay = document.createElement('div');
  overlay.className = 'decision-overlay';
  overlay.innerHTML =
    '<div class="decision-box">'+
    '<h3>💬 '+(CHAR_EMOJI[charName]||'')+' '+charName+': '+decision.message+'</h3>'+
    '<div class="decision-choices">'+
    decision.choices.map(c =>
      '<button class="decision-choice" onclick="resolveDecision(\''+escapeAttr(charName)+'\',\''+escapeAttr(c.action)+'\')">'+
      c.label+
      '<span class="effect">'+c.effect+'</span>'+
      '</button>'
    ).join('')+
    '</div>'+
    '<div class="decision-input-row">'+
    '<input type="text" id="decisionInput" placeholder="自定义指令...">'+
    '<button class="btn btn-primary btn-sm" onclick="sendCustomDecision(\''+escapeAttr(charName)+'\')">发送</button>'+
    '</div>'+
    '</div>';
  document.body.appendChild(overlay);
}

async function resolveDecision(charName, choice){
  try {
    const r = await fetch(`${API}/api/decision`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({char_name: charName, choice})
    });
    const d = await r.json();
    if(d.ok){
      toast('✅ '+d.msg);
      document.querySelectorAll('.decision-overlay').forEach(el=>el.remove());
    }
  } catch(e){}
}

async function sendCustomDecision(charName){
  const input = document.getElementById('decisionInput');
  const text = input.value.trim();
  if(!text){ toast('请输入指令'); return; }
  const r = await fetch(`${API}/api/decision`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({char_name: charName, choice:'custom', custom_text: text})
  });
  const d = await r.json();
  if(d.ok){
    toast('✅ '+d.msg);
    document.querySelectorAll('.decision-overlay').forEach(el=>el.remove());
  }
}

/* ═══════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════ */
function avatarError(){ /* no-op — removed retry logic, CSS handles fallback */ }

function handlePhotoWallImgError(img) {
  if (!img) return;
  var box = img.closest('.photo-item');
  var fullUrl = img.dataset.fullUrl || img.getAttribute('src') || '';
  img.style.display = 'none';
  var errEl = box && box.querySelector('.photo-item-loading');
  if(errEl){ errEl.style.display = 'flex'; errEl.textContent = '加载失败，点击重试'; errEl.style.cursor = 'pointer';
    errEl.onclick = function(e){
      e.stopPropagation();
      img.style.display = 'block';
      img.src = fullUrl.split('?')[0] + '?v=' + Date.now();
      errEl.style.display = 'none';
    };
  }
}

async function deletePhoto(pinyin, filename, btn){
  if(!confirm('确定删除这张照片？\n删除后手机端和电脑端都会移除。')) return;
  btn.textContent = '…';
  btn.disabled = true;
  try {
    var r = await fetch(API+'/api/photos/'+pinyin+'/'+encodeURIComponent(filename), {method:'DELETE'});
    var d = await r.json();
    if(d.ok){
      var item = btn.closest('.photo-item');
      if(item) item.remove();
      var grid = document.getElementById('photoGrid_'+pinyin);
      if(grid && grid.querySelectorAll('.photo-item').length === 0){
        grid.innerHTML = '<p style="font-size:12px;color:var(--text2)">暂无照片</p>';
      }
      if('serviceWorker' in navigator && navigator.serviceWorker.controller){
        caches.open('jc-photos-v1').then(function(cache){ cache.delete(d.deleted_urls[0]); }).catch(function(){});
      }
      toast('✅ 已删除');
    } else {
      toast('❌ 删除失败: '+(d.error||'未知错误'));
      btn.textContent = '✕';
      btn.disabled = false;
    }
  } catch(e){
    toast('❌ 删除失败: '+e.message);
    btn.textContent = '✕';
    btn.disabled = false;
  }
}


function escapeHtml(text){
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function escapeAttr(s){ return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

/* ═══════════════════════════════════════════
   PWA INIT
   ═══════════════════════════════════════════ */
/* SW disabled to prevent avatar caching issues */
// if('serviceWorker' in navigator){
//   navigator.serviceWorker.register('/sw.js').then(()=>{
//     console.log('[PWA] SW registered');
//   }).catch(()=>{});
// }

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
});

// Install banner (show after 30s of use)
setTimeout(()=>{
  if(deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches){
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;bottom:80px;left:16px;right:16px;z-index:250;'+
      'background:var(--card);border:1px solid var(--accent);border-radius:var(--radius);'+
      'padding:14px 16px;display:flex;gap:12px;align-items:center;'+
      'animation:slideUp .3s ease;';
    banner.innerHTML =
      '<div style="font-size:28px">📱</div>'+
      '<div style="flex:1;font-size:13px;line-height:1.4">安装江城APP到桌面<br><span style="color:var(--text2);font-size:11px">更好的体验</span></div>'+
      '<button class="btn btn-primary btn-sm" id="installBannerBtn">安装</button>'+
      '<button style="background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;min-width:32px;min-height:32px" onclick="this.parentElement.remove()">✕</button>';
    document.body.appendChild(banner);
    document.getElementById('installBannerBtn').addEventListener('click', async ()=>{
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
      if(result.outcome === 'accepted') toast('✅ 安装成功！');
    });
  }
}, 30000);

/* ═══════════════════════════════════════════
   STARTUP
   ═══════════════════════════════════════════ */
/* ═══ Chat history persistence ═══ */
/* ═══ IndexedDB — APK 本地持久化（localStorage 后备） ═══ */
var DB_NAME = 'jiangcheng_chat_v3';
var DB_VERSION = 1;
var DB_STORE = 'messages';

function idbOpen(){
  return new Promise(function(resolve, reject){
    try {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e){
        var db = e.target.result;
        if(!db.objectStoreNames.contains(DB_STORE)){
          db.createObjectStore(DB_STORE, {keyPath: 'id', autoIncrement: true});
        }
      };
      req.onsuccess = function(e){ resolve(e.target.result); };
      req.onerror = function(e){ reject(e.target.error); };
    } catch(e){ reject(e); }
  });
}

function idbSaveAll(msgs){
  return idbOpen().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction(DB_STORE, 'readwrite');
      var store = tx.objectStore(DB_STORE);
      store.clear();
      msgs.forEach(function(m){ store.add(m); });
      tx.oncomplete = function(){ db.close(); resolve(); };
      tx.onerror = function(e){ db.close(); reject(e.target.error); };
    });
  }).catch(function(){});
}

function idbLoadAll(){
  return idbOpen().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction(DB_STORE, 'readonly');
      var store = tx.objectStore(DB_STORE);
      var req = store.getAll();
      req.onsuccess = function(){ db.close(); resolve(req.result); };
      req.onerror = function(e){ db.close(); reject(e.target.error); };
    });
  });
}

var CHAT_STORAGE_KEY = 'jc_chat_history_v3';
function saveChatHistory(){
  var rows = document.querySelectorAll('#msgList .msg-row');
  var msgs = [];
  rows.forEach(function(r){
    var isSelf = r.classList.contains('self');
    var bubble = r.querySelector('.msg-bubble');
    var senderEl = r.querySelector('.msg-sender');
    var timeEl = r.querySelector('.msg-time');
    if(!bubble) return;

    var timeEl2 = r.querySelector('.msg-time');
    var msgTime = Date.now();
    if(timeEl2){
      var parts = timeEl2.textContent.trim().split(':');
      if(parts.length === 2){
        var d = new Date();
        d.setHours(parseInt(parts[0])||0, parseInt(parts[1])||0, 0, 0);
        msgTime = d.getTime();
      }
    }
    var msg = {role: isSelf ? 'user' : 'char', time: msgTime};

    // Determine type from bubble classes
    if(bubble.classList.contains('img-bubble')){
      msg.type = 'image';
      var img = bubble.querySelector('img');
      if(img) msg.thumbUrl = img.src;
      var onclick2 = bubble.getAttribute('onclick') || '';
      var fm2 = onclick2.match(/showImageModal\('([^']+)'/);
      if(fm2) msg.imageUrl = fm2[1];
      if(!msg.imageUrl) msg.imageUrl = msg.thumbUrl;
    } else if(bubble.classList.contains('voice-bubble')){
      msg.type = 'voice';
      // voiceUrl extracted from onclick
      var onclick = bubble.getAttribute('onclick') || '';
      var vm = onclick.match(/playVoice\(this,'([^']+)'/);
      if(vm) msg.voiceUrl = vm[1];
    } else {
      msg.type = 'text';
      msg.text = bubble.textContent || '';
      msg.html = bubble.innerHTML || '';
    }

    // Character name
    if(!isSelf && senderEl){
      // senderEl text is "语嫣 发来一张照片" or "语嫣" — extract just the name
      var raw = senderEl.textContent.trim();
      // Remove action suffixes
      raw = raw.replace(/ 发来一张照片$/, '').replace(/ 语音消息$/, '').replace(/[📍].*/,'').trim();
      msg.char = raw;
    }

    // Time from element
    if(timeEl){
      var t = timeEl.textContent.trim();
      if(t) msg._timeStr = t;
    }

    msgs.push(msg);
  });

  if(msgs.length > 0){
    var toSave = msgs.slice(-80);
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave)); } catch(e){}
    idbSaveAll(toSave);
  }
}

function loadChatHistory(){
  // localStorage first (sync save, always up-to-date). IDB is async, may lag.
  // This prevents the race where IDB stale data overwrites localStorage.
  var fromLS = null;
  try {
    var raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if(raw){ fromLS = JSON.parse(raw); if(!Array.isArray(fromLS)) fromLS = null; }
  } catch(e){}

  if(fromLS && fromLS.length > 0){
    _renderSavedMessages(fromLS);
    _historyLoaded = true;
    // Sync to IDB in background
    idbSaveAll(fromLS).catch(function(){});
    return;
  }

  // localStorage empty — try IndexedDB
  idbLoadAll().then(function(idbMsgs){
    if(idbMsgs && idbMsgs.length > 0){
      _renderSavedMessages(idbMsgs);
      // Copy to localStorage for next load
      try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(idbMsgs)); } catch(e){}
    }
    _historyLoaded = true;
  }).catch(function(){
    _historyLoaded = true;
  });
}

function _loadFromLocalStorage(){
  try {
    var raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if(!raw) return;
    var msgs;
    try { msgs = JSON.parse(raw); } catch(e){ localStorage.removeItem(CHAT_STORAGE_KEY); return; }
    if(!Array.isArray(msgs)){ localStorage.removeItem(CHAT_STORAGE_KEY); return; }

    var list = document.getElementById('msgList');
    var emptyEl = list.querySelector('.empty-state');
    if(emptyEl) emptyEl.remove();

    list.querySelectorAll('.msg-row').forEach(function(el){ el.remove(); });

    msgs = msgs.filter(function(m){
      if(!m || typeof m !== 'object') return false;
      if(m.type === 'image'){
        m.imageUrl = m.imageUrl || m.url || '';
        m.thumbUrl = m.thumbUrl || m.thumbnail || m.imageUrl || '';
        if(!m.imageUrl || m.imageUrl === 'undefined' || m.imageUrl === 'null' || m.imageUrl.length < 10){ return false; }
        if(m.thumbOk !== 1 || !m.thumbUrl || m.thumbUrl === 'undefined' || m.thumbUrl === 'null' || m.thumbUrl.length < 10){ m.thumbUrl = m.imageUrl; }
      }
      return true;
    });

    _renderSavedMessages(msgs);
  } catch(e){}
}

function _renderSavedMessages(msgs){
    var list = document.getElementById('msgList');
    if(!list) return;

    msgs.forEach(function(m){
      if(!m.time && m._timeStr){
        var parts = m._timeStr.split(':');
        if(parts.length === 2){
          var d2 = new Date();
          d2.setHours(parseInt(parts[0])||0, parseInt(parts[1])||0, 0, 0);
          m.time = d2.getTime();
        }
      }
      _renderMsg(m);
    });

    // Do NOT save to localStorage here — IDB data may be stale
    // (async idbSaveAll may not have completed before refresh).
    // Only saveChatHistory() and sendMessage() write to storage.
    list.scrollTop = list.scrollHeight;
    // Do NOT set lastPollTime here — uses client clock, may be ahead of server
    // pollMessages() updates it from server's `data.now` instead
}


function clearChatHistory(){
  var dialog = document.createElement('div');
  dialog.className = 'msg-delete-overlay';
  dialog.innerHTML = '<div class="msg-delete-dialog">'+
    '<p>清空所有聊天记录？<br><small style="color:var(--text2)">此操作不可恢复</small></p>'+
    '<div class="dd-btns">'+
    '<button class="dd-btn-cancel">取消</button>'+
    '<button class="dd-btn-confirm">清空</button>'+
    '</div></div>';
  dialog.querySelector('.dd-btn-cancel').onclick = function(){ dialog.remove(); };
  dialog.querySelector('.dd-btn-confirm').onclick = function(){
    localStorage.removeItem(CHAT_STORAGE_KEY);
    var list = document.getElementById('msgList');
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>欢迎来到江城<br>输入消息开始对话</p></div>';
    _lastMsgTime = 0;
    _seenMsgTs = [];
    // Also clear server-side message queue
    fetch(API + '/api/clear_queue', {method:'POST'}).catch(function(){});
    dialog.remove();
  };
  dialog.addEventListener('click', function(e){ if(e.target === dialog) dialog.remove(); });
  document.body.appendChild(dialog);
}

function togglePins(){
  var pins = document.querySelectorAll('.map-pin');
  var shown = localStorage.getItem('pinVisible') !== '0';
  pins.forEach(function(p){ p.style.display = shown ? 'none' : ''; });
  localStorage.setItem('pinVisible', shown ? '0' : '1');
  var btn = document.getElementById('pinToggleBtn');
  if(btn) btn.textContent = shown ? '👤 显示' : '👤 隐藏';
}


// deleteMsg replaced by _showDeleteDialog in _renderMsg



function renderCharCtrl(name){
  const pinyin = CHAR_PINYIN[name];
  const ctrl = document.getElementById('ctrl-'+pinyin);
  if(!ctrl) return;
  const s = charStateCache[name] || {};
  const orgasmCount = s.orgasm_count || 0;
  const stage = s.stage || '平静';
  const toyNames = {'vibrator':'跳蛋','wand':'按摩棒','beads':'拉珠','ring':'震动环','remote':'遥控器'};
  const currentToy = toyNames[s.current_toy] || s.current_toy || '—';
  const intensityMap = {'l':'弱','m':'中','h':'强','1':'微震','2':'中震','3':'强震','4':'最强'};
  const currentIntensity = intensityMap[s.current_intensity] || intensityMap[s.vibrator_level] || s.current_intensity || s.vibrator_level || '—';
  const gearLabels = {'1':'微震','2':'中震','3':'强震','4':'最强'};
  const currentGear = s.vibrator_level || 2;

  // Overstim warning
  let warnHtml = '';
  if(orgasmCount >= 5){
    warnHtml = '<div class="overstim-bar critical">严重过度刺激！必须停止！</div>';
  } else if(orgasmCount >= 3){
    warnHtml = '<div class="overstim-bar danger">过度刺激！再继续会坏掉</div>';
  } else if(orgasmCount >= 1){
    warnHtml = '<div class="overstim-bar warn">已开始过度刺激</div>';
  }

  ctrl.innerHTML =
    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">📊 当前状态</div>'+
    '<div class="status-grid">'+
    '<div class="status-item"><span class="status-lbl">道具</span><span>'+currentToy+'</span></div>'+
    '<div class="status-item"><span class="status-lbl">强度</span><span>'+currentIntensity+'</span></div>'+
    '<div class="status-item"><span class="status-lbl">高潮</span><span>'+orgasmCount+'次</span></div>'+
    '<div class="status-item"><span class="status-lbl">阶段</span><span>'+stage+'</span></div>'+
    '<div class="status-item"><span class="status-lbl">位置</span><span>'+(s.location||'—')+'</span></div>'+
    '<div class="status-item"><span class="status-lbl">心情</span><span>'+(s.mood||'—')+'</span></div>'+
    '</div>'+
    warnHtml+
    '</div>'+

    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">⚡ 跳蛋控制</div>'+
    '<div class="slider-wrap">'+
    '<div class="slider-labels"><span>微震</span><span>中震</span><span>强震</span><span>最强</span></div>'+
    '<input type="range" id="intensity-'+pinyin+'" min="1" max="4" value="'+currentGear+'" step="1">'+
    '</div>'+
    '<div class="zone-row">'+
    '<button class="zone-btn '+(selectedZone==='vag'?'active':'')+'" onclick="setZone(\'vag\')">🔵 阴道</button>'+
    '<button class="zone-btn '+(selectedZone==='clit'?'active':'')+'" onclick="setZone(\'clit\')">🔴 阴蒂</button>'+
    '<button class="zone-btn '+(selectedZone==='both'?'active':'')+'" onclick="setZone(\'both\')">🟣 混合</button>'+
    '</div>'+
    '<div class="btn-row">'+
    '<button class="btn btn-primary btn-sm" onclick="sendCmd(\'vibrator\', this)">▶ 启动</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'vibrator_pulse\', this)">〰 脉冲</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'vibrator_wave\', this)">🌊 波浪</button>'+
    '<button class="btn btn-danger btn-sm" onclick="sendCmd(\'stop\', this)">■ 停止</button>'+
    '</div>'+
    '</div>'+

    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">🔥 高潮控制</div>'+
    '<div class="btn-row">'+
    '<button class="btn btn-primary btn-sm" onclick="sendCmd(\'orgasm\', this)">🔥 强制高潮</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendHighCount(\''+name+'\', 2, this)">🔥🔥 ×2</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendHighCount(\''+name+'\', 5, this)">🔥🔥🔥 ×5</button>'+
    '</div>'+
    '</div>'+

    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">🎮 选择道具</div>'+
    '<div class="btn-row">'+
    '<button class="btn btn-outline btn-sm" onclick="selectToy(\'vibrator\', this)">🔮 跳蛋</button>'+
    '<button class="btn btn-outline btn-sm" onclick="selectToy(\'wand\', this)">🥖 按摩棒</button>'+
    '<button class="btn btn-outline btn-sm" onclick="selectToy(\'beads\', this)">📿 拉珠</button>'+
    '<button class="btn btn-outline btn-sm" onclick="selectToy(\'ring\', this)">⭕ 震动环</button>'+
    '</div>'+
    '</div>'+

    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">⚡ 快捷指令</div>'+
    '<div class="btn-row">'+
    '<button class="btn btn-outline btn-sm" onclick="quickAction(\''+name+'\', \'wakeup\', this)">🔔 叫醒</button>'+
    '<button class="btn btn-outline btn-sm" onclick="quickAction(\''+name+'\', \'summon\', this)">📍 召唤</button>'+
    '<button class="btn btn-outline btn-sm" onclick="quickAction(\''+name+'\', \'kiss\', this)">💋 亲一下</button>'+
    '<button class="btn btn-outline btn-sm" onclick="quickAction(\''+name+'\', \'hug\', this)">🫂 抱紧</button>'+
    '<button class="btn btn-outline btn-sm" onclick="quickAction(\''+name+'\', \'speak\', this)">💬 说句话</button>'+
    '</div>'+
    '</div>'+

    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">🎯 物理玩法</div>'+
    '<div class="btn-row">'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'oral\', this)">👄 口交</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'doggy\', this)">🍑 后入</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'cowgirl\', this)">🤠 骑乘</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'fingering\', this)">✌️ 指交</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'spank\', this)">✋ 惩戒</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'edge\', this)">⛔ 边缘</button>'+
    '</div>'+
    '</div>'+

    '<div class="ctrl-section">'+
    '<div class="ctrl-section-title">🎭 剧情主题</div>'+
    '<div class="btn-row">'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'training\', this)">🔗 调教</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'bondage\', this)">🪢 SM</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'hypnosis\', this)">🌀 催眠</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'pet\', this)">🐾 宠物</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'corruption\', this)">💫 淫堕</button>'+
    '<button class="btn btn-outline btn-sm" onclick="sendCmd(\'breeding\', this)">🤰 繁殖</button>'+
    '</div>'+
    '</div>'+

    '<button class="btn btn-danger" style="width:100%" onclick="endCharSession(\''+name+'\', this)">🛑 结束事件</button>';
}


function renderCharCards(states){
  charStateCache = states || charStateCache;
  const grid = document.getElementById('charGrid');
  if(!grid) return;

  grid.innerHTML = CHARACTERS.map(name => {
    const s = charStateCache[name] || {};
    const online = s.online !== false;
    const color = CHAR_COLORS[name];
    const pinyin = CHAR_PINYIN[name];
    const isExpanded = expandedChar === name;
    const orgasmCount = s.orgasm_count || 0;
    const pleasure = Math.min((orgasmCount / 10) * 100, 100);

    return (
    '<div class="char-card'+(isExpanded?' expanded':'')+'" id="card-'+pinyin+'">'+
    '<div class="char-card-hd" onclick="toggleCharExpand(\''+name+'\')">'+
    '<div class="char-card-avatar" style="background:'+color+'22;color:'+color+';overflow:hidden">'+
    (pinyin ? '<img src="'+_avatarUrl(pinyin)+'" alt="'+name+'" loading="eager">' : (CHAR_EMOJI[name]||'🎀'))+
    '</div>'+
    '<div class="char-card-info">'+
    '<div class="char-card-name">'+
    '<span class="online-dot '+(online?'on':'off')+'"></span>'+
    (CHAR_EMOJI[name]||'')+' '+name+
    '</div>'+
    '<div class="char-card-activity">'+(s.mood||'')+' · '+(s.location||'')+'</div>'+
    (pleasure > 0 ? '<div class="pleasure-mini"><div class="pleasure-mini-fill" style="width:'+pleasure+'%;background:linear-gradient(90deg,#f0c4c0,#e8938a 50%,#e8785a)"></div></div>' : '')+
    // Goal progress
    (goalsCache[name] ? '<div class="goal-label"><span>🎯 '+(goalsCache[name].short_term?.goal||'')+'</span><span>'+(goalsCache[name].short_term?.progress||0)+'%</span></div><div class="goal-bar"><div class="goal-bar-fill" style="width:'+(goalsCache[name].short_term?.progress||0)+'%"></div></div>' : '')+
    '</div>'+
    '<div class="char-card-arrow" style="font-size:14px;color:var(--text2);min-width:24px;text-align:center">▼</div>'+
    '</div>'+
    '<div class="char-ctrl-panel"><div class="char-ctrl-inner" id="ctrl-'+pinyin+'"></div></div>'+
    '</div>');
  }).join('');
  // Re-fill expanded card's control panel (DOM was rebuilt)
  if(expandedChar){
    setTimeout(function(){ renderCharCtrl(expandedChar); }, 50);
  }
}



function toggleCharExpand(name){
  var pinyin = CHAR_PINYIN[name];
  var wasExpanded = expandedChar === name;
  // Collapse previously expanded card
  if(expandedChar && expandedChar !== name){
    var prevPinyin = CHAR_PINYIN[expandedChar];
    var prevCard = document.getElementById('card-'+prevPinyin);
    if(prevCard) prevCard.classList.remove('expanded');
  }
  expandedChar = wasExpanded ? null : name;
  // Toggle target card via CSS class (no DOM rebuild → preserves transition)
  var card = document.getElementById('card-'+pinyin);
  if(!card) return;
  if(wasExpanded){
    card.classList.remove('expanded');
  } else {
    card.classList.add('expanded');
    renderCharCtrl(name);
  }
}


/* Retry polling for status bar — keep checking until cache has data */
var _sbRetryTimer = 0;
function _ensureStatusBar(){
  if(Object.keys(charStateCache).length > 0){
    refreshCharStatusBar();
    if(_sbRetryTimer){ clearInterval(_sbRetryTimer); _sbRetryTimer = 0; }
  }
}

function refreshCharStatusBar(){
  var bar = document.getElementById('charStatusBar');
  if(!bar || currentTab !== 'chat') return;
  var chars = charStateCache;
  var names = Object.keys(chars);
  if(!names.length){ bar.style.display='none'; return; }
  bar.style.display='flex';

  // Activity emoji map
  var actMap = {'画画':'🎨','画稿':'🎨','画图':'🎨','插画':'🎨','赶稿':'🎨',
    '开会':'💼','面试':'💼','上班':'💼','工作':'💼','review':'💼','周会':'💼',
    '咖啡':'☕','喝茶':'☕','喝咖啡':'☕','甜品':'🍰',
    '排练':'🎸','弹琴':'🎸','吉他':'🎸','音乐':'🎸','写歌':'🎸',
    '做饭':'🍳','烤':'🍳','煎':'🍳','煮':'🍳','火锅':'🍳','厨房':'🍳',
    '刷手机':'📱','翻杂志':'📱','看手机':'📱','手机':'📱','打字':'📱',
    '睡觉':'😴','刚醒':'😴','睡醒':'😴','床上':'😴','被子':'😴',
    '上课':'📐','图书馆':'📐','写论文':'📐','画图':'📐','作业':'📐','结构':'📐',
    '逛街':'🛍','出门':'🚶','地铁':'🚶','走路':'🚶',
    '洗澡':'🛁','换衣服':'👗','穿搭':'👗',
  };

  // Activity short labels — concise one-word summaries
  var actLabels = {'画画':'画画','画稿':'赶稿','画图':'画图','插画':'画画','赶稿':'赶稿',
    '开会':'开会','面试':'面试','上班':'上班','工作':'工作中','review':'review','周会':'开会',
    '咖啡':'喝咖啡','喝茶':'喝茶','甜品':'吃甜品',
    '排练':'排练','弹琴':'弹琴','吉他':'弹吉他','音乐':'练琴','写歌':'写歌',
    '做饭':'做饭','烤':'烘焙中','煎':'煎东西','煮':'煮饭','火锅':'吃火锅','厨房':'在厨房',
    '刷手机':'刷手机','翻杂志':'看杂志','手机':'刷手机','打字':'打字',
    '睡觉':'睡觉','刚醒':'刚睡醒','床上':'赖床','被子':'赖床',
    '上课':'上课','图书馆':'在图书馆','写论文':'写论文','作业':'写作业','结构':'画图',
    '逛街':'逛街','出门':'出门','地铁':'在路上','走路':'走路',
    '洗澡':'洗澡','换衣服':'换衣服','穿搭':'换衣服',
  };

  var html = '';
  names.forEach(function(name){
    var c = chars[name] || {};
    var scene = c.scene || '';
    var activity = c.activity || '';
    var mood = c.mood || '';

    // Build short display label: prefer activity, then extract key phrase from scene
    var label = '...';
    var activityText = activity;
    for(var kw in actLabels){
      if((scene+activityText).indexOf(kw) >= 0){ label = actLabels[kw]; break; }
    }
    // If no keyword matched, use first 8 Chinese chars of scene
    if(label === '...' && scene){ label = scene.replace(/[，,。.！!；;：:\s]+/g,'').substring(0,8); }

    // Pick emoji
    var emoji = '💬';
    for(var kw2 in actMap){ if((scene+activityText).indexOf(kw2)>=0){ emoji=actMap[kw2]; break; } }

    var dwellH = 0;
    if(c.location_since){
      try { dwellH = (Date.now() - new Date(c.location_since).getTime())/3600000; } catch(e){}
    }
    var dwellStr = dwellH >= 2 ? Math.floor(dwellH)+'h' : (dwellH >= 1 ? '1h' : '');
    var staleClass = dwellH >= 8 ? ' stale' : '';
    html += '<div class="char-status-chip'+staleClass+'" onclick="showCharBarPopup(\''+(name)+'\')" title="'+(mood||'')+'">'+
      '<span class="cs-avatar">'+emoji+'</span>'+
      '<span class="cs-name">'+name+'</span>'+
      '<span class="cs-act">'+label+'</span>'+
      (dwellStr?'<span class="cs-dwell">⏱'+dwellStr+'</span>':'')+
      '</div>';
  });
  bar.innerHTML = html;
}


/* Character detail popup — status bar version (uses cache only, lightweight) */
function showCharBarPopup(name){
  var o = document.querySelector('.char-popup');
  if(o) o.remove();
  var c = charStateCache[name] || {};
  var scene = c.scene || c.activity || '';
  var loc = c.location || '';
  var mood = c.mood || '';
  var pose = c.pose || '';
  var clothes = c.clothes || '';
  var plan = c.daily_plan || '';
  var nails = [];
  if(c.fingernails && c.fingernails != '无') nails.push('▫'+c.fingernails);
  if(c.toenails && c.toenails != '无') nails.push('▫'+c.toenails);
  var nailStr = nails.join(' | ');
  var p = document.createElement('div');
  p.className = 'char-popup';
  p.innerHTML = '<div class="cp-head"><div class="cp-avatar" style="background:'+(CHAR_COLORS[name]||'#888')+'">'+(CHAR_EMOJI[name]||'?')+'</div><div class="cp-title"><div class="cp-name">'+name+'</div><div class="cp-mood">'+mood+(loc?' '+loc:'')+'</div></div><button class="cp-close" onclick="this.parentNode.parentNode.remove()">X</button></div><div class="cp-body">'+(scene?'<div class="cp-row"><span class="cp-label">当前</span><span class="cp-val">"'+escapeHtml(scene)+'"</span></div>':'')+(pose?'<div class="cp-row"><span class="cp-label">姿态</span><span class="cp-val">'+pose+'</span></div>':'')+(clothes?'<div class="cp-row"><span class="cp-label">穿搭</span><span class="cp-val">'+escapeHtml(clothes)+'</span></div>':'')+(nailStr?'<div class="cp-row"><span class="cp-label">美甲</span><span class="cp-val">'+nailStr+'</span></div>':'')+(plan?'<div class="cp-row"><span class="cp-label">计划</span><span class="cp-val">'+escapeHtml(plan)+'</span></div>':'')+'</div>';
  document.body.appendChild(p);
  p.onclick = function(e){ if(e.target === p) p.remove(); };
}

function init(){
  loadChatHistory();
  connectWS();
  renderMap();
  refreshCharStatusBar();
  // Retry polling: if cache empty, check every 500ms until populated
  _sbRetryTimer = setInterval(_ensureStatusBar, 500);
  renderCharCards({});
  refreshCharacters();
  refreshWorld();
}

// Polling intervals
setInterval(()=>{
  if(currentTab === 'chars') refreshCharacters();
  if(currentTab === 'world') refreshWorld();
}, 15000);

// Pleasure now event-driven via WebSocket (pleasure_update messages).
// HTTP poll kept as fallback at reduced frequency (30s).
async function pollPleasure(){
  if(currentTab !== 'chars' || !expandedChar) return;
  try {
    const r = await fetch(`${API}/api/pleasure`);
    const pd = await r.json();
    if(!pd || !expandedChar || !pd[expandedChar]) return;
    const p = pd[expandedChar];
    charStateCache[expandedChar] = {...(charStateCache[expandedChar]||{}), ...p};
    renderCharCtrl(expandedChar);
  } catch(e){}
}
pollPleasure();  // initial load
setInterval(pollPleasure, 30000);  // fallback every 30s
setInterval(()=>{
  if(currentTab === 'map') refreshMap();
}, 10000);
async function checkDecision(){
  try {
    const r = await fetch(`${API}/api/decision`);
    const d = await r.json();
    const entries = Object.entries(d);
    if(entries.length > 0){
      showDecision(entries[0][0], entries[0][1]);
    }
  } catch(e){}
}

function showDecision(charName, decision){
  document.querySelectorAll('.decision-overlay').forEach(function(el){ el.remove(); });
  var overlay = document.createElement('div');
  overlay.className = 'decision-overlay';
  overlay.innerHTML =
    '<div class="decision-box">'+
    '<h3>💬 '+(CHAR_EMOJI[charName]||'')+' '+charName+': '+decision.message+'</h3>'+
    '<div class="decision-choices">'+
    decision.choices.map(function(c){
      return '<button class="decision-choice" onclick="resolveDecision(\''+escapeAttr(charName)+'\',\''+escapeAttr(c.action)+'\')">'+
      c.label+
      '<span class="effect">'+c.effect+'</span>'+
      '</button>';
    }).join('')+
    '</div>'+
    '<div class="decision-input-row">'+
    '<input type="text" id="decisionInput" placeholder="自定义指令...">'+
    '<button class="btn btn-primary btn-sm" onclick="sendCustomDecision(\''+escapeAttr(charName)+'\')">发送</button>'+
    '</div>'+
    '</div>';
  document.body.appendChild(overlay);
}

async function resolveDecision(charName, choice){
  try {
    const r = await fetch(`${API}/api/decision`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({char_name: charName, choice})
    });
    const d = await r.json();
    if(d.ok){
      toast('✅ '+d.msg);
      document.querySelectorAll('.decision-overlay').forEach(function(el){ el.remove(); });
    }
  } catch(e){}
}

async function sendCustomDecision(charName){
  var input = document.getElementById('decisionInput');
  var text = input.value.trim();
  if(!text){ toast('请输入指令'); return; }
  const r = await fetch(`${API}/api/decision`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({char_name: charName, choice:'custom', custom_text: text})
  });
  const d = await r.json();
  if(d.ok){
    toast('✅ '+d.msg);
    document.querySelectorAll('.decision-overlay').forEach(function(el){ el.remove(); });
  }
}

setInterval(checkDecision, 5000);

/* ═══════════════════════════════════════════
   MAP GESTURES — pinch zoom + pan
   Adapted from skills/地图/map.html + research
   ═══════════════════════════════════════════ */
var _gsX=0,_gsY=0,_gMoved=false,_gesturesOn=false;
var _mapScale=1,_mapTX=0,_mapTY=0;
var _lastDist=0,_lastCX=0,_lastCY=0;
var _panning=false,_panSX,_panSY,_panTX,_panTY;
function _mapEl(){return document.getElementById('mapContainer')}
function _mapView(){var p=_mapEl();return p?p.parentElement.getBoundingClientRect():null}

function _applyTX(){
  var m=_mapEl();if(!m)return;
  m.style.transform='translate('+_mapTX+'px,'+_mapTY+'px) scale('+_mapScale+')';
  m.style.transformOrigin='0 0';
}

function pinchMap(cx,cy,ns){
  var r=_mapView();if(!r)return;
  var px=cx-r.left,py=cy-r.top;
  ns=Math.min(4,Math.max(1,ns));
  var dx=px-(px-_mapTX)*(ns/_mapScale);
  var dy=py-(py-_mapTY)*(ns/_mapScale);
  _mapScale=ns;_mapTX=dx;_mapTY=dy;
  var mw=r.width*_mapScale,mh=r.height*_mapScale;
  _mapTX=Math.min(0,Math.max(r.width-mw,_mapTX));
  _mapTY=Math.min(0,Math.max(r.height-mh,_mapTY));
  if(_mapScale<=1){_mapTX=0;_mapTY=0;}
  _applyTX();
}

function setupGestures(){
  if(_gesturesOn)return;_gesturesOn=true;
  var c=_mapEl();if(!c)return;

  c.addEventListener('touchstart',function(e){
    if(e.target.closest('.map-info-sheet')||e.target.closest('.tab-bar'))return;
    if(e.touches.length===1){_gsX=e.touches[0].clientX;_gsY=e.touches[0].clientY;_gMoved=false;}
    if(e.touches.length===2){e.preventDefault();c.style.touchAction='none';
      var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      _lastDist=Math.sqrt(dx*dx+dy*dy);
      _lastCX=(e.touches[0].clientX+e.touches[1].clientX)/2;
      _lastCY=(e.touches[0].clientY+e.touches[1].clientY)/2;
      _gMoved=true;
    }else if(e.touches.length===1&&_mapScale>1){
      _panning=true;_panSX=e.touches[0].clientX;_panSY=e.touches[0].clientY;
      _panTX=_mapTX;_panTY=_mapTY;
    }
  },{passive:false});

  c.addEventListener('touchmove',function(e){
    if(e.touches.length===2){e.preventDefault();
      var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      var dist=Math.sqrt(dx*dx+dy*dy);
      var cx=(e.touches[0].clientX+e.touches[1].clientX)/2,cy=(e.touches[0].clientY+e.touches[1].clientY)/2;
      if(_lastDist>0)pinchMap(cx,cy,_mapScale*(dist/_lastDist));
      _lastDist=dist;
    }else if(e.touches.length===1&&_panning&&_mapScale>1){
      var dx=e.touches[0].clientX-_panSX,dy=e.touches[0].clientY-_panSY;
      _mapTX=_panTX+dx;_mapTY=_panTY+dy;
      var r=_mapView(),mw=r.width*_mapScale,mh=r.height*_mapScale;
      _mapTX=Math.min(0,Math.max(r.width-mw,_mapTX));
      _mapTY=Math.min(0,Math.max(r.height-mh,_mapTY));
      _applyTX();
      if(Math.abs(dx)>12||Math.abs(dy)>12)_gMoved=true;
    }else if(e.touches.length===1&&!_panning){
      var dx2=e.touches[0].clientX-_gsX,dy2=e.touches[0].clientY-_gsY;
      if(Math.abs(dx2)>12||Math.abs(dy2)>12)_gMoved=true;
    }
  },{passive:false});

  c.addEventListener('touchend',function(e){
    if(e.touches.length===0){
      _lastDist=0;_panning=false;
      if(_mapScale<=1){c.style.touchAction='pan-y';}
      // Reset _gMoved after brief delay so click fires normally
      setTimeout(function(){_gMoved=false;},50);
    }
  });

  // Suppress clicks when user was panning/zooming
  c.addEventListener('click',function(e){if(_gMoved){e.stopPropagation();e.preventDefault();_gMoved=false;}},true);

  // Tap empty map area → close bottom sheet
  c.addEventListener('click',function(e){
    if(_gMoved)return;
    if(e.target===c||e.target.tagName==='svg'||e.target.closest('svg')){
      var s=document.getElementById('mapInfoCard');
      if(s&&s.classList.contains('visible'))s.classList.remove('visible');
    }
  });

  // Bottom sheet drag to close
  var sheet=document.getElementById('mapInfoCard');
  if(sheet){
    var _sy=0,_sdrag=false;
    sheet.addEventListener('touchstart',function(e){_sy=e.touches[0].clientY;_sdrag=true;});
    sheet.addEventListener('touchmove',function(e){
      if(!_sdrag)return;
      var dy=e.touches[0].clientY-_sy;
      if(dy>60){sheet.classList.remove('visible');_sdrag=false;}
    });
    sheet.addEventListener('touchend',function(){_sdrag=false;});
  }
}

/* ═══ POI click ripple ═══ */
function poiRipple(e,el){
  var r=document.createElement('div');r.className='poi-tap-ripple';
  var rect=el.getBoundingClientRect();
  r.style.left=(e.clientX-rect.left)+'px';r.style.top=(e.clientY-rect.top)+'px';
  el.appendChild(r);
  setTimeout(function(){r.remove();},500);
}

/* ═══ Aggregate overlapping pins — show one pin + count badge ═══ */
function spiderifyPins(){
  // Delegate to unified DOM-position-based aggregation
  _reaggregatePins();
}

/* ═══ Re-aggregate pins after real-time movement ═══ */
function _reaggregatePins(movedPins){
  // Full cleanup: remove all badges, show all pins (handles stale state from prev moves)
  document.querySelectorAll('.pin-count-badge').forEach(function(el){ el.remove(); });
  CHARACTERS.forEach(function(name){
    var pin = document.getElementById('pin-' + CHAR_PINYIN[name]);
    if(!pin) return;
    pin.style.zIndex = '10';
    pin.style.display = '';
  });

  // Build position map from current DOM positions
  var posMap = {};
  CHARACTERS.forEach(function(name){
    var pin = document.getElementById('pin-' + CHAR_PINYIN[name]);
    if(!pin) return;
    var left = pin.style.left;
    var top = pin.style.top;
    var key = Math.round(parseFloat(left)) + ',' + Math.round(parseFloat(top));
    if(!posMap[key]) posMap[key] = [];
    posMap[key].push(name);
  });

  // For each position with >1 pin, show one + badge
  Object.keys(posMap).forEach(function(key){
    var names = posMap[key];
    if(names.length < 2) return;
    // Show first pin, hide others, update badge
    var first = document.getElementById('pin-' + CHAR_PINYIN[names[0]]);
    if(!first) return;
    // Remove old badge
    var oldBadge = first.querySelector('.pin-count-badge');
    if(oldBadge) oldBadge.remove();
    // Add new badge
    var count = names.length;
    var badge = document.createElement('div');
    badge.className = 'pin-count-badge';
    badge.textContent = '+' + (count - 1);
    badge.style.cssText = 'position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:'+(CHAR_COLORS[names[0]]||'#888')+';color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:12;box-shadow:0 1px 4px rgba(0,0,0,.25)';
    first.appendChild(badge);
    // Hide others
    for(var i=1; i<names.length; i++){
      var otherPin = document.getElementById('pin-' + CHAR_PINYIN[names[i]]);
      if(otherPin) otherPin.style.display = 'none';
    }
  });
}

/* ═══ Time-of-day overlay ═══ */
function _hourFromServer(){return new Date().getHours()}
function updateTimeOverlay(){
  var overlay=document.getElementById('timeOverlay');
  if(!overlay)return;
  var h=new Date().getHours();
  if(h>=20||h<5){overlay.setAttribute('fill','url(#gradNight)')}
  else if(h>=18&&h<20){overlay.setAttribute('fill','url(#gradDusk)')}
  else {overlay.setAttribute('fill','none')}
}

/* ═══ Enhanced showPOI with ripple ═══ */
var _origShowPOI=showPOI;
showPOI=function(name,desc){
  _origShowPOI(name,desc);
  // Also close sheet when tapping a POI and reopening
  var sheet=document.getElementById('mapInfoCard');
  if(sheet)sheet.scrollIntoView({behavior:'smooth'});
};

/* ═══ Setup after renderMap ═══ */
var _origRenderMap=renderMap;
renderMap=function(){
  _origRenderMap();
  setTimeout(function(){
    spiderifyPins();
    setupGestures();
    updateTimeOverlay();
  },100);
};

var _origRefreshMap=refreshMap;
refreshMap=function(){
  _origRefreshMap();
  updateTimeOverlay();
};

/* ═══════════════════════════════════════════
   SCENE SYSTEM — Interactive Scene Panel
   ═══════════════════════════════════════════ */

function showSceneSelect(){
  // Check if a scene is already active
  fetch('/api/scene/status').then(function(r){return r.json()}).then(function(d){
    if(d.scene_id){
      document.getElementById('sceneOverlay').style.display='flex';
      renderScene(d);
    } else {
      showScenePicker();
    }
  }).catch(function(){ showScenePicker(); });
}

function showScenePicker(){

  var h = '<div style="padding:16px"><h3 style="margin-bottom:12px">荒岛求生</h3><p style="font-size:13px;color:var(--text2);margin-bottom:16px">选择参与的角色：</p><div id="sceneCharSelect">';
  CHARACTERS.forEach(function(c){
    h += '<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--card);border-radius:10px;border:1px solid rgba(0,0,0,.06);cursor:pointer;font-size:14px"><input type="checkbox" checked data-char="'+c+'" style="width:18px;height:18px"> '+(CHAR_EMOJI[c]||'')+' '+c+'</label>';
  });
  h += '</div><br><button onclick="goScene()" style="width:100%;padding:14px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:15px;font-weight:600;cursor:pointer">开始冒险</button></div>';
  showModal(h);
}

function endScene(){
  fetch('/api/scene/end', {method:'POST'}).then(function(r){return r.json()}).then(function(d){
    document.getElementById('sceneOverlay').style.display='none';
    if(d.ok) toast('场景已结束');
  });
}

function goScene(){
  var sel = [];
  document.querySelectorAll('#sceneCharSelect input:checked').forEach(function(e){ sel.push(e.dataset.char); });
  if(sel.length < 2){ alert('至少选2人'); return; }
  document.getElementById('sceneOverlay').style.display = 'flex';
  startScene('desert_island', sel);
}


function startScene(sceneId, participants) {
  fetch('/api/scene/start', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({scene_id:sceneId, participants:participants})
  }).then(function(r){ return r.json(); }).then(function(data) {
    document.getElementById('sceneOverlay').style.display = 'flex';
    document.getElementById('sceneOverlay').style.flexDirection = 'column';
    renderScene(data);
  }).catch(function(e){ toast('场景启动失败: '+e.message); });
}

function renderScene(data) {
  document.getElementById('sceneTitle').textContent = data.title || '荒岛求生';
  document.getElementById('sceneTime').textContent = data.time_str || '';

  if(data.stats) {
    document.querySelectorAll('.scene-stat').forEach(function(el) {
      var key = el.dataset.stat;
      var val = data.stats[key] || 0;
      el.querySelector('.stat-bar-fill').style.width = val + '%';
    });
  }

  var imgArea = document.getElementById('sceneImageArea');
  var img = document.getElementById('sceneImage');
  var loading = document.getElementById('sceneImageLoading');
  if(data.image_trigger) {
    imgArea.style.display = 'block';
    loading.style.display = 'block';
    img.style.display = 'none';
    document.getElementById('sceneImageLoadingText').textContent = (data.image_trigger&&data.image_trigger.char||'') + '正在拍照……';
    pollImageStatus();
  } else {
    imgArea.style.display = 'none';
  }

  var textEl = document.getElementById('sceneText');
  textEl.textContent = '';
  typeWriter(textEl, data.text || '', 0, 20);

  var choicesEl = document.getElementById('sceneChoices');
  choicesEl.innerHTML = '';
  (data.choices || []).forEach(function(c, i) {
    var btn = document.createElement('button');
    btn.className = 'scene-choice-btn';
    btn.textContent = '👉 ' + c.text;
    btn.onclick = function() { makeChoice(c.id); };
    choicesEl.appendChild(btn);
  });

  if(data.voice) {
    var vi = document.getElementById('sceneVoiceIndicator');
    vi.style.display = 'block';
    document.getElementById('sceneVoiceLabel').textContent = data.voice.label || '';
    var audio = new Audio('/voice/scene_' + data.scene_id + '_' + data.voice.id + '.mp3');
    audio.play().catch(function(){});
  } else {
    document.getElementById('sceneVoiceIndicator').style.display = 'none';
  }

  updateSceneCharBar(data.participants || []);
}

function makeChoice(choiceId) {
  fetch('/api/scene/choice', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({choice_id:choiceId})
  }).then(function(r){ return r.json(); }).then(function(data) {
    if(data.scene_ended) {
      document.getElementById('sceneOverlay').style.display = 'none';
      return;
    }
    renderScene(data);
  }).catch(function(e){ toast('选择提交失败: '+e.message); });
}

function pollImageStatus() {
  var check = function() {
    fetch('/api/scene/image_status').then(function(r){ return r.json(); }).then(function(data) {
      if(data.status === 'ready') {
        var img = document.getElementById('sceneImage');
        img.src = data.filename + '?v=' + Date.now();
        document.getElementById('sceneImageLoading').style.display = 'none';
        img.style.display = 'block';
      } else if(data.status === 'failed') {
        document.getElementById('sceneImageLoading').style.display = 'none';
      } else {
        setTimeout(check, 2000);
      }
    }).catch(function(){ setTimeout(check, 3000); });
  };
  setTimeout(check, 2000);
}

function typeWriter(el, text, index, speed) {
  if(index < text.length) {
    el.textContent += text.charAt(index);
    index++;
    setTimeout(function(){ typeWriter(el, text, index, speed); }, speed);
  }
}

function updateSceneCharBar(participants) {
  var bar = document.getElementById('sceneCharBar');
  bar.innerHTML = '';
  participants.forEach(function(name) {
    var pinyin = CHAR_PINYIN[name] || '';
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
    div.innerHTML = '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid '+(CHAR_COLORS[name]||'#ccc')+'"><img src="'+_avatarUrl(pinyin)+'" style="width:100%;height:100%;object-fit:cover"></div><span style="font-size:9px;color:var(--text2)">'+name+'</span>';
    bar.appendChild(div);
  });
}

function openGallery() {
  fetch('/api/scene/gallery').then(function(r){ return r.json(); }).then(function(data) {
    var html = '<div style="padding:16px"><h3 style="margin-bottom:12px">🖼️ 场景画廊</h3>';
    html += '<h4 style="font-size:12px;color:var(--accent);margin-bottom:8px">📷 场景照片</h4><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">';
    (data.images || []).forEach(function(img) {
      html += '<img src="'+img+'" style="width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:8px">';
    });
    html += '</div>';
    html += '<h4 style="font-size:12px;color:var(--accent);margin-bottom:8px">🔊 语音收藏</h4><div style="display:flex;flex-direction:column;gap:6px">';
    (data.voices || []).forEach(function(v) {
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--card);border-radius:8px;font-size:12px"><span>🔊</span><span>'+v.name+'</span><button onclick="new Audio(\''+v.file+'\').play()" style="margin-left:auto;padding:4px 12px;border:1px solid rgba(0,0,0,.08);border-radius:16px;background:var(--card);font-size:11px;cursor:pointer">▶ 播放</button></div>';
    });
    html += '</div></div>';
    showModal(html);
  }).catch(function(e){ toast('加载画廊失败: '+e.message); });
}

function showModal(html) {
  var backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:250;background:rgba(0,0,0,.7);animation:fadeIn .2s ease;';
  backdrop.addEventListener('click', function(){ modal.remove(); backdrop.remove(); });

  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:251;background:var(--card);border-radius:var(--radius);max-width:420px;width:92vw;max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;box-shadow:0 8px 40px rgba(0,0,0,.15);';
  modal.innerHTML = '<div style="position:sticky;top:0;text-align:right;padding:8px;background:var(--card);"><button id="modalCloseBtn" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.05);color:var(--text);font-size:16px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">✕</button></div>'+html;
  modal.querySelector('#modalCloseBtn').addEventListener('click', function(){ modal.remove(); backdrop.remove(); });

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}

init();