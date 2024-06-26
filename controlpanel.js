import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, getDoc, addDoc, doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot, serverTimestamp, limit, writeBatch, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
    alert('News added successfully!');
    // Clear the form after submission
    newsForm.reset();
  } catch (error) {
    console.error("Error adding news: ", error);
    alert('Failed to add news. Please try again later.');
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
    alert("Please enter a tag.");
    return;
  }

  try {
    const tagsDocRef = doc(db, 'TagList', 'tagsDocument');
    const tagsDoc = await getDoc(tagsDocRef);
    
    if (tagsDoc.exists()) {
      const tags = tagsDoc.data().tags;
      
      // Check if the new tag already exists
      if (tags.includes(newTag)) {
        alert("Tag already exists.");
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

// Button functions
document.addEventListener('DOMContentLoaded', function () {
  const addNewsbtn = document.getElementById('addnewsbtn');
  const closeNewsbtn = document.getElementById('nfaddclose');
  const addNewsSection = document.getElementById('nfaddsection');
  const addtagsbtn = document.getElementById('openAddTagsBtn');
  const closetagsbtn = document.getElementById('tagcloseicon');
  const addtagsSection = document.getElementById('addTagSection');

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

  if (closetagsbtn ) {
    closetagsbtn.addEventListener('click', function (event) {
      event.stopPropagation();
      closeaddTagsSection();
    });
  }
});
