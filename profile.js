import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, updateProfile as updateAuthProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);




document.addEventListener('DOMContentLoaded', async function () {
  const userId = localStorage.getItem('loggedInUserId');

  if (!userId) {
    console.error('User ID not found in localStorage');
    return;
  }

  const app = initializeApp(firebaseConfig); // Initialize Firebase app
  const db = getFirestore(app); // Get Firestore instance

  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();

      // Update profile image
      const profilePic = document.getElementById('profileimg');
      if (userData.profilePicUrl) {
        profilePic.src = userData.profilePicUrl;
      }

      // Update username
      const usernameElement = document.getElementById('pusername');
      usernameElement.textContent = userData.username || 'Username';

      // Update bio/description
      const descriptionElement = document.getElementById('pdescription');
      descriptionElement.textContent = userData.description || 'Bio';
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
});


// HTML elements
const usernameInput = document.getElementById('username');
const descriptionInput = document.getElementById('description');
const profilePicInput = document.getElementById('profilePic');
const updateButton = document.getElementById('update');
const avatarDiv = document.querySelector('.avatar');
const loader = document.getElementById('loader');
const updateText = document.getElementById('updateText');

// Allowed file types and size limit
const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const maxSizeInBytes = 5 * 1024 * 1024; // 5MB


// Event listener for file input change
profilePicInput.addEventListener('change', () => {
  const file = profilePicInput.files[0];
  if (file) {
    // Use FileReader to read file content
    const reader = new FileReader();
    reader.onload = function (e) {
      avatarDiv.style.backgroundImage = `url(${e.target.result})`;
    };
    reader.readAsDataURL(file);
  } else {
    // Reset background image if no file selected
    avatarDiv.style.backgroundImage = 'none';
  }
});
// Fetch and display current user profile
async function fetchAndDisplayProfile() {
  try {
    const userId = localStorage.getItem('loggedInUserId');

    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      usernameInput.value = userData.username || '';
      descriptionInput.value = userData.description || '';

      // Display current profile picture if available
      if (userData.profilePicUrl) {
        avatarDiv.style.backgroundImage = `url('${userData.profilePicUrl}')`;
      } else {
        // Set default avatar image or placeholder
        avatarDiv.style.backgroundImage = `url('Assests/saberpf.jpg')`;
      }
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
}

// Update profile information
updateButton.addEventListener('click', async (e) => {
  e.preventDefault();

  if (!usernameInput.value.trim() || !descriptionInput.value.trim()) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    updateButton.classList.add('disabled');
    updateButton.style.pointerEvents = 'none';
    updateText.style.display = 'none';
    loader.style.display = 'inline-block';

    const userId = localStorage.getItem('loggedInUserId');

    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    const newUsername = usernameInput.value;
    const newDescription = descriptionInput.value;
    let profilePicUrl = null;

    // Fetch the current profile data to get the existing profile picture URL
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    const userData = docSnap.data();
    const existingProfilePicUrl = userData.profilePicUrl;

    // Update profile in Firestore
    await updateDoc(userRef, {
      username: newUsername,
      description: newDescription
    });

    // Upload new profile picture if selected
    const file = profilePicInput.files[0];
    if (file) {
      // Validate file type and size
      if (!allowedFileTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, GIF or webp).');
        return;
      }

      if (file.size > maxSizeInBytes) {
        alert('The file size should not exceed 5MB.');
        return;
      }

      // Delete the existing profile picture if it exists
      if (existingProfilePicUrl) {
        const existingProfilePicRef = ref(storage, existingProfilePicUrl);
        await deleteObject(existingProfilePicRef);
      }

      const storageRef = ref(storage, `profile_pics/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);
      profilePicUrl = await getDownloadURL(storageRef);

      // Update user's profile picture in Firestore
      await updateDoc(userRef, {
        profilePicUrl: profilePicUrl
      });
    }

    // Optionally update user's profile in Authentication (displayName and photoURL)
    await updateAuthProfile(auth.currentUser, {
      displayName: newUsername,
      photoURL: profilePicUrl
    });

    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
  } finally {
    window.location.href = "profile.html";
    loader.style.display = 'none'; // Hide loader
  }

});

// Initialize the profile form
fetchAndDisplayProfile();

document.addEventListener('DOMContentLoaded', function () {
  const profileEditButton = document.getElementById('pfsettings');
  const profileCloseButton = document.getElementById('pfclose');
  const profileEditSection = document.getElementById('editprofil');
  const deleteProfileSection = document.getElementById('delete-confirmation');
  const cancelButton = document.getElementById('nodelete');
  const deleteAccountButton = document.getElementById('delete');
  const Tagclose = document.getElementById('Tagclose');
  const addTagsSection = document.getElementById('addTags');
  const editTagButton = document.getElementById('edittagbtn');
  const controlpanel = document.getElementById('controlpnl');


  function openProfileEdit() {
    profileEditSection.style.display = 'block';
  }

  function closeProfileEdit() {
    profileEditSection.style.display = 'none';
    window.location.href = "profile.html";
  }

  function openTagsEdit() {
    addTagsSection.style.display = 'block';
  }

  function closeTagsEdit() {
    addTagsSection.style.display = 'none';
  }

  function openDeleteConfirmation() {
    deleteProfileSection.style.display = 'block';
  }

  function cancelDelete() {
    deleteProfileSection.style.display = 'none';
  }

  function openControls() {
    window.location.href = "controlpanel.html";
  }
  if (controlpanel) {
    controlpanel.addEventListener('click', function (event) {
      event.stopPropagation(); 
      openControls();
    });
  }

  if (profileEditButton) {
    profileEditButton.addEventListener('click', openProfileEdit);
  }

  if (profileCloseButton) {
    profileCloseButton.addEventListener('click', function (event) {
      event.stopPropagation();
      closeProfileEdit();
    });
  }


  if (editTagButton) {
    editTagButton.addEventListener('click', openTagsEdit);
  }


  if (Tagclose) {
    Tagclose.addEventListener('click', function (event) {
      event.stopPropagation();
      closeTagsEdit();
    });
  }

  if (deleteAccountButton) {
    deleteAccountButton.addEventListener('click', function (event) {
      event.stopPropagation();
      openDeleteConfirmation();
      deleteAccountButton.style.pointerEvents = 'none';
    });
  }


  if (cancelButton) {
    cancelButton.addEventListener('click', function (event) {
      event.stopPropagation();
      cancelDelete();
      deleteAccountButton.style.pointerEvents = 'auto';
    });
  }
});



//Tag Selector

const tags = [
  'JavaScript', 'Python', 'Java', 'C++', 'PHP',
  'Ruby', 'Go', 'Swift', 'Kotlin', 'Rust'
];

const tagInput = document.getElementById('tagInput');
const tagList = document.getElementById('tagList');

function displayTags(filteredTags) {
  tagList.innerHTML = '';
  filteredTags.forEach(tag => {
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = tag;
      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(tag));
      tagList.appendChild(li);
  });
}

tagInput.addEventListener('input', () => {
  const searchTerm = tagInput.value.toLowerCase();
  if (searchTerm === '') {
      displayTags([]);  // Clear the list when the input is empty
  } else {
      const filteredTags = tags.filter(tag => tag.toLowerCase().includes(searchTerm));
      displayTags(filteredTags);
  }
});