/* ============================================================
   views/secure-chat.js — In-Context Secure Staff Chat
   ============================================================ */

/* ---------- Module State ---------- */

var _activeChatId = null;
var _chatFilterTab = 'all'; // 'all' | 'direct' | 'patient-linked'
var _chatSearchQuery = '';
var _chatPanelOpen = false;
var _typingState = {};
var _typingTimers = {};
var _replyingTo = null; // { id, senderName, preview }
var _messageSearchActive = false;
var _messageSearchQuery = '';
var _newMessageCount = 0;
var _lastScrollTop = 0;
var _chatPollInterval = null;

/* ---------- Data Layer ---------- */

function getChats(providerId) {
  return loadAll(KEYS.secureChats)
    .filter(function(c) { return c.participants && c.participants.indexOf(providerId) !== -1; })
    .sort(function(a, b) { return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt); });
}

function getChat(chatId) {
  return loadAll(KEYS.secureChats).find(function(c) { return c.id === chatId; }) || null;
}

function getChatMessages(chatId) {
  return loadAll(KEYS.chatMessages)
    .filter(function(m) { return m.chatId === chatId; })
    .sort(function(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
}

function createChat(data) {
  var chat = {
    id:                 generateId(),
    type:               data.type || 'direct',
    participants:       data.participants || [],
    patientId:          data.patientId || null,
    title:              data.title || '',
    createdAt:          new Date().toISOString(),
    createdBy:          data.createdBy || (getSessionUser() ? getSessionUser().id : ''),
    lastMessageAt:      null,
    lastMessagePreview: '',
    unreadCount:        {},
  };
  var all = loadAll(KEYS.secureChats);
  all.push(chat);
  saveAll(KEYS.secureChats, all);
  return chat;
}

function sendMessage(chatId, content, type) {
  var me = getSessionUser();
  if (!me) return null;

  var msg = {
    id:        generateId(),
    chatId:    chatId,
    senderId:  me.id,
    content:   content,
    timestamp: new Date().toISOString(),
    readBy:    [me.id],
    type:      type || 'text',
    reactions: [],
    replyToId: null,
    replyToPreview: null,
    pinnedAt: null,
    pinnedBy: null,
    editedAt: null,
  };

  // Attach reply info if replying
  if (_replyingTo) {
    msg.replyToId = _replyingTo.id;
    msg.replyToPreview = _replyingTo.preview;
    msg.replyToSender = _replyingTo.senderName;
  }

  var msgs = loadAll(KEYS.chatMessages);
  msgs.push(msg);
  saveAll(KEYS.chatMessages, msgs);

  // Update chat metadata
  var chats = loadAll(KEYS.secureChats);
  var chat = chats.find(function(c) { return c.id === chatId; });
  if (chat) {
    chat.lastMessageAt = msg.timestamp;
    chat.lastMessagePreview = content.length > 80 ? content.substring(0, 80) + '...' : content;
    // Increment unread for all participants except sender
    if (!chat.unreadCount) chat.unreadCount = {};
    chat.participants.forEach(function(pid) {
      if (pid !== me.id) {
        chat.unreadCount[pid] = (chat.unreadCount[pid] || 0) + 1;
      }
    });
    saveAll(KEYS.secureChats, chats);
  }

  // Clear reply state
  _replyingTo = null;

  // Clear typing indicator
  _setTyping(chatId, false);

  return msg;
}

function markChatRead(chatId, providerId) {
  // Mark all messages as read
  var msgs = loadAll(KEYS.chatMessages);
  var changed = false;
  msgs.forEach(function(m) {
    if (m.chatId === chatId && m.readBy && m.readBy.indexOf(providerId) === -1) {
      m.readBy.push(providerId);
      changed = true;
    }
  });
  if (changed) saveAll(KEYS.chatMessages, msgs);

  // Reset unread count
  var chats = loadAll(KEYS.secureChats);
  var chat = chats.find(function(c) { return c.id === chatId; });
  if (chat && chat.unreadCount) {
    chat.unreadCount[providerId] = 0;
    saveAll(KEYS.secureChats, chats);
  }
}

function getUnreadCount(providerId) {
  var total = 0;
  loadAll(KEYS.secureChats).forEach(function(c) {
    if (c.participants && c.participants.indexOf(providerId) !== -1 && c.unreadCount) {
      total += (c.unreadCount[providerId] || 0);
    }
  });
  return total;
}

function getPatientChats(patientId) {
  return loadAll(KEYS.secureChats)
    .filter(function(c) { return c.patientId === patientId; })
    .sort(function(a, b) { return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt); });
}

/* ---------- Typing Indicator ---------- */

function _setTyping(chatId, isTyping) {
  var me = getSessionUser();
  if (!me) return;
  var typingData = {};
  try {
    typingData = JSON.parse(localStorage.getItem('emr_chat_typing') || '{}');
  } catch(e) { typingData = {}; }

  var key = chatId + ':' + me.id;
  if (isTyping) {
    typingData[key] = { providerId: me.id, timestamp: Date.now() };
  } else {
    delete typingData[key];
  }
  localStorage.setItem('emr_chat_typing', JSON.stringify(typingData));
}

function _getTypingUsers(chatId, meId) {
  var typingData = {};
  try {
    typingData = JSON.parse(localStorage.getItem('emr_chat_typing') || '{}');
  } catch(e) { typingData = {}; }

  var typingUsers = [];
  var now = Date.now();
  var keys = Object.keys(typingData);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k.indexOf(chatId + ':') === 0) {
      var entry = typingData[k];
      // Auto-expire after 3 seconds
      if (now - entry.timestamp > 3000) {
        delete typingData[k];
        continue;
      }
      if (entry.providerId !== meId) {
        var prov = getProvider(entry.providerId);
        if (prov) typingUsers.push(prov.firstName + ' ' + prov.lastName);
      }
    }
  }
  // Clean up expired entries
  localStorage.setItem('emr_chat_typing', JSON.stringify(typingData));
  return typingUsers;
}

/* ---------- Reactions ---------- */

var _quickReactions = ['\u{1F44D}', '\u2705', '\u2757', '\u{1F440}', '\u2764\uFE0F'];

function _toggleReaction(msgId, emoji) {
  var me = getSessionUser();
  if (!me) return;
  var msgs = loadAll(KEYS.chatMessages);
  var msg = msgs.find(function(m) { return m.id === msgId; });
  if (!msg) return;
  if (!msg.reactions) msg.reactions = [];

  var existingIdx = -1;
  for (var i = 0; i < msg.reactions.length; i++) {
    if (msg.reactions[i].emoji === emoji && msg.reactions[i].providerId === me.id) {
      existingIdx = i;
      break;
    }
  }

  if (existingIdx !== -1) {
    msg.reactions.splice(existingIdx, 1);
  } else {
    var prov = getProvider(me.id);
    msg.reactions.push({
      emoji: emoji,
      providerId: me.id,
      providerName: prov ? (prov.firstName + ' ' + prov.lastName) : 'Unknown',
    });
  }
  saveAll(KEYS.chatMessages, msgs);
}

/* ---------- Message Editing ---------- */

function _editMessage(msgId, newContent) {
  var msgs = loadAll(KEYS.chatMessages);
  var msg = msgs.find(function(m) { return m.id === msgId; });
  if (!msg) return false;
  msg.content = newContent;
  msg.editedAt = new Date().toISOString();
  saveAll(KEYS.chatMessages, msgs);
  return true;
}

function _canEditMessage(msg) {
  var me = getSessionUser();
  if (!me || msg.senderId !== me.id) return false;
  if (msg.type === 'system') return false;
  var elapsed = Date.now() - new Date(msg.timestamp).getTime();
  return elapsed < 5 * 60 * 1000; // 5 minutes
}

/* ---------- Message Pinning ---------- */

function _togglePinMessage(msgId) {
  var me = getSessionUser();
  if (!me) return;
  var msgs = loadAll(KEYS.chatMessages);
  var msg = msgs.find(function(m) { return m.id === msgId; });
  if (!msg) return;

  if (msg.pinnedAt) {
    msg.pinnedAt = null;
    msg.pinnedBy = null;
    showToast('Message unpinned', 'success');
  } else {
    msg.pinnedAt = new Date().toISOString();
    msg.pinnedBy = me.id;
    showToast('Message pinned', 'success');
  }
  saveAll(KEYS.chatMessages, msgs);
}

function _getPinnedMessages(chatId) {
  return getChatMessages(chatId).filter(function(m) { return m.pinnedAt; });
}

/* ---------- Helpers ---------- */

function _chatTitle(chat, meId) {
  if (chat.title) return chat.title;
  // Auto-generate title from participants (excluding self)
  var names = [];
  chat.participants.forEach(function(pid) {
    if (pid === meId) return;
    var prov = getProvider(pid);
    if (prov) names.push(prov.firstName + ' ' + prov.lastName);
  });
  return names.length > 0 ? names.join(', ') : 'Chat';
}

