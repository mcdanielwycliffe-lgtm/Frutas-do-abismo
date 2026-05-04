// ===== DATABASE SETUP =====
let db;
const dbName = 'MundimangaDB';
const stores = ['users', 'posts', 'comments', 'likes', 'messages', 'conversations'];

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                }
            });
        };
    });
}

// ===== STATE =====
let currentUser = null;
let currentChat = null;
const botNames = [
    'Taro Yamamoto', 'Sakura Tanaka', 'Kenji Nakamura', 'Yuki Sato',
    'Haruto Suzuki', 'Aiko Kobayashi', 'Riku Inoue', 'Hana Watanabe',
    'Takeshi Ito', 'Yuki Nakamura', 'Akira Matsumoto', 'Emiko Yamada'
];
const botAvatarColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#a29bfe', '#00b894', '#fdcb6e'
];

const animeTopics = [
    'One Piece Ã© Ã©pico!', 'Demon Slayer melhor anime 2024',
    'Jujutsu Kaisen season 2 foi incrÃ­vel', 'Naruto clÃ¡ssico demais',
    'Tokyo Ghoul underrated', 'Chainsaw Man que sÃ©rie!',
    'Attack on Titan final perfeito', 'Death Note Ã© obra prima',
    'Mob Psycho 100 profundo', 'Vinland Saga cinematogrÃ¡fico',
    'Spy x Family wholesome demais', 'Sousou no Frieren tÃ¡ bom demais',
    'Hunter x Hunter Ã© obra de arte', 'Steins;Gate mudou minha vida',
    'Evangelion Ã© revolucionÃ¡rio', 'Bleach tem os melhores personagens',
    'CÃ³digo Geass final Ã©pico demais', 'Fullmetal Alchemist perfeiÃ§Ã£o',
    'Tower of God manwha top demais', 'Solo Leveling Ã© viciante',
    'Jjk manga Ã© melhor que anime', 'One Punch Man underrated',
    'My Hero Academia volta forte', 'Toradora Ã© romance puro',
    'Nana manga me destruiu emocionalmente', 'Fruits Basket remake foi incrÃ­vel',
    'Anohana: a melhor histÃ³ria de amizade', 'Classroom of the Elite genial',
    'The Rising of Shield Hero Ã©pico', 'Sword Art Online criou o gÃªnero',
    'Overlord light novel melhor que anime', 'Re:Zero Ã© masterpiece de isekai',
    'Konosuba me fez rir demais', 'That Time I Got Reincarnated viciante',
    'Violet Evergarden obra de arte', 'A Silent Voice filme emocionante'
];

// ===== LOGIN =====
function entrar() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();

    if (!usuario || !senha) {
        alert('Preencha todos os campos');
        return;
    }

    currentUser = {
        id: usuario.toLowerCase(),
        nome: usuario,
        isBot: false,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('mundimanga_user', JSON.stringify(currentUser));
    
    // Desabilita redirecionamentos automÃ¡ticos
    window.skipAutoRedirect = true;
    
    // TransiÃ§Ã£o para home
    window.location.href = 'home.html';
}

function sair() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('mundimanga_user');
        currentUser = null;
        window.skipAutoRedirect = true;
        window.location.href = 'login.html';
    }
}

function verificarLogin() {
    // Flag para evitar redirecionamentos automÃ¡ticos logo apÃ³s transiÃ§Ã£o
    if (window.skipAutoRedirect) {
        window.skipAutoRedirect = false;
        initializeAppHome();
        return;
    }

    const saved = localStorage.getItem('mundimanga_user');
    const currentPage = window.location.pathname;
    
    // Se nÃ£o hÃ¡ usuÃ¡rio salvo e estÃ¡ na home, redireciona para login
    if (!saved && currentPage.indexOf('home.html') !== -1) {
        window.location.href = 'login.html';
        return;
    }
    
    // Se nÃ£o hÃ¡ usuÃ¡rio, nÃ£o faz nada (estÃ¡ na login)
    if (!saved) {
        return;
    }
    
    // Se hÃ¡ usuÃ¡rio
    currentUser = JSON.parse(saved);
    
    // Se estÃ¡ na login, redireciona para home
    if (currentPage.indexOf('login.html') !== -1) {
        window.location.href = 'home.html';
        return;
    }
    
    // Inicializa a app na home
    initializeAppHome();
}

