document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display current username in header
    const user = JSON.parse(currentUser);
    const headerTitle = document.querySelector('.conversations-header h2');
    if (headerTitle) {
        headerTitle.textContent = `Vild - ${user.username}`;
    }
    
    // Check if elements exist before accessing them
    const conversationItems = document.querySelectorAll('.conversation-item');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    
    // Get current user from session
    function getCurrentUser() {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
    
    // Get current chat user
    function getCurrentChatUser() {
        const chatUser = sessionStorage.getItem('currentChatUser');
        return chatUser ? JSON.parse(chatUser) : null;
    }
    
    // Load messages from localStorage for current chat
    function loadMessages() {
        try {
            const currentUser = getCurrentUser();
            const chatUser = getCurrentChatUser();
            if (!currentUser || !chatUser) return;
            
            const chatMessages = document.querySelector('.chat-messages');
            const emptyState = chatMessages?.querySelector('.empty-chat-state');
            
            const storageKey = `chatMessages_${currentUser.username}_${chatUser.username}`;
            const savedMessages = localStorage.getItem(storageKey);
            
            if (savedMessages) {
                if (chatMessages) {
                    chatMessages.innerHTML = '<div class="date-divider">TODAY</div>' + savedMessages;
                    
                    // Re-attach voice message play handlers
                    chatMessages.querySelectorAll('.voice-play-btn').forEach(btn => {
                        const audioUrl = btn.dataset.audio;
                        if (audioUrl && audioUrl.startsWith('blob:')) {
                            // Blob URL expired, show message
                            btn.style.opacity = '0.5';
                            btn.title = 'Voice message expired (reload page to record new)';
                        }
                    });
                }
            } else {
                if (chatMessages) {
                    chatMessages.innerHTML = '<div class="date-divider">TODAY</div>';
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    
    // Save messages to localStorage for current chat
    function saveMessages() {
        try {
            const currentUser = getCurrentUser();
            const chatUser = getCurrentChatUser();
            if (!currentUser || !chatUser) return;
            
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                const messages = Array.from(chatMessages.querySelectorAll('.message'));
                const messagesHTML = messages.map(msg => msg.outerHTML).join('');
                
                // Save for current user (sender perspective)
                const storageKey1 = `chatMessages_${currentUser.username}_${chatUser.username}`;
                localStorage.setItem(storageKey1, messagesHTML);
                
                // Save for other user (receiver perspective) - swap sent/received classes
                const swappedHTML = messagesHTML
                    .replace(/class="message sent"/g, 'class="message received-temp"')
                    .replace(/class="message received"/g, 'class="message sent"')
                    .replace(/class="message received-temp"/g, 'class="message received"');
                
                const storageKey2 = `chatMessages_${chatUser.username}_${currentUser.username}`;
                localStorage.setItem(storageKey2, swappedHTML);
            }
        } catch (error) {
            console.error('Error saving messages:', error);
        }
    }
    
    // Load messages on page load
    let chatUser = getCurrentChatUser();
    
    // Check if chat user exists, if not clear it
    if (chatUser) {
        const currentUser = getCurrentUser();
        const storageKey = `chatMessages_${currentUser.username}_${chatUser.username}`;
        const hasMessages = localStorage.getItem(storageKey);
        
        // If no messages exist for this chat, clear the selection
        if (!hasMessages) {
            sessionStorage.removeItem('currentChatUser');
            chatUser = null;
        }
    }
    
    if (chatUser) {
        loadMessages();
        // Show chat header
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) chatHeader.style.display = 'flex';
    } else {
        // Clear chat if no user selected
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="empty-chat-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; text-align: center; padding: 40px;">
                    <img src="assets/icons/chat.svg" alt="Chat" style="width: 80px; height: 80px; margin-bottom: 20px; opacity: 0.5;">
                    <h3 style="font-size: 20px; margin-bottom: 10px; color: #666;">No chat selected</h3>
                    <p style="font-size: 14px;">Search for a user to start messaging</p>
                </div>
            `;
        }
        
        // Hide chat header
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) chatHeader.style.display = 'none';
        
        // Hide chat input if no chat selected
        const chatInput = document.querySelector('.chat-input');
        const voiceRecorder = document.getElementById('voiceRecorder');
        if (chatInput) chatInput.style.display = 'none';
        if (voiceRecorder) voiceRecorder.style.display = 'none';
    }
    
    // Load conversations list
    function loadConversations() {
        const conversationList = document.getElementById('conversationList');
        const currentUser = getCurrentUser();
        if (!conversationList || !currentUser) return;
        
        // Get all chat keys from localStorage
        const chats = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`chatMessages_${currentUser.username}_`)) {
                const otherUsername = key.replace(`chatMessages_${currentUser.username}_`, '');
                chats.push(otherUsername);
            }
        }
        
        if (chats.length === 0) {
            conversationList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No conversations yet. Search for users to start chatting!</div>';
            return;
        }
        
        conversationList.innerHTML = chats.map(username => `
            <div class="conversation-item" data-username="${username}">
                <div class="search-result-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: #0088cc; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px;">${username.charAt(0).toUpperCase()}</div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="name">${username}</span>
                        <span class="time">NOW</span>
                    </div>
                    <p class="preview">Click to open chat</p>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', function() {
                // Remove active from all
                document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                
                const username = this.dataset.username;
                
                // Show chat header
                const chatHeader = document.querySelector('.chat-header');
                if (chatHeader) chatHeader.style.display = 'flex';
                
                // Update chat header
                const chatUserDiv = chatHeader?.querySelector('.chat-user');
                if (chatUserDiv) {
                    chatUserDiv.innerHTML = `
                        <div class="search-result-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #0088cc; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${username.charAt(0).toUpperCase()}</div>
                        <div>
                            <h3>${username}</h3>
                            <span class="status">online</span>
                        </div>
                    `;
                }
                
                // Show chat input
                const chatInput = document.querySelector('.chat-input');
                if (chatInput) chatInput.style.display = 'flex';
                
                // Save current chat user
                sessionStorage.setItem('currentChatUser', JSON.stringify({
                    username: username,
                    userId: null
                }));
                
                // Load messages for this chat
                loadMessages();
            });
        });
    }
    
    loadConversations();
    
    // Auto-refresh messages every 2 seconds
    let lastMessageCount = 0;
    
    // Function to play notification sound
    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }
    
    setInterval(() => {
        const chatUser = getCurrentChatUser();
        if (!chatUser) return;
        
        const currentUser = getCurrentUser();
        const storageKey = `chatMessages_${currentUser.username}_${chatUser.username}`;
        const savedMessages = localStorage.getItem(storageKey);
        
        if (savedMessages) {
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                const currentMessages = chatMessages.querySelectorAll('.message').length;
                const parser = new DOMParser();
                const doc = parser.parseFromString(savedMessages, 'text/html');
                const savedMessageCount = doc.querySelectorAll('.message').length;
                
                // If message count changed, reload
                if (savedMessageCount !== currentMessages) {
                    const scrollAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;
                    
                    // Check if new message is received (not sent)
                    const newMessages = doc.querySelectorAll('.message');
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.classList.contains('received')) {
                        // Play sound only for received messages
                        if (savedMessageCount > lastMessageCount) {
                            playNotificationSound();
                        }
                    }
                    
                    lastMessageCount = savedMessageCount;
                    loadMessages();
                    
                    // Keep scroll at bottom if it was there
                    if (scrollAtBottom) {
                        setTimeout(() => {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }, 50);
                    }
                }
            }
        }
    }, 2000);
    
    // Auto-refresh conversations list every 3 seconds
    setInterval(() => {
        const conversationList = document.getElementById('conversationList');
        if (conversationList) {
            const currentCount = conversationList.querySelectorAll('.conversation-item').length;
            
            // Check if new chats appeared
            const currentUser = getCurrentUser();
            if (!currentUser) return;
            
            let chatsCount = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`chatMessages_${currentUser.username}_`)) {
                    chatsCount++;
                }
            }
            
            // Reload if count changed
            if (chatsCount !== currentCount) {
                loadConversations();
            }
        }
    }, 3000);
    
    // File upload
    const attachBtn = document.getElementById('attachBtn');
    const attachMenu = document.getElementById('attachMenu');
    const fileInput = document.getElementById('fileInput');
    const imageInput = document.getElementById('imageInput');
    const attachImage = document.getElementById('attachImage');
    const attachFile = document.getElementById('attachFile');
    
    attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        attachMenu.style.display = attachMenu.style.display === 'none' ? 'block' : 'none';
    });
    
    attachImage.addEventListener('click', () => {
        imageInput.click();
        attachMenu.style.display = 'none';
    });
    
    attachFile.addEventListener('click', () => {
        fileInput.click();
        attachMenu.style.display = 'none';
    });
    
    document.addEventListener('click', (e) => {
        if (!attachMenu.contains(e.target) && e.target !== attachBtn) {
            attachMenu.style.display = 'none';
        }
    });
    
    function handleFileUpload(file) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="image-message">
                            <img src="${event.target.result}" alt="${file.name}">
                        </div>
                        <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ✓</span>
                    </div>
                `;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                saveMessages();
            };
            reader.readAsDataURL(file);
        } else {
            const fileSize = file.size < 1024 * 1024 
                ? (file.size / 1024).toFixed(1) + ' KB'
                : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
            
            const fileExt = file.name.split('.').pop().toUpperCase();
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="file-message">
                        <div class="file-icon">${fileExt}</div>
                        <div class="file-info">
                            <div class="file-name">${file.name}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <button class="file-download">↓</button>
                    </div>
                    <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ✓</span>
                </div>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            saveMessages();
        }
    }
    
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => handleFileUpload(file));
        imageInput.value = '';
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => handleFileUpload(file));
        fileInput.value = '';
    });
    
    // Переключение темы
    if (themeToggle && themeIcon) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            this.classList.toggle('dark');
            
            if (document.body.classList.contains('dark-theme')) {
                themeIcon.src = 'assets/icons/moon.svg';
                localStorage.setItem('theme', 'dark');
                // Sync with profile theme button
                const profileIcon = document.querySelector('.theme-icon-profile');
                if (profileIcon) profileIcon.src = 'assets/icons/moon.svg';
            } else {
                themeIcon.src = 'assets/icons/sun.svg';
                localStorage.setItem('theme', 'light');
                // Sync with profile theme button
                const profileIcon = document.querySelector('.theme-icon-profile');
                if (profileIcon) profileIcon.src = 'assets/icons/sun.svg';
            }
        });
        
        // Загружаем сохраненную тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.classList.add('dark');
            themeIcon.src = 'assets/icons/moon.svg';
        }
    }
    
    // Theme toggle in profile
    const themeToggleProfile = document.getElementById('themeToggleProfile');
    const themeIconProfile = themeToggleProfile?.querySelector('.theme-icon-profile');
    
    if (themeToggleProfile && themeIconProfile) {
        themeToggleProfile.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            this.classList.toggle('dark');
            
            if (document.body.classList.contains('dark-theme')) {
                themeIconProfile.src = 'assets/icons/moon.svg';
                localStorage.setItem('theme', 'dark');
                // Sync with main theme button
                if (themeIcon) themeIcon.src = 'assets/icons/moon.svg';
            } else {
                themeIconProfile.src = 'assets/icons/sun.svg';
                localStorage.setItem('theme', 'light');
                // Sync with main theme button
                if (themeIcon) themeIcon.src = 'assets/icons/sun.svg';
            }
        });
        
        // Load saved theme for profile button
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            themeToggleProfile.classList.add('dark');
            themeIconProfile.src = 'assets/icons/moon.svg';
        }
    }
    
    // Переключение активного чата
    conversationItems.forEach(item => {
        item.addEventListener('click', function() {
            conversationItems.forEach(conv => conv.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // User search
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;
    
    console.log('Search initialized', { searchInput, searchResults });
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        console.log('Search input:', query);
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            console.log('Searching for:', query);
            try {
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                    credentials: 'same-origin'
                });
                
                console.log('Search response status:', response.status);
                
                if (!response.ok) {
                    if (response.status === 401) {
                        console.error('Not authenticated - redirecting to login');
                        window.location.href = 'login.html';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const users = await response.json();
                console.log('Search results:', users);
                
                if (users.length > 0) {
                    const html = users.map(user => `
                        <div class="search-result-item" data-user-id="${user.id}" data-username="${user.username}">
                            <div class="search-result-avatar">${user.username.charAt(0).toUpperCase()}</div>
                            <div class="search-result-info">
                                <div class="search-result-name">${user.username}</div>
                                <div class="search-result-status ${user.status}">${user.status}</div>
                            </div>
                        </div>
                    `).join('');
                    console.log('Setting HTML:', html);
                    searchResults.innerHTML = html;
                    searchResults.style.display = 'block';
                    console.log('Search results display:', searchResults.style.display);
                    console.log('Search results element:', searchResults);
                    
                    // Add click handlers
                    document.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', function() {
                            const username = this.dataset.username;
                            const userId = this.dataset.userId;
                            
                            // Show chat header
                            const chatHeader = document.querySelector('.chat-header');
                            if (chatHeader) chatHeader.style.display = 'flex';
                            
                            const chatUserDiv = chatHeader?.querySelector('.chat-user');
                            if (chatUserDiv) {
                                chatUserDiv.innerHTML = `
                                    <div class="search-result-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #0088cc; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${username.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3>${username}</h3>
                                        <span class="status">online</span>
                                    </div>
                                `;
                            }
                            // Show chat input
                            const chatInput = document.querySelector('.chat-input');
                            if (chatInput) chatInput.style.display = 'flex';
                            
                            // Clear chat messages
                            const chatMessages = document.querySelector('.chat-messages');
                            if (chatMessages) {
                                chatMessages.innerHTML = '<div class="date-divider">TODAY</div>';
                            }
                            
                            // Save current chat user
                            sessionStorage.setItem('currentChatUser', JSON.stringify({
                                username: username,
                                userId: userId
                            }));
                            
                            // Load messages for this chat
                            loadMessages();
                            
                            // Update conversations list
                            loadConversations();
                            
                            // Close search
                            searchResults.style.display = 'none';
                            searchInput.value = '';
                        });
                    });
                } else {
                    searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: #999;">No users found</div>';
                    searchResults.style.display = 'block';
                }
            } catch (error) {
                console.error('Search error:', error);
                searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: #ff3b30;">Search failed. Please try again.</div>';
                searchResults.style.display = 'block';
            }
        }, 300);
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Функция для подсветки текста
    function highlightText(element, searchTerm) {
        const originalText = element.getAttribute('data-original') || element.textContent;
        if (!element.getAttribute('data-original')) {
            element.setAttribute('data-original', originalText);
        }
        
        if (!searchTerm) {
            element.textContent = originalText;
            return;
        }
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = originalText.replace(regex, '<mark>$1</mark>');
        element.innerHTML = highlightedText;
    }
    
    // Emoji picker
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiGrid = document.getElementById('emojiGrid');
    const messageInput = document.getElementById('messageInput');
    
    const emojis = {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
        gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🦿', '🦵', '🦶'],
        animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
        food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧈', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽', '🥣', '🥡', '🥢', '🧂'],
        travel: ['✈️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🏎', '🏍', '🛵', '🦽', '🦼', '🛴', '🚲', '🛹', '🛼', '🚏', '🛣', '🛤', '🛢', '⛽', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳', '⛴', '🛥', '🚢', '✈️', '🛩', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰', '🚀', '🛸'],
        objects: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩']
    };
    
    let currentCategory = 'smileys';
    
    function renderEmojis(category) {
        emojiGrid.innerHTML = '';
        emojis[category].forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.addEventListener('click', () => {
                messageInput.value += emoji;
                messageInput.focus();
                checkSendButton();
            });
            emojiGrid.appendChild(emojiItem);
        });
    }
    
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('show');
        if (emojiPicker.classList.contains('show')) {
            renderEmojis(currentCategory);
        }
    });
    
    document.querySelectorAll('.emoji-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderEmojis(currentCategory);
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.classList.remove('show');
        }
    });
    
    // Voice recording
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceBtnIcon = document.getElementById('voiceBtnIcon');
    const voiceRecorder = document.getElementById('voiceRecorder');
    const chatInput = document.querySelector('.chat-input');
    const recordingTime = document.getElementById('recordingTime');
    const cancelRecording = document.getElementById('cancelRecording');
    const sendRecording = document.getElementById('sendRecording');
    
    let mediaRecorder;
    let audioChunks = [];
    let recordingInterval;
    let recordingSeconds = 0;
    let isRecording = false;
    
    // Toggle between voice and send button
    messageInput.addEventListener('input', () => {
        if (messageInput.value.trim().length > 0) {
            voiceBtnIcon.src = 'assets/icons/send.svg';
            voiceBtnIcon.alt = 'Send message';
            voiceBtn.classList.add('send-mode');
        } else {
            voiceBtnIcon.src = 'assets/icons/microphone.svg';
            voiceBtnIcon.alt = 'Voice message';
            voiceBtn.classList.remove('send-mode');
        }
    });
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const messageText = messageInput.value.trim();
            if (messageText) {
                // Trigger click on voice button (which acts as send button when in send-mode)
                voiceBtn.click();
            }
        }
    });
    
    // Check on emoji insert
    function checkSendButton() {
        if (messageInput.value.trim().length > 0) {
            voiceBtnIcon.src = 'assets/icons/send.svg';
            voiceBtnIcon.alt = 'Send message';
            voiceBtn.classList.add('send-mode');
        } else {
            voiceBtnIcon.src = 'assets/icons/microphone.svg';
            voiceBtnIcon.alt = 'Voice message';
            voiceBtn.classList.remove('send-mode');
        }
    }
    
    voiceBtn.addEventListener('click', async () => {
        // If in send mode, send text message
        if (voiceBtn.classList.contains('send-mode')) {
            const messageText = messageInput.value.trim();
            if (messageText) {
                const chatMessages = document.querySelector('.chat-messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message sent';
                
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <p>${messageText}</p>
                        <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ✓</span>
                    </div>
                `;
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                messageInput.value = '';
                voiceBtnIcon.src = 'assets/icons/microphone.svg';
                voiceBtn.classList.remove('send-mode');
                
                // Save messages
                saveMessages();
                loadConversations();
            }
            return;
        }
        
        // Otherwise, start voice recording
        if (isRecording) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            recordingSeconds = 0;
            isRecording = true;
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                clearInterval(recordingInterval);
                isRecording = false;
            };
            
            mediaRecorder.start();
            chatInput.style.display = 'none';
            voiceRecorder.style.display = 'flex';
            
            recordingInterval = setInterval(() => {
                recordingSeconds++;
                const minutes = Math.floor(recordingSeconds / 60);
                const seconds = recordingSeconds % 60;
                recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
            
        } catch (error) {
            alert('Microphone access denied');
        }
    });
    
    cancelRecording.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        audioChunks = [];
        chatInput.style.display = 'flex';
        voiceRecorder.style.display = 'none';
        recordingTime.textContent = '0:00';
    });
    
    sendRecording.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Add voice message to chat
                const chatMessages = document.querySelector('.chat-messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message sent';
                
                const duration = recordingTime.textContent;
                
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="voice-message">
                            <button class="voice-play-btn" data-audio="${audioUrl}"></button>
                            <div class="voice-waveform">
                                <span style="height: 8px"></span>
                                <span style="height: 16px"></span>
                                <span style="height: 12px"></span>
                                <span style="height: 20px"></span>
                                <span style="height: 10px"></span>
                                <span style="height: 18px"></span>
                                <span style="height: 14px"></span>
                                <span style="height: 16px"></span>
                            </div>
                            <span class="voice-duration">${duration}</span>
                        </div>
                        <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ✓</span>
                    </div>
                `;
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Reset UI
                chatInput.style.display = 'flex';
                voiceRecorder.style.display = 'none';
                recordingTime.textContent = '0:00';
                audioChunks = [];
                
                // Save messages
                saveMessages();
                
                // Add play functionality
                const playBtn = messageDiv.querySelector('.voice-play-btn');
                const audio = new Audio(audioUrl);
                
                playBtn.addEventListener('click', () => {
                    if (audio.paused) {
                        audio.play();
                        playBtn.style.background = '#ff4444';
                        playBtn.innerHTML = '⏸';
                    } else {
                        audio.pause();
                        playBtn.style.background = '#0088cc';
                        playBtn.innerHTML = '';
                    }
                });
                
                audio.onended = () => {
                    playBtn.style.background = '#0088cc';
                    playBtn.innerHTML = '';
                };
            };
        }
    });
    
    // Profile Settings
    const openProfileSettings = document.getElementById('openProfileSettings');
    const profileSettings = document.getElementById('profileSettings');
    const conversationsList = document.querySelector('.conversations');
    const backToChat = document.getElementById('backToChat');
    const profileAvatarInput = document.getElementById('profileAvatarInput');
    const profileAvatarPreview = document.getElementById('profileAvatarPreview');
    const profileSettingsForm = document.getElementById('profileSettingsForm');
    
    if (openProfileSettings) {
        openProfileSettings.addEventListener('click', () => {
            conversationsList.style.display = 'none';
            profileSettings.style.display = 'flex';
            
            // Load profile data for current user
            const currentUser = getCurrentUser();
            const storageKey = `profileData_${currentUser.username}`;
            const profileData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            
            document.getElementById('profileUsername').value = profileData.username || currentUser.username;
            document.getElementById('profileDisplayName').value = profileData.displayName || '';
            document.getElementById('profileBio').value = profileData.bio || '';
            document.getElementById('profileBirthdate').value = profileData.birthdate || '';
            
            if (profileData.avatar) {
                profileAvatarPreview.innerHTML = `<img src="${profileData.avatar}" alt="Avatar">`;
            } else {
                document.getElementById('profileAvatarInitial').textContent = currentUser.username.charAt(0).toUpperCase();
            }
        });
    }
    
    if (backToChat) {
        backToChat.addEventListener('click', () => {
            profileSettings.style.display = 'none';
            conversationsList.style.display = 'flex';
        });
    }
    
    if (profileAvatarInput) {
        profileAvatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    profileAvatarPreview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const alert = document.getElementById('profileAlert');
            const avatar = profileAvatarPreview.querySelector('img')?.src || '';
            const currentUser = getCurrentUser();
            
            const profileData = {
                username: document.getElementById('profileUsername').value,
                displayName: document.getElementById('profileDisplayName').value,
                bio: document.getElementById('profileBio').value,
                birthdate: document.getElementById('profileBirthdate').value,
                avatar: avatar
            };
            
            // Save profile data for current user
            const storageKey = `profileData_${currentUser.username}`;
            localStorage.setItem(storageKey, JSON.stringify(profileData));
            
            alert.className = 'alert success';
            alert.textContent = 'Profile updated successfully!';
            alert.style.display = 'block';
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 3000);
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentChatUser');
                window.location.href = 'login.html';
            }
        });
    }
});
