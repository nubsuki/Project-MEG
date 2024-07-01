import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, deleteDoc, collection, addDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBua35RMPI5GlO9riLYNYN8R2NwOTzjY0Y",
    authDomain: "porject-meg.firebaseapp.com",
    projectId: "porject-meg",
    storageBucket: "porject-meg.appspot.com",
    messagingSenderId: "787863360422",
    appId: "1:787863360422:web:60923e03fe9d59e9e2f567"
};

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
          showAlert(`User is admin: ${isAdmin}`);
          // Show admin control panel icon
          document.getElementById('adddata').style.display = 'flex';
          document.getElementById('deleteButt').style.display = 'flex';
          
        } else {
          console.log("User is admin:", isAdmin);
          document.getElementById('adddata').style.display = 'none';
          document.getElementById('deleteButt').style.display = 'none';
        }
      } else {
        console.log("No such document!");
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
  }
});


document.getElementById('closeicon').addEventListener('click', function () {
    document.getElementById('starraildata').style.display = 'none';
});

document.getElementById('adddata').addEventListener('click', function () {
    document.getElementById('uploaddata').style.display = 'block';
});

document.getElementById('closeiconuploaddata').addEventListener('click', function () {
    document.getElementById('uploaddata').style.display = 'none';
});


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const form = document.getElementById("nameCardForm");
    const subButton = document.getElementById("submitButton");

    showCharacters();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const avatar = document.getElementById("avatar").files[0];
        const details = document.getElementById("nameDetails").value;
        const webUrl = document.getElementById("websiteURL").value;
        const anti = document.getElementById("antivirusURL").value;

        try {
            if (subButton) {
                subButton.disabled = true;
                subButton.textContent = 'Uploading...';
            }

            const avatarUrl = await uploadImage(avatar, `pirategames/${generateUniqueName(avatar.name)}`);

            const docRef = await addDoc(collection(db, "piratedgames"), {
                id: generateUniqueId(),
                Name: name,
                details: details,
                weburl: webUrl,
                antiurl: anti,
                avatarImg: avatarUrl
            });

            form.reset();
            location.reload();
            console.log("Doc written with ID: ", docRef.id);
            showAlert("Upload successful!!");
        } catch (e) {
            console.error("Error adding doc: ", e);
            alert("Error uploading data: " + e.message);
        } finally {
            if (subButton) {
                subButton.disabled = false;
                subButton.textContent = 'Submit';
            }
        }
    });

    function generateUniqueName(originalName) {
        const timestamp = Date.now();
        const fileExtension = originalName.split('.').pop();
        return `${originalName.split('.')[0]}_${timestamp}.${fileExtension}`;
    }

    async function uploadImage(file, path) {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef); // Return the download URL directly
    }

    function generateUniqueId() {
        // Generate a random 20-character string as ID
        return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    }

    const closeIcon = document.getElementById('closeiconuploaddata');
    if (closeIcon) {
        closeIcon.addEventListener('click', () => {
            form.reset();
            document.getElementById('uploaddata').style.display = 'none';
        });
    }

    const Del = document.getElementById("deleteButt");
    if (Del) {
        Del.addEventListener('click', async () => {
            await DeleteDoc();
            //clearDisplay();
            document.getElementById('starraildata').style.display = 'none';
        });
    }

});

document.getElementById('closeicon').addEventListener('click', function () {
    document.getElementById('starraildata').style.display = 'none';
});

document.getElementById('adddata').addEventListener('click', function () {
    document.getElementById('uploaddata').style.display = 'block';
});

document.getElementById('closeiconuploaddata').addEventListener('click', function () {
    document.getElementById('uploaddata').style.display = 'none';
});

async function showCharacters() {
    console.log("showCharacters function called");

    // Function to show the loading screen
    function showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    // Function to hide the loading screen
    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    const characterDiv = document.querySelector('.character');

    try {
        const querySnapshot = await getDocs(collection(db, "piratedgames"));
        showLoading();

        if (querySnapshot.empty) {
            console.log("No documents found in piratedgames collection");
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const avatarImgUrl = data.avatarImg;

            console.log("avatarImgUrl:", avatarImgUrl);

            //create HTML structure
            const characterImgDiv = document.createElement('div');
            characterImgDiv.className = 'character-img';

            const imgElement = document.createElement('img');
            imgElement.src = avatarImgUrl;
            imgElement.alt = 'Picture';
            imgElement.dataset.id = doc.id;

            characterImgDiv.appendChild(imgElement);
            characterDiv.appendChild(characterImgDiv);

            //make image clickable
            imgElement.addEventListener('click', async (event) => {
                const clickedId = event.target.dataset.id;
                console.log('Image clicked, ID:', clickedId);

                await DisplayInfo(clickedId);

                // Show the record section
                const recordSection = document.getElementById('starraildata');
                recordSection.style.display = 'block';
            });
        });
        hideLoading();
    } catch (error) {
        console.log("Error fetching documents:", error);
        hideLoading();
    }
}

async function DisplayInfo(Cname) {
    console.log("Displaying info for Cname:", Cname);

    const avatar = document.getElementById("avatarimg");
    const software = document.getElementById("software");
    const detail = document.getElementById("des");
    const Glink = document.getElementById("Link1");
    const Alink = document.getElementById("Link2");

    try {
        const docRef = doc(db, "piratedgames", Cname);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const charInfo = docSnap.data();

            avatar.src = charInfo.avatarImg;
            software.textContent = charInfo.Name;
            detail.textContent = charInfo.details;
            Glink.href = charInfo.weburl;
            Alink.href = charInfo.antiurl;

            const delButton = document.getElementById("deleteButt");
            if (delButton) {
                delButton.addEventListener('click', async () => {
                    try {
                        if (delButton) {
                            delButton.disabled = true;
                            delButton.textContent = 'Deleting...';
                        }

                        console.log("before passing to del:", Cname);

                        await DeleteDoc(Cname);
                        clearDisplay();
                        document.getElementById('starraildata').style.display = 'none';
                        location.reload();
                    } catch (e) {
                        console.error("Error deleting doc:", e);
                    } finally {
                        if (delButton) {
                            delButton.disabled = false;
                            delButton.textContent = 'Delete';
                        }
                    }
                });
            }
        } else {
            console.log("No such document!");
            clearDisplay();
        }
    } catch (e) {
        console.error("Error getting document:", e);
        clearDisplay();
    }
}

function clearDisplay() {
    const avatar = document.getElementById("avatarimg");
    const software = document.getElementById("software");
    const detail = document.getElementById("des");
    const Glink = document.getElementById("Link1");
    const Alink = document.getElementById("Link2");

    avatar.src = "";
    software.textContent = "";
    detail.textContent = "";
    Glink.href = "";
    Alink.href = "";
}

async function DeleteDoc(Cname) {
    try {
        const docRef = doc(db, "piratedgames", Cname);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const charInfo = docSnap.data();

            await deleteImage(charInfo.avatarImg);

            await deleteDoc(docRef);

        } else {
            console.log("No such document:", Cname);
        }
    } catch (e) {
        console.error("Error deleting document:", e);
        throw e;
    }
}

async function deleteImage(url) {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (e) {
        console.error("Error deleting image:", e);
        throw e;
    }
}

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
