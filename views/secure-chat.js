/* ============================================================
   views/secure-chat.js — In-Context Secure Staff Chat
   ============================================================ */

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
  };

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

  return msg;
}

function markChatRead(chatId, providerId) {
  // Mark all messages as read
  var msgs = loadAll(KEYS.chatMessages);
  var changed = false;
  msgs.forEach(function(m) {
    if (m.chatId === chatId && m.readBy.indexOf(providerId) === -1) {
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

/* ---------- View: Full-page Secure Chat (#secure-chat) ---------- */

var _activeChatId = null;
var _chatFilterTab = 'all'; // 'all' | 'direct' | 'patient-linked'
var _chatSearchQuery = '';

function renderSecureChat() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var me = getSessionUser();
  if (!me) { navigate('#dashboard'); return; }

  setTopbar({ title: 'Secure Chat', meta: '', actions: '' });
  setActiveNav('secure-chat');

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

function _renderEmptyConversation(panel) {
  panel.innerHTML =
    '<div class="chat-empty-state">' +
      '<div class="chat-empty-icon">&#128172;</div>' +
      '<div class="chat-empty-title">Select a conversation</div>' +
      '<div class="chat-empty-subtitle">Choose from the list or start a new chat</div>' +
    '</div>';
}

function _openConversation(chatId) {
  var panel = document.getElementById('chat-right-panel');
  if (!panel) return;
  panel.innerHTML = '';

  var me = getSessionUser();
  if (!me) return;

  var chat = getChat(chatId);
  if (!chat) return;

  markChatRead(chatId, me.id);

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

  // Patient link button
  if (chat.patientId) {
    var patBtn = document.createElement('button');
    patBtn.className = 'btn btn-secondary btn-sm';
    patBtn.textContent = 'View Chart';
    patBtn.addEventListener('click', function() { navigate('#chart/' + chat.patientId); });
    header.appendChild(patBtn);
  }

  panel.appendChild(header);

  // ===== Message List =====
  var msgList = document.createElement('div');
  msgList.className = 'chat-messages';
  msgList.id = 'chat-messages-container';
  panel.appendChild(msgList);

  _renderMessages(msgList, chatId, me.id);

  // Scroll to bottom
  setTimeout(function() { msgList.scrollTop = msgList.scrollHeight; }, 50);

  // ===== Input Bar =====
  var inputBar = document.createElement('div');
  inputBar.className = 'chat-input-bar';

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

  var textarea = document.createElement('textarea');
  textarea.className = 'chat-input-textarea';
  textarea.placeholder = 'Type a message...';
  textarea.rows = 1;
  // Auto-resize
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  // Cmd+Enter to send
  textarea.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      doSend();
    }
  });
  inputBar.appendChild(textarea);

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
    if (isUrgent) {
      isUrgent = false;
      urgentToggle.classList.remove('chat-urgent-toggle-active');
    }
    _renderMessages(msgList, chatId, me.id);
    setTimeout(function() { msgList.scrollTop = msgList.scrollHeight; }, 50);
    // Update left panel preview
    var chatListEl = document.querySelector('.chat-list');
    if (chatListEl) _renderChatList(chatListEl, me.id);
  }

  textarea.focus();
}

