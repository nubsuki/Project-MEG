import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


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

onAuthStateChanged(auth, (user) => {
    if (user) {
        const loggedInUserId = user.uid;
    } else {
        // Redirect to login if not authenticated
        localStorage.removeItem('loggedInUserId');
        window.location.href = "../userRegister.html";
    }
});

// Logout functionality
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth)
            .then(() => {
                localStorage.removeItem('loggedInUserId');
                // Add a small delay before redirecting
                setTimeout(() => {
                    window.location.replace('../userRegister.html');
                }, 100);
            })
            .catch((error) => {
                console.log('Error signing out:', error);
            });
    });
} else {
    console.log('Logout button not found');
}

// Redirect to login page if user is not authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../userRegister.html";
    } else {
        console.log("User is logged in:", user.email);
    }
});
