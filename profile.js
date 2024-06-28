import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// Add the other Firebase services that you want to use
import { getAuth, onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updateProfile as updateAuthProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc, setDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


//Firebase configuration
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



// Global variable to store admin status
let isAdmin = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in. Fetch user data from Firestore
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData.role === 'admin') {
          isAdmin = true;
          console.log("User is admin:", isAdmin);
          // Show admin control panel icon
          document.getElementById('controlpnl').style.display = 'flex';
        } else {
          console.log("User is admin:", isAdmin);
        }
      } else {
        console.log("No such document!");
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
  }
});


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
    // Fetch follower and followed counts
    await getFollowerCount(userId);
    await getFollowedCount(userId);

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

//followers and following counts
const getFollowerCount = async (userId) => {
  try {
    const friendsRef = doc(db, 'friends', userId);
    const unsubscribe = onSnapshot(friendsRef, (doc) => {
      if (doc.exists()) {
        const friendsData = doc.data();
        const followerCount = friendsData.followers ? friendsData.followers.length : 0;
        document.getElementById('followerCount').textContent = followerCount.toString();
      } else {
        console.error('Friends document not found for user:', userId);
      }
    });

    return unsubscribe; // Return unsubscribe function to detach listener if needed
  } catch (error) {
    console.error('Error fetching follower count:', error);
  }
};

const getFollowedCount = async (userId) => {
  try {
    const friendsRef = doc(db, 'friends', userId);
    const unsubscribe = onSnapshot(friendsRef, (doc) => {
      if (doc.exists()) {
        const friendsData = doc.data();
        const followedCount = friendsData.followed ? friendsData.followed.length : 0;
        document.getElementById('followingCount').textContent = followedCount.toString();
      } else {
        console.error('Friends document not found for user:', userId);
      }
    });

    return unsubscribe; // Return unsubscribe function to detach listener if needed
  } catch (error) {
    console.error('Error fetching followed count:', error);
  }
};


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

// Function to fetch user tags from Firestore using current user's UID
async function fetchCurrentUserTags() {
  const userId = localStorage.getItem('loggedInUserId');
  const tagContainer = document.getElementById('tag-container');

  if (!userId) {
    console.error('User ID not found in localStorage');
    tagContainer.innerHTML = 'User ID not found'; // Display an error message if user ID is not found
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId); // Reference to the user document
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const userTags = userData.tags || []; // Get tags array from user data, default to empty array

      tagContainer.innerHTML = ''; // Clear existing tags

      if (userTags.length === 0) {
        tagContainer.innerHTML = 'No tags yet added'; // Display message if no tags
      } else {
        userTags.forEach((tag) => {
          const tagElement = document.createElement('div');
          tagElement.classList.add('tag');

          // Display tag text
          const tagText = document.createElement('span');
          tagText.textContent = tag;
          tagElement.appendChild(tagText);

          // Create delete icon
          const deleteIcon = document.createElement('i');
          deleteIcon.classList.add('bi', 'bi-trash', 'delete-icon');
          deleteIcon.style.marginLeft = '10px';
          deleteIcon.style.cursor = 'pointer';
          deleteIcon.addEventListener('click', async () => {
            // Remove the tag from the user's profile
            try {
              const updatedTags = userTags.filter(t => t !== tag);
              await updateDoc(userDocRef, { tags: updatedTags });
              fetchCurrentUserTags(); // Refresh tag display
            } catch (error) {
              console.error('Error removing tag:', error);
            }
          });

          tagElement.appendChild(deleteIcon);
          tagContainer.appendChild(tagElement);
        });
      }
    } else {
      console.log('User document not found');
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
  }
}

fetchCurrentUserTags();



// Function to fetch and filter tags based on user input
async function fetchAndFilterTags() {
  try {
    const tagsRef = doc(db, 'TagList', 'tagsDocument');
    const docSnap = await getDoc(tagsRef);

    if (docSnap.exists()) {
      const tagData = docSnap.data();
      const allTags = tagData.tags || []; // Get tags array

      const tagInput = document.getElementById('tagInput');
      const tagList = document.getElementById('tagList');
      const searchTerm = tagInput.value.trim().toLowerCase(); // Trim and lowercase input

      // Clear existing tag list if search term is empty
      if (searchTerm === '') {
        tagList.innerHTML = '';
        return; // Exit function early
      }

      // Fetch user's existing tags
      const userId = localStorage.getItem('loggedInUserId');
      let userTags = [];

      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userTags = userData.tags || [];
        } else {
          console.log('User document not found');
        }
      } else {
        console.error('User ID not found in localStorage');
      }

      // Use a Set to store unique tags temporarily
      const uniqueTags = new Set();

      allTags.forEach(tag => {
        const tagText = tag.toLowerCase();
        if (tagText.includes(searchTerm) && !userTags.includes(tagText)) {
          uniqueTags.add(tag); // Add original tag to Set
        }
      });

      // Convert Set back to Array and sort alphabetically
      const uniqueTagsArray = Array.from(uniqueTags).sort();

      // Clear existing tag list
      tagList.innerHTML = '';

      uniqueTagsArray.forEach(tag => {
        const li = document.createElement('div');
        li.textContent = tag;
        li.classList.add('tag');

        // Create plus icon for adding tag
        const plusIcon = document.createElement('i');
        plusIcon.classList.add('bi', 'bi-plus-lg', 'add-tagsicon');
        plusIcon.style.marginLeft = '10px';
        plusIcon.style.cursor = 'pointer';
        plusIcon.addEventListener('click', async () => {
          // Add the tag to the user's profile
          const userId = localStorage.getItem('loggedInUserId');
          if (userId) {
            try {
              const userDocRef = doc(db, 'users', userId);
              const userDocSnap = await getDoc(userDocRef);

              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                let userTags = userData.tags || [];

                if (!userTags.includes(tag)) {
                  userTags.push(tag); // Add the new tag

                  // Update the user document with new tags
                  await updateDoc(userDocRef, { tags: userTags });

                  // Update UI or trigger a refresh of user tags display
                  fetchCurrentUserTags();
                } else {
                  console.log('Tag already exists for the user');
                  // You can optionally provide user feedback that the tag is already added
                }
              } else {
                console.log('User document not found');
              }
            } catch (error) {
              console.error('Error updating user tags:', error);
            }
          } else {
            console.error('User ID not found in localStorage');
          }
        });

        li.appendChild(plusIcon);
        tagList.appendChild(li);
      });
    } else {
      console.log('Tags document not found');
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
  }
}