function _renderMessages(container, chatId, meId) {
  container.innerHTML = '';
  var messages = getChatMessages(chatId);

  if (messages.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'chat-messages-empty';
    empty.textContent = 'No messages yet. Start the conversation!';
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
    var bubble = document.createElement('div');
    bubble.className = 'chat-msg' + (isOwn ? ' chat-msg-own' : ' chat-msg-other') + (msg.type === 'urgent' ? ' chat-msg-urgent' : '');

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

    var contentEl = document.createElement('div');
    contentEl.className = 'chat-msg-content';
    contentEl.textContent = msg.content;
    body.appendChild(contentEl);

    var timeEl = document.createElement('div');
    timeEl.className = 'chat-msg-time';
    timeEl.textContent = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    body.appendChild(timeEl);

    bubble.appendChild(body);
    container.appendChild(bubble);
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

var _chatPanelOpen = false;

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

    /* Shell — two-panel layout */
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

    /* Right panel — empty state */
    '.chat-right-panel { flex:1; display:flex; flex-direction:column; background:var(--bg-surface); }',
    '.chat-empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); }',
    '.chat-empty-icon { font-size:48px; margin-bottom:12px; opacity:0.4; }',
    '.chat-empty-title { font-size:16px; font-weight:600; margin-bottom:4px; }',
    '.chat-empty-subtitle { font-size:13px; }',

    /* Conversation header */
    '.chat-conv-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--border); background:var(--bg-base); }',
    '.chat-conv-header-info { min-width:0; }',
    '.chat-conv-title { font-size:15px; font-weight:700; color:var(--text-primary); }',
    '.chat-conv-meta { font-size:12px; color:var(--text-muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',

    /* Messages area */
    '.chat-messages { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:4px; }',
    '.chat-messages-empty { text-align:center; color:var(--text-muted); font-size:13px; padding:40px 0; }',

    /* Date separator */
    '.chat-date-separator { text-align:center; margin:16px 0 8px; position:relative; }',
    '.chat-date-separator::before { content:""; position:absolute; left:0; right:0; top:50%; border-top:1px solid var(--border); }',
    '.chat-date-separator span { position:relative; background:var(--bg-surface); padding:0 12px; font-size:11px; color:var(--text-muted); font-weight:600; }',

    /* Message bubbles */
    '.chat-msg { display:flex; align-items:flex-end; gap:8px; margin-bottom:2px; max-width:75%; }',
    '.chat-msg-own { align-self:flex-end; flex-direction:row-reverse; }',
    '.chat-msg-other { align-self:flex-start; }',
    '.chat-msg-avatar { width:28px; height:28px; border-radius:50%; background:var(--accent-blue); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }',
    '.chat-msg-body { padding:8px 12px; border-radius:12px; max-width:100%; }',
    '.chat-msg-own .chat-msg-body { background:var(--accent-blue); color:#fff; border-bottom-right-radius:4px; }',
    '.chat-msg-other .chat-msg-body { background:var(--bg-base); color:var(--text-primary); border:1px solid var(--border); border-bottom-left-radius:4px; }',
    '.chat-msg-sender { font-size:11px; font-weight:700; margin-bottom:2px; opacity:0.85; }',
    '.chat-msg-own .chat-msg-sender { color:rgba(255,255,255,0.8); }',
    '.chat-msg-content { font-size:13px; line-height:1.45; white-space:pre-wrap; word-break:break-word; }',
    '.chat-msg-time { font-size:10px; margin-top:4px; opacity:0.6; }',
    '.chat-msg-own .chat-msg-time { text-align:right; }',

    /* Urgent messages */
    '.chat-msg-urgent .chat-msg-body { border:2px solid var(--danger); }',
    '.chat-msg-urgent.chat-msg-own .chat-msg-body { background:var(--danger); border-color:var(--danger); }',
    '.chat-msg-urgent-label { display:inline-block; font-size:9px; font-weight:800; letter-spacing:0.5px; padding:1px 5px; border-radius:3px; margin-bottom:4px; }',
    '.chat-msg-own .chat-msg-urgent-label { background:rgba(255,255,255,0.25); color:#fff; }',
    '.chat-msg-other .chat-msg-urgent-label { background:var(--danger-light); color:var(--danger); }',

    /* System messages */
    '.chat-msg-system { text-align:center; font-size:12px; color:var(--text-muted); font-style:italic; padding:8px 0; }',

    /* Input bar */
    '.chat-input-bar { display:flex; align-items:flex-end; gap:8px; padding:12px 20px; border-top:1px solid var(--border); background:var(--bg-base); }',
    '.chat-input-textarea { flex:1; padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius); font-size:13px; font-family:inherit; resize:none; min-height:36px; max-height:120px; background:var(--bg-surface); color:var(--text-primary); }',
    '.chat-input-textarea:focus { outline:none; border-color:var(--border-focus); }',
    '.chat-send-btn { flex-shrink:0; height:36px; }',
    '.chat-urgent-toggle { padding:6px 10px; font-size:11px; font-weight:700; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg-surface); color:var(--text-muted); cursor:pointer; transition:all 0.15s; flex-shrink:0; }',
    '.chat-urgent-toggle:hover { border-color:var(--danger); color:var(--danger); }',
    '.chat-urgent-toggle-active { background:var(--danger); color:#fff; border-color:var(--danger); }',

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

    /* Responsive */
    '@media (max-width:768px) {',
    '  .chat-shell { flex-direction:column; height:auto; }',
    '  .chat-left-panel { width:100%; max-height:40vh; border-right:none; border-bottom:1px solid var(--border); }',
    '  .chat-panel { width:calc(100vw - 20px); right:10px; bottom:10px; height:60vh; }',
    '}',

  ].join('\n');
  document.head.appendChild(style);
})();