function _chatTimeAgo(isoStr) {
  if (!isoStr) return '';
  var diff = Date.now() - new Date(isoStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  var days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd';
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function _chatParticipantNames(chat, meId) {
  var names = [];
  chat.participants.forEach(function(pid) {
    if (pid === meId) return;
    var prov = getProvider(pid);
    if (prov) names.push(prov.firstName + ' ' + prov.lastName + (prov.degree ? ', ' + prov.degree : ''));
  });
  return names.join('; ');
}

function _senderInitials(senderId) {
  var prov = getProvider(senderId);
  if (!prov) return '?';
  return (prov.firstName || '?').charAt(0).toUpperCase() + (prov.lastName || '?').charAt(0).toUpperCase();
}

function _senderName(senderId) {
  var prov = getProvider(senderId);
  if (!prov) return 'Unknown';
  return prov.firstName + ' ' + prov.lastName;
}

function _highlightText(text, query) {
  if (!query) return esc(text);
  var lowerText = text.toLowerCase();
  var lowerQ = query.toLowerCase();
  var result = '';
  var lastIdx = 0;
  var idx = lowerText.indexOf(lowerQ, lastIdx);
  while (idx !== -1) {
    result += esc(text.substring(lastIdx, idx));
    result += '<mark class="chat-search-highlight">' + esc(text.substring(idx, idx + query.length)) + '</mark>';
    lastIdx = idx + query.length;
    idx = lowerText.indexOf(lowerQ, lastIdx);
  }
  result += esc(text.substring(lastIdx));
  return result;
}

/* ---------- Read Receipts Helpers ---------- */

function _readReceiptHTML(msg, meId) {
  var isOwn = msg.senderId === meId;
  if (msg.type === 'system') return '';

  var readBy = msg.readBy || [];
  var otherReaders = readBy.filter(function(pid) { return pid !== msg.senderId; });

  if (isOwn) {
    if (otherReaders.length === 0) {
      // Sent but not read by others — single check
      return '<div class="chat-read-receipt">' +
        '<span class="chat-check-single" title="Delivered">\u2713</span>' +
        ' <span class="chat-receipt-text">Delivered</span></div>';
    }
    // Read by others — double check
    var readerNames = otherReaders.map(function(pid) {
      return _senderName(pid);
    });
    return '<div class="chat-read-receipt chat-read-receipt-read">' +
      '<span class="chat-check-double" title="Read">\u2713\u2713</span>' +
      ' <span class="chat-receipt-text">Read by ' + esc(readerNames.join(', ')) + '</span></div>';
  }
  return '';
}

/* ---------- Reactions Rendering ---------- */

function _reactionsHTML(msg) {
  if (!msg.reactions || msg.reactions.length === 0) return '';
  // Group reactions by emoji
  var groups = {};
  var me = getSessionUser();
  var meId = me ? me.id : '';
  msg.reactions.forEach(function(r) {
    if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, names: [], hasMine: false };
    groups[r.emoji].names.push(r.providerName);
    if (r.providerId === meId) groups[r.emoji].hasMine = true;
  });

  var html = '<div class="chat-reactions">';
  var emojis = Object.keys(groups);
  for (var i = 0; i < emojis.length; i++) {
    var g = groups[emojis[i]];
    html += '<button class="chat-reaction-badge' + (g.hasMine ? ' chat-reaction-mine' : '') +
      '" data-msg-id="' + esc(msg.id) + '" data-emoji="' + esc(g.emoji) +
      '" title="' + esc(g.names.join(', ')) + '">' +
      g.emoji + ' <span class="chat-reaction-count">' + g.names.length + '</span></button>';
  }
  html += '</div>';
  return html;
}

/* ---------- View: Full-page Secure Chat (#secure-chat) ---------- */

function renderSecureChat() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var me = getSessionUser();
  if (!me) { navigate('#dashboard'); return; }

  setTopbar({ title: 'Secure Chat', meta: '', actions: '' });
  setActiveNav('secure-chat');

  // Clear stale state
  _messageSearchActive = false;
  _messageSearchQuery = '';
  _newMessageCount = 0;
  _replyingTo = null;

  var shell = document.createElement('div');
  shell.className = 'chat-shell';

  // ===== Left Panel: Chat List =====
  var leftPanel = document.createElement('div');
  leftPanel.className = 'chat-left-panel';

  // Header with New Chat button
  var leftHeader = document.createElement('div');
  leftHeader.className = 'chat-left-header';
  leftHeader.innerHTML = '<span class="chat-left-title">Conversations</span>';
  var newChatBtn = document.createElement('button');
  newChatBtn.className = 'btn btn-primary btn-sm';
  newChatBtn.textContent = '+ New Chat';
  newChatBtn.addEventListener('click', function() { openNewChatModal(); });
  leftHeader.appendChild(newChatBtn);
  leftPanel.appendChild(leftHeader);

  // Search bar
  var searchWrap = document.createElement('div');
  searchWrap.className = 'chat-search-wrap';
  searchWrap.innerHTML = '<input type="text" class="chat-search-input" placeholder="Search conversations..." value="' + esc(_chatSearchQuery) + '" />';
  leftPanel.appendChild(searchWrap);
  var searchInput = searchWrap.querySelector('input');
  searchInput.addEventListener('input', function() {
    _chatSearchQuery = this.value;
    _renderChatList(chatListEl, me.id);
  });

  // Tabs
  var tabBar = document.createElement('div');
  tabBar.className = 'chat-tab-bar';
  ['all', 'direct', 'patient-linked'].forEach(function(tab) {
    var tabBtn = document.createElement('button');
    tabBtn.className = 'chat-tab' + (_chatFilterTab === tab ? ' chat-tab-active' : '');
    tabBtn.textContent = tab === 'all' ? 'All' : tab === 'direct' ? 'Direct' : 'Patient';
    tabBtn.addEventListener('click', function() {
      _chatFilterTab = tab;
      tabBar.querySelectorAll('.chat-tab').forEach(function(t) { t.classList.remove('chat-tab-active'); });
      tabBtn.classList.add('chat-tab-active');
      _renderChatList(chatListEl, me.id);
    });
    tabBar.appendChild(tabBtn);
  });
  leftPanel.appendChild(tabBar);

  // Chat list container
  var chatListEl = document.createElement('div');
  chatListEl.className = 'chat-list';
  leftPanel.appendChild(chatListEl);

  // ===== Right Panel: Conversation =====
  var rightPanel = document.createElement('div');
  rightPanel.className = 'chat-right-panel';
  rightPanel.id = 'chat-right-panel';

  shell.appendChild(leftPanel);
  shell.appendChild(rightPanel);
  app.appendChild(shell);

  // Render list
  _renderChatList(chatListEl, me.id);

  // If we had an active chat, reopen it
  if (_activeChatId) {
    var existing = getChat(_activeChatId);
    if (existing && existing.participants.indexOf(me.id) !== -1) {
      _openConversation(_activeChatId);
    } else {
      _activeChatId = null;
      _renderEmptyConversation(rightPanel);
    }
  } else {
    _renderEmptyConversation(rightPanel);
  }

  // Cleanup on route change
  if (typeof registerCleanup === 'function') {
    registerCleanup(function() {
      if (_chatPollInterval) {
        clearInterval(_chatPollInterval);
        _chatPollInterval = null;
      }
    });
  }
}

function _renderChatList(container, meId) {
  container.innerHTML = '';
  var chats = getChats(meId);
  var q = _chatSearchQuery.toLowerCase().trim();

  // Filter by tab
  if (_chatFilterTab === 'direct') {
    chats = chats.filter(function(c) { return c.type === 'direct'; });
  } else if (_chatFilterTab === 'patient-linked') {
    chats = chats.filter(function(c) { return c.type === 'patient-linked'; });
  }

  // Filter by search
  if (q) {
    chats = chats.filter(function(c) {
      var title = _chatTitle(c, meId).toLowerCase();
      var preview = (c.lastMessagePreview || '').toLowerCase();
      var patName = '';
      if (c.patientId) {
        var pat = getPatient(c.patientId);
        if (pat) patName = (pat.firstName + ' ' + pat.lastName).toLowerCase();
      }
      return title.indexOf(q) !== -1 || preview.indexOf(q) !== -1 || patName.indexOf(q) !== -1;
    });
  }

  if (chats.length === 0) {
    var emptyMsg = document.createElement('div');
    emptyMsg.className = 'chat-list-empty';
    emptyMsg.textContent = q ? 'No matching conversations' : 'No conversations yet';
    container.appendChild(emptyMsg);
    return;
  }

  chats.forEach(function(chat) {
    var item = document.createElement('div');
    item.className = 'chat-list-item' + (_activeChatId === chat.id ? ' chat-list-item-active' : '');
    item.dataset.chatId = chat.id;

    var unread = (chat.unreadCount && chat.unreadCount[meId]) || 0;

    var titleText = _chatTitle(chat, meId);
    var typeIcon = chat.type === 'patient-linked' ? '<span class="chat-type-icon" title="Patient-linked">&#9878;</span> ' : '';
    if (chat.type === 'group') typeIcon = '<span class="chat-type-icon" title="Group">&#9783;</span> ';

    var patLabel = '';
    if (chat.patientId) {
      var pat = getPatient(chat.patientId);
      if (pat) patLabel = '<div class="chat-list-patient">Re: ' + esc(pat.lastName) + ', ' + esc(pat.firstName) + '</div>';
    }

    item.innerHTML =
      '<div class="chat-list-item-content">' +
        '<div class="chat-list-item-top">' +
          '<span class="chat-list-item-title">' + typeIcon + esc(titleText) + '</span>' +
          '<span class="chat-list-item-time">' + esc(_chatTimeAgo(chat.lastMessageAt || chat.createdAt)) + '</span>' +
        '</div>' +
        patLabel +
        '<div class="chat-list-item-preview' + (unread > 0 ? ' chat-list-item-preview-unread' : '') + '">' +
          esc(chat.lastMessagePreview || 'No messages yet') +
        '</div>' +
      '</div>' +
      (unread > 0 ? '<span class="chat-unread-badge">' + unread + '</span>' : '');

    item.addEventListener('click', function() {
      _activeChatId = chat.id;
      // Re-highlight
      container.querySelectorAll('.chat-list-item').forEach(function(el) {
        el.classList.toggle('chat-list-item-active', el.dataset.chatId === chat.id);
      });
      _openConversation(chat.id);
    });

    container.appendChild(item);
  });
}

/* ---------- Empty / Welcome State ---------- */