// Event listener for tag input change
document.getElementById('tagInput').addEventListener('input', fetchAndFilterTags);


//pf share
document.getElementById('pfshare').addEventListener('click', function () {
  const loggedInUserId = localStorage.getItem('loggedInUserId');
  if (loggedInUserId) {
    window.location.href = `shareprofile.html?uid=${loggedInUserId}`;
  } else {
    alert('User not logged in');
  }
});


// Helper function to create a reference from a URL
function refFromURL(storage, url) {
  const urlObj = new URL(url);
  const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
  return ref(storage, path);
}

// Function to reauthenticate the user
async function reauthenticateUser(user) {
  const email = user.email;
  const password = prompt("Please enter your password to confirm deletion:");

  if (!password) {
    throw new Error("Password is required for reauthentication.");
  }

  const credential = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, credential);
}

// Event listener for the "Yes" delete button
document.getElementById('yesdelete').addEventListener('click', async () => {
  const userId = localStorage.getItem('loggedInUserId');
  if (!userId) {
    alert('User not logged in');
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const profilePicUrl = userData.profilePicUrl;

      // Reauthenticate the user
      const user = auth.currentUser;
      if (user && user.uid === userId) {
        await reauthenticateUser(user);
      }

      // Delete user document from Firestore
      await deleteDoc(userDocRef);

      // Delete profile picture from Firebase Storage
      if (profilePicUrl) {
        const storageRef = refFromURL(storage, profilePicUrl);
        await deleteObject(storageRef);
      }

      // Delete the user from Firebase Authentication
      await deleteUser(user);

      alert('User account deleted successfully.');
      // Redirect or perform additional actions if necessary
    } else {
      alert('User document not found');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user');
  }
});


// Reference to Firestore collection
const postsCollection = collection(db, 'posts');

document.addEventListener('DOMContentLoaded', function () {
  const loggedInUserId = localStorage.getItem('loggedInUserId'); // Retrieve logged in user ID from localStorage

  // Function to show the loading screen
    function showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    // Function to hide the loading screen
    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }


  // Function to fetch posts from Firestore
  function fetchPosts() {
    showLoading();
      const q = query(postsCollection, where("userID", "==", loggedInUserId)); // Filter posts by logged-in user ID

      getDocs(q).then(querySnapshot => {
          const postContainer = document.getElementById('postContainer');
          postContainer.innerHTML = ''; // Clear previous content

          querySnapshot.forEach(doc => {
              const post = doc.data();
              const postId = doc.id;

              // Check if the post has an image URL
              if (post.imgUrl) {
                  const postElement = document.createElement('div');
                  postElement.classList.add('content');
                  postElement.setAttribute('data-type', 'image');

                  // Create image element
                  const imgElement = document.createElement('img');
                  imgElement.src = post.imgUrl;
                  postElement.appendChild(imgElement);

                  // Create icon for opening in another window
                  const iconElement = document.createElement('i');
                  iconElement.classList.add('bi', 'bi-image', 'iconpost');
                  iconElement.addEventListener('click', function () {
                      window.open(post.imgUrl, '_blank');
                  });
                  postElement.appendChild(iconElement);

                  // Create delete button icon
                  const deleteButton = document.createElement('i');
                  deleteButton.classList.add('bi', 'bi-trash', 'icondelete');
                  deleteButton.addEventListener('click', function () {
                      deletePost(postId, post.imgUrl);
                  });

                  // Create a container for the bottom elements (like delete button)
                  const bottomContainer = document.createElement('div');
                  bottomContainer.classList.add('bottom-container');
                  bottomContainer.appendChild(deleteButton);

                  // Append the bottom container to the post element
                  postElement.appendChild(bottomContainer);

                  // Append post element to container
                  postContainer.appendChild(postElement);
              }
          });
          hideLoading();
      }).catch(error => {
          console.error('Error fetching posts:', error);
          hideLoading();
      });
  }

  // Function to delete post from Firestore and Storage
  function deletePost(postId, imgUrl) {
      // Delete the post document from Firestore
      deleteDoc(doc(db, 'posts', postId)).then(() => {
          console.log('Post deleted from Firestore:', postId);

          // Delete the image from Storage
          const storageRef = ref(storage, imgUrl);
          deleteObject(storageRef).then(() => {
              console.log('Image deleted from Storage:', imgUrl);
              // Refresh the posts after deletion
              fetchPosts();
          }).catch(error => {
              console.error('Error deleting image from Storage:', error);
          });
      }).catch(error => {
          console.error('Error deleting post from Firestore:', error);
      });
  }

  // Call fetchPosts function when DOM content is loaded
  fetchPosts();
});