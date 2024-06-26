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

  try {
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





//button funtions
document.addEventListener('DOMContentLoaded', function () {
    const addNewsbtn = document.getElementById('addnewsbtn');
    const closeNewsbtn = document.getElementById('nfaddclose');
    const addNewsSection = document.getElementById('nfaddsection');
  
  
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
  
  });