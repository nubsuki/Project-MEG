import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth , onAuthStateChanged, updateProfile as updateAuthProfile} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc ,setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

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

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const uid = urlParams.get('uid');
const loggedInUser = localStorage.getItem('loggedInUserId');

const getUserData = async (userId) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            const profilePicUrl = userData.profilePicUrl || 'Assests/saberpf.jpg';
            document.getElementById('profileimg').src = profilePicUrl;
            document.getElementById('pusername').textContent = userData.username;
            document.getElementById('pdescription').textContent = userData.description;

            // Fetch follower and followed counts
            await getFollowerCount(userId);
            await getFollowedCount(userId);

            // Check if logged-in user is already following this user
            const friendsRef = doc(db, 'friends', userId);
            const friendsDoc = await getDoc(friendsRef);

            if (friendsDoc.exists()) {
                const friendsData = friendsDoc.data();
                const followersArray = friendsData.followers || [];
                if (followersArray.includes(loggedInUser)) {
                    toggleFollowButton(true); // User is already followed
                } else {
                    toggleFollowButton(false); // User is not followed
                }

                // Disable follow button if viewing own profile
                if (loggedInUser === userId) {
                    disableFollowButton();
                }
            } else {
                console.error('Friends document not found for user:', userId);
            }
        } else {
            console.error('User not found');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
};


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

const generateQRCode = (url) => {
    const qrcodeContainer = document.getElementById('qrcode-container');
    qrcodeContainer.innerHTML = '';
    new QRCode(qrcodeContainer, {
        text: url,
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.H,
    });
};

const openModal = () => {
    const modal = document.getElementById('qrCodeModal');
    modal.style.display = 'block';
};

const closeModal = () => {
    const modal = document.getElementById('qrCodeModal');
    modal.style.display = 'none';
};

const downloadQRCode = () => {
    html2canvas(document.querySelector('#qrcode-container')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'qrcode.jpg';
        link.href = canvas.toDataURL('image/jpeg');
        link.click();
    }).catch(error => {
        console.error('Error capturing QR code:', error);
    });
};

document.getElementById('pfshare').addEventListener('click', () => {
    const url = window.location.href;
    generateQRCode(url);
    openModal();
});

document.getElementById('downloadBtn').addEventListener('click', downloadQRCode);

document.querySelector('.close').addEventListener('click', closeModal);

window.onclick = (event) => {
    const modal = document.getElementById('qrCodeModal');
    if (event.target === modal) {
        closeModal();
    }
};

if (uid) {
    getUserData(uid);

    const followButton = document.getElementById('followButton');
    followButton.addEventListener('click', () => {
        const isFollowing = followButton.textContent === 'Unfollow';
        handleFollow(uid, isFollowing);
    });
} else {
    console.error('No user ID specified in the URL');
}

onAuthStateChanged(auth, (user) => {
    const followButton = document.getElementById('followButton');
    const pfshare = document.getElementById('pfshare');
    if (user) {
        // User is logged in
        followButton.style.display = 'block';
        followButton.style.pointerEvents = 'auto';
        console.log("User is logged in:", user.email);
        pfshare.style.display = 'block';
    } else {
        // User is not logged in
        followButton.style.display = 'none';
        pfshare.style.display = 'none';
    }
});

const handleFollow = async (userId, isFollowing) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();

            // Update followers array in Firestore under friends > {url uid} > followers
            const friendsRef = doc(db, 'friends', userId);
            const friendsDoc = await getDoc(friendsRef);

            if (friendsDoc.exists()) {
                const friendsData = friendsDoc.data();
                let followersArray = friendsData.followers || [];

                if (isFollowing) {
                    // Unfollow user
                    followersArray = followersArray.filter(uid => uid !== loggedInUser);
                } else {
                    // Follow user
                    followersArray.push(loggedInUser);
                }

                await updateDoc(friendsRef, {
                    followers: followersArray
                });

                // Update followed array for the logged-in user under friends > loggedInUser > followed
                const loggedInUserRef = doc(db, 'friends', loggedInUser);
                const loggedInUserDoc = await getDoc(loggedInUserRef);

                if (loggedInUserDoc.exists()) {
                    const loggedInUserData = loggedInUserDoc.data();
                    let followedArray = loggedInUserData.followed || [];

                    if (isFollowing) {
                        // Unfollow user
                        followedArray = followedArray.filter(uid => uid !== userId);
                    } else {
                        // Follow user
                        followedArray.push(userId);
                    }

                    await updateDoc(loggedInUserRef, {
                        followed: followedArray
                    });

                    console.log(isFollowing ? 'Successfully unfollowed user.' : 'Successfully followed user.');
                    toggleFollowButton(!isFollowing); // Toggle follow button state
                    // Optionally update UI to reflect follow status
                } else {
                    await setDoc(loggedInUserRef, {
                        followed: [userId]
                    });

                    console.log('Successfully followed user.');
                    toggleFollowButton(true); // Toggle follow button state
                    // Optionally update UI to reflect follow status
                }
            } else {
                // Create new friends document if it doesn't exist
                await setDoc(friendsRef, {
                    followers: [loggedInUser]
                });

                // Update followed array for the logged-in user under friends > loggedInUser > followed
                const loggedInUserRef = doc(db, 'friends', loggedInUser);
                await setDoc(loggedInUserRef, {
                    followed: [userId]
                });

                console.log('Successfully followed user.');
                toggleFollowButton(true); // Toggle follow button state
                // Optionally update UI to reflect follow status
            }
        } else {
            console.error('User not found');
        }
    } catch (error) {
        console.error('Error following user:', error);
    }
};

const toggleFollowButton = (isFollowing) => {
    const followButton = document.getElementById('followButton');
    if (isFollowing) {
        followButton.textContent = 'Unfollow';
    } else {
        followButton.textContent = 'Follow';
    }
    followButton.disabled = false; // Enable button by default
    followButton.style.pointerEvents = 'auto';
};

const disableFollowButton = () => {
    const followButton = document.getElementById('followButton');
    followButton.textContent = 'Profile';
    followButton.disabled = true;
    followButton.style.pointerEvents = 'none'; 
};