function initializeAppHome() {
    const avatarElement = document.getElementById('currentUserAvatar');
    if (avatarElement && currentUser) {
        avatarElement.textContent = currentUser.nome[0].toUpperCase();
    }
    
    initDB().then(() => {
        initializeBots();
        loadPosts();
        updateTrending();
        
        // Bot actions every 30 seconds
        setInterval(() => {
            botAction();
        }, 30000);
    }).catch(err => {
        console.error('Erro ao inicializar app:', err);
    });
}

// ===== BOTS SYSTEM =====
async function initializeBots() {
    const tx = db.transaction(['users'], 'readwrite');
    const store = tx.objectStore('users');
    
    for (let i = 0; i < 8; i++) {
        const bot = {
            id: `bot_${i}`,
            nome: botNames[i],
            isBot: true,
            color: botAvatarColors[i],
            createdAt: new Date().toISOString()
        };
        store.put(bot);
    }
}

async function getBotRandomComment(postText) {
    const responses = [
        'Que top!',
        'Concordo demais!',
        'Muito bom mesmo',
        'Adorei sua opiniÃ£o',
        'Exatamente! ðŸ”¥',
        'Bem observado!',
        'Isso aÃ­!',
        'Perfeito!'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

async function botAction() {
    const posts = await getPosts();
    if (posts.length < 1) return;

    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
    const botId = `bot_${botNames.indexOf(randomBot)}`;

    const action = Math.random();
    
    if (action < 0.35) {
        // Like
        await addLike(randomPost.id, botId, true);
    } else if (action < 0.65) {
        // Comment
        const comment = await getBotRandomComment(randomPost.text);
        await addComment(randomPost.id, botId, comment);
    } else if (action < 0.85) {
        // Post com texto
        const topic = animeTopics[Math.floor(Math.random() * animeTopics.length)];
        await createPostDatabase(botId, topic, null, null);
    } else {
        // Post com imagem aleatÃ³ria
        const botPost = await createBotPostWithImage(botId);
    }

    loadPosts();
}

async function createBotPostWithImage(botId) {
    // URLs de imagens aleatÃ³rias de anime que funcionam
    const animeImages = [
        'https://via.placeholder.com/600x400/ff6b6b/ffffff?text=Anime+Moment',
        'https://via.placeholder.com/600x400/4ecdc4/ffffff?text=Manga+Art',
        'https://via.placeholder.com/600x400/45b7d1/ffffff?text=Best+Scene',
        'https://via.placeholder.com/600x400/f9ca24/333333?text=Fan+Art',
        'https://via.placeholder.com/600x400/6c5ce7/ffffff?text=Character+Design',
        'https://via.placeholder.com/600x400/a29bfe/ffffff?text=Studio+Ghibli',
        'https://via.placeholder.com/600x400/00b894/ffffff?text=Epic+Battle',
        'https://via.placeholder.com/600x400/fdcb6e/333333?text=Anime+Girl'
    ];

    const randomImageUrl = animeImages[Math.floor(Math.random() * animeImages.length)];
    const topic = animeTopics[Math.floor(Math.random() * animeTopics.length)];
    
    const mediaObj = {
        type: 'image',
        data: randomImageUrl,
        name: 'bot-post.jpg'
    };

    await createPostDatabase(botId, topic, mediaObj, null);
}

// ===== POST SYSTEM =====
function triggerImageUpload() {
    document.getElementById('imageInput').click();
}

function triggerVideoUpload() {
    document.getElementById('videoInput').click();
}

let attachedFiles = [];

function handleFileSelect(file, type) {
    if (!file) return;

    const maxSize = type === 'image' ? 20 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
        alert(`Arquivo muito grande. MÃ¡ximo ${type === 'image' ? '20MB' : '50MB'}`);
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        attachedFiles.push({
            type,
            data: e.target.result,
            name: file.name
        });
        renderAttachments();
    };
    reader.readAsDataURL(file);
}

function renderAttachments() {
    const container = document.getElementById('attachmentPreview');
    container.innerHTML = '';
    
    attachedFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-preview';
        
        if (file.type === 'image') {
            div.innerHTML = `<img src="${file.data}" alt="preview">`;
        } else {
            div.innerHTML = `<video src="${file.data}"></video>`;
        }
        
        const btn = document.createElement('button');
        btn.className = 'file-remove';
        btn.innerHTML = 'âœ•';
        btn.onclick = () => {
            attachedFiles.splice(index, 1);
            renderAttachments();
        };
        
        div.appendChild(btn);
        container.appendChild(div);
    });
}

