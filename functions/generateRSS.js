const { Feed } = require('feed');
const admin = require('firebase-admin');

exports.generateRSS = functions.https.onRequest(async (req, res) => {
    const feed = new Feed({
        title: "EnglishPro Blog",
        description: "Expert English learning tips and resources",
        id: "https://yourdomain.com/blog",
        link: "https://yourdomain.com/blog",
        language: "en",
        image: "https://yourdomain.com/logo.png",
        favicon: "https://yourdomain.com/favicon.ico",
        copyright: "All rights reserved 2025, EnglishPro",
        updated: new Date(),
        generator: "EnglishPro RSS Feed",
        feedLinks: {
            rss2: "https://yourdomain.com/rss.xml",
            atom: "https://yourdomain.com/atom.xml",
        },
        author: {
            name: "EnglishPro",
            email: "contact@yourdomain.com",
            link: "https://yourdomain.com"
        }
    });

    const postsSnapshot = await admin.firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

    postsSnapshot.forEach(doc => {
        const post = doc.data();
        feed.addItem({
            title: post.title,
            id: `https://yourdomain.com/blog/${post.slug}`,
            link: `https://yourdomain.com/blog/${post.slug}`,
            description: post.metaDescription,
            content: post.content,
            author: [{
                name: "EnglishPro",
                email: "contact@yourdomain.com",
                link: "https://yourdomain.com"
            }],
            date: post.createdAt.toDate(),
            image: post.imageUrl
        });
    });

    res.set('Content-Type', 'application/xml');
    res.send(feed.rss2());
});