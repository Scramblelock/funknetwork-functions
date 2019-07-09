const { db } = require('../util/admin');

exports.getAllFunkPosts = (req, res) => {
  db.collection('funk posts')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let funkPosts = [];
      data.forEach((doc) => {
        funkPosts.push({
          funkPostId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage
        });
      });
      return res.json(funkPosts);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOneFunkPost = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Body must not be empty' });
  }

  const newFunkPost = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection('funk posts')
    .add(newFunkPost)
    .then((doc) => {
      const resFunkPost = newFunkPost;
      resFunkPost.funkPostId = doc.id;
      res.json(resFunkPost);
    })
    .catch((err) => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};
// Fetch one FunkPost
exports.getFunkPost = (req, res) => {
  let funkPostData = {};
  db.doc(`/funkPosts/${req.params.funkPostId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Funk Post not found' });
      }
      funkPostData = doc.data();
      funkPostData.funkPostId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('funkPostId', '==', req.params.funkPostId)
        .get();
    })
    .then((data) => {
      funkPostData.comments = [];
      data.forEach((doc) => {
        funkPostData.comments.push(doc.data());
      });
      return res.json(funkPostData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Comment on a comment
exports.commentOnFunkPost = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'Must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    funkPostId: req.params.funkPostId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };
  console.log(newComment);

  db.doc(`/funkPosts/${req.params.funkPostId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Funk Post not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
};
// Like a Funk Post
exports.likeFunkPost = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('funkPostId', '==', req.params.funkPostId)
    .limit(1);

  const funkPostDocument = db.doc(`/funkPosts/${req.params.funkPostId}`);

  let funkPostData;

  funkPostDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        funkPostData = doc.data();
        funkPostData.funkPostId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Funk Post not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            funkPostId: req.params.funkPostId,
            userHandle: req.user.handle
          })
          .then(() => {
            funkPostData.likeCount++;
            return funkPostDocument.update({ likeCount: funkPostData.likeCount });
          })
          .then(() => {
            return res.json(funkPostData);
          });
      } else {
        return res.status(400).json({ error: 'Funk Post already liked' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeFunkPost = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('funkPostId', '==', req.params.funkPostId)
    .limit(1);

  const funkPostDocument = db.doc(`/funkPosts/${req.params.funkPostId}`);

  let funkPostData;

  funkPostDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        funkPostData = doc.data();
        funkPostData.funkPostId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Funk Post not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Funk Post not liked' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            funkPostData.likeCount--;
            return funkPostDocument.update({ likeCount: funkPostData.likeCount });
          })
          .then(() => {
            res.json(funkPostData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Delete a Funk Post
exports.deleteFunkPost = (req, res) => {
  const document = db.doc(`/funkPosts/${req.params.funkPostId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Funk Post not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Funk Post deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};