let db = {
	users: [
    {
      userId: 'dh23ggj5h32g543j5gf43',
      email: 'user@email.com',
      handle: 'user',
      createdAt: '2019-03-15T10:59:52.798Z',
      imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
      bio: 'Hello, my name is user, nice to meet you',
      website: 'https://user.com',
      location: 'Lonodn, UK'
    }
  ],
	funkPosts: [
		{
			userHandle: 'user',
			body: 'this is the funk post body',
			createdAt: "2019-06-28T22:25:22.530Z", 
			likeCount: 5,
			commentCount: 2
		}
	], 
  comments: [
    {
      userHandle: 'user',
      funkPostId: 'kdjsfgdksuufhgkdsufky',
      body: 'nice one mate!',
      createdAt: '2019-03-15T10:59:52.798Z'
    }
  ], 
  notifications: [
    {
      recipient: 'user',
      sender: 'john',
      read: 'true | false',
      funkPostId: 'kdjsfgdksuufhgkdsufky',
      type: 'like | comment',
      createdAt: '2019-03-15T10:59:52.798Z'
    }
  ]
};

const userDetails = {
  // Redux data
  credentials: {
    userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
    email: 'user@email.com',
    handle: 'user',
    createdAt: '2019-03-15T10:59:52.798Z',
    imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
    bio: 'Hello, my name is user, nice to meet you',
    website: 'https://user.com',
    location: 'Lonodn, UK'
  },
  likes: [
    {
      userHandle: 'user',
      funkPostId: 'hh7O5oWfWucVzGbHH2pa'
    },
    {
      userHandle: 'user',
      funkPostId: '3IOnFoQexRcofs5OhBXO'
    }
  ]
};