function _renderEmptyConversation(panel) {
  var me = getSessionUser();
  panel.innerHTML =
    '<div class="chat-welcome-state">' +
      '<div class="chat-welcome-icon">' +
        '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' +
          '<line x1="9" y1="9" x2="15" y2="9"/>' +
          '<line x1="12" y1="6" x2="12" y2="12"/>' +
        '</svg>' +
      '</div>' +
      '<div class="chat-welcome-title">Secure Staff Messaging</div>' +
      '<div class="chat-welcome-subtitle">HIPAA-compliant communication for your care team</div>' +
      '<div class="chat-welcome-actions">' +
        '<button class="btn btn-primary chat-welcome-btn" id="chat-welcome-new">' +
          '<span class="chat-welcome-btn-icon">+</span> New Conversation' +
        '</button>' +
        '<button class="btn btn-secondary chat-welcome-btn" id="chat-welcome-patient">' +
          '<span class="chat-welcome-btn-icon">\u2695</span> Patient-Linked Chat' +
        '</button>' +
      '</div>' +
      '<div class="chat-welcome-hint">Select a conversation from the list or start a new one</div>' +
    '</div>';

  var newBtn = document.getElementById('chat-welcome-new');
  if (newBtn) {
    newBtn.addEventListener('click', function() { openNewChatModal(); });
  }
  var patBtn = document.getElementById('chat-welcome-patient');
  if (patBtn) {
    patBtn.addEventListener('click', function() { openNewChatModal({ type: 'patient-linked' }); });
  }
}

/* ---------- Conversation View ---------- */

function _openConversation(chatId) {
  var panel = document.getElementById('chat-right-panel');
  if (!panel) return;
  panel.innerHTML = '';

  var me = getSessionUser();
  if (!me) return;

  var chat = getChat(chatId);
  if (!chat) return;

  markChatRead(chatId, me.id);

  // Reset state
  _messageSearchActive = false;
  _messageSearchQuery = '';
  _newMessageCount = 0;
  _replyingTo = null;

  // Update badge in sidebar
  _updateChatSidebarBadge();

  // Refresh left panel item (remove unread bold)
  var leftItem = document.querySelector('.chat-list-item[data-chat-id="' + chatId + '"]');
  if (leftItem) {
    var badge = leftItem.querySelector('.chat-unread-badge');
    if (badge) badge.remove();
    var prevEl = leftItem.querySelector('.chat-list-item-preview');
    if (prevEl) prevEl.classList.remove('chat-list-item-preview-unread');
  }

  // ===== Chat Header =====
  var header = document.createElement('div');
  header.className = 'chat-conv-header';

  var headerInfo = document.createElement('div');
  headerInfo.className = 'chat-conv-header-info';
  var titleEl = document.createElement('div');
  titleEl.className = 'chat-conv-title';
  titleEl.textContent = _chatTitle(chat, me.id);
  headerInfo.appendChild(titleEl);

  var metaEl = document.createElement('div');
  metaEl.className = 'chat-conv-meta';
  var parts = [];
  parts.push(_chatParticipantNames(chat, me.id));
  if (chat.patientId) {
    var pat = getPatient(chat.patientId);
    if (pat) parts.push('Patient: ' + pat.lastName + ', ' + pat.firstName);
  }
  metaEl.textContent = parts.filter(Boolean).join(' | ');
  headerInfo.appendChild(metaEl);
  header.appendChild(headerInfo);

  // Header buttons container
  var headerBtns = document.createElement('div');
  headerBtns.className = 'chat-conv-header-btns';

  // Search button in header
  var searchBtn = document.createElement('button');
  searchBtn.className = 'btn btn-secondary btn-sm chat-header-search-btn';
  searchBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search';
  searchBtn.title = 'Search messages';
  searchBtn.addEventListener('click', function() {
    _messageSearchActive = !_messageSearchActive;
    var searchBarEl = document.getElementById('chat-message-search-bar');
    if (searchBarEl) {
      searchBarEl.classList.toggle('hidden', !_messageSearchActive);
      if (_messageSearchActive) {
        var inp = searchBarEl.querySelector('input');
        if (inp) inp.focus();
      } else {
        _messageSearchQuery = '';
        _renderMessages(msgList, chatId, me.id);
      }
    }
  });
  headerBtns.appendChild(searchBtn);

  // Patient link button
  if (chat.patientId) {
    var patBtn = document.createElement('button');
    patBtn.className = 'btn btn-secondary btn-sm';
    patBtn.textContent = 'View Chart';
    patBtn.addEventListener('click', function() { navigate('#chart/' + chat.patientId); });
    headerBtns.appendChild(patBtn);
  }

  header.appendChild(headerBtns);
  panel.appendChild(header);

  // ===== Message Search Bar =====
  var searchBar = document.createElement('div');
  searchBar.className = 'chat-message-search-bar hidden';
  searchBar.id = 'chat-message-search-bar';
  searchBar.innerHTML =
    '<div class="chat-message-search-inner">' +
      '<svg class="chat-message-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input type="text" class="chat-message-search-input" placeholder="Search messages in this conversation..." />' +
      '<button class="chat-message-search-close" title="Close search">&times;</button>' +
    '</div>';
  panel.appendChild(searchBar);

  var msgSearchInput = searchBar.querySelector('input');
  var msgSearchClose = searchBar.querySelector('.chat-message-search-close');
  msgSearchInput.addEventListener('input', function() {
    _messageSearchQuery = this.value;
    _renderMessages(msgList, chatId, me.id);
  });
  msgSearchClose.addEventListener('click', function() {
    _messageSearchActive = false;
    _messageSearchQuery = '';
    searchBar.classList.add('hidden');
    _renderMessages(msgList, chatId, me.id);
  });

  // ===== Pinned Messages Section =====
  var pinnedSection = document.createElement('div');
  pinnedSection.className = 'chat-pinned-section';
  pinnedSection.id = 'chat-pinned-section';
  panel.appendChild(pinnedSection);
  _renderPinnedMessages(pinnedSection, chatId, me.id);

  // ===== Message List =====
  var msgList = document.createElement('div');
  msgList.className = 'chat-messages';
  msgList.id = 'chat-messages-container';
  panel.appendChild(msgList);

  _renderMessages(msgList, chatId, me.id);

  // Scroll to bottom
  setTimeout(function() { msgList.scrollTop = msgList.scrollHeight; }, 50);

  // Track scroll for new message indicator
  msgList.addEventListener('scroll', function() {
    var isAtBottom = msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight < 60;
    if (isAtBottom) {
      _newMessageCount = 0;
      var indicator = document.getElementById('chat-new-msg-indicator');
      if (indicator) indicator.classList.add('hidden');
    }
    _lastScrollTop = msgList.scrollTop;
  });

  // ===== New Message Indicator (floating) =====
  var newMsgIndicator = document.createElement('div');
  newMsgIndicator.className = 'chat-new-msg-indicator hidden';
  newMsgIndicator.id = 'chat-new-msg-indicator';
  newMsgIndicator.addEventListener('click', function() {
    msgList.scrollTop = msgList.scrollHeight;
    _newMessageCount = 0;
    newMsgIndicator.classList.add('hidden');
  });
  panel.appendChild(newMsgIndicator);

  // ===== Typing Indicator =====
  var typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-typing-indicator';
  typingIndicator.id = 'chat-typing-indicator';
  panel.appendChild(typingIndicator);

  // ===== Reply Preview Bar =====
  var replyPreview = document.createElement('div');
  replyPreview.className = 'chat-reply-preview hidden';
  replyPreview.id = 'chat-reply-preview';
  panel.appendChild(replyPreview);

  // ===== Input Bar =====
  var inputBar = document.createElement('div');
  inputBar.className = 'chat-input-bar';

  // Attachment placeholder button
  var attachBtn = document.createElement('button');
  attachBtn.className = 'chat-attach-btn';
  attachBtn.innerHTML = '+';
  attachBtn.title = 'Attach file (coming soon)';
  attachBtn.addEventListener('click', function() {
    showToast('File attachments coming soon', 'warning');
  });
  inputBar.appendChild(attachBtn);

  var urgentToggle = document.createElement('button');
  urgentToggle.className = 'chat-urgent-toggle';
  urgentToggle.textContent = 'Urgent';
  urgentToggle.title = 'Toggle urgent message';
  var isUrgent = false;
  urgentToggle.addEventListener('click', function() {
    isUrgent = !isUrgent;
    urgentToggle.classList.toggle('chat-urgent-toggle-active', isUrgent);
  });
  inputBar.appendChild(urgentToggle);

  var textareaWrap = document.createElement('div');
  textareaWrap.className = 'chat-textarea-wrap';

  var textarea = document.createElement('textarea');
  textarea.className = 'chat-input-textarea';
  textarea.placeholder = 'Type a message... (Enter to send, Shift+Enter for new line)';
  textarea.rows = 1;

  // Character count
  var charCount = document.createElement('div');
  charCount.className = 'chat-char-count hidden';
  charCount.id = 'chat-char-count';

  // Auto-resize and character count
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';

    // Character count
    var len = this.value.length;
    if (len > 500) {
      charCount.textContent = len + ' characters';
      charCount.classList.remove('hidden');
      if (len > 2000) {
        charCount.classList.add('chat-char-count-warn');
      } else {
        charCount.classList.remove('chat-char-count-warn');
      }
    } else {
      charCount.classList.add('hidden');
    }

    // Typing indicator
    _setTyping(chatId, true);
    if (_typingTimers[chatId]) clearTimeout(_typingTimers[chatId]);
    _typingTimers[chatId] = setTimeout(function() {
      _setTyping(chatId, false);
    }, 3000);
  });

  // Enter to send, Shift+Enter for newline
  textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      doSend();
    }
    // Keep Cmd/Ctrl+Enter as alternative send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      doSend();
    }
    // Escape clears reply
    if (e.key === 'Escape' && _replyingTo) {
      _replyingTo = null;
      _updateReplyPreview();
    }
  });

  textareaWrap.appendChild(textarea);
  textareaWrap.appendChild(charCount);
  inputBar.appendChild(textareaWrap);

  var sendBtn = document.createElement('button');
  sendBtn.className = 'btn btn-primary chat-send-btn';
  sendBtn.textContent = 'Send';
  sendBtn.addEventListener('click', doSend);
  inputBar.appendChild(sendBtn);

  panel.appendChild(inputBar);

  function doSend() {
    var text = textarea.value.trim();
    if (!text) return;
    var msgType = isUrgent ? 'urgent' : 'text';
    sendMessage(chatId, text, msgType);
    textarea.value = '';
    textarea.style.height = 'auto';
    charCount.classList.add('hidden');
    if (isUrgent) {
      isUrgent = false;
      urgentToggle.classList.remove('chat-urgent-toggle-active');
    }
    _replyingTo = null;
    _updateReplyPreview();
    _renderMessages(msgList, chatId, me.id);
    _renderPinnedMessages(pinnedSection, chatId, me.id);
    setTimeout(function() { msgList.scrollTop = msgList.scrollHeight; }, 50);
    // Update left panel preview
    var chatListEl = document.querySelector('.chat-list');
    if (chatListEl) _renderChatList(chatListEl, me.id);
  }

  function _updateReplyPreview() {
    var el = document.getElementById('chat-reply-preview');
    if (!el) return;
    if (_replyingTo) {
      el.innerHTML =
        '<div class="chat-reply-preview-inner">' +
          '<div class="chat-reply-preview-bar"></div>' +
          '<div class="chat-reply-preview-content">' +
            '<span class="chat-reply-preview-sender">' + esc(_replyingTo.senderName) + '</span>' +
            '<span class="chat-reply-preview-text">' + esc(_replyingTo.preview) + '</span>' +
          '</div>' +
          '<button class="chat-reply-preview-close" title="Cancel reply">&times;</button>' +
        '</div>';
      el.classList.remove('hidden');
      var closeBtn = el.querySelector('.chat-reply-preview-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          _replyingTo = null;
          _updateReplyPreview();
        });
      }
      textarea.focus();
    } else {
      el.classList.add('hidden');
      el.innerHTML = '';
    }
  }

  // Poll for typing indicator updates
  if (_chatPollInterval) clearInterval(_chatPollInterval);
  _chatPollInterval = setInterval(function() {
    var typingEl = document.getElementById('chat-typing-indicator');
    if (!typingEl) { clearInterval(_chatPollInterval); _chatPollInterval = null; return; }
    var typingUsers = _getTypingUsers(chatId, me.id);
    if (typingUsers.length > 0) {
      var text = typingUsers.length === 1
        ? typingUsers[0] + ' is typing'
        : typingUsers.join(', ') + ' are typing';
      typingEl.innerHTML = '<span class="chat-typing-text">' + esc(text) +
        '<span class="chat-typing-dots"><span>.</span><span>.</span><span>.</span></span></span>';
      typingEl.classList.add('chat-typing-visible');
    } else {
      typingEl.innerHTML = '';
      typingEl.classList.remove('chat-typing-visible');
    }
  }, 800);

  textarea.focus();
}

