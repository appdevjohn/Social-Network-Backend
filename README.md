# Social Network API
This is an open source API for common social network features. It comes complete with Authentication, Messaging, and Posting, with Stories coming in the future.

## Setting Up
To run this on a local machine, PostgreSQL must be started. This was tested with PostgreSQL 14, but that version is not necessarily a requirement. Once Postgres is running, the database can be set up - this can be done with the `setup.sql` file in `src/database`. An environment variable file `.env` must also be created to define at least the following variables:
```
PGUSER=user
PGHOST=localhost
PGDATABASE=social_network
PGPASSWORD=password1
PGPORT=5432
```
Once the database and environment variables are set up, the app can be run with `npm run dev`. A production build can be generated with `npm build`, then it can be run with `npm start`. After setting everything up, it is recommended to run `npm test` to ensure everything is working.

## Endpoints

### Auth
Accounts on this social network require a unique email address, unique username, first name, last name, and a password of at least four characters. After signing up, the account must be activated before it is allowed to participate in the network.
<br><br>

**`GET /auth/ping`**<br>
A token must be present in the Authorization header. This endpoint will return whether or not the token is still valid.
<br><br>

**`PUT /auth/login`**<br>
Gets an Authorization token for the client.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|email|body|true|The email address for the account.|
|password|body|true|The password the account.|
```
{
    userId: '1234'
    token: 'eyJhbGciOiJIUzI1NiI...',
    activated: true,
    message: 'You are now logged in.'
}
```
<br>

**`POST /auth/signup`**<br>
Creates a new account.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|firstName|body|true|The first name of the user.|
|lastName|body|true|The last name of the user.|
|username|body|true|The username for the account. Must be alphanumeric and unique.|
|email|body|true|The email address the account.|
|password|body|true|The password for the account. Must be at least four characters.|
```
{
    userId: '1234'
    token: 'eyJhbGciOiJIUzI1NiI...',
    activated: false,
    message: 'Find our activation email to activate your account.'
}
```
<br>

**`POST /auth/confirm-email`**<br>
Activates the account using a code sent the the account holder's inbox.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|activateToken|body|true|The activation token sent to the user's inbox. Needed to activate the account.|
```
{
    activated: true,
    message: 'You can now sign into the account.'
}
```
<br>

### Groups
A group is a community of users. Users can share posts within groups, and only other members of that group can view the posts. Posts can only be sent from within a group. Group members can see who else is in the group and send them direct messages.
<br><br>

**`GET /groups/validate/:groupName`**<br>
Returns whether or not a group name references a real group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupName|param|true|The name of the group.|
```
{
    groupName: 'Nintendo Gamers',
    valid: true
}
```
<br>

**`GET /groups`**<br>
Returns all of the groups the user is currently involved in.<br>
```
{
    groups: [
        {
            id: '1234',
            name: 'Nintendo Gamers'
        }
    ]
}
```
<br>

**`GET /groups/:groupId`**<br>
Returns details about the group and the members in the group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers'
    },
    members: [
        {
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: '$2b$12$24.gTVOvhU9vNYlCWtxQ5u9UlinOjZ8.gSyIevxbmCM2oH4Ik9/K2',
            activated: true,
            activateToken: '',
            id: '1234'
        }
    ]
}
```
<br>

**`POST /groups/new`**<br>
Creates a new group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|name|body|true|The name of the group. Must be unique.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers'
    },
    members: [
        {
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: '$2b$12$24.gTVOvhU9vNYlCWtxQ5u9UlinOjZ8.gSyIevxbmCM2oH4Ik9/K2',
            activated: true,
            activateToken: '',
            id: '1234'
        }
    ]
}
```
<br>

**`PUT /groups/edit`**<br>
Edits the details of a group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|id|body|true|The ID of the group to modify.|
|name|body|true|The updated name of the group. Must be unique.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers'
    },
    members: [
        {
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: '$2b$12$24.gTVOvhU9vNYlCWtxQ5u9UlinOjZ8.gSyIevxbmCM2oH4Ik9/K2',
            activated: true,
            activateToken: '',
            id: '1234'
        }
    ]
}
```
<br>

**`DELETE /groups/delete`**<br>
Deletes a group and all of the posts in that group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|id|body|true|The ID of the group to delete.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers'
  }
}
```
<br>

