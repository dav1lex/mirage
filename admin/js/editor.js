// Quill editor initialization and utilities
let editor = null;

function initEditor() {
    // Initialize Quill editor
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image']
    ];

    editor = new Quill('#editor', {
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Napisz treść artykułu...',
        theme: 'snow'
    });

    // SEO checking functions
    editor.on('text-change', function() {
        updateSEOScore();
    });

    return editor;
}

// Auto-generate slug from title
function setupSlugGenerator() {
    document.getElementById('postTitle').addEventListener('input', (e) => {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .replace(/ą/g, 'a')
            .replace(/ć/g, 'c')
            .replace(/ę/g, 'e')
            .replace(/ł/g, 'l')
            .replace(/ń/g, 'n')
            .replace(/ó/g, 'o')
            .replace(/ś/g, 's')
            .replace(/ż|ź/g, 'z');
        
        document.getElementById('urlSlug').value = slug;
        
        // Update title character count
        const count = e.target.value.length;
        document.getElementById('titleCount').textContent = count;
        
        updateSEOScore();
    });
}

// Meta description counter
function setupMetaDescriptionCounter() {
    document.getElementById('metaDescription').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('metaCount').textContent = count;
        
        if (count > 155) {
            document.getElementById('metaCount').classList.add('text-red-500');
        } else {
            document.getElementById('metaCount').classList.remove('text-red-500');
        }
        
        updateSEOScore();
    });
}

// Keywords tracking
function setupKeywordsTracking() {
    document.getElementById('keywords').addEventListener('input', () => {
        updateSEOScore();
    });
}

// Update SEO score
function updateSEOScore() {
    let score = 0;
    let checks = 0;
    
    // Check title length
    const titleLength = document.getElementById('postTitle').value.length;
    if (titleLength > 0) {
        checks++;
        if (titleLength >= 40 && titleLength <= 60) {
            score++;
            document.getElementById('seo-title-status').innerHTML = '🟢 Doskonale';
        } else if (titleLength >= 30 && titleLength < 40) {
            score += 0.5;
            document.getElementById('seo-title-status').innerHTML = '🟡 W porządku';
        } else {
            document.getElementById('seo-title-status').innerHTML = '🔴 Za krótki lub za długi';
        }
    }
    
    // Check meta description
    const metaLength = document.getElementById('metaDescription').value.length;
    if (metaLength > 0) {
        checks++;
        if (metaLength >= 120 && metaLength <= 160) {
            score++;
            document.getElementById('seo-desc-status').innerHTML = '🟢 Doskonale';
        } else if (metaLength >= 80 && metaLength < 120) {
            score += 0.5;
            document.getElementById('seo-desc-status').innerHTML = '🟡 W porządku';
        } else {
            document.getElementById('seo-desc-status').innerHTML = '🔴 Za krótki lub za długi';
        }
    }
    
    // Check content length
    const contentLength = editor.getText().length;
    if (contentLength > 0) {
        checks++;
        if (contentLength >= 1500) {
            score++;
            document.getElementById('seo-content-status').innerHTML = '🟢 Doskonale';
        } else if (contentLength >= 800 && contentLength < 1500) {
            score += 0.5;
            document.getElementById('seo-content-status').innerHTML = '🟡 W porządku';
        } else {
            document.getElementById('seo-content-status').innerHTML = '🔴 Za krótki';
        }
    }
    
    // Check keywords
    const keywordsValue = document.getElementById('keywords').value;
    if (keywordsValue.length > 0) {
        checks++;
        const keywords = keywordsValue.split(',');
        if (keywords.length >= 3) {
            score++;
            document.getElementById('seo-keyword-status').innerHTML = '🟢 Doskonale';
        } else if (keywords.length > 0) {
            score += 0.5;
            document.getElementById('seo-keyword-status').innerHTML = '🟡 Dodaj więcej słów kluczowych';
        } else {
            document.getElementById('seo-keyword-status').innerHTML = '🔴 Brak słów kluczowych';
        }
    }
    
    // Calculate percentage
    const percent = checks > 0 ? Math.round((score / checks) * 100) : 0;
    
    // Update score
    document.getElementById('seo-score-value').textContent = `${percent}%`;
    
    // Update badge color
    const badge = document.getElementById('seo-score-badge');
    if (percent >= 80) {
        badge.className = 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium';
    } else if (percent >= 50) {
        badge.className = 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium';
    } else {
        badge.className = 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium';
    }
}

// Export functions
window.editorUtils = {
    initEditor,
    setupSlugGenerator,
    setupMetaDescriptionCounter,
    setupKeywordsTracking,
    updateSEOScore
};