/* ---------- Pinned Messages Rendering ---------- */

function _renderPinnedMessages(container, chatId, meId) {
  container.innerHTML = '';
  var pinned = _getPinnedMessages(chatId);
  if (pinned.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  var header = document.createElement('div');
  header.className = 'chat-pinned-header';
  header.innerHTML = '<span class="chat-pinned-icon">\u{1F4CC}</span> <strong>Pinned Messages</strong> <span class="chat-pinned-count">(' + pinned.length + ')</span>';

  var toggle = document.createElement('button');
  toggle.className = 'chat-pinned-toggle';
  toggle.textContent = 'Show';
  var listVisible = false;
  toggle.addEventListener('click', function() {
    listVisible = !listVisible;
    toggle.textContent = listVisible ? 'Hide' : 'Show';
    listEl.classList.toggle('hidden', !listVisible);
  });
  header.appendChild(toggle);
  container.appendChild(header);

  var listEl = document.createElement('div');
  listEl.className = 'chat-pinned-list hidden';
  pinned.forEach(function(msg) {
    var item = document.createElement('div');
    item.className = 'chat-pinned-item';
    item.innerHTML =
      '<div class="chat-pinned-item-sender">' + esc(_senderName(msg.senderId)) + '</div>' +
      '<div class="chat-pinned-item-text">' + esc(msg.content.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content) + '</div>' +
      '<div class="chat-pinned-item-time">' + esc(_chatTimeAgo(msg.timestamp)) + '</div>';
    listEl.appendChild(item);
  });
  container.appendChild(listEl);
}

/* ---------- Message Rendering ---------- */

function _renderMessages(container, chatId, meId) {
  container.innerHTML = '';
  var messages = getChatMessages(chatId);
  var searchQ = _messageSearchQuery.toLowerCase().trim();

  // Filter messages by search if active
  if (searchQ) {
    messages = messages.filter(function(m) {
      return m.content && m.content.toLowerCase().indexOf(searchQ) !== -1;
    });
  }

  if (messages.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'chat-messages-empty';
    if (searchQ) {
      empty.innerHTML =
        '<div class="chat-no-results-icon">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '</div>' +
        '<div>No messages matching "' + esc(searchQ) + '"</div>';
    } else {
      empty.innerHTML =
        '<div class="chat-start-icon">' +
          '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>' +
          '</svg>' +
        '</div>' +
        '<div class="chat-start-text">Start the conversation</div>' +
        '<div class="chat-start-subtext">Send a message to begin</div>';
    }
    container.appendChild(empty);
    return;
  }

  var lastDate = '';

  messages.forEach(function(msg) {
    // Date separator
    var msgDate = new Date(msg.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (msgDate !== lastDate) {
      lastDate = msgDate;
      var dateSep = document.createElement('div');
      dateSep.className = 'chat-date-separator';
      dateSep.innerHTML = '<span>' + esc(msgDate) + '</span>';
      container.appendChild(dateSep);
    }

    // System message
    if (msg.type === 'system') {
      var sysEl = document.createElement('div');
      sysEl.className = 'chat-msg-system';
      sysEl.textContent = msg.content;
      container.appendChild(sysEl);
      return;
    }

    var isOwn = msg.senderId === meId;
    var wrapper = document.createElement('div');
    wrapper.className = 'chat-msg-wrapper' + (isOwn ? ' chat-msg-wrapper-own' : ' chat-msg-wrapper-other');
    wrapper.dataset.msgId = msg.id;

    // Reply quote (if this message is a reply)
    if (msg.replyToId && msg.replyToPreview) {
      var replyQuote = document.createElement('div');
      replyQuote.className = 'chat-msg-reply-quote';
      replyQuote.innerHTML =
        '<div class="chat-reply-quote-bar"></div>' +
        '<div class="chat-reply-quote-content">' +
          '<span class="chat-reply-quote-sender">' + esc(msg.replyToSender || 'Unknown') + '</span>' +
          '<span class="chat-reply-quote-text">' + esc(msg.replyToPreview) + '</span>' +
        '</div>';
      wrapper.appendChild(replyQuote);
    }

    var bubble = document.createElement('div');
    bubble.className = 'chat-msg' + (isOwn ? ' chat-msg-own' : ' chat-msg-other') + (msg.type === 'urgent' ? ' chat-msg-urgent' : '');
    if (msg.pinnedAt) bubble.className += ' chat-msg-pinned';

    if (!isOwn) {
      var avatar = document.createElement('div');
      avatar.className = 'chat-msg-avatar';
      avatar.textContent = _senderInitials(msg.senderId);
      bubble.appendChild(avatar);
    }

    var body = document.createElement('div');
    body.className = 'chat-msg-body';

    if (!isOwn) {
      var senderEl = document.createElement('div');
      senderEl.className = 'chat-msg-sender';
      senderEl.textContent = _senderName(msg.senderId);
      body.appendChild(senderEl);
    }

    if (msg.type === 'urgent') {
      var urgentLabel = document.createElement('span');
      urgentLabel.className = 'chat-msg-urgent-label';
      urgentLabel.textContent = 'URGENT';
      body.appendChild(urgentLabel);
    }

    // Pin icon if pinned
    if (msg.pinnedAt) {
      var pinIcon = document.createElement('span');
      pinIcon.className = 'chat-msg-pin-icon';
      pinIcon.title = 'Pinned message';
      pinIcon.textContent = '\u{1F4CC}';
      body.appendChild(pinIcon);
    }

    var contentEl = document.createElement('div');
    contentEl.className = 'chat-msg-content';
    contentEl.id = 'msg-content-' + msg.id;
    if (searchQ) {
      contentEl.innerHTML = _highlightText(msg.content, _messageSearchQuery);
    } else {
      contentEl.textContent = msg.content;
    }
    body.appendChild(contentEl);

    // Edited label
    if (msg.editedAt) {
      var editedLabel = document.createElement('span');
      editedLabel.className = 'chat-msg-edited';
      editedLabel.textContent = '(edited)';
      body.appendChild(editedLabel);
    }

    var timeEl = document.createElement('div');
    timeEl.className = 'chat-msg-time';
    timeEl.textContent = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    body.appendChild(timeEl);

    // Read receipts
    var receiptHTML = _readReceiptHTML(msg, meId);
    if (receiptHTML) {
      var receiptEl = document.createElement('div');
      receiptEl.innerHTML = receiptHTML;
      body.appendChild(receiptEl.firstChild);
    }

    bubble.appendChild(body);

    // Hover action buttons
    var hoverActions = document.createElement('div');
    hoverActions.className = 'chat-msg-hover-actions';

    // Reaction button
    var reactBtn = document.createElement('button');
    reactBtn.className = 'chat-msg-hover-btn';
    reactBtn.innerHTML = '\u{1F600}';
    reactBtn.title = 'React';
    reactBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _showReactionPicker(msg.id, reactBtn, chatId, meId, container);
    });
    hoverActions.appendChild(reactBtn);

    // Reply button
    var replyBtn = document.createElement('button');
    replyBtn.className = 'chat-msg-hover-btn';
    replyBtn.innerHTML = '\u21A9';
    replyBtn.title = 'Reply';
    replyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _replyingTo = {
        id: msg.id,
        senderName: _senderName(msg.senderId),
        preview: msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content,
      };
      // Update reply preview bar
      var replyEl = document.getElementById('chat-reply-preview');
      if (replyEl) {
        replyEl.innerHTML =
          '<div class="chat-reply-preview-inner">' +
            '<div class="chat-reply-preview-bar"></div>' +
            '<div class="chat-reply-preview-content">' +
              '<span class="chat-reply-preview-sender">' + esc(_replyingTo.senderName) + '</span>' +
              '<span class="chat-reply-preview-text">' + esc(_replyingTo.preview) + '</span>' +
            '</div>' +
            '<button class="chat-reply-preview-close" title="Cancel reply">&times;</button>' +
          '</div>';
        replyEl.classList.remove('hidden');
        var closeBtn = replyEl.querySelector('.chat-reply-preview-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            _replyingTo = null;
            replyEl.classList.add('hidden');
            replyEl.innerHTML = '';
          });
        }
      }
      var ta = document.querySelector('.chat-input-textarea');
      if (ta) ta.focus();
    });
    hoverActions.appendChild(replyBtn);

    // Pin button
    var pinBtn = document.createElement('button');
    pinBtn.className = 'chat-msg-hover-btn';
    pinBtn.innerHTML = msg.pinnedAt ? '\u274C' : '\u{1F4CC}';
    pinBtn.title = msg.pinnedAt ? 'Unpin' : 'Pin';
    pinBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _togglePinMessage(msg.id);
      _renderMessages(container, chatId, meId);
      var pinnedSection = document.getElementById('chat-pinned-section');
      if (pinnedSection) _renderPinnedMessages(pinnedSection, chatId, meId);
    });
    hoverActions.appendChild(pinBtn);

    // Edit button (only for own messages < 5 min old)
    if (_canEditMessage(msg)) {
      var editBtn = document.createElement('button');
      editBtn.className = 'chat-msg-hover-btn';
      editBtn.innerHTML = '\u270E';
      editBtn.title = 'Edit message';
      editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        _startInlineEdit(msg, container, chatId, meId);
      });
      hoverActions.appendChild(editBtn);
    }

    bubble.appendChild(hoverActions);
    wrapper.appendChild(bubble);

    // Reactions display
    if (msg.reactions && msg.reactions.length > 0) {
      var reactionsEl = document.createElement('div');
      reactionsEl.innerHTML = _reactionsHTML(msg);
      // Wire up reaction badge clicks to toggle
      reactionsEl.querySelectorAll('.chat-reaction-badge').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var mId = btn.dataset.msgId;
          var emoji = btn.dataset.emoji;
          _toggleReaction(mId, emoji);
          _renderMessages(container, chatId, meId);
        });
      });
      wrapper.appendChild(reactionsEl.firstChild);
    }

    container.appendChild(wrapper);
  });
}