function createPost() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content && attachedFiles.length === 0) {
        alert('Escreva algo ou adicione uma média');
        return;
    }

    createPostDatabase(currentUser.id, content, attachedFiles[0] || null, null).then(() => {
        document.getElementById('postContent').value = '';
        document.getElementById('charCount').textContent = '0';
        attachedFiles = [];
        renderAttachments();
        
        loadPosts();

        // Bot reactions
        setTimeout(() => botAction(), 1000);
        setTimeout(() => botAction(), 3000);
    });
}

async function createPostDatabase(userId, text, media, tags) {
    const post = {
        userId,
        text,
        media,
        tags,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        likedBy: []
    };

    return new Promise((resolve) => {
        const tx = db.transaction(['posts'], 'readwrite');
        const store = tx.objectStore('posts');
        const request = store.add(post);
        
        request.onsuccess = () => {
            post.id = request.result;
            resolve(post);
        };
    });
}

async function getPosts() {
    return new Promise((resolve) => {
        const tx = db.transaction(['posts'], 'readonly');
        const store = tx.objectStore('posts');
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result.reverse());
        };
    });
}

async function loadPosts() {
    const posts = await getPosts();
    const container = document.getElementById('postsContainer');
    
    // Limpar apenas posts que foram removidos, nÃ£o recarregar tudo
    const existingPosts = container.querySelectorAll('[data-post-id]');
    const existingIds = new Set(Array.from(existingPosts).map(el => el.dataset.postId));
    const newIds = new Set(posts.map(p => p.id.toString()));
    
    // Remover posts que jÃ¡ nÃ£o existem
    existingPosts.forEach(el => {
        if (!newIds.has(el.dataset.postId)) {
            el.remove();
        }
    });

    // Adicionar novos posts ou atualizar existentes
    for (const post of posts) {
        const postId = post.id.toString();
        const existingPost = container.querySelector(`[data-post-id="${postId}"]`);
        const user = await getUser(post.userId);
        
        if (existingPost) {
            // Atualizar apenas stats do post existente, sem recarregar vÃ­deo
            updatePostStats(existingPost, post);
        } else {
            // Adicionar novo post
            const postEl = createPostElement(post, user);
            container.appendChild(postEl);
        }
    }
}

function updatePostStats(postEl, post) {
    // Atualizar likes
    const likeBtn = postEl.querySelector('.btn-interact');
    const liked = post.likedBy.includes(currentUser.id);
    if (likeBtn) {
        likeBtn.classList.toggle('liked', liked);
        likeBtn.innerHTML = `${liked ? 'â¤ï¸' : 'ðŸ¤'} Curtir`;
    }
    
    // Atualizar contadores
    const stats = postEl.querySelector('.post-stats');
    if (stats) {
        stats.innerHTML = `
            <span class="stat">${post.likes} ${post.likes === 1 ? 'Curtida' : 'Curtidas'}</span>
            <span class="stat">${post.comments.length} ${post.comments.length === 1 ? 'ComentÃ¡rio' : 'ComentÃ¡rios'}</span>
        `;
    }
}

