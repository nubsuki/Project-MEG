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

async function showCharacters() {
    console.log("showing avatars");
    const characterDiv = document.querySelector('.character');

    // Function to show the loading screen
    function showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    // Function to hide the loading screen
    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    try {
        // Fetch all documents from the "starrail" collection
        const querySnapshot = await getDocs(collection(db, "starrail"));
        showLoading();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const avatarImgUrl = data.avatarImg;

            // Create the HTML structure
            const characterImgDiv = document.createElement('div');
            characterImgDiv.className = 'character-img';

            const imgElement = document.createElement('img');
            imgElement.src = avatarImgUrl;
            imgElement.alt = 'Picture';
            imgElement.dataset.id = doc.id; // Store document ID as a data attribute

            characterImgDiv.appendChild(imgElement);
            characterDiv.appendChild(characterImgDiv);

            // Make the image clickable
            imgElement.addEventListener('click', async (event) => {
                const clickedId = event.target.dataset.id;
                console.log('Image clicked, ID:', clickedId);

                await DisplayInfo(clickedId);

                // Show the starraildata section
                const starraildataSection = document.getElementById('starraildata');
                starraildataSection.style.display = 'block';
            });
        });
        hideLoading();
    } catch (e) {
        console.error("Error fetching documents: ", e);
        hideLoading();
    }
}



async function DisplayInfo(Cname) {
    console.log("Displaying info for Cname:", Cname);

    const avatar = document.getElementById("avatarimg");
    const charName = avatar.nextElementSibling;
    const det = document.getElementById("chardet");

    const artifactMain = document.getElementById("artifactimg");
    const artifact1 = document.getElementById("artifactimg1");
    const artifact1Det = artifact1.nextElementSibling;
    const artifact2 = document.getElementById("artifactimg2");
    const artifact2Det = artifact2.nextElementSibling;

    const weapon = document.getElementById("weapon");
    const weaponimg1 = document.getElementById("weapon1");
    const weapon1Det = weaponimg1.nextElementSibling;
    const weaponimg2 = document.getElementById("weapon2");
    const weapon2Det = weaponimg2.nextElementSibling;

    const teamimg = document.getElementById("team");
    const teamimg1 = document.getElementById("team1");
    const teamimg2 = document.getElementById("team2");
    const teamimg3 = document.getElementById("team3");
    const teamimg4 = document.getElementById("team4");

    try {
        const docRef = doc(db, "starrail", Cname);
        const docSnap = await getDoc(docRef);

        if (!docSnap.empty) {
            const charInfo = docSnap.data();

            avatar.src = charInfo.avatarImg;
            charName.textContent = charInfo.Name;
            det.textContent = charInfo.details;

            artifactMain.src = charInfo.artifact1Img;
            artifact1.src = charInfo.artifact1Img;
            artifact1Det.textContent = charInfo.artifact1Det;
            artifact2.src = charInfo.artifact2Img;
            artifact2Det.textContent = charInfo.artifact2Det;

            weapon.src = charInfo.weapon1Img;
            weaponimg1.src = charInfo.weapon1Img;
            weapon1Det.textContent = charInfo.weapon1Det;
            weaponimg2.src = charInfo.weapon2Img;
            weapon2Det.textContent = charInfo.weapon2Det;

            teamimg.src = charInfo.team1Img;
            teamimg1.src = charInfo.team1Img;
            teamimg2.src = charInfo.team2Img;
            teamimg3.src = charInfo.team3Img;
            teamimg4.src = charInfo.team4Img;

            // Initialize delete button event listener
            const deleteButton = document.getElementById('deleteButt');
            if (deleteButton) {
                deleteButton.addEventListener('click', async () => {
                    try {
                        if (deleteButton) {
                            deleteButton.disabled = true;
                            deleteButton.textContent = 'Deleting...';
                        }

                        console.log("before passing to del:", Cname);

                        await DeleteDoc(Cname);
                        clearDisplay();
                        document.getElementById('starraildata').style.display = 'none';
                        location.reload();
                    } catch (error) {
                        console.error('Error deleting document:', error);
                        // Handle error if necessary
                    } finally {
                        if (deleteButton) {
                            deleteButton.disabled = false;
                            deleteButton.textContent = 'Delete';
                        }
                    }
                });
            }
        } else {
            console.log(`No document found with ID ${Cname}`);
            // Clear UI elements here if needed
            clearDisplay();
        }
    } catch (error) {
        console.error("Error fetching document:", error);
        // Handle error gracefully, clear display or show error message
        clearDisplay();
    }
}




