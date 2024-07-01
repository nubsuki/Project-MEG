import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, getDoc, getDocs, addDoc, doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot, serverTimestamp, limit, writeBatch, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
          console.log("User is admin:", isAdmin);
        } else {
          window.location.href = "index.html";
        }
      } else {
        console.log("No such document!");
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
  }
});

// Add News
const newsForm = document.getElementById('newsForm');

// Event listener for form submission
newsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(newsForm);
  const title = formData.get('title');
  const description = formData.get('description');
  const category = formData.get('category');
  const link = formData.get('link');
  const imageFile = formData.get('imageFile');
  const loader = document.getElementById('loader');
  const addNewsText = document.getElementById('addNewsText');

  try {
    newsForm.style.pointerEvents = 'none'; // Disable form interactions
    addNewsText.style.display = 'none';
    loader.style.display = 'inline-block';
    // Upload image to Firebase Storage
    const imageUrl = await uploadImageToStorage(imageFile);
    // Add news data to Firestore
    await addNewsToFirestore(title, description, imageUrl, category, link);
    showAlert('News added successfully!');
    // Clear the form after submission
    newsForm.reset();
  } catch (error) {
    console.error("Error adding news: ", error);
    showAlert('Failed to add news. Please try again later.');
  } finally {
    window.location.href = "controlpanel.html";
    loader.style.display = 'none'; // Hide loader
  }
});

// Function to upload image to Firebase Storage
async function uploadImageToStorage(imageFile) {
  try {
    const storageRef = ref(storage, 'news_images/' + imageFile.name);
    const snapshot = await uploadBytesResumable(storageRef, imageFile);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    throw error;
  }
}

// Function to add news data to Firestore
async function addNewsToFirestore(title, description, imageUrl, category, link) {
  try {
    const newDocRef = doc(collection(db, 'news')); // Create a new document reference with an auto-generated ID
    await setDoc(newDocRef, {
      title: title,
      newsId: newDocRef.id, // Set the newsId field to the new document ID
      description: description,
      imageUrl: imageUrl,
      category: category,
      link: link
    });
  } catch (error) {
    throw error;
  }
}


// Fetch and display initial tags
async function fetchAndDisplayTags() {
  const tagContainer = document.getElementById('tag-container');
  tagContainer.innerHTML = ''; // Clear existing tags

  try {
    const tagsDocRef = doc(db, 'TagList', 'tagsDocument');
    const tagsDoc = await getDoc(tagsDocRef);
    if (tagsDoc.exists()) {
      const tags = tagsDoc.data().tags;
      tags.forEach(tag => {
        const tagElement = createTagElement(tag);
        tagContainer.appendChild(tagElement);
      });
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error fetching tags: ", error);
  }
}

// Function to create a tag element
function createTagElement(tag) {
  const tagElement = document.createElement('div');
  tagElement.classList.add('tag');

  const tagText = document.createElement('span');
  tagText.innerText = tag;
  tagElement.appendChild(tagText);

  const deleteIcon = document.createElement('i');
  deleteIcon.classList.add('bi', 'bi-trash', 'delete-icon');
  deleteIcon.onclick = () => deleteTag(tag, tagElement);
  tagElement.appendChild(deleteIcon);

  return tagElement;
}

// Function to delete a tag
async function deleteTag(tag, tagElement) {
  try {
    const tagsDocRef = doc(db, 'TagList', 'tagsDocument');
    const tagsDoc = await getDoc(tagsDocRef);
    if (tagsDoc.exists()) {
      const tags = tagsDoc.data().tags;
      const updatedTags = tags.filter(t => t !== tag);
      await setDoc(tagsDocRef, { tags: updatedTags });
      tagElement.remove();
      console.log(`Tag "${tag}" deleted successfully.`);
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error deleting tag: ", error);
  }
}

// Select the button element and add event listener
document.addEventListener('DOMContentLoaded', function () {
  const addTagBtn = document.getElementById('addTagBtn');
  addTagBtn.addEventListener('click', addTag);
});

// Function to add a tag
async function addTag() {
  const tagInput = document.getElementById('tag-input');
  const newTag = tagInput.value.trim();

  if (newTag === '') {
    showAlert("Please enter a tag.");
    return;
  }

  try {
    const tagsDocRef = doc(db, 'TagList', 'tagsDocument');
    const tagsDoc = await getDoc(tagsDocRef);

    if (tagsDoc.exists()) {
      const tags = tagsDoc.data().tags;

      // Check if the new tag already exists
      if (tags.includes(newTag)) {
        showAlert("Tag already exists.");
        return;
      }

      const updatedTags = [...tags, newTag];
      await setDoc(tagsDocRef, { tags: updatedTags });

      // Update UI
      const tagContainer = document.getElementById('tag-container');
      const tagElement = createTagElement(newTag);
      tagContainer.appendChild(tagElement);

      // Clear input
      tagInput.value = '';

      console.log(`Tag "${newTag}" added successfully.`);
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error adding tag: ", error);
  }
}


// Initial fetch and display of tags
fetchAndDisplayTags();


//usersban/unban

//usersban/unban

// Function to fetch users from Firestore
async function fetchUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  const users = [];
  snapshot.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });
  return users;
}

