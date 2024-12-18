// Fetch data chat dan kontak secara bersamaan
Promise.all([
    fetch("http://localhost:3000/chat").then((response) => response.json()), // Chat data
    fetch("http://localhost:3000/contact").then((response) => response.json()) // Contacts data
])
    .then(([data, contactData]) => {
        // Elemen-elemen utama pada halaman
        const chatList = document.getElementById("chat-list"); // Sidebar daftar kontak
        const chat = document.getElementById("chat"); // Jendela obrolan
        const chatHeader = document.querySelector('.chat-header p'); // Header untuk nama kontak

        // Peta kontak (map) nomor telepon ke nama kontak
        const contactMap = {};
        contactData.data.forEach(contact => {
            contactMap[contact.phone] = contact.name; // Nomor telepon sebagai key, nama sebagai value
        });

        // Fungsi untuk membersihkan ID (menghapus @c.us, @g.us)
        const cleanId = (id) => id.replace(/@c.us|@g.us/g, '');

        // Fungsi untuk menampilkan isi chat
        const loadChatMessages = (messages, contactName, isGroup) => {
            chatHeader.textContent = contactName; // Perbarui nama kontak di header
            chat.innerHTML = ''; // Kosongkan jendela obrolan

            let lastDate = null; // Variable untuk melacak tanggal terakhir yang ditampilkan

            messages.forEach(chatItem => {
                // Membuat elemen pesan
                const message = document.createElement("div");
                message.classList.add("message");
                chatItem.fromMe ? message.classList.add("chat-self") : message.classList.add("chat-other");

                // Tampilkan nama pengirim untuk pesan grup
                if (isGroup && !chatItem.fromMe && chatItem.author) {
                    const authorElement = document.createElement("p");
                    authorElement.classList.add("message-author");
                    authorElement.innerText = contactMap[cleanId(chatItem.author)];
                    message.appendChild(authorElement);
                }

                // Konten pesan
                const messageText = document.createElement("p");
                messageText.classList.add("messageText");
                messageText.innerText = chatItem.body;

                // Menangani pesan balasan (reply)
                let hasReply = chatItem.hasQuotedMsg;
                if (hasReply) {
                    const replyBox = document.createElement("div");
                    const replyBoxSource = document.createElement("p");
                    replyBoxSource.innerText = contactMap[cleanId(chatItem._data.quotedMsg.from)]; // Sumber pesan balasan
                    const replyBoxContent = document.createElement("p");
                    replyBoxContent.innerText = chatItem._data.quotedMsg.body.split(">> ")[1]; // Isi pesan balasan
                    replyBox.classList.add("reply-box");
                    replyBoxSource.classList.add("reply-box-source");
                    replyBoxContent.classList.add("reply-box-content");
                    replyBox.appendChild(replyBoxSource);
                    replyBox.appendChild(replyBoxContent);
                    message.appendChild(replyBox);
                }

                // Menangani pesan dengan media (gambar dan video)
                if (chatItem.hasMedia) {
                    let mediaElement;
                    if (chatItem._data.mediaType === 'image') {
                        mediaElement = document.createElement('img');
                        mediaElement.src = chatItem._data.mediaUrl;
                        mediaElement.alt = 'Media Attachment';
                        mediaElement.classList.add('media-thumbnail');
                    } else if (chatItem._data.mediaType === 'video') {
                        mediaElement = document.createElement('video');
                        mediaElement.src = chatItem._data.mediaUrl;
                        mediaElement.alt = 'Media Attachment';
                        mediaElement.controls = false;
                        mediaElement.classList.add('media-thumbnail');
                    }
                    message.appendChild(mediaElement);
                }

                // Konversi timestamp ke format waktu lokal (WIB)
                const date = new Date(chatItem.timestamp * 1000);
                const localHours = (date.getUTCHours() + 7) % 24;
                const localMinutes = date.getUTCMinutes();
                const year = date.getUTCFullYear().toString().slice(-2);
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                const timeString = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;

                // Hitung Today dan Yesterday
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);

                // Periksa apakah tanggal pesan adalah Today, Yesterday, atau tanggal lainnya
                let dateString;
                if (date.toDateString() === today.toDateString()) {
                    dateString = "Today";
                } else if (date.toDateString() === yesterday.toDateString()) {
                    dateString = "Yesterday";
                } else {
                    dateString = `${day}/${month}/${year}`;
                }

                // Menambahkan elemen header untuk tanggal baru
                if (lastDate !== dateString) {
                    lastDate = dateString;
                    const dateContainer = document.createElement("div");
                    dateContainer.classList.add("date-container");
                    const dateHeader = document.createElement("div");
                    dateHeader.classList.add("message-date-header");
                    dateHeader.innerText = dateString;
                    dateContainer.appendChild(dateHeader);
                    chat.appendChild(dateContainer);
                }

                // Footer untuk timestamp dan read receipt
                const messageFooter = document.createElement("div");
                messageFooter.classList.add("messageFooter");

                const timeElement = document.createElement("span");
                timeElement.classList.add("timestamp");
                timeElement.innerText = timeString;
                messageFooter.appendChild(timeElement);

                // Tampilkan tanda centang jika pesan dari pengguna
                if (chatItem.fromMe) {
                    const readReceipt = document.createElement("span");
                    readReceipt.classList.add("readReceipt");
                    if (chatItem.ack === 0) {
                        readReceipt.classList.add("clock");
                    } else if (chatItem.ack === 1) {
                        readReceipt.innerText = "✓";
                        readReceipt.style.color = "lightgrey";
                    } else if (chatItem.ack === 2) {
                        readReceipt.innerText = "✓✓";
                        readReceipt.style.color = "lightgrey";
                    } else if (chatItem.ack === 3) {
                        readReceipt.innerText = "✓✓";
                        readReceipt.style.color = "#34B7F1";
                    }
                    messageFooter.appendChild(readReceipt);
                }

                // Gabungkan semua elemen ke dalam pesan
                message.appendChild(messageText);
                message.appendChild(messageFooter);
                chat.appendChild(message);
            });
        };

        // Kosongkan daftar chat di sidebar
        chatList.innerHTML = '';
        const groupedChats = {};  // Objek untuk mengelompokkan pesan berdasarkan kontak

        // Memproses data pesan menjadi grup kontak
        data.data.forEach(chatItem => {
            const contact = chatItem.fromMe ? chatItem.to : chatItem.from;
            const cleanContact = contactMap[cleanId(contact)];
            const isGroup = contact.includes('@g.us');

            if (!groupedChats[cleanContact]) {
                groupedChats[cleanContact] = {
                    notifyName: chatItem.notifyName || cleanContact,
                    isGroup: isGroup,
                    messages: []
                };
            }
            groupedChats[cleanContact].messages.push(chatItem);
        });

        // Fungsi untuk memuat daftar kontak ke sidebar
        function loadContacts(searchData, loadFirstData) {
            let allChatItems = document.getElementsByClassName("chat-list");
            allChatItems[0].innerHTML = '';
            Object.keys(groupedChats).forEach((contact, index) => {
                const chatItem = groupedChats[contact];
                if (chatItem.notifyName.includes(searchData) || searchData == undefined) {
                    const chatDiv = document.createElement("div");
                    chatDiv.classList.add("chat-item");
                    chatDiv.dataset.id = chatItem.notifyName; // Tambahkan data-id dengan chatName
                    chatDiv.dataset.group = true;
                    const avatar = document.createElement("img");
                    avatar.src = "https://via.placeholder.com/30";
                    avatar.alt = "Chat Avatar";
                    const chatDetails = document.createElement("div");
                    chatDetails.classList.add("chat-details");
                    const chatName = document.createElement("p");
                    chatName.textContent = chatItem.notifyName;
                    const lastMessage = document.createElement("span");
                    lastMessage.textContent = chatItem.messages[chatItem.messages.length - 1].body;
                    chatDetails.appendChild(chatName);
                    chatDetails.appendChild(lastMessage);
                    chatDiv.appendChild(avatar);
                    chatDiv.appendChild(chatDetails);
                    chatList.appendChild(chatDiv);

                    // Klik kontak untuk menampilkan chat
                    chatList.addEventListener("click", (e) => {
                        const chatDiv = e.target.closest('.chat-item');
                        if (chatDiv) {
                            const contactId = chatDiv.dataset.id;
                            const isGroup = chatDiv.dataset.group === "true";
                            loadChatMessages(groupedChats[contactId].messages, contactId, isGroup);
                        }
                    });
                    
                    // Tampilkan chat pertama secara default
                    if (index === 0 && loadFirstData) {
                        loadChatMessages(chatItem.messages, chatItem.notifyName, chatItem.isGroup);
                    }
                }
            });
        }

        // Muat semua kontak secara default
        loadContacts(undefined, true);

        var searchbar = document.getElementsByClassName("search-bar")[0].children[0];
        searchbar.addEventListener("input", () => {
            if (searchbar.value == "") {
                loadContacts();
            } else {
                loadContacts(searchbar.value);
            }
        });
        
    })
    .catch((error) => console.error("Error:", error))
    .finally(() => {
        console.log("Data loaded successfully");
    });