function clearDisplay() {
    const avatar = document.getElementById("avatarimg");
    const charName = avatar.nextElementSibling;
    const charDet = document.querySelector(".card__body p");

    const artifactMain = document.getElementById("artifactimg");
    const artifact1 = document.getElementById("artifactimg1");
    const artifact1Det = artifact1.nextElementSibling;
    const artifact2 = document.getElementById("artifactimg2");
    const artifact2Det = artifact2.nextElementSibling;

    const weapon = document.getElementById("weapon");
    const weaponimg1 = document.getElementById("weapon1");
    const weapon1Det = weaponimg1.nextElementSibling;
    const weaponimg2 = document.getElementById("weapon2");
    const weapon2Det = weaponimg2.nextElementSibling;

    const teamimg = document.getElementById("team");
    const teamimg1 = document.getElementById("team1");
    const teamimg2 = document.getElementById("team2");
    const teamimg3 = document.getElementById("team3");
    const teamimg4 = document.getElementById("team4");

    avatar.src = "";
    charName.textContent = "";
    charDet.textContent = "";

    artifactMain.src = "";
    artifact1.src = "";
    artifact1Det.textContent = "";
    artifact2.src = "";
    artifact2Det.textContent = "";

    weapon.src = "";
    weaponimg1.src = "";
    weapon1Det.textContent = "";
    weaponimg2.src = "";
    weapon2Det.textContent = "";

    teamimg.src = "";
    teamimg1.src = "";
    teamimg2.src = "";
    teamimg3.src = "";
    teamimg4.src = "";
}

async function DeleteDoc(Cname) {
    try {
        console.log("Deleting document and associated files:", Cname);

        const docRef = doc(db, "starrail", Cname); // Ensure proper document reference creation

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const charInfo = docSnap.data();
            console.log("Document data:", charInfo);

            // Delete associated images from Firebase Storage
            await Promise.all([
                deleteImage(charInfo.avatarImg),
                deleteImage(charInfo.artifact1Img),
                deleteImage(charInfo.artifact2Img),
                deleteImage(charInfo.weapon1Img),
                deleteImage(charInfo.weapon2Img),
                deleteImage(charInfo.team1Img),
                deleteImage(charInfo.team2Img),
                deleteImage(charInfo.team3Img),
                deleteImage(charInfo.team4Img)
            ]);

            // Delete document from Firestore
            await deleteDoc(docRef);

            console.log(`Document ${Cname} and associated files deleted successfully.`);
        } else {
            console.log(`Document ${Cname} not found.`);
        }
    } catch (error) {
        console.error("Error deleting document and associated files:", error);
        throw error;
    }
}