// Function to display users in the userList div
function displayUsers(users) {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';
  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.classList.add('user-item');
    userItem.innerHTML = `
      <div class="user-info">
        <p>UID: ${user.id}</p>
        <p>Email: ${user.email}</p>
        <p>Role: ${user.role}</p>
        <button class="role-button" onclick="window.toggleUserRole('${user.id}', '${user.role}')">
          ${user.role === 'banned' ? 'Unban' : 'Ban'}
        </button>
      </div>
    `;
    userList.appendChild(userItem);
  });
}

// Function to toggle user role between 'banned' and 'user'
window.toggleUserRole = async function (userId, currentRole) {
  try {
    const newRole = currentRole === 'banned' ? 'user' : 'banned';
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { role: newRole }, { merge: true });
    showAlert(`User ${newRole === 'banned' ? 'banned' : 'unbanned'} successfully.`);
    // Refresh the user list after updating the role
    const users = await fetchUsers();
    displayUsers(users);
    filterUsers(users);
  } catch (error) {
    console.error('Error updating user role: ', error);
    showAlert('Failed to update user role. Please try again later.');
  }
}

// Function to filter users based on search input
function filterUsers(users) {
  const searchInput = document.getElementById('searchUserInput');
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm.trim() === '') {
      document.getElementById('userList').innerHTML = ''; // Clear user list when input is empty
    } else {
      const filteredUsers = users.filter(user =>
        user.id.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm)
      );
      displayUsers(filteredUsers);
    }
  });
}

// Initialize and fetch users
document.addEventListener('DOMContentLoaded', async () => {
  const users = await fetchUsers();
  displayUsers(users);
  filterUsers(users);
});




// Function to report
async function fetchAllReportsAndPopulate() {
  try {
    const reportsRef = collection(db, 'reports');

    // Real-time listener for reports collection
    onSnapshot(reportsRef, async (snapshot) => {
      if (snapshot.empty) {
        console.log('No reports found');
        return;
      }

      // Clear the existing reports container
      document.getElementById('reportsContainer').innerHTML = '';

      snapshot.forEach(async (doc) => {
        const reportData = doc.data();
        const reportId = doc.id;

        console.log('Report Data:', reportData); // Log the report data

        // Create a new report container
        const reportContainer = document.createElement('div');
        reportContainer.classList.add('reportContainer');
        reportContainer.id = `report_${reportId}`;

        // Create the content card
        const contentCard = document.createElement('div');
        contentCard.classList.add('contentcard');

        // Create the card content
        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');

        // Check if the report is a comment or not
        if (reportData.commenterId) {
          cardContent.innerHTML = `
            <p class="Mid">Commenter ID: ${reportData.commenterId}</p>
            <p class="Mid">Reporter ID: ${reportData.reporterId}</p>
            <p class="description">Comment: ${reportData.commentText}</p>
            <a class="delete-button" data-report-id="${reportId}" data-reel-comment-id="${reportData.reelcommentId}" data-post-comment-id="${reportData.postcommentId}"><i class="bi bi-trash3"></i></a>
            <a class="delete-button" data-report-id="${reportId}"><i class="bi bi-folder-minus"></i></a>
          `;
        } else if (reportData.posterId) {
          cardContent.innerHTML = `
            <p class="Mid">Poster ID: ${reportData.posterId}</p>
            <p class="description">Caption: ${reportData.caption}</p>
            <p class="description">Post Content: ${reportData.postContent}</p>
            <p class="description">Reason: ${reportData.reason}</p>
            <a class="delete-button" data-report-id="${reportId}" data-post-id="${reportData.postId}" data-reel-id="${reportData.reelId}" data-img-url="${reportData.imgUrl}"><i class="bi bi-trash3"></i></a>
            <a class="delete-button" data-report-id="${reportId}"><i class="bi bi-folder-minus"></i></a>
          `;
        } else if (reportData.messageUserID) {
          cardContent.innerHTML = `
            <p class="Mid">Messenger ID: ${reportData.messageUserID}</p>
            <p class="Mid">Reporter ID: ${reportData.reporterID}</p>
            <p class="description">Message: ${reportData.messageText}</p>
            <a class="delete-button" data-report-id="${reportId}"><i class="bi bi-folder-minus"></i></a>
          `;
        }

        // Append card content to the content card
        contentCard.appendChild(cardContent);

        // Append content card to the report container
        reportContainer.appendChild(contentCard);

        // Append the entire report container to reportsContainer
        document.getElementById('reportsContainer').appendChild(reportContainer);

        // Fetch and populate additional data
        if (reportData.reelId) {
          await fetchReelDataAndPopulate(reportData.reelId, reportId, contentCard);
        } else if (reportData.postId) {
          await fetchPostDataAndPopulate(reportData.postId, reportId, contentCard);
        }
      });

      // Attach delete event listeners to all delete buttons
      document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', handleDelete);
      });
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
  }
}

