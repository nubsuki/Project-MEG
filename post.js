import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, deleteDoc, getDoc, orderBy, collection, limit, query, serverTimestamp, onSnapshot,updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


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

let displayArr = [];
let currentIndex = 0;
let commentsSnapshot;



async function populateTagDropdown() {
    try {
        const docRef = doc(db, "TagList", "tagsDocument");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const tags = docSnap.data().tags;
            const tagDropdown = document.getElementById('tag');

            tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                tagDropdown.appendChild(option);
            });
        } else {
            console.log("No such document!");
        }
    } catch (e) {
        console.error("Error getting document: ", e);
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const addPostIcon = document.getElementById('addPostIcon');
    const addPostModal = document.getElementById('addPostModal');
    const closeModal = document.getElementById('closeModal');
    const tagDropdown = document.getElementById('tag');
    const tagList = document.getElementById('tagList');
    const addPostForm = document.getElementById('addPostForm');
    const successMessage = document.getElementById('successMessage');
    const submitButton = document.getElementById('submitButton');
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    const sendButton = document.getElementById('sendCommentButton');
    const reportPostIcon = document.getElementById('reportPostIcon');
    const currentUserID = localStorage.getItem('loggedInUserId');

    const reportPostModal = document.getElementById('reportPostModal');
    const closeReportModal = document.getElementById('closeReportModal');
    const reportPostForm = document.getElementById('reportPostForm');
    const reportReasonInput = document.getElementById('reportReason');
    const reportButton = document.getElementById('reportButton');

    if (!currentUserID) {
        console.log("Yep, no user ID");
    } else {
        console.log(currentUserID);
    }

    const commentInput = document.getElementById('commentInput');
    const sendCommentButton = document.getElementById('sendCommentButton');
    const commentsWindow = document.querySelector('.comments-window');

    let commentsSnapshot;
    let loadedCommentIds = new Set();

    reportPostIcon.addEventListener('click', () => {
        reportPostModal.style.display = 'block';
    });

    closeReportModal.addEventListener('click', () => {
        reportPostModal.style.display = 'none';
    });

    reportPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        reportButton.disabled = true;
        reportButton.textContent = 'Reporting';
        
        const currentPostIndex = displayArr[currentIndex];
        const reporterId = localStorage.getItem('loggedInUserId');
        const reportReason = reportReasonInput.value;
    
        const postRef = query(collection(db, "posts"), where("index", "==", currentPostIndex));
        const postSnapshot = await getDocs(postRef);
    
        if (!postSnapshot.empty) {
            const postId = postSnapshot.docs[0].id; 
            const postData = postSnapshot.docs[0].data();
            await reportPost(postId, reporterId, postData, reportReason);
        } else {
            console.error("No post found with this index");
        }
        
        // Hide the modal after submitting the report
        reportPostModal.style.display = 'none';

        reportPostForm.reset();

        reportButton.disabled = false;
        reportButton.textContent = 'Report';
    });

    async function reportPost(postId, reporterId, postData, reportReason) {
        try {
          const reportData = {
            postId: postId,
            caption: postData.caption,
            postContent: postData.description,
            posterId: postData.userID,
            imgUrl: postData.imgUrl,
            reason: reportReason
          };
      
          // Add the report to Firestore and get the document reference
          const reportDocRef = await addDoc(collection(db, "reports"), reportData);
          
          // Get the document ID
          const reportDocId = reportDocRef.id;
          
          // Update the document with the document ID
          await updateDoc(reportDocRef, { reportId: reportDocId });
      
          console.log("Post report added successfully:", {...reportData, reportId: reportDocId});
            showAlert('Post reported successfully.');
        } catch (error) {
            console.error("Error reporting post:", error);
        }
    }



    addPostIcon.addEventListener('click', function () {
        addPostModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', function () {
        addPostModal.style.display = 'none';
        tagList.innerHTML = '';
        tagDropdown.selectedIndex = 0;
        successMessage.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target === addPostModal) {
            addPostModal.style.display = 'none';
            tagList.innerHTML = '';
            tagDropdown.selectedIndex = 0;
            successMessage.style.display = 'none';
        }
    });

    populateTagDropdown();

    tagDropdown.addEventListener('change', function () {
        const selectedTag = tagDropdown.value;
        const existingTags = Array.from(tagList.getElementsByTagName('li')).map(li => li.textContent);
        if (selectedTag && !existingTags.includes(selectedTag)) {
            const listItem = document.createElement('li');
            listItem.textContent = selectedTag;
            tagList.appendChild(listItem);
        }
    });

    async function getCurrentUsername() {
        const currentUserID = localStorage.getItem('loggedInUserId');
        const userRef = doc(db, "users", currentUserID);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data().username; // Return the username
        } else {
            console.error("No user document found.");
            return ''; // Handle the case where no user document exists
        }
    }




    // Helper function to display the current post
    function displayPost(index) {
        console.log("index value: ", index);
        // Function to show the loading screen
        function showLoading() {
            document.getElementById('loading').style.display = 'block';
        }

        // Function to hide the loading screen
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }
        if (index < 0 || index >= displayArr.length) {
            console.error("Index out of bounds");
            return;
        }

        console.log('Displaying post at index:', index); // Debug log

        const postIndex = displayArr[index];
        console.log('Post index for loading comments:', postIndex); // Debug log for postIndex

        const postRef = query(collection(db, "posts"), where("index", "==", postIndex));
        getDocs(postRef).then((querySnapshot) => {
            if (!querySnapshot.empty) {
                showLoading();
                const post = querySnapshot.docs[0].data();
                const postContent = document.getElementById('postContent');
                postContent.innerHTML = `
                    <div class="post">
                        <div class="post-caption" alt="Loading....">${post.caption}</div>
                        <div class="post-description" alt="Loading....">${post.description}</div>
                        <img class="post-img"src="${post.imgUrl}" alt="Loading....">
                    </div>
                `;
                loadComments(postIndex); // Call to load comments for the current post
            } else {
                console.log("No post found with this index");
            }
            hideLoading();
        }).catch((error) => {
            console.error("Error fetching post: ", error);
            hideLoading();
        });
    }




    addPostForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const postName = document.getElementById('postName').value;
        const caption = document.getElementById('caption').value;
        const description = document.getElementById('description').value;
        const tags = Array.from(tagList.getElementsByTagName('li')).map(li => li.textContent);
        const fileUpload = document.getElementById('fileUpload').files[0];

        const userID = currentUserID;

        let imgUrl = '';

        if (tags.length === 0) {
            showAlert('Please select at least one tag');
            return;
        }

        if (fileUpload) {
            const maxSizeInBytes = 20 * 1024 * 1024; // 20MB
            if (fileUpload.size > maxSizeInBytes) {
                alert('File size exceeds the 50MB limit. Please choose a smaller file.');
                return;
            }
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        if (fileUpload) {
            const timestamp = new Date().getTime(); // Generate a timestamp
            const uniqueFileName = `${timestamp}_${fileUpload.name}`; // Combine timestamp with the original file name
            const storageRef = ref(storage, `PostImg/${uniqueFileName}`);
            const uploadTask = uploadBytesResumable(storageRef, fileUpload);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optional: Handle progress updates
                },
                (error) => {
                    console.error('Upload failed:', error);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit';
                },
                async () => {
                    imgUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    savePost(postName, caption, description, tags, userID, imgUrl);
                }
            );
        } else {
            savePost(postName, caption, description, tags, userID, imgUrl);
        }
    });


    async function savePost(postName, caption, description, tags, userID, imgUrl) {
        try {
            await addDoc(collection(db, "posts"), {
                userID,
                postName,
                caption,
                description,
                tags,
                imgUrl,
                index: await getNewIndex(),
                timestamp: serverTimestamp()
            });
            console.log("Document successfully written!");
            addPostModal.style.display = 'none';
            addPostForm.reset();
            tagList.innerHTML = '';
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        } catch (e) {
            console.error("Error adding document: ", e);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        }
    }

    const getNewIndex = async () => {
        const postsQuery = query(collection(db, "posts"), orderBy('index', 'desc'), limit(1));
        const queryS = await getDocs(postsQuery);
        if (!queryS.empty) {
            const lastpost = queryS.docs[0].data();
            return lastpost.index + 1;
        } else {
            return 1;
        }
    };

    async function fetchUserTags() {
        const currentUserID = localStorage.getItem('loggedInUserId');
        const userRef = doc(db, "users", currentUserID);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userTags = userData.tags; // Get user tags from userData
            const tagsArray = Array.isArray(userTags) ? userTags : []; // Ensure tagsArray is an array

            await populateDisplayArr(tagsArray); // Pass tagsArray to populateDisplayArr
            displayPost(currentIndex); // Display the first post
        } else {
            console.error("No such user document!");
        }
    }


    async function populateDisplayArr(tags) {
        if (!Array.isArray(tags)) {
            console.error("Tags parameter is not an array:", tags);
            return;
        }

        displayArr = []; // Ensure displayArr is cleared before populating

        if (tags.length === 0) {
            // If tags array is empty, fetch all post indexes
            const postsQuery = query(collection(db, "posts"));
            const querySnapshot = await getDocs(postsQuery);
            querySnapshot.forEach((doc) => {
                const post = doc.data();
                displayArr.push(post.index);
            });
        } else {
            // If tags array is not empty, filter posts by tags
            const postsQuery = query(collection(db, "posts"));
            const querySnapshot = await getDocs(postsQuery);
            querySnapshot.forEach((doc) => {
                const post = doc.data();
                if (Array.isArray(post.tags)) {
                    if (post.tags.some(tag => tags.includes(tag))) {
                        displayArr.push(post.index);
                    }
                } else {
                    console.error("Post tags are not an array:", post.tags);
                }
            });
        }

        displayArr.sort((a, b) => a - b); // Optional: Sort the displayArr by index
    }




    leftArrow.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            clearComments();
            displayPost(currentIndex);
        }
    });

    rightArrow.addEventListener('click', () => {
        if (currentIndex < displayArr.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // Reset to 0 when end is reached
        }
        clearComments();
        displayPost(currentIndex);
    });


    function clearComments() {
        const commentsWindow = document.querySelector('.comments-window');
        commentsWindow.innerHTML = ''; // Clear previous comments
    }

    sendCommentButton.addEventListener('click', async () => {
        const commentText = commentInput.value.trim();
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
        if (commentText !== '') {
            await addComment(currentIndex, commentText);
            commentInput.value = ''; // Clear input field after adding comment
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        }
    });




    async function addComment(postIndex, commentText) {
        try {
            const userName = await getCurrentUsername(); // Await here to get the username correctly
            const newCommentRef = await addDoc(collection(db, "comments"), {
                comment: commentText,
                commentIndex: await getNewCommentIndex(displayArr[postIndex]), // Use displayArr to get the actual postIndex value
                postIndex: displayArr[postIndex], // Use displayArr to get the actual postIndex value
                userName: userName,
                userID: currentUserID,
                timestamp: serverTimestamp()
            });
            console.log("Comment added successfully with ID: ", newCommentRef.id);
            console.log("Stored comment data:", {
                comment: commentText,
                postIndex: displayArr[postIndex], // Use displayArr to get the actual postIndex value
                userName: userName
            });

            // Append the new comment to the UI without resetting the existing comments
            /*appendCommentToUI({
                comment: commentText,
                userName: userName,
                timestamp: { seconds: Date.now() / 1000 } // Use current time for immediate UI update
            });*/
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    }




    async function loadComments(postIndex) {
        console.log('Loading comments for post index:', postIndex); // Debug log
    
        const commentsQuery = query(
            collection(db, "comments"),
            where("postIndex", "==", postIndex),
            orderBy('timestamp', 'asc')
        );
    
        // Clear any existing snapshot listener
        if (commentsSnapshot) {
            commentsSnapshot(); // Detach the previous listener
        }
    
        // Clear the loadedCommentIds set
        loadedCommentIds.clear();
    
        // Clear the comments window
        commentsWindow.innerHTML = '';
    
        // Create and append the comment count element
        const commentCountElement = document.createElement('p');
        commentCountElement.id = 'comment-count';
        commentsWindow.appendChild(commentCountElement);
    
        commentsSnapshot = onSnapshot(commentsQuery, (querySnapshot) => {
            console.log('Snapshot received:', querySnapshot.size, 'comments'); // Debug
    
            const commCount = querySnapshot.size;
            commentCountElement.textContent = 'Comment count: ' + commCount;
    
            if (querySnapshot.empty) {
                // Append a message if no comments are available
                const noCommentsElement = document.createElement('p');
                noCommentsElement.textContent = '';
                commentsWindow.appendChild(noCommentsElement);
            } else {
                // Append each comment to the comments window
                querySnapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const commentData = change.doc.data();
                        const commentId = change.doc.id;
                        console.log('Processing comment ID:', commentId); // Debug
                        if (!loadedCommentIds.has(commentId)) {
                            appendCommentToUI(commentData, commentId);
                            loadedCommentIds.add(commentId);
                        }
                    }
                });
            }
        });
    }

    async function appendCommentToUI(comment, commentId) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.dataset.commentId = commentId; // Set the comment ID as a data attribute
        commentElement.innerHTML = `
            <div class="comment-user">${comment.userName}</div>
            <div class="comment-text">${comment.comment}</div>
            <div class="comment-timestamp">${comment.timestamp ? new Date(comment.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</div>
            <div class="comment-actions">
                <div class="dropdown">
                    <button class="dropdown-toggle">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <div class="dropdown-menu">
                        ${await shouldShowDeleteButton(comment.userID) ? `
                            <a href="#" class="delete-action" data-comment-id="${commentId}">Delete</a>
                        ` : ''}
                        ${await shouldShowReportButton(comment.userID) ? `
                            <a href="#" class="report-action" data-comment-id="${commentId}">Report</a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        commentsWindow.appendChild(commentElement);

        // Add event listener to the dropdown toggle button
        commentElement.querySelector('.dropdown-toggle').addEventListener('click', function () {
            commentElement.querySelector('.dropdown-menu').classList.toggle('show');
        });

        // Add event listener to the delete button if shown
        const deleteAction = commentElement.querySelector('.delete-action');
        if (deleteAction) {
            deleteAction.addEventListener('click', async function (event) {
                event.preventDefault();
                const commentId = event.target.dataset.commentId;
                try {
                    await deleteComment(commentId);
                    showAlert(`Deleted comment: ${comment.comment}`);
                    commentElement.remove();
                } catch (error) {
                    console.error("Error deleting comment: ", error);
                }
            });
        }

        // Add event listener to the report action if shown
        const reportAction = commentElement.querySelector('.report-action');
        if (reportAction) {
            reportAction.addEventListener('click', async function (event) {
                event.preventDefault();
                const commentId = event.target.dataset.commentId;
                const reporterId = localStorage.getItem('loggedInUserId'); // Assuming logged-in user ID is stored in localStorage
                const commentText = comment.comment; // Assuming comment text is directly available in the comment object
                await reportComment(commentId, reporterId, commentText);
            });
        }
    }

    async function shouldShowReportButton(commentUserId) {
        const currentUserID = localStorage.getItem('loggedInUserId');
        if (!currentUserID) {
            console.error("No logged-in user found.");
            return false;
        }

        // Check if the comment is not from the current user
        const isNotCurrentUser = currentUserID !== commentUserId;
        console.log(`shouldShowReportButton: isNotCurrentUser=${isNotCurrentUser}, currentUserID=${currentUserID}, commentUserId=${commentUserId}`);
        return isNotCurrentUser;
    }

    async function shouldShowDeleteButton(commentUserId) {
        const currentUserID = localStorage.getItem('loggedInUserId');
        if (!currentUserID) {
            console.error("No logged-in user found.");
            return false;
        }

        const userRef = doc(db, "users", currentUserID);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdminOrOwner = isAdmin(userData) || currentUserID === commentUserId;
            console.log(`shouldShowDeleteButton: isAdminOrOwner=${isAdminOrOwner}, currentUserID=${currentUserID}, commentUserId=${commentUserId}`);
            return isAdminOrOwner;
        } else {
            console.error("No user document found for current user.");
            return false;
        }
    }

    function isAdmin(userData) {
        // Ensure userData has been passed correctly from Firestore
        if (!userData || !userData.role) {
            console.error("User data or role not available.");
            return false;
        }

        // Check if user role indicates admin
        return userData.role === 'admin';
    }








    async function getNewCommentIndex(postIndex) {
        const commentsQuery = query(collection(db, "comments"), where("postIndex", "==", postIndex), orderBy('commentIndex', 'desc'), limit(1));

        const querySnapshot = await getDocs(commentsQuery);
        if (!querySnapshot.empty) {
            const lastComment = querySnapshot.docs[0].data();
            return lastComment.commentIndex + 1;
        } else {
            return 1;
        }
    }

    //drop down
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('report-action')) {
            event.preventDefault();
            const commentId = event.target.dataset.commentId;
            // Handle the report action for the comment with commentId
            console.log(`Report comment with ID: ${commentId}`);
        } else if (event.target.classList.contains('delete-action')) {
            event.preventDefault();
            const commentId = event.target.dataset.commentId;
            // Handle the delete action for the comment with commentId
            console.log(`Delete comment with ID: ${commentId}`);
            await deleteComment(commentId);
        }
    });


    async function reportComment(commentId, reporterId, commentT) {
        try {
            const commentRef = doc(db, "comments", commentId);
            const commentDoc = await getDoc(commentRef);
            if (commentDoc.exists()) {
                const commentData = commentDoc.data();
                const reportData = {
                    postcommentId: commentId,
                    commentText: commentT,
                    commenterId: commentData.userID, // Assuming userId is stored in comments collection
                    reporterId: reporterId
                };
                await addDoc(collection(db, "reports"), reportData);
                console.log("Report added successfully:", reportData);
                showAlert('Comment reported successfully.');
            } else {
                console.error("Comment document not found.");
            }
        } catch (error) {
            console.error("Error reporting comment:", error);
        }
    }


    async function deleteComment(commentId) {
        try {
            // Delete comment document from Firestore
            await deleteDoc(doc(db, "comments", commentId));
            console.log(`Comment with ID: ${commentId} has been deleted from Firestore.`);

            // Remove comment from UI
            const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
                console.log(`Comment with ID: ${commentId} has been removed from the UI.`);
            } else {
                console.error(`Comment element not found for ID: ${commentId}`);
                // Optional: Display a message or handle the scenario where the element is not found
            }
        } catch (error) {
            console.error("Error deleting comment: ", error);
        }
    }


    loadComments(currentIndex);
    fetchUserTags();
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