/* ---------- Reaction Picker ---------- */

function _showReactionPicker(msgId, anchorEl, chatId, meId, container) {
  // Remove any existing picker
  var existing = document.querySelector('.chat-reaction-picker');
  if (existing) existing.remove();

  var picker = document.createElement('div');
  picker.className = 'chat-reaction-picker';

  _quickReactions.forEach(function(emoji) {
    var btn = document.createElement('button');
    btn.className = 'chat-reaction-picker-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      _toggleReaction(msgId, emoji);
      picker.remove();
      _renderMessages(container, chatId, meId);
    });
    picker.appendChild(btn);
  });

  // Position near the anchor
  anchorEl.parentElement.appendChild(picker);

  // Close on click outside
  var closeHandler = function(e) {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(function() {
    document.addEventListener('click', closeHandler);
  }, 10);
}

/* ---------- Inline Edit ---------- */

function _startInlineEdit(msg, container, chatId, meId) {
  var contentEl = document.getElementById('msg-content-' + msg.id);
  if (!contentEl) return;

  var origText = msg.content;
  var editArea = document.createElement('textarea');
  editArea.className = 'chat-inline-edit-textarea';
  editArea.value = origText;
  editArea.rows = 2;

  var editActions = document.createElement('div');
  editActions.className = 'chat-inline-edit-actions';

  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-sm';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', function() {
    var newText = editArea.value.trim();
    if (!newText) { showToast('Message cannot be empty', 'error'); return; }
    if (newText !== origText) {
      _editMessage(msg.id, newText);
      showToast('Message updated', 'success');
    }
    _renderMessages(container, chatId, meId);
  });

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary btn-sm';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function() {
    _renderMessages(container, chatId, meId);
  });

  editActions.appendChild(saveBtn);
  editActions.appendChild(cancelBtn);

  contentEl.innerHTML = '';
  contentEl.appendChild(editArea);
  contentEl.appendChild(editActions);
  editArea.focus();
  editArea.selectionStart = editArea.value.length;

  editArea.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      _renderMessages(container, chatId, meId);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    }
  });
}

/* ---------- New Chat Modal ---------- */

function openNewChatModal(prefill) {
  var me = getSessionUser();
  if (!me) return;

  prefill = prefill || {};
  var providers = getProviders().filter(function(p) { return p.id !== me.id; });
  var selectedParticipants = prefill.participants ? prefill.participants.filter(function(pid) { return pid !== me.id; }) : [];
  var chatType = prefill.type || 'direct';
  var linkedPatientId = prefill.patientId || '';

  var providerListHTML = providers.map(function(p) {
    var checked = selectedParticipants.indexOf(p.id) !== -1 ? ' checked' : '';
    return '<label class="chat-provider-option"><input type="checkbox" value="' + esc(p.id) + '"' + checked + '> ' +
      esc(p.firstName + ' ' + p.lastName) + (p.degree ? ', ' + esc(p.degree) : '') + ' <span class="chat-provider-specialty">(' + esc(p.specialty || 'General') + ')</span></label>';
  }).join('');

  var patients = getPatients();
  var patientOptionsHTML = '<option value="">-- Select Patient --</option>' +
    patients.map(function(p) {
      var sel = p.id === linkedPatientId ? ' selected' : '';
      return '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName) + ' (MRN: ' + esc(p.mrn || 'N/A') + ')</option>';
    }).join('');

  var bodyHTML =
    '<div class="chat-new-form">' +
      '<div class="form-group">' +
        '<label>Type</label>' +
        '<div class="chat-type-radios">' +
          '<label class="chat-type-radio"><input type="radio" name="chat-type" value="direct"' + (chatType === 'direct' ? ' checked' : '') + '> Direct Message</label>' +
          '<label class="chat-type-radio"><input type="radio" name="chat-type" value="group"' + (chatType === 'group' ? ' checked' : '') + '> Group Chat</label>' +
          '<label class="chat-type-radio"><input type="radio" name="chat-type" value="patient-linked"' + (chatType === 'patient-linked' ? ' checked' : '') + '> Patient-Linked</label>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Title <span class="text-muted">(optional for direct)</span></label>' +
        '<input type="text" id="chat-new-title" class="form-control" placeholder="Chat title..." value="' + esc(prefill.title || '') + '" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Participants</label>' +
        '<input type="text" id="chat-provider-search" class="form-control" placeholder="Search providers..." />' +
        '<div class="chat-provider-list" id="chat-provider-list">' + providerListHTML + '</div>' +
      '</div>' +
      '<div class="form-group' + (chatType !== 'patient-linked' ? ' hidden' : '') + '" id="chat-patient-group">' +
        '<label>Linked Patient</label>' +
        '<select id="chat-patient-select" class="form-control">' + patientOptionsHTML + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>First Message</label>' +
        '<textarea id="chat-first-message" class="form-control" rows="3" placeholder="Type your first message...">' + esc(prefill.message || '') + '</textarea>' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" id="chat-create-btn">Create Chat</button>';

  openModal({ title: 'New Secure Chat', bodyHTML: bodyHTML, footerHTML: footerHTML });

  // Wire type toggle to show/hide patient field
  document.querySelectorAll('input[name="chat-type"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      var patGroup = document.getElementById('chat-patient-group');
      if (patGroup) {
        patGroup.classList.toggle('hidden', this.value !== 'patient-linked');
      }
    });
  });

  // Provider search filter
  var provSearchInput = document.getElementById('chat-provider-search');
  if (provSearchInput) {
    provSearchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase().trim();
      document.querySelectorAll('.chat-provider-option').forEach(function(opt) {
        var text = opt.textContent.toLowerCase();
        opt.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }

  // Create button
  setTimeout(function() {
    var createBtn = document.getElementById('chat-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', function() {
        var type = document.querySelector('input[name="chat-type"]:checked').value;
        var title = (document.getElementById('chat-new-title').value || '').trim();
        var firstMessage = (document.getElementById('chat-first-message').value || '').trim();

        // Gather selected participants
        var parts = [me.id];
        document.querySelectorAll('#chat-provider-list input[type="checkbox"]:checked').forEach(function(cb) {
          if (parts.indexOf(cb.value) === -1) parts.push(cb.value);
        });

        if (parts.length < 2) {
          showToast('Please select at least one participant', 'error');
          return;
        }

        var patientId = null;
        if (type === 'patient-linked') {
          patientId = document.getElementById('chat-patient-select').value;
          if (!patientId) {
            showToast('Please select a patient for patient-linked chat', 'error');
            return;
          }
        }

        var chat = createChat({
          type: type,
          participants: parts,
          patientId: patientId,
          title: title,
          createdBy: me.id,
        });

        // Send system message
        sendMessage(chat.id, _senderName(me.id) + ' created this conversation', 'system');

        // Send first message if provided
        if (firstMessage) {
          sendMessage(chat.id, firstMessage, 'text');
        }

        closeModal();
        _activeChatId = chat.id;

        // If on the secure-chat page, refresh
        if (location.hash === '#secure-chat') {
          renderSecureChat();
        }

        showToast('Chat created', 'success');
      });
    }
  }, 60);
}

/* ---------- Floating Chat Panel (from chart) ---------- */

