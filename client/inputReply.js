document.addEventListener("DOMContentLoaded", () => {
    const sendButton = document.querySelector('.chat-footer .send');
    const messageInput = document.querySelector('.chat-footer .iniInput .message-input');
    const chatHeader = document.querySelector('.chat-header p');
    const chatContent = document.querySelector('.chat-content');
    const mediaPlaceholder = document.querySelector('.chat-footer .media-placeholder');
    const mediaContainer = document.querySelector('.media-container');
    const replyBox = document.createElement("div");
    
    // Variabel global untuk chat saat ini
    let currentContactId = '6283895262500';  // ID kontak yang sedang aktif
    let isCurrentChatGroup = false;  
    let contactMap = {}; // Peta kontak nomor ke nama
    let activeAuthorMessage = null;
    let activeTextMessage = null;
    let hasQuotedMessage = false;
    let activeAuthorName = null;

    // Untuk Mengakomodasi File
    const fileInput = document.getElementById('file-input');
    let file = null;
    fileInput.addEventListener('change', () => {
        file = fileInput.files[0] || null;
    });    
    let mediaUrl = null;
    let mediaType = null;
    let hasMedia = false;

    // Ambil data kontak dari API
    fetch("http://localhost:3000/contact")
        .then((response) => response.json())
        .then((contactData) => {
            // Isi contactMap dengan data dari API
            contactData.data.forEach(contact => {
                contactMap[contact.name] = contact.phone; // Nomor telepon sebagai value, nama sebagai key
            });
        })
        .catch((error) => {
            console.error("Gagal mengambil data kontak:", error);
        });

    // Fungsi upload file ke server
    const uploadFile = (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return fetch('http://localhost:3000/file/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log("File uploaded successfully", data);
            return {
                mediaUrl: data.fileUrl,  // URL file yang diupload
                mediaType: file.type    // MIME type file yang diupload
            };
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            return null;
        });
    };

    // Buat reply box
    replyBox.classList.add("reply-box");
    replyBox.style.display = "none";
    replyBox.innerHTML = `
        <div class="reply-author"></div> 
        <div class="reply-message"></div>
        <span class="close-reply">&times;</span>
    `;
    document.querySelector(".chat-footer").before(replyBox);

    const replyElements = {
        replyAuthor: replyBox.querySelector(".reply-author"),
        replyMessage: replyBox.querySelector(".reply-message"),
        closeReplyButton: replyBox.querySelector(".close-reply"),
    };

    // Event untuk menutup reply box
    replyElements.closeReplyButton.addEventListener("click", () => {
        replyBox.style.display = "none";
        activeAuthorMessage = null;
        activeTextMessage = null;
        hasQuotedMessage = false;
    });

    // Fungsi untuk memperbarui detail kontak/chat
    const setChatDetails = (contactId, isGroup) => {
        chatHeader.textContent = contactId;  // Tampilkan nama kontak/chat aktif
        isCurrentChatGroup = isGroup;
        currentContactId = isCurrentChatGroup? `${contactMap[contactId]}@g.us`: `${contactMap[contactId]}@c.us`;
    };

    // Fungsi untuk memperbarui detail Quoted
    const setQuotedDetails = (author, message, isGroup) => {
        activeAuthorName = author;
        activeAuthorMessage = isGroup? `${contactMap[author]}@g.us`: `${contactMap[author]}@c.us`;
        activeTextMessage = message;
        hasQuotedMessage = true;
        isGroup = isGroup;
    };

    // Fungsi untuk menampilkan reply box
    const showReplyBox = () => {
        replyElements.replyAuthor.textContent = activeAuthorName;
        replyElements.replyMessage.textContent = activeTextMessage;
        replyBox.style.display = "flex";
    };

    // Fungsi untuk membuat menu klik kanan
    const createContextMenu = (x, y, onReplyClick) => {
        const contextMenu = document.createElement("div");
        contextMenu.classList.add("context-menu");
        contextMenu.style.top = `${y}px`;
        contextMenu.style.left = `${x}px`;

        const replyButton = document.createElement("button");
        replyButton.textContent = "Reply";
        replyButton.addEventListener("click", () => {
            onReplyClick();
            document.body.removeChild(contextMenu);
        });

        contextMenu.appendChild(replyButton);

        // Tambahkan menu ke DOM
        document.body.appendChild(contextMenu);

        // Hilangkan menu jika klik di luar
        document.addEventListener("click", () => {
            if (document.body.contains(contextMenu)) {
                document.body.removeChild(contextMenu);
            }
        }, { once: true });
    };

    // Event listener untuk klik kanan pada pesan
    chatContent.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const message = e.target.closest(".message");
        if (message) {
            const messageText = message.querySelector('.messageText')?.innerText || 'Unknown Message';
            const authorElement = message.querySelector('.message-author')?.innerText || chatHeader.textContent;
            const isFromMe = message.classList.contains("chat-self");
            const isGroup = message.classList.contains("message-author");
            const activeAuthor = isFromMe ? "You" : authorElement;

            // Buat menu klik kanan
            createContextMenu(e.pageX, e.pageY, () => {
                // Jika tombol Reply diklik
                setQuotedDetails(activeAuthor, messageText, isGroup);
                showReplyBox();
            });
        }
    });

    // Fungsi untuk membuat data pesan
    function createMessageData(contactId, messageBody, isGroup, hasQuotedMessage, activeAuthorMessage, activeTextMessage, hasMedia, mediaUrl, mediaType) {
        const messageId = isGroup ? `CHTG${String(Date.now()).slice(-10)}` : `CHT${String(Date.now()).slice(-10)}`;

        if (!isGroup) {
            return {
                _data: {
                    id: {
                        fromMe: true,
                        remote: `${contactId}`,
                        id: messageId,
                        _serialized: `true_${contactId}_${messageId}`
                    },
                    viewed: false,
                    body: messageBody,
                    type: 'chat',
                    t: Math.floor(Date.now() / 1000),
                    notifyName: 'r',
                    from: '6285174388804@c.us',
                    to: `${contactId}@c.us`,
                    ack: 2,
                    invis: false,
                    isNewMsg: true,
                    star: false,
                    kicNotified: false,
                    recvFresh: true,
                    isFromTemplate: false,
                    thumbnail: '',
                    mediaUrl: hasMedia? mediaUrl : "",
                    mediaType: hasMedia? mediaType : "",
                    quotedMsg: hasQuotedMessage? {
                        id: [
                            null
                        ],
                        rowId: 1000000074,
                        type: 'chat',
                        t: 1731204697,
                        from: `${activeAuthorMessage}`,
                        to: `${contactId}`,
                        local: true,
                        ack: 2,
                        mentionedJidList: [],
                        ephemeralDuration: 86400,
                        messageRangeIndex: "6283895262500-1614926919@g.us_2_76718b0c4",
                        disappearingModeTrigger: "chat_settings",
                        msgRowOpaqueData: {},
                        disappearingModeInitiator: "chat",
                        rcat: null,
                        star: false,
                        isMdHistoryMsg: false,
                        body: `${activeAuthorMessage} r >> ${activeTextMessage}`, // Menggunakan variabel global
                        pollOptions: [],
                        pollVotesSnapshot: [
                            null
                        ],
                        "viewMode": "VISIBLE"
                    } : {},
                    quotedStanzaID: "",
                    quotedParticipant: "",
                    mentionedJidList: [],
                    groupMentions: [],
                    labels: [],
                    links: []
                },
                id: {
                    fromMe: true,
                    remote: `${contactId}`,
                    id: messageId,
                    _serialized: `true_${contactId}_${messageId}`
                },
                ack: 2,
                hasMedia: hasMedia,
                body: messageBody,
                type: 'chat',
                timestamp: Math.floor(Date.now() / 1000),
                from: '6285174388804@c.us',
                to: `${contactId}`,
                deviceType: 'web',
                isStatus: false,
                isStarred: false,
                fromMe: true,
                hasQuotedMsg: hasQuotedMessage,
                hasReaction: false,
                mentionedIds: [],
                groupMentions: [],
                links: []
            };
        } else {
            return {
                _data: {
                    id: {
                        fromMe: true,
                        remote: `${contactId}`,
                        id: messageId,
                        participant: '6283895262500@c.us',
                        _serialized: `true_${contactId}_${messageId}_6285174388804@c.us`
                    },
                    viewed: false,
                    body: messageBody,
                    type: "chat",
                    t: Math.floor(Date.now() / 1000),
                    notifyName: "r",
                    from: '6285174388804@c.us',
                    to: `${contactId}`,
                    author: '6285174388804@c.us',
                    ack: 2,
                    invis: false,
                    isNewMsg: true,
                    star: false,
                    kicNotified: false,
                    recvFresh: true,
                    isFromTemplate: false,
                    thumbnail: "",
                    pollInvalidated: false,
                    isSentCagPollCreation: false,
                    latestEditMsgKey: null,
                    latestEditSenderTimestampMs: null,
                    mediaUrl: hasMedia? mediaUrl : "",
                    mediaType: hasMedia? mediaType : "",
                    quotedMsg: hasQuotedMessage? {
                        id: [
                            null
                        ],
                        rowId: 1000000074,
                        type: 'chat',
                        t: 1731204697,
                        from: `${activeAuthorMessage}@c.us`,
                        to: `${contactId}@c.us`,
                        local: true,
                        ack: 2,
                        mentionedJidList: [],
                        ephemeralDuration: 86400,
                        messageRangeIndex: "6283895262500-1614926919@g.us_2_76718b0c4",
                        disappearingModeTrigger: "chat_settings",
                        msgRowOpaqueData: {},
                        disappearingModeInitiator: "chat",
                        rcat: null,
                        star: false,
                        isMdHistoryMsg: false,
                        body: `${activeAuthorMessage} r >> ${activeTextMessage}`, // Menggunakan variabel global
                        pollOptions: [],
                        pollVotesSnapshot: [
                            null
                        ],
                        "viewMode": "VISIBLE"
                    } : {},
                    quotedStanzaID: "",
                    quotedParticipant: "",
                    mentionedJidList: [],
                    groupMentions: [],
                    isEventCanceled: false,
                    eventInvalidated: false,
                    isVcardOverMmsDocument: false,
                    labels: [],
                    hasReaction: false,
                    ephemeralDuration: 86400,
                    viewMode: "VISIBLE",
                    productHeaderImageRejected: false,
                    lastPlaybackProgress: 0,
                    isDynamicReplyButtonsMsg: false,
                    isCarouselCard: false,
                    parentMsgId: null,
                    isMdHistoryMsg: false,
                    stickerSentTs: 0,
                    isAvatar: false,
                    lastUpdateFromServerTs: 0,
                    invokedBotWid: null,
                    bizBotType: null,
                    botResponseTargetId: null,
                    botPluginType: null,
                    botPluginReferenceIndex: null,
                    botPluginSearchProvider: null,
                    botPluginSearchUrl: null,
                    botPluginSearchQuery: null,
                    botPluginMaybeParent: false,
                    botReelPluginThumbnailCdnUrl: null,
                    botMsgBodyType: null,
                    requiresDirectConnection: null,
                    bizContentPlaceholderType: null,
                    hostedBizEncStateMismatch: false,
                    senderOrRecipientAccountTypeHosted: false,
                    placeholderCreatedWhenAccountIsHosted: false,
                    links: []
                },
                id: {
                    fromMe: true,
                    remote: `${contactId}`,
                    id: messageId,
                    participant: '6283895262500@c.us',
                    _serialized: `true_${`${contactId}`}_${messageId}_6285174388804@c.us`
                },
                ack: 2,
                hasMedia: hasMedia,
                body: messageBody,
                type: "chat",
                timestamp: Math.floor(Date.now() / 1000),
                from: '6285174388804@c.us',
                to: `${contactId}`,
                author: '6285174388804@c.us',
                deviceType: "web",
                forwardingScore: 0,
                isStatus: false,
                isStarred: false,
                fromMe: true,
                hasQuotedMsg: hasQuotedMessage,
                vCards: [],
                mentionedIds: [],
                groupMentions: [],
                isGif: false,
                links: []
            };
        }
    }

    // Fungsi untuk mengirim pesan ke backend
    const sendMessage = () => {
        const messageBody = messageInput.value.trim();
        if (!file) {
            if (!messageBody) return;
        }
    
        // Validasi apakah currentContactId sudah diatur
        if (!currentContactId) {
            alert("Pilih kontak atau grup terlebih dahulu sebelum mengirim pesan.");
            return;
        }

        if (file) {
            uploadFile(file).then((uploadResponse) => {
                if (uploadResponse) {
                    hasMedia = true;
                    mediaUrl = `localhost:3000/file/${uploadResponse.filename}`;  // Dapatkan URL file
                    mediaType = uploadResponse.contentType;  // Dapatkan media type
                    console.log("File URL:", mediaUrl);

                    // Kirim pesan dengan atau tanpa file URL dan media type
                    const newMessage = createMessageData(
                        currentContactId,
                        messageBody,
                        isCurrentChatGroup,
                        hasQuotedMessage,
                        activeAuthorMessage,
                        activeTextMessage,
                        hasMedia,
                        mediaUrl,
                        mediaType
                    );
        
                    fetch('http://localhost:3000/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newMessage),
                    })
                    .then((response) => {
                        if (!response.ok) throw new Error('Network response was not ok');
                        return response.json();
                    })
                    .then((data) => {
                        console.log('Pesan terkirim:', data);
                        messageInput.value = '';
                        fileInput.value = ''; // Reset file input
                        replyBox.style.display = "none";
                        hasQuotedMessage = false;
                        hasMedia = false;
                    })
                    .catch((error) => {
                        console.error('Error mengirim pesan:', error);
                    });
                }
            });
        } else {
            // Kirim pesan dengan atau tanpa file URL dan media type
            const newMessage = createMessageData(
                currentContactId,
                messageBody,
                isCurrentChatGroup,
                hasQuotedMessage,
                activeAuthorMessage,
                activeTextMessage,
                false,
                mediaUrl,
                mediaType
            );
    
            fetch('http://localhost:3000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage),
            })
            .then((response) => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then((data) => {
                console.log('Pesan terkirim:', data);
                messageInput.value = '';
                fileInput.value = ''; // Reset file input
                replyBox.style.display = "none";
                hasQuotedMessage = false;
                hasMedia = false;
            })
            .catch((error) => {
                console.error('Error mengirim pesan:', error);
            });
        }
    };

    // Tambahkan event listener untuk tombol kirim
    sendButton.addEventListener('click', sendMessage);

    // Event listener untuk input pesan (Enter untuk kirim pesan)
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Fungsi untuk memperbarui daftar kontak yang dipilih (contoh)
    const updateContact = (contactId, isGroup) => {
        setChatDetails(contactId, isGroup);
    };
    
    // Contoh jika ada event untuk memilih kontak
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-item')) {
            const contactId = e.target.dataset.id;
            const isGroup = e.target.dataset.group === 'true';
    
            // Reset reply box setiap kali berpindah kontak
            replyBox.style.display = "none";
            activeAuthorMessage = null;
            activeTextMessage = null;
            hasQuotedMessage = false;

            // Reset media place holder setiap kali berpindah kontak
            mediaPlaceholder.style.display = "none";
            mediaContainer.style.display = "none";
            fileInput.value = '';
            mediaUrl = null;
            mediaType = null;
            hasMedia = false;

            // Menghapus teks input pesan
            messageInput.value = '';
    
            // Update detail kontak
            updateContact(contactId, isGroup);
    
            // Simpan ID kontak aktif di localStorage
            localStorage.setItem('activeContactId', contactId);
        }
    });
    
    // Cek jika ada kontak aktif yang disimpan di localStorage setelah halaman di-load ulang
    window.addEventListener('load', () => {
        const activeContactId = localStorage.getItem('activeContactId');
        if (activeContactId) {
            const activeContact = document.querySelector(`[data-id="${activeContactId}"]`);
            if (activeContact) {
                // Triggers the click behavior programmatically
                activeContact.click();
            }
        }
    });
});
