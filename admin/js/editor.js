import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

let editor = null;

window.addEventListener('DOMContentLoaded', () => {
    editor = new Editor({
        element: document.querySelector('#editor'),
        extensions: [
            StarterKit,
        ],
        content: '<p>Start writing your post...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none'
            }
        }
    });

    // Auto-generate slug from title
    document.getElementById('postTitle').addEventListener('input', (e) => {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        document.getElementById('urlSlug').value = slug;
    });

    // Meta description counter
    document.getElementById('metaDescription').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('metaCount').textContent = count;
        if (count > 155) {
            document.getElementById('metaCount').classList.add('text-red-500');
        } else {
            document.getElementById('metaCount').classList.remove('text-red-500');
        }
    });
});