function openChatPanel(patientId) {
  // Remove existing panel if any
  closeChatPanel();

  var me = getSessionUser();
  if (!me) return;

  _chatPanelOpen = true;

  var panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.id = 'floating-chat-panel';

  // Header
  var hdr = document.createElement('div');
  hdr.className = 'chat-panel-header';

  var pat = getPatient(patientId);
  var patName = pat ? (pat.lastName + ', ' + pat.firstName) : 'Patient';

  var hdrTitle = document.createElement('div');
  hdrTitle.className = 'chat-panel-title';
  hdrTitle.textContent = 'Chat: ' + patName;
  hdr.appendChild(hdrTitle);

  var hdrBtns = document.createElement('div');
  hdrBtns.className = 'chat-panel-header-btns';

  var expandBtn = document.createElement('button');
  expandBtn.className = 'chat-panel-btn';
  expandBtn.textContent = 'Expand';
  expandBtn.title = 'Open full chat view';
  expandBtn.addEventListener('click', function() {
    closeChatPanel();
    navigate('#secure-chat');
  });
  hdrBtns.appendChild(expandBtn);

  var newBtn = document.createElement('button');
  newBtn.className = 'chat-panel-btn';
  newBtn.textContent = '+ New';
  newBtn.title = 'Start new chat about this patient';
  newBtn.addEventListener('click', function() {
    openNewChatModal({ type: 'patient-linked', patientId: patientId });
  });
  hdrBtns.appendChild(newBtn);

  var closeBtn = document.createElement('button');
  closeBtn.className = 'chat-panel-btn chat-panel-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.title = 'Close chat panel';
  closeBtn.addEventListener('click', function() { closeChatPanel(); });
  hdrBtns.appendChild(closeBtn);

  hdr.appendChild(hdrBtns);
  panel.appendChild(hdr);

  // Body — list of patient-linked chats
  var body = document.createElement('div');
  body.className = 'chat-panel-body';
  body.id = 'chat-panel-body';
  panel.appendChild(body);

  document.body.appendChild(panel);

  _renderPanelChatList(body, patientId, me.id);
}

function closeChatPanel() {
  _chatPanelOpen = false;
  var existing = document.getElementById('floating-chat-panel');
  if (existing) existing.remove();
}

function _renderPanelChatList(container, patientId, meId) {
  container.innerHTML = '';

  var chats = getPatientChats(patientId);

  if (chats.length === 0) {
    container.innerHTML =
      '<div class="chat-panel-empty">' +
        '<p>No chats for this patient yet.</p>' +
        '<button class="btn btn-primary btn-sm" id="chat-panel-start">Start Chat</button>' +
      '</div>';
    var startBtn = container.querySelector('#chat-panel-start');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        openNewChatModal({ type: 'patient-linked', patientId: patientId });
      });
    }
    return;
  }

  // Show list, click to open inline conversation
  chats.forEach(function(chat) {
    var item = document.createElement('div');
    item.className = 'chat-panel-list-item';

    var unread = (chat.unreadCount && chat.unreadCount[meId]) || 0;

    item.innerHTML =
      '<div class="chat-panel-item-top">' +
        '<span class="chat-panel-item-title">' + esc(_chatTitle(chat, meId)) + '</span>' +
        '<span class="chat-panel-item-time">' + esc(_chatTimeAgo(chat.lastMessageAt || chat.createdAt)) + '</span>' +
      '</div>' +
      '<div class="chat-panel-item-preview">' + esc(chat.lastMessagePreview || 'No messages') + '</div>' +
      (unread > 0 ? '<span class="chat-unread-badge chat-unread-badge-sm">' + unread + '</span>' : '');

    item.addEventListener('click', function() {
      _renderPanelConversation(container, chat.id, patientId, meId);
    });

    container.appendChild(item);
  });
}

function _renderPanelConversation(container, chatId, patientId, meId) {
  container.innerHTML = '';

  markChatRead(chatId, meId);
  _updateChatSidebarBadge();

  // Back button
  var backBtn = document.createElement('button');
  backBtn.className = 'chat-panel-back-btn';
  backBtn.innerHTML = '&larr; Back';
  backBtn.addEventListener('click', function() {
    _renderPanelChatList(container, patientId, meId);
  });
  container.appendChild(backBtn);

  // Messages
  var msgArea = document.createElement('div');
  msgArea.className = 'chat-panel-messages';
  container.appendChild(msgArea);

  _renderMessages(msgArea, chatId, meId);
  setTimeout(function() { msgArea.scrollTop = msgArea.scrollHeight; }, 50);

  // Input
  var inputBar = document.createElement('div');
  inputBar.className = 'chat-panel-input-bar';

  var textarea = document.createElement('textarea');
  textarea.className = 'chat-panel-input';
  textarea.placeholder = 'Message...';
  textarea.rows = 1;
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });
  textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      doSend();
    }
  });
  inputBar.appendChild(textarea);

  var sendBtn = document.createElement('button');
  sendBtn.className = 'btn btn-primary btn-sm chat-panel-send-btn';
  sendBtn.textContent = 'Send';
  sendBtn.addEventListener('click', doSend);
  inputBar.appendChild(sendBtn);

  container.appendChild(inputBar);

  function doSend() {
    var text = textarea.value.trim();
    if (!text) return;
    sendMessage(chatId, text, 'text');
    textarea.value = '';
    textarea.style.height = 'auto';
    _renderMessages(msgArea, chatId, meId);
    setTimeout(function() { msgArea.scrollTop = msgArea.scrollHeight; }, 50);
  }

  textarea.focus();
}

/* ---------- Badge & Notification ---------- */

function renderChatBadge() {
  var me = getSessionUser();
  if (!me) return '';
  var count = getUnreadCount(me.id);
  if (count <= 0) return '';
  return '<span class="nav-badge">' + count + '</span>';
}

function getChatNotificationHTML() {
  var me = getSessionUser();
  if (!me) return '';
  var count = getUnreadCount(me.id);
  if (count <= 0) return '<span class="chat-notification-quiet">No new messages</span>';

  // Show latest unread message preview
  var chats = getChats(me.id).filter(function(c) {
    return c.unreadCount && c.unreadCount[me.id] > 0;
  });
  if (chats.length > 0) {
    var latest = chats[0];
    var title = _chatTitle(latest, me.id);
    return '<span class="chat-notification-active">You have ' + count + ' unread message' + (count !== 1 ? 's' : '') +
      '</span><br><span class="chat-notification-preview"><strong>' + esc(title) + ':</strong> ' + esc(latest.lastMessagePreview || '') + '</span>';
  }
  return '<span class="chat-notification-active">You have ' + count + ' unread message' + (count !== 1 ? 's' : '') + '</span>';
}

function _updateChatSidebarBadge() {
  var el = document.getElementById('secure-chat-badge');
  if (!el) return;
  var me = getSessionUser();
  if (!me) return;
  var count = getUnreadCount(me.id);
  el.textContent = count > 0 ? count : '';
}

/* ---------- Inline CSS (injected once) ---------- */