function createPostElement(post, user) {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.dataset.postId = post.id;
    
    const liked = post.likedBy.includes(currentUser.id);
    const avatar = user.isBot ? user.color : null;

    div.innerHTML = `
        <div class="post-header">
            <div class="post-author">
                <div class="avatar" style="${avatar ? `background: ${avatar}` : ''}">${user.nome[0].toUpperCase()}</div>
                <div class="post-meta">
                    <div class="post-name">
                        ${user.nome}
                        ${user.isBot ? '<span class="bot-indicator">ðŸ¤– Bot</span>' : ''}
                    </div>
                    <div class="post-username">@${user.id}</div>
                    <div class="post-time">${formatTime(post.createdAt)}</div>
                </div>
            </div>
            ${post.userId === currentUser.id ? `
                <button class="post-menu" onclick="openPostMenu(${post.id})">â‹®</button>
                <div class="dropdown-menu" id="menu-${post.id}">
                    <button class="dropdown-item danger" onclick="deletePost(${post.id})">ðŸ—‘ï¸ Excluir</button>
                </div>
            ` : ''}
        </div>
        
        <div class="post-content">
            ${post.text ? `<div class="post-text">${escapeHtml(post.text)}</div>` : ''}
            ${post.media ? (post.media.type === 'image' 
                ? `<img src="${post.media.data}" alt="post" class="post-media">`
                : `<video src="${post.media.data}" class="post-media" controls></video>`
            ) : ''}
        </div>
        
        <div class="post-stats">
            <span class="stat">${post.likes} ${post.likes === 1 ? 'Curtida' : 'Curtidas'}</span>
            <span class="stat">${post.comments.length} ${post.comments.length === 1 ? 'ComentÃ¡rio' : 'ComentÃ¡rios'}</span>
        </div>
        
        <div class="post-actions">
            <button class="btn-interact ${liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                ${liked ? 'â¤ï¸' : 'ðŸ¤'} Curtir
            </button>
            <button class="btn-interact" onclick="toggleComments(${post.id})">
                ðŸ’¬ Comentar
            </button>
            ${user.isBot ? '' : `
                <button class="btn-interact" onclick="startChat('${user.id}', '${user.nome}')">
                    ðŸ“© PV
                </button>
            `}
        </div>
        
        <div class="post-comments" id="comments-${post.id}">
            <div id="comments-list-${post.id}"></div>
            <div class="comment-input-box">
                <input type="text" class="comment-input" id="comment-input-${post.id}" placeholder="Comente...">
                <button class="btn-comment" onclick="addCommentFromInput(${post.id})">Enviar</button>
            </div>
        </div>
    `;

    // Render comments
    const commentsList = div.querySelector(`#comments-list-${post.id}`);
    post.comments.forEach(async (commentId) => {
        const comment = await getComment(commentId);
        const commentUser = await getUser(comment.userId);
        const commentEl = createCommentElement(comment, commentUser);
        commentsList.appendChild(commentEl);
    });

    return div;
}

function createCommentElement(comment, user) {
    const div = document.createElement('div');
    div.className = 'comment';
    
    const avatar = user.isBot ? user.color : null;
    
    div.innerHTML = `
        <div class="comment-avatar" style="${avatar ? `background: ${avatar}` : ''}">${user.nome[0].toUpperCase()}</div>
        <div class="comment-body">
            <div class="comment-header">
                <span class="comment-author">${user.nome} ${user.isBot ? 'ðŸ¤–' : ''}</span>
                <span class="comment-time">${formatTime(comment.createdAt)}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
    `;
    
    return div;
}

function openPostMenu(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    menu.classList.toggle('active');
}

async function deletePost(postId) {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    await new Promise((resolve) => {
        const tx = db.transaction(['posts'], 'readwrite');
        const store = tx.objectStore('posts');
        store.delete(postId);
        tx.oncomplete = resolve;
    });

    loadPosts();
}

async function toggleLike(postId) {
    const post = await getPost(postId);
    const liked = post.likedBy.includes(currentUser.id);

    if (liked) {
        post.likedBy = post.likedBy.filter(id => id !== currentUser.id);
        post.likes--;
    } else {
        post.likedBy.push(currentUser.id);
        post.likes++;
    }

    await updatePost(post);
    
    // Atualizar apenas visualmente sem recarregar
    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    if (postEl) {
        updatePostStats(postEl, post);
    }
}

function toggleComments(postId) {
    const comments = document.getElementById(`comments-${postId}`);
    comments.classList.toggle('active');
}

async function addCommentFromInput(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    
    if (!text) return;

    await addComment(postId, currentUser.id, text);
    input.value = '';
    
    // Recarregar apenas comentÃ¡rios deste post
    const post = await getPost(postId);
    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    
    if (postEl) {
        const commentsList = postEl.querySelector(`#comments-list-${postId}`);
        commentsList.innerHTML = '';
        
        for (const commentId of post.comments) {
            const comment = await getComment(commentId);
            const commentUser = await getUser(comment.userId);
            const commentEl = createCommentElement(comment, commentUser);
            commentsList.appendChild(commentEl);
        }
        
        // Atualizar contador de comentÃ¡rios
        updatePostStats(postEl, post);
    }

    // Bot may respond
    setTimeout(() => {
        if (Math.random() > 0.7) {
            botCommentOnPost(postId);
        }
    }, 1000);
}