### Posts
A post contains a title and content, which can be text, media, or both. Users who are authorized to see the post can comment on the post.
<br><br>

**`GET /posts/?groupId=asdf`**<br>
Returns all posts from a group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|query|true|The ID of the group from which to query posts.|
```
{
    posts: [
        {
            userId: '1234',
            groupId: '5678',
            title: 'What are your predictions for WWDC 2021?',
            text: 'I bet they'll announce a new MacBook Pro.',
            media: null,
            userData: {
                firstName: 'John',
                lastName: 'Champion',
                email: 'john@bison.software',
                username: 'appdevjohn'
            },
            id: '7654'
        }
    ]
}
```
<br>

**`GET /posts/:postId`**<br>
Returns data for a specific post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|postId|param|true|The ID of the post.|
```
{
    post: {
        userId: '1234',
        groupId: '5678',
        title: 'What are your predictions for WWDC 2021?',
        text: 'I bet they'll announce a new MacBook Pro.',
        media: null,
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '7654'
    },
    messages: [
        {
            userId: '1234',
            convoId: null,
            postId: '6543',
            content: 'Chances of that are ~50/50',
            type: 'text',
            userData: {
                firstName: 'John',
                lastName: 'Champion',
                email: 'john@bison.software',
                username: 'appdevjohn'
            },
            id: '2345'
        }
    ]
}
```
<br>

**`POST /posts/new`**<br>
Creates a new post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|body|true|The ID of the group where this post should go.|
|title|body|true|The title of the post.|
|text|body|false|The text content of the post.|
```
{
    post: {
        userId: '1234',
        groupId: '5678',
        title: 'What are your predictions for WWDC 2021?',
        text: 'I bet they'll announce a new MacBook Pro.',
        media: null,
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '7654'
    }
}
```
<br>

**`PUT /posts/edit`**<br>
Edits an existing post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|postId|body|true|The ID of post to be edited.|
|title|body|true|The title of the post.|
|text|body|false|The text content of the post.|
```
{
    post: {
        userId: '1234',
        groupId: '5678',
        title: 'What are your predictions for WWDC 2021?',
        text: 'I bet they'll announce a new MacBook Pro.',
        media: null,
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '7654'
    }
}
```
<br>

**`DELETE /posts/delete`**<br>
Edits an existing post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|postId|body|true|The ID of post to be deleted.|
```
{
    post: {
        userId: '1234',
        groupId: '5678',
        title: 'What are your predictions for WWDC 2021?',
        text: 'I bet they'll announce a new MacBook Pro.',
        media: null,
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '7654'
    }
}
```
<br>

**`GET /posts/:postId/messages`**<br>
Gets the current list of messages sent in a post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|postId|param|true|The ID of post where messages are to be retrieved.|
```
{
    messages: [
        {
            userId: '1234',
            convoId: null,
            postId: '6543',
            content: 'Chances of that are ~50/50',
            type: 'text',
            userData: {
                firstName: 'John',
                lastName: 'Champion',
                email: 'john@bison.software',
                username: 'appdevjohn'
            },
            id: '2345'
        }
    ]
}
```
<br>

**`POST /posts/add-message`**<br>
Sends a message from within a post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|postId|body|true|The ID of post where the message should be sent.|
|content|body|true|The content of the message, be it text or a link to media.|
|type|body|true|The type of content of the message. Can either be 'text' or 'image'.|
```
{
    message: {
        userId: '1234',
        convoId: null,
        postId: '6543',
        content: 'Chances of that are ~50/50',
        type: 'text',
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '2345'
    }
}
```
<br>

**`DELETE /posts/delete-message`**<br>
Deletes a message from a post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|messageId|body|true|The ID of message to be deleted.|
```
{
    message: {
        userId: '1234',
        convoId: null,
        postId: '6543',
        content: 'Chances of that are ~50/50',
        type: 'text',
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '2345'
    }
}
```
<br>

### Messaging
Messaging works exaclty like one might expect. Multi-media messages are sent in a thread with one or more people. Conversations do not exist within groups; rather, users can start conversations with anyone on the platform.
<br><br>

