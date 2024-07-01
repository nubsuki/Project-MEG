import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, getDoc, addDoc, doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot, serverTimestamp, limit, writeBatch, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyBua35RMPI5GlO9riLYNYN8R2NwOTzjY0Y",
  authDomain: "porject-meg.firebaseapp.com",
  projectId: "porject-meg",
  storageBucket: "porject-meg.appspot.com",
  messagingSenderId: "787863360422",
  appId: "1:787863360422:web:60923e03fe9d59e9e2f567"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage(app);



// newsfeed


// To display news

// Reference to the container where cards will be inserted
const cardContainer = document.querySelector('.card-container');
const loadingScreen = document.getElementById('loading');

// Function to create a card
function createCard(doc) {
  const data = doc.data();
  const card = document.createElement('div');
  card.classList.add('card');

  card.innerHTML = `
    <img src="${data.imageUrl}">
    <div class="card-content">
      <p>${data.category}</p>
      <h1>${data.title}</h1>
      <p>${data.description}</p>
      <a href="${data.link}" class="card-button"><i class="bi bi-cursor"></i> Details</a>
      ${isAdmin ? `<a class="card-button delete-button" data-id="${doc.id}" data-image-url="${data.imageUrl}">Delete</a>` : ''}
    </div>
  `;

  return card;
}

// Function to fetch and display data
async function displayNews() {
  try {
    const querySnapshot = await getDocs(collection(db, 'news'));
    cardContainer.innerHTML = ''; // Clear the container first
    querySnapshot.forEach((doc) => {
      const card = createCard(doc);
      cardContainer.appendChild(card);

    });
  } catch (error) {
    console.error("Error fetching news: ", error);
  }
}

// Call the function to display news
window.onload = async function () {
  await displayNews(); // Fetch and display news
  loadingScreen.style.display = 'none'; // Hide loading screen
  setTimeout(() => {
    loadingScreen.parentNode.removeChild(loadingScreen);
  }, 500);

};


// To delete news

// Event listener for delete button clicks
cardContainer.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-button')) {
    e.preventDefault(); // Prevent the default anchor behavior
    const newsId = e.target.dataset.id; // Get the news ID from the button's dataset
    const imageUrl = e.target.dataset.imageUrl; // Assuming you store image URL in data attribute

    try {
      // Delete image from storage
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      // Delete news document from Firestore
      await deleteNewsFromFirestore(newsId);
      e.target.closest('.card').remove(); // Remove the card from UI
      showAlert('News deleted successfully!');
    } catch (error) {
      console.error("Error deleting news: ", error);
      showAlert('Failed to delete news. Please try again later.');
    }
  }
});

// Function to delete news document from Firestore
async function deleteNewsFromFirestore(newsId) {
  try {
    await deleteDoc(doc(db, 'news', newsId));
  } catch (error) {
    throw error;
  }
}

// Global variable to store admin status
let isAdmin = false;

auth.onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in. Fetch user data from Firestore
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData.role === 'admin') {
          isAdmin = true;
        } else {
          // If user is not admin, hide the nfadd container
        }
        displayNews();
      } else {
        console.log("No such document!");
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
  }
});


//chatroom
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendButton');
  const chatWindow = document.querySelector('.chat-window');
  let chatroom = 'General';
  let lastDisplayedIndex = -1;
  const chatLimit = 12;
  const currentUserID = localStorage.getItem('loggedInUserId');
  let currentUserRole = '';
  let gotUserID = '';
  let unsubscribe = null;

  const getUserInfo = async () => {
    try {
        const user = currentUserID;
        const userDocRef = doc(db, 'users', user);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
            currentUserRole = userDocSnapshot.data().role;
            gotUserID = userDocSnapshot.data().uid;
        } else {
            console.error('User not found');
            currentUserRole = null;
            gotUserID = null;
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
        currentUserRole = null;
        gotUserID = null;
    }
};


getUserInfo();