async function deleteImage(imageUrl) {
    if (!imageUrl) return;

    console.log("Deleting image:", imageUrl);

    try {
        // Create a reference to the storage service
        const storageRef = ref(storage, imageUrl);

        // Delete the file from the storage
        await deleteObject(storageRef);

        console.log(`Deleted file: ${imageUrl}`);
    } catch (error) {
        console.error("Error deleting image:", error);
        throw error;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('nameCardForm');
    const subButton = document.getElementById('submitButton');


    showCharacters();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const avatar = document.getElementById('avatar').files[0];
        const details = document.getElementById('nameDetails').value;
        const artifactImg1 = document.getElementById('artifactImg1').files[0];
        const artifactDetails1 = document.getElementById('artifactDetails1').value;
        const artifactImg2 = document.getElementById('artifactImg2').files[0];
        const artifactDetails2 = document.getElementById('artifactDetails2').value;
        const weaponImg1 = document.getElementById('weaponImg1').files[0];
        const weaponDetails1 = document.getElementById('weaponDetails1').value;
        const weaponImg2 = document.getElementById('weaponImg2').files[0];
        const weaponDetails2 = document.getElementById('weaponDetails2').value;
        const teamAvatar1 = document.getElementById('teamAvatar1').files[0];
        const teamAvatar2 = document.getElementById('teamAvatar2').files[0];
        const teamAvatar3 = document.getElementById('teamAvatar3').files[0];
        const teamAvatar4 = document.getElementById('teamAvatar4').files[0];

        try {
            if (subButton) {
                subButton.disabled = true;
                subButton.textContent = 'Uploading...';
            }

            const avatarUrl = await uploadImage(avatar, `starrail/${generateUniqueName(avatar.name)}`);
            const artifactImg1Url = await uploadImage(artifactImg1, `starrail/${generateUniqueName(artifactImg1.name)}`);
            const artifactImg2Url = await uploadImage(artifactImg2, `starrail/${generateUniqueName(artifactImg2.name)}`);
            const weaponImg1Url = await uploadImage(weaponImg1, `starrail/${generateUniqueName(weaponImg1.name)}`);
            const weaponImg2Url = await uploadImage(weaponImg2, `starrail/${generateUniqueName(weaponImg2.name)}`);
            const teamAvatar1Url = await uploadImage(teamAvatar1, `starrail/${generateUniqueName(teamAvatar1.name)}`);
            const teamAvatar2Url = await uploadImage(teamAvatar2, `starrail/${generateUniqueName(teamAvatar2.name)}`);
            const teamAvatar3Url = await uploadImage(teamAvatar3, `starrail/${generateUniqueName(teamAvatar3.name)}`);
            const teamAvatar4Url = await uploadImage(teamAvatar4, `starrail/${generateUniqueName(teamAvatar4.name)}`);

            // Generate a unique ID for the document
            const docRef = await addDoc(collection(db, "starrail"), {
                id: generateUniqueId(), // Generate unique ID
                Name: name,
                avatarImg: avatarUrl,
                details: details,
                artifact1Img: artifactImg1Url,
                artifact1Det: artifactDetails1,
                artifact2Img: artifactImg2Url,
                artifact2Det: artifactDetails2,
                weapon1Img: weaponImg1Url,
                weapon1Det: weaponDetails1,
                weapon2Img: weaponImg2Url,
                weapon2Det: weaponDetails2,
                team1Img: teamAvatar1Url,
                team2Img: teamAvatar2Url,
                team3Img: teamAvatar3Url,
                team4Img: teamAvatar4Url
            });

            console.log("Document written with ID: ", docRef.id);
            showAlert("Data uploaded successfully!");
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Error uploading data: " + e.message);
        } finally {
            if (subButton) {
                subButton.disabled = false;
                subButton.textContent = 'Submit';
            }
        }

        /* const deleteButton = document.getElementById('deleteButt');
     if (deleteButton) {
         deleteButton.addEventListener('click', async () => {
             try {
                 deleteButton.disabled = true;
                 deleteButton.textContent = 'Deleting...';
 
                 // Get the ID of the document to delete
                 const Cname = document.getElementById("avatarimg").nextElementSibling.textContent.trim();
 
                 // Call DeleteDoc function
                 await DeleteDoc(Cname);
 
                 // Clear display and hide modal or section
                 clearDisplay();
                 document.getElementById('starraildata').style.display = 'none';
             } catch (error) {
                 console.error('Error deleting document:', error);
                 // Handle error if necessary
             } finally {
                 deleteButton.disabled = false;
                 deleteButton.textContent = 'Delete';
             }
         });
     }*/
    });

    function generateUniqueName(originalName) {
        const timestamp = Date.now();
        const fileExtension = originalName.split('.').pop();
        return `${originalName.split('.')[0]}_${timestamp}.${fileExtension}`;
    }

    async function uploadImage(file, path) {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }

    function generateUniqueId() {
        // Generate a random 20-character string as ID
        return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    }

    const closeIcon = document.getElementById('closeicon');
    if (closeIcon) {
        closeIcon.addEventListener('click', () => {
            clearDisplay();
            form.reset();
            // Optionally, close your popup or hide the relevant section here
            document.getElementById('starraildata').style.display = 'none';
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
