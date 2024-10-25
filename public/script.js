
    document.getElementById('post-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;

        // Check if the post with the given title exists to determine if we are creating or updating
        const existingPost = await checkPostExists(title);

        if (existingPost) {
            // Update the existing post
            await updatePost(existingPost.title, title, content);
        } else {
            // Create a new post
            await createPost(title, content);
        }

        // Clear the form fields
        document.getElementById('title').value = '';
        document.getElementById('content').value = '';

        // Reload the posts
        loadPosts();
    });

    async function createPost(title, content) {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content })
        });

        if (response.ok) {
            document.getElementById('post-message').innerText = 'Post created successfully!';
        } else {
            const errorData = await response.json();
            document.getElementById('post-message').innerText = errorData.message || 'Failed to create post.';
        }
    }

    async function updatePost(oldTitle, newTitle, newContent) {
        const url = '/api/posts'; // Endpoint to update post by title
        const isAuthenticated = localStorage.getItem('token');
    
        if (!isAuthenticated) {
            alert('You must be logged in to edit a post.');
            return;
        }
    
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${isAuthenticated}`
                },
                body: JSON.stringify({ oldTitle, newTitle, newContent })
            });
    
            if (response.ok) {
                document.getElementById('post-message').innerText = 'Post updated successfully!';
            } else {
                const errorData = await response.json();
                document.getElementById('post-message').innerText = errorData.message || 'Failed to update post.';
            }
    
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('post-message').innerText = 'An error occurred while updating the post.';
        }
    }
    

    async function checkPostExists(title) {
        const response = await fetch('/posts');
        const posts = await response.json();

        return posts.find(post => post.title === title);
    }

    async function loadPosts() {
        const response = await fetch('/posts');
        const posts = await response.json();
    
        const postSection = document.getElementById('post-section');
        postSection.innerHTML = ''; // Clear previous posts
    
        const isAuthenticated = localStorage.getItem('token'); // Check if user is logged in
        const currentUserId = getCurrentUserId(); // Implement this function to get the current user's ID from the token or storage
    
        posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('post', 'bg-gray-900', 'p-4', 'mb-4', 'rounded-md');
    
            // Format the creation date
            const createdAt = new Date(post.created_at);
            const formattedDate = isNaN(createdAt.getTime()) ? 'Invalid date' : createdAt.toLocaleString();
    
            postDiv.innerHTML = `
                <h2 class="text-xl font-bold text-white">${post.title}</h2>
                <p class="text-white mt-2">${post.content}</p>
                <p class="text-gray-600 text-sm">Created at: ${formattedDate}</p>
               
            `;
    
            // Only show edit and delete buttons if the user is authenticated and they are the post owner
            if (isAuthenticated && post.userId === currentUserId) {
                postDiv.innerHTML += `
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md mt-2" data-id="${post.id}">Edit</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mt-2" data-id="${post.id}">Delete</button>
                `;
            }
    
            postSection.appendChild(postDiv);
        });
    
        // Add event listeners for edit and delete buttons
        addButtonEventListeners();
    }
    
    // Implement this function to decode the JWT and get the user's ID
    function getCurrentUserId() {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1])); // Decode the JWT payload
            return payload.userId; // Adjust this according to your token structure
        }
        return null;
    }
    
    function addButtonEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const postId = this.dataset.id;
                editPost(postId);
            });
        });
    
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const postId = this.dataset.id;
    
                try {
                    const response = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}` // Include token in request
                        }
                    });
    
                    if (response.ok) {
                        loadPosts(); // Reload posts after deletion
                    } else {
                        console.error('Error deleting post');
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            });
        });
    }
    
    function editPost(postId) {
        fetch('http://localhost:3000/posts')
            .then(response => response.json())
            .then(posts => {
                const post = posts.find(p => p.id == postId);
                document.getElementById('title').value = post.title;
                document.getElementById('content').value = post.content;
    
                // Change button text to "Save Post" when editing
                document.querySelector('button[type="submit"]').innerText = 'Save Post';
    
                // Scroll to the form
                document.getElementById('post-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
    }
    
    
    // Load posts on page load
    loadPosts();
   