const loadchatroom = async (selectedchatroom) => {
  chatroom = selectedchatroom;
  lastDisplayedIndex = -1;

  const N = await getindex();
  console.log('Last index in db:', N); // Debug-checking the value

  if (N === undefined) {
      console.error('N is undefined'); // Function-display if N is null
      return;
  }

  chatWindow.innerHTML = '';

  // Unsubscribe from previous listener if exists
  if (unsubscribe) {
      unsubscribe();
  }

  const MQ = query(collection(db, chatroom), orderBy('timestamp', 'asc'));
  console.log('MQ:', MQ); // Debug-checking the query

  unsubscribe = onSnapshot(MQ, async (snapshot) => {
      const messagePromises = snapshot.docChanges().map(async (change) => {
          const message = change.doc.data();
          if (change.type === 'added' && message.index > lastDisplayedIndex) {
              const userDocRef = doc(db, 'users', message.userID);
              const userDocSnapshot = await getDoc(userDocRef);
              const username = userDocSnapshot.exists() ? userDocSnapshot.data().username : 'Unknown User';
              return { type: 'added', message, username, userID: message.userID };
          }
          if (change.type === 'removed') {
              return { type: 'removed', messageIndex: message.index };
          }
          return null;
      });

      const messagesWithUsernames = await Promise.all(messagePromises);

      messagesWithUsernames.forEach((item) => {
          if (item) {
              if (item.type === 'added') {
                  const { message, username, userID } = item;
                  const messageElement = document.createElement('div');
                  messageElement.className = 'message';
                  messageElement.setAttribute('data-index', message.index); // Add index to msg

                  const textContainer = document.createElement('div');
                  textContainer.className = 'text-container';

                  const usernameElement = document.createElement('div');
                  usernameElement.className = 'username';
                  usernameElement.textContent = username;
                  usernameElement.addEventListener('click', () => {
                      window.location.href = `usersprofile.html?uid=${userID}`;
                  });

                  const textElement = document.createElement('div');
                  textElement.className = 'text';
                  textElement.textContent = message.text;

                  const dropdownContainer = document.createElement('div');
                  dropdownContainer.className = 'options-container';

                  const dropdownButton = document.createElement('a');
                  dropdownButton.className = 'options-icon';
                  dropdownButton.textContent = '⋮';

                  const dropdownMenu = document.createElement('div');
                  dropdownMenu.className = 'dropdown-menu';

                  if (currentUserRole === 'admin' || message.userID === currentUserID) {
                      const deleteOption = document.createElement('div');
                      deleteOption.className = 'dropdown-option';
                      deleteOption.textContent = 'Delete';
                      deleteOption.addEventListener('click', () => deleteMessage(message.index, messageElement));
                      dropdownMenu.appendChild(deleteOption);
                  }

                  if (message.userID !== currentUserID) {
                      const reportOption = document.createElement('div');
                      reportOption.className = 'dropdown-option';
                      reportOption.textContent = 'Report';
                      reportOption.addEventListener('click', () => reportMessage(message.index, message.text, message.userID));
                      dropdownMenu.appendChild(reportOption);
                  }

                  dropdownContainer.appendChild(dropdownButton);
                  dropdownContainer.appendChild(dropdownMenu);

                  textContainer.appendChild(usernameElement);
                  textContainer.appendChild(textElement);

                  messageElement.appendChild(textContainer);
                  messageElement.appendChild(dropdownContainer);

                  chatWindow.appendChild(messageElement);

                  dropdownButton.addEventListener('click', () => {
                      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
                  });

                  LimitChat();

                  lastDisplayedIndex = message.index;
                  scrollToBottom();
              } else if (item.type === 'removed') {
                  yeetFromUI(item.messageIndex);
              }
          }
      });
  });
};