(function _injectChatStyles() {
  if (document.getElementById('secure-chat-styles')) return;
  var style = document.createElement('style');
  style.id = 'secure-chat-styles';
  style.textContent = [

    /* Shell -- two-panel layout */
    '.chat-shell { display:flex; height:calc(100vh - var(--topbar-height, 52px) - 16px); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; background:var(--bg-surface); }',

    /* Left panel */
    '.chat-left-panel { width:340px; min-width:280px; border-right:1px solid var(--border); display:flex; flex-direction:column; background:var(--bg-base); }',
    '.chat-left-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; border-bottom:1px solid var(--border); }',
    '.chat-left-title { font-size:16px; font-weight:700; color:var(--text-primary); }',
    '.chat-search-wrap { padding:8px 12px; }',
    '.chat-search-input { width:100%; padding:7px 10px; border:1px solid var(--border); border-radius:var(--radius); font-size:13px; background:var(--bg-surface); color:var(--text-primary); }',
    '.chat-search-input:focus { outline:none; border-color:var(--border-focus); }',

    /* Tabs */
    '.chat-tab-bar { display:flex; border-bottom:1px solid var(--border); padding:0 12px; }',
    '.chat-tab { flex:1; padding:8px 4px; text-align:center; font-size:12px; font-weight:600; color:var(--text-muted); background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; transition:color 0.15s, border-color 0.15s; }',
    '.chat-tab:hover { color:var(--text-primary); }',
    '.chat-tab-active { color:var(--accent-blue); border-bottom-color:var(--accent-blue); }',

    /* Chat list */
    '.chat-list { flex:1; overflow-y:auto; }',
    '.chat-list-empty { padding:40px 20px; text-align:center; color:var(--text-muted); font-size:13px; }',
    '.chat-list-item { display:flex; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; position:relative; }',
    '.chat-list-item:hover { background:var(--accent-blue-light); }',
    '.chat-list-item-active { background:var(--accent-blue-light); border-left:3px solid var(--accent-blue); }',
    '.chat-list-item-content { flex:1; min-width:0; }',
    '.chat-list-item-top { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px; }',
    '.chat-list-item-title { font-size:13px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }',
    '.chat-list-item-time { font-size:11px; color:var(--text-muted); flex-shrink:0; margin-left:8px; }',
    '.chat-list-patient { font-size:11px; color:var(--accent-blue); margin-bottom:2px; }',
    '.chat-list-item-preview { font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.chat-list-item-preview-unread { color:var(--text-primary); font-weight:600; }',
    '.chat-type-icon { font-size:14px; margin-right:2px; }',

    /* Unread badge */
    '.chat-unread-badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; border-radius:10px; font-size:11px; font-weight:700; background:var(--accent-blue); color:#fff; flex-shrink:0; margin-left:8px; }',
    '.chat-unread-badge-sm { min-width:16px; height:16px; font-size:10px; padding:0 4px; }',

    /* Right panel -- empty/welcome state */
    '.chat-right-panel { flex:1; display:flex; flex-direction:column; background:var(--bg-surface); position:relative; }',
    '.chat-empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); }',
    '.chat-empty-icon { font-size:48px; margin-bottom:12px; opacity:0.4; }',
    '.chat-empty-title { font-size:16px; font-weight:600; margin-bottom:4px; }',
    '.chat-empty-subtitle { font-size:13px; }',

    /* Welcome state */
    '.chat-welcome-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; }',
    '.chat-welcome-icon { color:var(--accent-blue); opacity:0.6; margin-bottom:20px; }',
    '.chat-welcome-title { font-size:22px; font-weight:700; color:var(--text-primary); margin-bottom:6px; }',
    '.chat-welcome-subtitle { font-size:14px; color:var(--text-muted); margin-bottom:28px; }',
    '.chat-welcome-actions { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; justify-content:center; }',
    '.chat-welcome-btn { display:flex; align-items:center; gap:8px; padding:10px 20px; font-size:14px; }',
    '.chat-welcome-btn-icon { font-size:16px; font-weight:700; }',
    '.chat-welcome-hint { font-size:12px; color:var(--text-muted); }',

    /* Conversation header */
    '.chat-conv-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--border); background:var(--bg-base); }',
    '.chat-conv-header-info { min-width:0; flex:1; }',
    '.chat-conv-title { font-size:15px; font-weight:700; color:var(--text-primary); }',
    '.chat-conv-meta { font-size:12px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.chat-conv-header-btns { display:flex; gap:8px; align-items:center; flex-shrink:0; }',
    '.chat-header-search-btn { display:flex; align-items:center; gap:4px; }',

    /* Message search bar */
    '.chat-message-search-bar { border-bottom:1px solid var(--border); background:var(--bg-base); }',
    '.chat-message-search-bar.hidden { display:none; }',
    '.chat-message-search-inner { display:flex; align-items:center; gap:8px; padding:8px 20px; }',
    '.chat-message-search-icon { color:var(--text-muted); flex-shrink:0; }',
    '.chat-message-search-input { flex:1; padding:6px 10px; border:1px solid var(--border); border-radius:var(--radius); font-size:13px; background:var(--bg-surface); color:var(--text-primary); }',
    '.chat-message-search-input:focus { outline:none; border-color:var(--border-focus); }',
    '.chat-message-search-close { background:none; border:none; font-size:18px; color:var(--text-muted); cursor:pointer; padding:0 4px; line-height:1; }',
    '.chat-message-search-close:hover { color:var(--text-primary); }',
    '.chat-search-highlight { background:var(--warning-light, #fff3cd); padding:1px 2px; border-radius:2px; color:var(--text-primary); }',
    '.chat-no-results-icon { margin-bottom:8px; opacity:0.4; }',

    /* Pinned messages section */
    '.chat-pinned-section { border-bottom:1px solid var(--border); background:var(--bg-base); }',
    '.chat-pinned-section.hidden { display:none; }',
    '.chat-pinned-header { display:flex; align-items:center; gap:6px; padding:8px 20px; font-size:12px; color:var(--text-secondary); }',
    '.chat-pinned-icon { font-size:14px; }',
    '.chat-pinned-count { color:var(--text-muted); }',
    '.chat-pinned-toggle { margin-left:auto; background:none; border:none; color:var(--accent-blue); font-size:11px; font-weight:600; cursor:pointer; padding:2px 6px; }',
    '.chat-pinned-toggle:hover { text-decoration:underline; }',
    '.chat-pinned-list { padding:0 20px 8px; }',
    '.chat-pinned-list.hidden { display:none; }',
    '.chat-pinned-item { padding:6px 10px; margin-bottom:4px; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius); font-size:12px; }',
    '.chat-pinned-item-sender { font-weight:600; color:var(--text-primary); margin-bottom:2px; }',
    '.chat-pinned-item-text { color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.chat-pinned-item-time { font-size:10px; color:var(--text-muted); margin-top:2px; }',

    /* Messages area */
    '.chat-messages { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:4px; }',
    '.chat-messages-empty { text-align:center; color:var(--text-muted); font-size:13px; padding:40px 0; display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; }',
    '.chat-start-icon { margin-bottom:12px; opacity:0.35; color:var(--accent-blue); }',
    '.chat-start-text { font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:4px; }',
    '.chat-start-subtext { font-size:13px; color:var(--text-muted); }',

    /* Date separator */
    '.chat-date-separator { text-align:center; margin:16px 0 8px; position:relative; }',
    '.chat-date-separator::before { content:""; position:absolute; left:0; right:0; top:50%; border-top:1px solid var(--border); }',
    '.chat-date-separator span { position:relative; background:var(--bg-surface); padding:0 12px; font-size:11px; color:var(--text-muted); font-weight:600; }',

    /* Message wrapper */
    '.chat-msg-wrapper { position:relative; margin-bottom:2px; }',
    '.chat-msg-wrapper-own { display:flex; flex-direction:column; align-items:flex-end; }',
    '.chat-msg-wrapper-other { display:flex; flex-direction:column; align-items:flex-start; }',

    /* Message bubbles */
    '.chat-msg { display:flex; align-items:flex-end; gap:8px; max-width:75%; position:relative; }',
    '.chat-msg-own { flex-direction:row-reverse; }',
    '.chat-msg-other { }',
    '.chat-msg-avatar { width:28px; height:28px; border-radius:50%; background:var(--accent-blue); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }',
    '.chat-msg-body { padding:8px 12px; border-radius:12px; max-width:100%; position:relative; }',
    '.chat-msg-own .chat-msg-body { background:var(--accent-blue); color:#fff; border-bottom-right-radius:4px; }',
    '.chat-msg-other .chat-msg-body { background:var(--bg-base); color:var(--text-primary); border:1px solid var(--border); border-bottom-left-radius:4px; }',
    '.chat-msg-sender { font-size:11px; font-weight:700; margin-bottom:2px; opacity:0.85; }',
    '.chat-msg-own .chat-msg-sender { color:rgba(255,255,255,0.8); }',
    '.chat-msg-content { font-size:13px; line-height:1.45; white-space:pre-wrap; word-break:break-word; }',
    '.chat-msg-time { font-size:10px; margin-top:4px; opacity:0.6; }',
    '.chat-msg-own .chat-msg-time { text-align:right; }',
    '.chat-msg-pinned { }',
    '.chat-msg-pin-icon { font-size:10px; display:inline-block; margin-bottom:2px; }',

    /* Edited label */
    '.chat-msg-edited { font-size:10px; font-style:italic; opacity:0.6; margin-left:4px; }',

    /* Urgent messages */
    '.chat-msg-urgent .chat-msg-body { border:2px solid var(--danger); }',
    '.chat-msg-urgent.chat-msg-own .chat-msg-body { background:var(--danger); border-color:var(--danger); }',
    '.chat-msg-urgent-label { display:inline-block; font-size:9px; font-weight:800; letter-spacing:0.5px; padding:1px 5px; border-radius:3px; margin-bottom:4px; }',
    '.chat-msg-own .chat-msg-urgent-label { background:rgba(255,255,255,0.25); color:#fff; }',
    '.chat-msg-other .chat-msg-urgent-label { background:var(--danger-light); color:var(--danger); }',

    /* System messages */
    '.chat-msg-system { text-align:center; font-size:12px; color:var(--text-muted); font-style:italic; padding:8px 0; }',

    /* Read receipts */
    '.chat-read-receipt { font-size:10px; margin-top:2px; display:flex; align-items:center; gap:3px; opacity:0.7; }',
    '.chat-read-receipt-read { opacity:0.85; }',
    '.chat-check-single { font-size:11px; }',
    '.chat-check-double { font-size:11px; color:var(--accent-blue-light, #90caf9); letter-spacing:-3px; }',
    '.chat-msg-own .chat-check-double { color:rgba(255,255,255,0.85); }',
    '.chat-msg-own .chat-check-single { color:rgba(255,255,255,0.6); }',
    '.chat-receipt-text { font-size:9px; }',

    /* Reply quote */
    '.chat-msg-reply-quote { display:flex; align-items:stretch; gap:0; margin-bottom:4px; max-width:75%; padding-left:36px; }',
    '.chat-msg-wrapper-own .chat-msg-reply-quote { padding-left:0; padding-right:0; }',
    '.chat-reply-quote-bar { width:3px; background:var(--accent-blue); border-radius:2px; flex-shrink:0; }',
    '.chat-reply-quote-content { padding:4px 8px; font-size:11px; background:var(--bg-base); border-radius:0 4px 4px 0; border:1px solid var(--border); border-left:none; }',
    '.chat-reply-quote-sender { font-weight:700; color:var(--accent-blue); margin-right:6px; }',
    '.chat-reply-quote-text { color:var(--text-muted); }',

    /* Hover actions on messages */
    '.chat-msg-hover-actions { position:absolute; top:-8px; display:none; gap:2px; background:var(--bg-surface); border:1px solid var(--border); border-radius:6px; padding:2px; box-shadow:var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1)); z-index:10; }',
    '.chat-msg-own .chat-msg-hover-actions { right:0; }',
    '.chat-msg-other .chat-msg-hover-actions { left:36px; }',
    '.chat-msg:hover .chat-msg-hover-actions { display:flex; }',
    '.chat-msg-hover-btn { background:none; border:none; cursor:pointer; padding:3px 6px; font-size:14px; border-radius:4px; line-height:1; transition:background 0.1s; }',
    '.chat-msg-hover-btn:hover { background:var(--accent-blue-light); }',

    /* Reaction picker */
    '.chat-reaction-picker { position:absolute; bottom:100%; left:0; display:flex; gap:2px; background:var(--bg-surface); border:1px solid var(--border); border-radius:8px; padding:4px 6px; box-shadow:var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.15)); z-index:20; margin-bottom:4px; }',
    '.chat-reaction-picker-btn { background:none; border:none; cursor:pointer; padding:4px 6px; font-size:18px; border-radius:4px; transition:background 0.1s, transform 0.1s; }',
    '.chat-reaction-picker-btn:hover { background:var(--accent-blue-light); transform:scale(1.2); }',

    /* Reaction badges */
    '.chat-reactions { display:flex; flex-wrap:wrap; gap:4px; margin-top:2px; padding-left:36px; }',
    '.chat-msg-wrapper-own .chat-reactions { padding-left:0; justify-content:flex-end; }',
    '.chat-reaction-badge { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; border-radius:12px; font-size:12px; background:var(--bg-base); border:1px solid var(--border); cursor:pointer; transition:all 0.12s; }',
    '.chat-reaction-badge:hover { border-color:var(--accent-blue); background:var(--accent-blue-light); }',
    '.chat-reaction-mine { border-color:var(--accent-blue); background:var(--accent-blue-light); }',
    '.chat-reaction-count { font-size:11px; font-weight:600; color:var(--text-secondary); }',

    /* Reply preview bar above input */
    '.chat-reply-preview { border-top:1px solid var(--border); background:var(--bg-base); }',
    '.chat-reply-preview.hidden { display:none; }',
    '.chat-reply-preview-inner { display:flex; align-items:center; gap:0; padding:8px 20px; }',
    '.chat-reply-preview-bar { width:3px; height:32px; background:var(--accent-blue); border-radius:2px; flex-shrink:0; margin-right:10px; }',
    '.chat-reply-preview-content { flex:1; min-width:0; }',
    '.chat-reply-preview-sender { display:block; font-size:11px; font-weight:700; color:var(--accent-blue); }',
    '.chat-reply-preview-text { display:block; font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.chat-reply-preview-close { background:none; border:none; font-size:18px; color:var(--text-muted); cursor:pointer; padding:0 4px; line-height:1; flex-shrink:0; margin-left:8px; }',
    '.chat-reply-preview-close:hover { color:var(--text-primary); }',

    /* Typing indicator */
    '.chat-typing-indicator { padding:0 20px; min-height:0; overflow:hidden; transition:min-height 0.2s, padding 0.2s; }',
    '.chat-typing-visible { min-height:24px; padding:4px 20px; }',
    '.chat-typing-text { font-size:12px; color:var(--text-muted); font-style:italic; }',
    '.chat-typing-dots { display:inline-flex; margin-left:2px; }',
    '.chat-typing-dots span { animation:chatTypingDot 1.4s infinite; opacity:0.3; font-weight:700; }',
    '.chat-typing-dots span:nth-child(2) { animation-delay:0.2s; }',
    '.chat-typing-dots span:nth-child(3) { animation-delay:0.4s; }',
    '@keyframes chatTypingDot { 0%,60%,100%{opacity:0.3} 30%{opacity:1} }',

    /* New message indicator */
    '.chat-new-msg-indicator { position:absolute; bottom:80px; left:50%; transform:translateX(-50%); padding:6px 16px; background:var(--accent-blue); color:#fff; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; box-shadow:var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.15)); z-index:15; transition:opacity 0.2s, transform 0.2s; }',
    '.chat-new-msg-indicator.hidden { display:none; }',
    '.chat-new-msg-indicator:hover { transform:translateX(-50%) scale(1.05); }',

    /* Input bar */
    '.chat-input-bar { display:flex; align-items:flex-end; gap:8px; padding:12px 20px; border-top:1px solid var(--border); background:var(--bg-base); }',
    '.chat-textarea-wrap { flex:1; position:relative; }',
    '.chat-input-textarea { width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius); font-size:13px; font-family:inherit; resize:none; min-height:36px; max-height:120px; background:var(--bg-surface); color:var(--text-primary); box-sizing:border-box; }',
    '.chat-input-textarea:focus { outline:none; border-color:var(--border-focus); }',
    '.chat-send-btn { flex-shrink:0; height:36px; }',
    '.chat-urgent-toggle { padding:6px 10px; font-size:11px; font-weight:700; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg-surface); color:var(--text-muted); cursor:pointer; transition:all 0.15s; flex-shrink:0; }',
    '.chat-urgent-toggle:hover { border-color:var(--danger); color:var(--danger); }',
    '.chat-urgent-toggle-active { background:var(--danger); color:#fff; border-color:var(--danger); }',

    /* Attachment button */
    '.chat-attach-btn { width:36px; height:36px; border-radius:50%; border:1px solid var(--border); background:var(--bg-surface); color:var(--text-muted); font-size:20px; font-weight:400; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; line-height:1; }',
    '.chat-attach-btn:hover { border-color:var(--accent-blue); color:var(--accent-blue); background:var(--accent-blue-light); }',

    /* Character count */
    '.chat-char-count { position:absolute; bottom:-16px; right:4px; font-size:10px; color:var(--text-muted); }',
    '.chat-char-count.hidden { display:none; }',
    '.chat-char-count-warn { color:var(--danger); font-weight:600; }',

    /* Inline edit */
    '.chat-inline-edit-textarea { width:100%; padding:6px 8px; border:1px solid var(--border-focus); border-radius:var(--radius); font-size:13px; font-family:inherit; resize:none; background:var(--bg-surface); color:var(--text-primary); box-sizing:border-box; }',
    '.chat-inline-edit-actions { display:flex; gap:6px; margin-top:6px; }',

    /* New chat modal form */
    '.chat-new-form .form-group { margin-bottom:14px; }',
    '.chat-new-form label { display:block; font-size:13px; font-weight:600; margin-bottom:4px; color:var(--text-primary); }',
    '.chat-type-radios { display:flex; gap:16px; }',
    '.chat-type-radio { font-size:13px; cursor:pointer; display:flex; align-items:center; gap:4px; }',
    '.chat-type-radio input { margin:0; }',
    '.chat-provider-list { max-height:160px; overflow-y:auto; border:1px solid var(--border); border-radius:var(--radius); padding:6px 8px; margin-top:4px; }',
    '.chat-provider-option { display:flex; align-items:center; gap:6px; padding:4px 2px; font-size:13px; cursor:pointer; }',
    '.chat-provider-option:hover { background:var(--accent-blue-light); }',
    '.chat-provider-option input { margin:0; }',
    '.chat-provider-specialty { color:var(--text-muted); font-size:11px; }',

    /* ===== Floating Chat Panel ===== */
    '.chat-panel { position:fixed; bottom:20px; right:20px; width:360px; height:480px; background:var(--bg-surface); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-lg); z-index:5000; display:flex; flex-direction:column; overflow:hidden; }',
    '.chat-panel-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--accent-blue); color:#fff; flex-shrink:0; }',
    '.chat-panel-title { font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.chat-panel-header-btns { display:flex; gap:4px; flex-shrink:0; }',
    '.chat-panel-btn { padding:3px 8px; font-size:11px; font-weight:600; border:1px solid rgba(255,255,255,0.3); border-radius:4px; background:transparent; color:#fff; cursor:pointer; transition:background 0.12s; }',
    '.chat-panel-btn:hover { background:rgba(255,255,255,0.15); }',
    '.chat-panel-close-btn { font-size:16px; line-height:1; padding:2px 6px; }',

    '.chat-panel-body { flex:1; overflow-y:auto; display:flex; flex-direction:column; }',
    '.chat-panel-empty { padding:40px 20px; text-align:center; color:var(--text-muted); font-size:13px; }',
    '.chat-panel-empty p { margin-bottom:12px; }',

    '.chat-panel-list-item { padding:10px 14px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; position:relative; }',
    '.chat-panel-list-item:hover { background:var(--accent-blue-light); }',
    '.chat-panel-item-top { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px; }',
    '.chat-panel-item-title { font-size:12px; font-weight:600; color:var(--text-primary); }',
    '.chat-panel-item-time { font-size:10px; color:var(--text-muted); }',
    '.chat-panel-item-preview { font-size:11px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',

    '.chat-panel-back-btn { padding:6px 12px; font-size:12px; background:none; border:none; color:var(--accent-blue); cursor:pointer; font-weight:600; text-align:left; border-bottom:1px solid var(--border); }',
    '.chat-panel-back-btn:hover { background:var(--accent-blue-light); }',

    '.chat-panel-messages { flex:1; overflow-y:auto; padding:10px 12px; display:flex; flex-direction:column; gap:4px; }',
    '.chat-panel-messages .chat-msg { max-width:85%; }',
    '.chat-panel-messages .chat-msg-body { padding:6px 10px; }',
    '.chat-panel-messages .chat-msg-content { font-size:12px; }',
    '.chat-panel-messages .chat-msg-sender { font-size:10px; }',
    '.chat-panel-messages .chat-msg-time { font-size:9px; }',
    '.chat-panel-messages .chat-msg-avatar { width:24px; height:24px; font-size:10px; }',

    '.chat-panel-input-bar { display:flex; align-items:flex-end; gap:6px; padding:8px 12px; border-top:1px solid var(--border); background:var(--bg-base); }',
    '.chat-panel-input { flex:1; padding:6px 8px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px; font-family:inherit; resize:none; min-height:30px; max-height:80px; background:var(--bg-surface); color:var(--text-primary); }',
    '.chat-panel-input:focus { outline:none; border-color:var(--border-focus); }',
    '.chat-panel-send-btn { flex-shrink:0; }',

    /* Notification helpers */
    '.chat-notification-quiet { color:var(--text-muted); font-size:12px; }',
    '.chat-notification-active { color:var(--accent-blue); font-size:12px; font-weight:600; }',
    '.chat-notification-preview { font-size:11px; color:var(--text-secondary); }',

    /* Dark mode adjustments */
    '.dark-mode .chat-msg-other .chat-msg-body { background:var(--bg-sidebar); border-color:var(--border); color:var(--text-primary); }',
    '.dark-mode .chat-date-separator span { background:var(--bg-surface); }',
    '.dark-mode .chat-reply-quote-content { background:var(--bg-sidebar); }',
    '.dark-mode .chat-reaction-badge { background:var(--bg-sidebar); }',

    /* Responsive */
    '@media (max-width:768px) {',
    '  .chat-shell { flex-direction:column; height:auto; }',
    '  .chat-left-panel { width:100%; max-height:40vh; border-right:none; border-bottom:1px solid var(--border); }',
    '  .chat-panel { width:calc(100vw - 20px); right:10px; bottom:10px; height:60vh; }',
    '}',

  ].join('\n');
  document.head.appendChild(style);
})();