async function botCommentOnPost(postId) {
    const post = await getPost(postId);
    const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
    const botId = `bot_${botNames.indexOf(randomBot)}`;
    
    const comment = await getBotRandomComment(post.text);
    await addComment(postId, botId, comment);
    
    // Atualizar apenas comentÃ¡rios deste post sem recarregar tudo
    const postEl = document.querySelector(`[data-post-id="${postId}"]`);
    if (postEl) {
        const updatedPost = await getPost(postId);
        const commentsList = postEl.querySelector(`#comments-list-${postId}`);
        commentsList.innerHTML = '';
        
        for (const commentId of updatedPost.comments) {
            const comm = await getComment(commentId);
            const commentUser = await getUser(comm.userId);
            const commentEl = createCommentElement(comm, commentUser);
            commentsList.appendChild(commentEl);
        }
        
        // Atualizar contador
        updatePostStats(postEl, updatedPost);
    }
}

async function addComment(postId, userId, text) {
    const comment = {
        postId,
        userId,
        text,
        createdAt: new Date().toISOString()
    };

    return new Promise((resolve) => {
        const tx = db.transaction(['comments'], 'readwrite');
        const store = tx.objectStore('comments');
        const request = store.add(comment);
        
        request.onsuccess = () => {
            comment.id = request.result;
            
            const postTx = db.transaction(['posts'], 'readwrite');
            const postStore = postTx.objectStore('posts');
            const getReq = postStore.get(postId);
            
            getReq.onsuccess = () => {
                const post = getReq.result;
                post.comments.push(comment.id);
                postStore.put(post);
                postTx.oncomplete = resolve;
            };
        };
    });
}

async function addLike(postId, userId, isBot) {
    const post = await getPost(postId);
    
    if (!post.likedBy.includes(userId)) {
        post.likedBy.push(userId);
        post.likes++;
        await updatePost(post);
    }
}

async function getPost(postId) {
    return new Promise((resolve) => {
        const tx = db.transaction(['posts'], 'readonly');
        const store = tx.objectStore('posts');
        const request = store.get(postId);
        request.onsuccess = () => resolve(request.result);
    });
}

async function updatePost(post) {
    return new Promise((resolve) => {
        const tx = db.transaction(['posts'], 'readwrite');
        const store = tx.objectStore('posts');
        store.put(post);
        tx.oncomplete = resolve;
    });
}

async function getComment(commentId) {
    return new Promise((resolve) => {
        const tx = db.transaction(['comments'], 'readonly');
        const store = tx.objectStore('comments');
        const request = store.get(commentId);
        request.onsuccess = () => resolve(request.result);
    });
}

async function getUser(userId) {
    return new Promise((resolve) => {
        const tx = db.transaction(['users'], 'readonly');
        const store = tx.objectStore('users');
        const request = store.get(userId);
        request.onsuccess = () => {
            let user = request.result;
            if (!user) {
                user = { id: userId, nome: userId.split('_')[1] || userId, isBot: false };
            }
            resolve(user);
        };
    });
}

// ===== MESSAGES SYSTEM =====
function startChat(userId, userName) {
    currentChat = { userId, userName };
    document.getElementById('chatPartnerName').textContent = userName;
    document.getElementById('messageWindow').classList.add('active');
    loadMessages(userId);
}

function closeMessageWindow() {
    currentChat = null;
    document.getElementById('messageWindow').classList.remove('active');
}

async function loadMessages(userId) {
    const list = document.getElementById('messagesList');
    list.innerHTML = '';

    const convKey = [currentUser.id, userId].sort().join('_');
    const tx = db.transaction(['messages'], 'readonly');
    const store = tx.objectStore('messages');
    const request = store.getAll();

    request.onsuccess = () => {
        const messages = request.result
            .filter(m => m.conversation === convKey)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.from === currentUser.id ? 'sent' : 'received'}`;
            
            const user = msg.from === currentUser.id ? currentUser.nome : currentChat.userName;
            const avatar = (user[0] || 'U').toUpperCase();
            
            div.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-bubble">${escapeHtml(msg.text)}</div>
            `;
            
            list.appendChild(div);
        });

        list.scrollTop = list.scrollHeight;
    };
}

function sendMessage() {
    if (!currentChat) return;

    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text) return;

    const message = {
        from: currentUser.id,
        to: currentChat.userId,
        conversation: [currentUser.id, currentChat.userId].sort().join('_'),
        text,
        createdAt: new Date().toISOString(),
        read: false
    };

    new Promise((resolve) => {
        const tx = db.transaction(['messages'], 'readwrite');
        const store = tx.objectStore('messages');
        store.add(message);
        tx.oncomplete = resolve;
    }).then(() => {
        input.value = '';
        loadMessages(currentChat.userId);

        // Bot response
        setTimeout(() => {
            if (botNames.includes(currentChat.userName)) {
                botReplyMessage();
            }
        }, 1000);
    });
}

