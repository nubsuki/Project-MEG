// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getFirestore, setDoc, doc, getDoc} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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



//login and sign in


//Message

function showMessage(message, divId) {
  var messageDiv = document.getElementById(divId);
  messageDiv.innerHTML = message;
  messageDiv.style.display = 'block';
  messageDiv.style.opacity = '1';
  setTimeout(function() {
      messageDiv.style.opacity = '0';
  }, 3000);

}
//Event SignUp

const signup = document.getElementById('submitsignup');
signup.addEventListener('click', function(event) {
  event.preventDefault();
  const email = document.getElementById('remail').value;
  const username = document.getElementById('rusername').value;
  const password = document.getElementById('rpassword').value;

  const auth = getAuth();
  const db = getFirestore();
  const defaultRole = 'user';

  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
          username: username,
          email: email,
          uid: user.uid,
          role: defaultRole
      };

      showMessage('Your good to Go !!!!!', 'signupmsg');

      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, userData)
        .then(() => {
          sendEmailVerification(user)
            .then(() => {
              showMessage('Verification email sent!', 'signupmsg');
              setTimeout(function() {
                window.location.href = "../userRegister.html";
              }, 3000);
            })
            .catch((error) => {
              console.error("Error sending verification email:", error);
              showMessage('Error sending verification email', 'signupmsg');
            });
        })
        .catch((error) => {
          console.error("Error storing user data:", error);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        showMessage('Email already in use', 'signupmsg');
      } else {
        showMessage('Something went wrong', 'signupmsg');
      }
    });
});

//Event Login

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

const login = document.getElementById('submitlogin');
login.addEventListener('click', async function(event) { 
  event.preventDefault();
  const email = document.getElementById('lemail').value;
  const password = document.getElementById('lpassword').value;

  console.log("Email Entered:", email);
  if (!isValidEmail(email)) {
    showMessage('Invalid email format', 'loginmsg');
    return;
  }

  const auth = getAuth();
  const db = getFirestore();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', user.uid)); // Await the getDoc promise
    
    if (userDoc.exists()) {
      if (user.emailVerified) {
        const userData = userDoc.data();
        const userRole = userData.role;
        const allowedRoles = ['user', 'admin'];
        if (allowedRoles.includes(userRole)) {
          showMessage('Here We Gooooo!!!!!', 'loginmsg');
          localStorage.setItem('loggedInUserId', user.uid);
          setTimeout(function() {
            window.location.href = "../index.html";
          }, 2300);
        } else {
          showMessage('Access denied. <br>You are permenetly banned!!!', 'loginmsg');
        }
      } else {
        showMessage('Please verify your email first', 'loginmsg');
      }
    } else {
      showMessage('User data not found', 'loginmsg');
    }
    
  } catch (error) {
    console.error("Error during login:", error);
    const errorCode = error.code;
      showMessage(error, 'loginmsg');
  }
});

//Event Reset Password

const resetForm = document.getElementById('submitreset');
resetForm.addEventListener('click', function(event) {
  event.preventDefault();
  const auth = getAuth();
  const email = document.getElementById('Femail').value;

  sendPasswordResetEmail(auth, email)
  .then(() => {
      showMessage('Check your email!!<br>Re-direct to login 3s.....', 'resetmsg');
      setTimeout(function() {
        window.location.href = "../userRegister.html";
      }, 3000);
  })
  .catch((error) => {
      console.error("Error during password reset:", error);
      showMessage('Something went wrong', 'resetmsg');
  });
});

