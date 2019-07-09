const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const cors = require('cors');
app.use(cors());

const { db } = require('./util/admin');

const { 
	getAllFunkPosts, 
	postOneFunkPost, 
	getFunkPost, 
	commentOnFunkPost, 
	likeFunkPost,
	unlikeFunkPost,
	deleteFunkPost
} = require('./handlers/funkPosts');

const { 
	signup, 
	login, 
	uploadImage, 
	addUserDetails,
	getAuthenticatedUser, 
	getUserDetails,
	markNotificationsRead
} = require('./handlers/users');

// funkPost routes
app.get('/funkPosts', getAllFunkPosts);
app.post('/funkPost', FBAuth, postOneFunkPost);
app.get('/funkPost/:funkPostId', getFunkPost);
app.delete('/funkPost/:funkPostId', FBAuth, deleteFunkPost);
app.get('/funkPost/:funkPostId/like', FBAuth, likeFunkPost);
app.get('/funkPost/:funkPostId/unlike', FBAuth, unlikeFunkPost);
app.post('/funkPost/:funkPostId/comment', FBAuth, commentOnFunkPost);

// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
	.firestore.document('likes/{id}')
	.onCreate((snapshot) => {
		return db
			.doc(`/funkPosts/${snapshot.data().funkPostId}`)
			.get()
			.then((doc) => {
				if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
					return db.doc('/notifications/${snapshot.id}').set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'like',
						read: false,
						funkPostId: doc.id
					});
				}
			})
			.catch((err) => {
				console.error(err);
			});
	});

exports.deleteNotificationOnUnlike = functions
	.firestore.document('likes/{id}')
	.onDelete((snapshot) => {
		return db.doc(`/notifications/${snapshot.id}`)
			.delete()
			.catch((err) => {
				console.error(err);
				return;
			});
	});

exports.createNotificationOnComment = functions
	.firestore.document('comments/{id}')
	.onCreate((snapshot) => {
		return db
			.doc(`/funkPosts/${snapshot.data().funkPostId}`)
			.get()
			.then((doc) => {
				if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
					return db.doc('/notifications/${snapshot.id}').set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'comment',
						read: false,
						funkPostId: doc.id
					});
				}
			})
			.catch((err) => {
				console.error(err);
				return;
			});
		});

exports.onUserImageChange = functions
	.firestore.document('/users/{userId}')
	.onUpdate((change) => {
		if (change.before.data().imageUrl !== change.after.data().imageUrl) {
			const batch = db.batch();
			return db
				.collection('funk posts')
				.where('userHandle', '==', change.before.data().handle)
				.get()
				.then((data) => {
					data.forEach((doc) => {
						const funkPost = db.doc(`/funkPosts/${doc.id}`);
						batch.update(funkPost, { userImage: change.after.data().imageUrl });
					})
					return batch.commit();
				});
		} else return true;
	});

exports.onFunkPostDelete = functions
  .firestore.document('/funkPosts/{funkPostId}')
  .onDelete((snapshot, context) => {
    const funkPostId = context.params.funkPostId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('funkPostId', '==', funkPostId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('funkPostId', '==', funkPostId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('funkPostId', '==', funkPostId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