async function botReplyMessage() {
    const botResponses = [
        'Desculpe, nÃ£o posso conversar em privado.',
        'NÃ£o desejo interaÃ§Ã£o privada no momento.',
        'Sou um bot, nÃ£o posso manter conversas privadas.',
        'Prefiro nÃ£o responder mensagens privadas.',
        'Infelizmente nÃ£o consigo conversar aqui.'
    ];

    const reply = botResponses[Math.floor(Math.random() * botResponses.length)];

    const message = {
        from: currentChat.userId,
        to: currentUser.id,
        conversation: [currentUser.id, currentChat.userId].sort().join('_'),
        text: reply,
        createdAt: new Date().toISOString(),
        read: false
    };

    await new Promise((resolve) => {
        const tx = db.transaction(['messages'], 'readwrite');
        const store = tx.objectStore('messages');
        store.add(message);
        tx.oncomplete = resolve;
    });

    loadMessages(currentChat.userId);
}

function toggleMessages() {
    document.getElementById('messagesModal').classList.add('active');
    loadConversations();
}

async function loadConversations() {
    const list = document.getElementById('conversationList');
    list.innerHTML = '';

    const tx = db.transaction(['messages'], 'readonly');
    const store = tx.objectStore('messages');
    const request = store.getAll();

    request.onsuccess = () => {
        const conversations = {};
        
        request.result.forEach(msg => {
            const otherUser = msg.from === currentUser.id ? msg.to : msg.from;
            if (!conversations[otherUser]) {
                conversations[otherUser] = [];
            }
            conversations[otherUser].push(msg);
        });

        Object.entries(conversations).forEach(async ([userId, msgs]) => {
            const lastMsg = msgs[msgs.length - 1];
            const user = await getUser(userId);

            const div = document.createElement('div');
            div.className = 'conversation-item';
            div.onclick = () => startChat(userId, user.nome);

            div.innerHTML = `
                <div class="avatar" style="width: 40px; height: 40px; ${user.isBot ? `background: ${user.color}` : ''}">${user.nome[0].toUpperCase()}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${user.nome}</div>
                    <div class="conversation-preview">${escapeHtml(lastMsg.text.substring(0, 40))}</div>
                </div>
            `;

            list.appendChild(div);
        });
    };
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== TRENDING =====
async function updateTrending() {
    const container = document.getElementById('trendingContainer');
    const tags = ['anime', 'manga', 'review', 'discussao'];

    container.innerHTML = tags.map(tag => `
        <div class="trending-item" onclick="filterByTag('${tag}')">
            <div class="trending-tag">#${tag}</div>
            <div class="trending-count">~${Math.floor(Math.random() * 1000) + 100} posts</div>
        </div>
    `).join('');
}

// ===== UTILITIES =====
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('pt-BR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showFeed() {
    document.getElementById('mainFeed').style.display = 'flex';
}

function showExplore() {
    alert('Explore em construÃ§Ã£o');
}

function showProfile() {
    alert('Perfil: ' + currentUser.nome);
}

function showMessages() {
    toggleMessages();
}

function filterByTag(tag) {
    alert('Filtro por ' + tag + ' em construÃ§Ã£o');
}

function toggleNotifications() {
    alert('NotificaÃ§Ãµes em construÃ§Ã£o');
}

// Event listeners setup
if (document.getElementById('imageInput')) {
    document.getElementById('imageInput').addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0], 'image');
    });
}

if (document.getElementById('videoInput')) {
    document.getElementById('videoInput').addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0], 'video');
    });
}

if (document.getElementById('postContent')) {
    document.getElementById('postContent').addEventListener('input', (e) => {
        if (document.getElementById('charCount')) {
            document.getElementById('charCount').textContent = e.target.value.length;
        }
    });
}

if (document.getElementById('messageInput')) {
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Keyboard enter for comment
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('comment-input')) {
        const postId = parseInt(e.target.id.split('-')[2]);
        addCommentFromInput(postId);
    }
});

// Executar verificaÃ§Ã£o de login na home.html
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Verifica se estamos na pÃ¡gina home (tem mainFeed e appContainer)
        if (document.getElementById('mainFeed') && document.getElementById('appContainer')) {
            verificarLogin();
        }
    });
} else {
    // Se DOM jÃ¡ carregou antes
    if (document.getElementById('mainFeed') && document.getElementById('appContainer')) {
        verificarLogin();
    }
}
