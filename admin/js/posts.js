// Blog post management utilities
const postsUtils = {
    // Initialize posts functionality
    init(db, editor) {
        this.db = db;
        this.editor = editor;
        this.currentPostId = null;
        
        // Set up event listeners
        document.getElementById('newPostBtn')?.addEventListener('click', () => {
            this.openPostModal();
        });
        
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closePostModal();
        });
        
        document.getElementById('cancelPost')?.addEventListener('click', () => {
            this.closePostModal();
        });
        
        document.getElementById('postForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePost();
        });
        
        // Load posts on initialization
        this.loadPosts();
    },
    
    // Load all posts from Firestore
    async loadPosts() {
        const postsList = document.getElementById('postsList');
        
        try {
            // Show loading state
            postsList.innerHTML = `
                <div class="text-center py-6">
                    <i class="fas fa-circle-notch fa-spin text-green-500 text-2xl"></i>
                    <p class="mt-2 text-gray-600">Ładowanie artykułów...</p>
                </div>
            `;
            
            // Get posts from Firestore, ordered by creation date
            const snapshot = await this.db.collection('posts')
                .orderBy('createdAt', 'desc')
                .get();
            
            if (snapshot.empty) {
                postsList.innerHTML = `
                    <div class="text-center py-6 bg-gray-50 rounded-lg">
                        <i class="fas fa-file-alt text-gray-400 text-3xl mb-2"></i>
                        <p class="text-gray-600">Brak artykułów. Kliknij "Nowy artykuł", aby dodać pierwszy wpis.</p>
                    </div>
                `;
                return;
            }
            
            // Clear posts list
            postsList.innerHTML = '';
            
            // Render each post
            snapshot.forEach(doc => {
                const post = doc.data();
                const postElement = this.createPostElement(doc.id, post);
                postsList.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
            
            postsList.innerHTML = `
                <div class="text-center py-6 bg-red-50 rounded-lg">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-2"></i>
                    <p class="text-red-600">Błąd podczas ładowania artykułów.</p>
                    <button class="mt-2 text-blue-600 hover:underline" onclick="postsUtils.loadPosts()">
                        Spróbuj ponownie
                    </button>
                </div>
            `;
        }
    },
    
    // Create a post element for the list
    createPostElement(id, post) {
        const div = document.createElement('div');
        div.className = 'bg-white shadow rounded-lg overflow-hidden';
        
        const date = post.createdAt?.toDate() || new Date();
        const formattedDate = date.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Category label styling
        const categoryColor = post.category ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        
        div.innerHTML = `
            <div class="p-5">
                <div class="flex justify-between items-start">
                    <h3 class="text-xl font-semibold text-gray-900 mb-1 flex-grow">${post.title}</h3>
                    <div class="flex space-x-2">
                        <button class="edit-post-btn text-blue-600 hover:text-blue-800" data-id="${id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-post-btn text-red-600 hover:text-red-800" data-id="${id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex items-center text-gray-500 text-sm mb-3">
                    <span class="mr-3">
                        <i class="far fa-calendar mr-1"></i> ${formattedDate}
                    </span>
                    <span class="mr-3">
                        <i class="far fa-eye mr-1"></i> ${post.views || 0} odsłon
                    </span>
                    <span class="${categoryColor} px-2 py-1 rounded-full text-xs font-medium">
                        ${post.category || 'Bez kategorii'}
                    </span>
                </div>
                
                <p class="text-gray-600 mb-3 line-clamp-2">${post.metaDescription || ''}</p>
                
                <div class="flex flex-wrap gap-1 mt-2">
                    ${(post.keywords || '')
                        .split(',')
                        .map(keyword => keyword.trim())
                        .filter(keyword => keyword)
                        .map(keyword => `
                            <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                ${keyword}
                            </span>
                        `)
                        .join('')
                    }
                </div>
            </div>
            <div class="bg-gray-50 px-5 py-3 border-t">
                <a href="/blog/post.html?slug=${post.slug}" target="_blank" class="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                    <i class="far fa-eye mr-1"></i> Zobacz artykuł
                </a>
            </div>
        `;
        
        // Add event listeners
        div.querySelector('.edit-post-btn').addEventListener('click', () => {
            this.editPost(id);
        });
        
        div.querySelector('.delete-post-btn').addEventListener('click', () => {
            this.confirmDeletePost(id, post.title);
        });
        
        return div;
    },
    
    // Open post modal (for new post or editing)
    openPostModal(postId = null) {
        const modal = document.getElementById('postModal');
        const modalTitle = document.getElementById('modalTitle');
        
        // Reset form
        document.getElementById('postForm').reset();
        this.editor.root.innerHTML = '';
        
        // Update UI based on whether we're editing or creating
        this.currentPostId = postId;
        
        if (postId) {
            modalTitle.textContent = 'Edytuj artykuł';
            this.loadPostData(postId);
        } else {
            modalTitle.textContent = 'Nowy artykuł';
            
            // Initialize with default values for new post
            this.editor.root.innerHTML = '<p>Napisz treść artykułu...</p>';
            
            // Initialize category dropdown with default
            const categorySelect = document.getElementById('postCategory');
            if (categorySelect) {
                categorySelect.value = '';
            }
        }
        
        // Show modal
        modal.classList.remove('hidden');
    },
    
    // Close post modal
    closePostModal() {
        const modal = document.getElementById('postModal');
        
        // Reset state
        this.currentPostId = null;
        
        // Hide modal
        modal.classList.add('hidden');
    },
    
    // Load post data for editing
    async loadPostData(postId) {
        try {
            const doc = await this.db.collection('posts').doc(postId).get();
            
            if (!doc.exists) {
                console.error('Post not found');
                return;
            }
            
            const post = doc.data();
            
            // Fill form fields
            document.getElementById('postTitle').value = post.title || '';
            document.getElementById('metaDescription').value = post.metaDescription || '';
            document.getElementById('urlSlug').value = post.slug || '';
            document.getElementById('keywords').value = post.keywords || '';
            document.getElementById('imageUrl').value = post.imageUrl || '';
            
            // Set category if it exists
            const categorySelect = document.getElementById('postCategory');
            if (categorySelect && post.category) {
                categorySelect.value = post.category;
            }
            
            // Set editor content
            this.editor.root.innerHTML = post.content || '';
            
            // Update character counts
            document.getElementById('titleCount').textContent = post.title?.length || 0;
            document.getElementById('metaCount').textContent = post.metaDescription?.length || 0;
            
            // Update SEO score
            window.editorUtils.updateSEOScore();
        } catch (error) {
            console.error('Error loading post data:', error);
        }
    },
    
    // Save post (create or update)
    async savePost() {
        const titleInput = document.getElementById('postTitle');
        const metaDescriptionInput = document.getElementById('metaDescription');
        const slugInput = document.getElementById('urlSlug');
        const keywordsInput = document.getElementById('keywords');
        const imageUrlInput = document.getElementById('imageUrl');
        const categorySelect = document.getElementById('postCategory');
        
        // Validate required fields
        if (!titleInput.value || !slugInput.value) {
            alert('Tytuł i slug URL są wymagane.');
            return;
        }
        
        try {
            // Prepare post data
            const postData = {
                title: titleInput.value,
                metaDescription: metaDescriptionInput.value,
                slug: slugInput.value,
                keywords: keywordsInput.value,
                imageUrl: imageUrlInput.value,
                content: this.editor.root.innerHTML,
                plainContent: this.editor.getText(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add category if selected
            if (categorySelect && categorySelect.value) {
                postData.category = categorySelect.value;
            }
            
            // Calculate reading time (approx. 225 words per minute)
            const wordCount = postData.plainContent.split(/\s+/).length;
            postData.readingTime = `${Math.max(1, Math.ceil(wordCount / 225))} min`;
            
            if (this.currentPostId) {
                // Update existing post
                await this.db.collection('posts').doc(this.currentPostId).update(postData);
            } else {
                // Create new post
                postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                postData.views = 0;
                
                await this.db.collection('posts').add(postData);
            }
            
            // Close modal and reload posts
            this.closePostModal();
            this.loadPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            alert(`Błąd podczas zapisywania artykułu: ${error.message}`);
        }
    },
    
    // Confirm post deletion
    confirmDeletePost(postId, postTitle) {
        if (confirm(`Czy na pewno chcesz usunąć artykuł "${postTitle}"? Tej operacji nie można cofnąć.`)) {
            this.deletePost(postId);
        }
    },
    
    // Delete post
    async deletePost(postId) {
        try {
            await this.db.collection('posts').doc(postId).delete();
            this.loadPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            alert(`Błąd podczas usuwania artykułu: ${error.message}`);
        }
    }
};

// Export posts utilities
window.postsUtils = postsUtils; 