async function handleDelete(event) {
  const button = event.currentTarget;
  const reportId = button.getAttribute('data-report-id');
  const postId = button.getAttribute('data-post-id');
  const reelId = button.getAttribute('data-reel-id');
  const reelCommentId = button.getAttribute('data-reel-comment-id');
  const postCommentId = button.getAttribute('data-post-comment-id');
  const imgUrl = button.getAttribute('data-img-url');

  try {
    // Delete the report document
    await deleteDoc(doc(db, 'reports', reportId));
    showAlert(`Report ${reportId} deleted`);

    // Delete the associated post or reel document
    if (postId) {
      await deleteDoc(doc(db, 'posts', postId));
      showAlert(`Post ${postId} deleted`);
    }
    if (reelId) {
      await deleteDoc(doc(db, 'reels', reelId));
      showAlert(`Reel ${reelId} deleted`);
    }

    // Delete the associated comment document
    if (reelCommentId) {
      await deleteDoc(doc(db, 'reelComments', reelCommentId));
      showAlert(`Reel Comment ${reelCommentId} deleted`);
    }
    if (postCommentId) {
      await deleteDoc(doc(db, 'comments', postCommentId));
      showAlert(`Post Comment ${postCommentId} deleted`);
    }

    // Delete the image or video file from Firebase Storage if imgUrl is defined
    if (imgUrl && imgUrl !== 'undefined') {
      const storageRef = ref(storage, imgUrl);
      await deleteObject(storageRef);
      console.log(`File ${imgUrl} deleted from storage`);
    } else {
      console.log('No file to delete from storage');
    }

    // Remove the report container from the DOM
    const reportContainer = document.getElementById(`report_${reportId}`);
    if (reportContainer) {
      reportContainer.remove();
    } else {
      console.log(`Report container for ${reportId} not found`);
    }

  } catch (error) {
    console.error('Error deleting report or associated data:', error);
  }
}

// Function to fetch reel data and populate the report card
async function fetchReelDataAndPopulate(reelId, reportId, contentCard) {
  try {
    const reelRef = doc(db, 'reels', reelId);
    const reelDoc = await getDoc(reelRef);

    if (!reelDoc.exists()) {
      console.log(`Reel ${reelId} not found`);
      return;
    }

    const reelData = reelDoc.data();

    // Create video element and update it with reel data
    const videoElement = document.createElement('video');
    videoElement.src = reelData.imgUrl;
    videoElement.controls = true;
    videoElement.classList.add('card-video');
    contentCard.appendChild(videoElement);

  } catch (error) {
    console.error('Error fetching reel data:', error);
  }
}

// Function to fetch post data and populate the report card
async function fetchPostDataAndPopulate(postId, reportId, contentCard) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.log(`Post ${postId} not found`);
      return;
    }

    const postData = postDoc.data();

    // Create image element and update it with post data
    const imgElement = document.createElement('img');
    imgElement.src = postData.imgUrl;
    imgElement.alt = 'Image';
    imgElement.classList.add('card-image');
    contentCard.appendChild(imgElement);

  } catch (error) {
    console.error('Error fetching post data:', error);
  }
}

// Call fetchAllReportsAndPopulate to fetch and populate all reports
fetchAllReportsAndPopulate();


// Button functions
document.addEventListener('DOMContentLoaded', function () {
  const addNewsbtn = document.getElementById('addnewsbtn');
  const closeNewsbtn = document.getElementById('nfaddclose');
  const addNewsSection = document.getElementById('nfaddsection');
  const addtagsbtn = document.getElementById('openAddTagsBtn');
  const closetagsbtn = document.getElementById('tagcloseicon');
  const addtagsSection = document.getElementById('addTagSection');
  const banusersSection = document.getElementById('banusersSection');
  const banusersbtn = document.getElementById('users');
  const userscloseicon = document.getElementById('userscloseicon');


  function openaddNewsSection() {
    addNewsSection.style.display = 'block';
  }

  function closeaddNewsSection() {
    addNewsSection.style.display = 'none';
  }

  if (addNewsbtn) {
    addNewsbtn.addEventListener('click', openaddNewsSection);
  }

  if (closeNewsbtn) {
    closeNewsbtn.addEventListener('click', function (event) {
      event.stopPropagation();
      closeaddNewsSection();
    });
  }

  function openaddTagsSection() {
    addtagsSection.style.display = 'block';
  }

  function closeaddTagsSection() {
    addtagsSection.style.display = 'none';
  }

  if (addtagsbtn) {
    addtagsbtn.addEventListener('click', openaddTagsSection);
  }

  if (closetagsbtn) {
    closetagsbtn.addEventListener('click', function (event) {
      event.stopPropagation();
      closeaddTagsSection();
    });
  }
  function openaddusersSection() {
    banusersSection.style.display = 'block';
  }

  function closeaddusersSection() {
    banusersSection.style.display = 'none';
  }

  if (banusersbtn) {
    banusersbtn.addEventListener('click', openaddusersSection);
  }

  if (userscloseicon) {
    userscloseicon.addEventListener('click', function (event) {
      event.stopPropagation();
      closeaddusersSection();
    });
  }
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