//well it is what it is
const scrollToBottom = () => {
  chatWindow.scrollTop = chatWindow.scrollHeight;
};



  //get the last index from the db
  const getindex = async () => {
    const messagesQuery = query(collection(db, chatroom), orderBy('timestamp', 'desc'), limit(1));

    const qs = await getDocs(messagesQuery);
    if (!qs.empty) {
      const lastM = qs.docs[0].data();
      console.log('Last message:', lastM.index); //debug-check if it's null or nah
      return lastM.index;
    } else {
      return 0;
    }
  };

  loadchatroom(chatroom);

  chatInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default action of the Enter key
      await sendMessage();
    }
  });

  const sendMessage = async () => {
    const text = chatInput.value;
    if (text.trim() !== '') {
      // Change the send button to waiting
      sendButton.disabled = true;
      sendButton.textContent = 'Waiting...';
  
      const newMessage = {
        text: text,
        userID: currentUserID,
        timestamp: serverTimestamp(),
        index: await getNewIndex()
      };
      await addDoc(collection(db, chatroom), newMessage);
  
      // Clear text and re enable send button
      chatInput.value = '';
      sendButton.disabled = false;
      sendButton.textContent = 'Send'; // restore send button to send
  
      manageMessageLimit();
    }
  };
  
  sendButton.addEventListener('click', sendMessage);
  
  

  //add a new index to new msgs 
  const getNewIndex = async () => {
    const messagesQuery = query(collection(db, chatroom), orderBy('index', 'desc'), limit(1));

    const queryS = await getDocs(messagesQuery);
    if (!queryS.empty) {
      const lastMsg = queryS.docs[0].data();
      return lastMsg.index + 1;
    } else {
      return 1;
    }
  };

  //yeet the oldest msg
   const LimitChat = () =>{
    while (chatWindow.childElementCount > chatLimit) {
      chatWindow.removeChild(chatWindow.firstChild);
    }
  };

  //yeet function
  const deleteMessage = async (messageIndex, messageElement) => {
    try {
      // Get the current user's role and ID
      const user = currentUserID;
      const userDocRef = doc(db, 'users', user);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (!userDocSnapshot.exists()) {
        console.error('User not found');
        return;
      }
  
      const currentUserRole = userDocSnapshot.data().role;
  
      const messageQuery = query(collection(db, chatroom), where('index', '==', messageIndex), limit(1));
      const querySnapshot = await getDocs(messageQuery);
  
      if (!querySnapshot.empty) {
        const messageDoc = querySnapshot.docs[0];
        const messageData = messageDoc.data();
  
        // checking the user role
        if (currentUserRole === 'admin' || messageData.userID === currentUserID) {
          await deleteDoc(messageDoc.ref);  //yeet from the forestore collection 
          messageElement.remove();  // yeet the message from the html
          console.log('Message deleted successfully');

          // update the last index after yeet
          lastDisplayedIndex = await getindex();
        } else {
          console.error('Zowwy it did not delete uwu');
        }
      } else {
        console.error('Message not found in Firestore');
      }
    } catch (error) {
      console.error('Error deleting message: ', error);
    }
  };
  

  //gae ban
  const reportMessage = async (messageIndex, messageText, messageUserID) => {
    try {
      const reporterID = currentUserID;
      const reportData = {
        messageText: messageText,
        messageUserID: messageUserID,
        reporterID: reporterID,
        room: chatroom,
      };
      // Add the report to Firestore and get the document reference
      const reportDocRef = await addDoc(collection(db, "reports"), reportData)
      // Get the document ID
      const reportDocId = reportDocRef.id;
      
      // Update the document with the document ID
      await updateDoc(reportDocRef, { reportId: reportDocId });
          
      console.log("Reel report added successfully:", {...reportData, reportId: reportDocId});
      
      showAlert('Message reported successfully.');

      lastDisplayedIndex = await getindex();
    } catch (error) {
      console.error('Error reporting message: ', error);
      showAlert('Error reporting message.');
    }
  };

  //yeet from ui 
  const yeetFromUI = (messageIndex) => {
    const messageElement = document.querySelector(`.message[data-index="${messageIndex}"]`);
    if (messageElement) {
        messageElement.remove();
    }
  };

  //yeet the old msgs from the db
  const manageMessageLimit = async () => {
    try {
        const messagesQuery = query(collection(db, chatroom), orderBy('index', 'asc'));
        const querySnapshot = await getDocs(messagesQuery);
        const messageCount = querySnapshot.size;
      
        console.log(`Total messages in ${chatroom}: ${messageCount}`);

        if (messageCount > 10) {
            // Delete the oldest 5 messages
            const messagesToDelete = querySnapshot.docs.slice(0, 6);
            const batch = writeBatch(db);
            messagesToDelete.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('Deleted the oldest 10 messages.');
          }
      } catch (error) {
        console.error('Error managing message limit:', error);
       }
  };

  

 
 // Example event listeners to change channels
 document.getElementById('ch1').addEventListener('click', () => {
   loadchatroom('General');
 });
 document.getElementById('ch2').addEventListener('click', () => {
   loadchatroom('Question');
 });
 document.getElementById('ch3').addEventListener('click', () => {
   loadchatroom('Game Related');
 });
 
  
});

  

document.addEventListener('DOMContentLoaded', function () {
  const chatIcon = document.getElementById('chatIcon');
  const chatIconClose = document.getElementById('chatIconclose');
  const chatroom = document.getElementById('Chatroom');

  chatIcon.addEventListener('click', function () {
    chatroom.style.opacity = '1'; // Set opacity to fully visible
    chatroom.style.display = 'block'; // Show chatroom
    chatIcon.style.display = 'none'; // Hide chat icon
    chatIconClose.style.display = 'block'; // Show close icon
  });

  chatIconClose.addEventListener('click', function () {
    chatroom.style.opacity = '0'; // Set opacity to fully transparent
    setTimeout(() => {
      chatroom.style.display = 'none'; // Hide chatroom after transition
    }, 300); // Wait for transition (300ms)
    chatIconClose.style.display = 'none'; // Hide close icon
    chatIcon.style.display = 'block'; // Show chat icon
  });
});


function showAlert(message) {
  const alertPopup = document.getElementById('alertPopup');
  const alertMessage = document.getElementById('alertMessage');
  
  alertMessage.textContent = message;
  alertPopup.style.display = 'block';
  
  setTimeout(() => {
      alertPopup.classList.add('hide');
  }, 4500); // Start hiding after 4.5 seconds
  
  setTimeout(() => {
      alertPopup.style.display = 'none';
      alertPopup.classList.remove('hide');
  }, 5000); // Completely hide after 5 seconds
}
