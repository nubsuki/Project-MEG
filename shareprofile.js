import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile as updateAuthProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

document.getElementById('close').addEventListener('click', function () {
    document.getElementById('about-you').style.display = 'none';
});
document.getElementById('about-you').addEventListener('click', function () {
    document.getElementById('about-you').style.display = 'none';
});


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
            document.getElementById('crofileimg').src = profilePicUrl;
            document.getElementById('pusername').textContent = userData.username;
            document.getElementById('cusername').textContent = userData.username;
            document.getElementById('pdescription').textContent = userData.description;
            document.getElementById('cdescription').textContent = userData.description;

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
                if (loggedInUser === uid) {
                    const followButton = document.getElementById('followButton');
                    followButton.textContent = 'Profile';
                    followButton.disabled = true;
                    followButton.style.pointerEvents = 'none';
                    followButton.style.display = 'none';
                }
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


// Reference to Firestore collection
const postsCollection = collection(db, 'posts');
const reelsCollection = collection(db, 'reels');

document.addEventListener('DOMContentLoaded', function () {

    // Function to show the loading screen
    function showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    // Function to hide the loading screen
    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    // Function to fetch posts and reels from Firestore
    function fetchPostsAndReels() {
        showLoading();
        const postsQuery = query(postsCollection, where("userID", "==", uid)); // Filter posts by user ID
        const reelsQuery = query(reelsCollection, where("userID", "==", uid));

        // Fetch posts
        getDocs(postsQuery).then(postsSnapshot => {
            const postContainer = document.getElementById('postContainer');
            postContainer.innerHTML = ''; // Clear previous content

            postsSnapshot.forEach(doc => {
                const post = doc.data();
                const postId = doc.id;

                // Check if the post has an image URL
                if (post.imgUrl) {
                    const postElement = createPostElement(post, postId);
                    postContainer.appendChild(postElement);
                }
            });
        }).catch(error => {
            console.error('Error fetching posts:', error);
        });

        // Fetch reels (videos)
        getDocs(reelsQuery).then(reelsSnapshot => {
            const reelsContainer = document.getElementById('reelsContainer');
            reelsContainer.innerHTML = ''; // Clear previous content

            reelsSnapshot.forEach(doc => {
                const reel = doc.data();
                const reelId = doc.id;

                // Check if the reel has a video URL
                if (reel.imgUrl) {
                    const reelElement = createReelElement(reel, reelId);
                    reelsContainer.appendChild(reelElement);
                }
            });
            hideLoading();
        }).catch(error => {
            console.error('Error fetching reels:', error);
            hideLoading();
        });
    }

    // Function to create a post element
    function createPostElement(post, postId) {
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

        // No delete button or bottom container for posts without delete functionality

        return postElement;
    }

    // Function to create a reel element (video)
    function createReelElement(reel, reelId) {
        const reelElement = document.createElement('div');
        reelElement.classList.add('content');
        reelElement.setAttribute('data-type', 'video');

        // Create video element
        const videoElement = document.createElement('video');
        videoElement.src = reel.imgUrl;
        videoElement.controls = true; // Enable controls
        reelElement.appendChild(videoElement);

        // No delete button or bottom container for reels without delete functionality

        return reelElement;
    }

    // Call fetchPostsAndReels function when DOM content is loaded
    fetchPostsAndReels();
});