**`GET /validate-recipient/:username`**<br>
Returns whether or not a user exists, given a username.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|username|param|true|The username of the user.|
```
{
    username: 'appdevjohn',
    valid: true
}
```
<br>

**`GET /conversations`**<br>
Returns the conversations which the user is involved in.<br>
```
{
    conversations: [
        {
            name: 'Pokemangos',
            id: '1234'
        }
    ]
}
```
<br>

**`GET /conversations/:convoId`**<br>
Returns data for a conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|param|true|The ID conversation to get.|
```
{
    conversation: {
        name: 'Pokemangos',
        id: '1234'
    },
    members: [
        {
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: '$2b$12$24.gTVOvhU9vNYlCWtxQ5u9UlinOjZ8.gSyIevxbmCM2oH4Ik9/K2',
            activated: true,
            activateToken: '',
            id: '1234'
        }
    ],
    messages [
        {
            userId: '1234',
            convoId: '1234,
            postId: null,
            content: 'Hey folks',
            type: 'text',
            userData: {
                firstName: 'John',
                lastName: 'Champion',
                email: 'john@bison.software',
                username: 'appdevjohn'
            },
            id: '5678'
        }
    ]
}
```
<br>

**`GET /conversations/:convoId/messages`**<br>
Returns only message data for a conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|param|true|The ID conversation to get.|
```
{
    messages [
        {
            userId: '1234',
            convoId: '1234,
            postId: null,
            content: 'Hey folks',
            type: 'text',
            userData: {
                firstName: 'John',
                lastName: 'Champion',
                email: 'john@bison.software',
                username: 'appdevjohn'
            },
            id: '5678'
        }
    ]
}
```
<br>

**`GET /messages/:messageId`**<br>
Returns a single message.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|messageId|param|true|The ID of the message.|
```
{
    message: {
        userId: '1234',
        convoId: '1234,
        postId: null,
        content: 'Hey folks',
        type: 'text',
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '5678'
    }
}
```
<br>

**`POST /conversations/new`**<br>
Creates a new conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|name|body|true|The name of the conversation.|
|members|body|true|An array of usernames to add as members. (JSON.stringify)|
```
{
    conversation: {
        name: 'Pokemangos',
        id: '1234'
    },
    members: [
        {
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: '$2b$12$24.gTVOvhU9vNYlCWtxQ5u9UlinOjZ8.gSyIevxbmCM2oH4Ik9/K2',
            activated: true,
            activateToken: '',
            id: '1234'
        }
    ]
}
```
<br>

**`PUT /conversations/edit`**<br>
Creates a new conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|body|true|The ID of the conversation.|
|newName|body|true|The updated name of the conversation|
```
{
    conversation: {
        name: 'Pokemangos',
        id: '1234'
    },
    members: [
        {
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: '$2b$12$24.gTVOvhU9vNYlCWtxQ5u9UlinOjZ8.gSyIevxbmCM2oH4Ik9/K2',
            activated: true,
            activateToken: '',
            id: '1234'
        }
    ]
}
```
<br>

**`PUT /conversations/leave`**<br>
Removes this user from the conversation. Even if this user created the conversation, it cannot be deleted until everyone leaves.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|body|true|The ID of the conversation.|
```
{
    conversation: {
        name: 'Pokemangos',
        id: '1234'
    }
}
```
<br>

**`POST /messages/new`**<br>
Sends a message in a conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|body|true|The ID of the conversation to send a message.|
|content|body|true|The content of the message, be it text or a link to media.|
|type|body|true|The type of content of the message. Can either be 'text' or 'image'.|
```
{
    message: {
        userId: '1234',
        convoId: '1234,
        postId: null,
        content: 'Hey folks',
        type: 'text',
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '5678'
    }
}
```
<br>

**`DELETE /messages/delete`**<br>
Deletes a message from a conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|messageId|body|true|The ID of the message to delete.|
```
{
    message: {
        userId: '1234',
        convoId: '1234,
        postId: null,
        content: 'Hey folks',
        type: 'text',
        userData: {
            firstName: 'John',
            lastName: 'Champion',
            email: 'john@bison.software',
            username: 'appdevjohn'
        },
        id: '5678'
    }
}
```