# Social Network API
This is an open source API for common social network features. It comes complete with Authentication, Messaging, and Posting, with Stories coming in the future.

## Setting Up
To run this on a local machine, PostgreSQL must be started. This was tested with PostgreSQL 13, but that version is not necessarily a requirement. Once Postgres is running, the database can be set up - this can be done with the `setup.sql` file in [this repository](https://github.com/appdevjohn/Social-Network-PostgreSQL-Config/blob/master/setup.sql). An environment variable file `.env` must also be created to define at least the following variables. Five are used to connect to the PostgreSQL database, and one is used in JSON web token generation.
```
PGUSER=user
PGHOST=localhost
PGDATABASE=social_network
PGPASSWORD=password1
PGPORT=5432
TOKEN_SECRET=somesecret

SENDGRID_API_KEY=sendgridapikey                         # Optional - For sending emails with SendGrid
APP_DOMAIN_NAME=https://www.this-service-url.com    # Optional - For generating links to the web app.
```
Once the database and environment variables are set up, the app can be run with `npm run dev`. A production build can be generated with `npm run build`, then it can be run with `npm start`. After setting everything up, it is recommended to run `npm test` to ensure everything is working.

### Setting Up with Docker
This app can be run in docker as long as the required environment variables listed above are set. A port must also be mapped.
```
docker run -p 8080:8080 social-network-backend
```
If you're connecting to the database through a docker network, make sure the PGHOST environment variable is the name of the container running the database.

### Setting Up with Docker Compose
This API is the core of a three-part system to spin up a social network. If the [frontend](https://github.com/appdevjohn/Messenger-Hawk) and [database](https://github.com/appdevjohn/Social-Network-PostgreSQL-Config) repositories are cloned in addition to this one, you can use Docker Compose to spin them all up properly. Follow the configuration instructions for each on setting up environment variables, then run the following command.Note that each folder on the drive must be named appropriately so the containers can communicate. By default, the container names are `postgres`, `backend`, and `frontend`.
```
docker-compose up
```

## Endpoints

### Auth
Accounts on this social network require a unique email address, unique username, first name, last name, and a password of at least four characters. After signing up, the account must be activated before it is allowed to participate in the network.
<br><br>

**`GET /auth/ping`**<br>
A token must be present in the Authorization header. This endpoint will return whether or not the token is still valid.
```
{
    message: 'Authenticated',
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        username: 'appdevjohn',
        email: 'john@bison.software',
        profilePicURL: 'http://localhost:8080/uploads/image.png'
    }
}
```
<br>

**`PUT /auth/login`**<br>
Gets an Authorization token for the client.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|email|body|true|The email address for the account.|
|password|body|true|The password the account.|
```
{
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        username: 'appdevjohn',
        email: 'john@bison.software',
        profilePicURL: 'http://localhost:8080/uploads/image.png'
    }
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
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        username: 'appdevjohn',
        email: 'john@bison.software',
        profilePicURL: null
    }
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
    token: 'eyJhbGciOiJIUzI1NiI...',
    message: 'You can now sign into the account.'
}
```
<br>

**`PUT /auth/resend-verification-code`**<br>
Sends a new email with a new account activation code to the user.<br>
```
{
    message: 'A new verification code has been emailed.'
}
```
<br>

**`PUT /auth/request-new-password`**<br>
Sends a password reset link to an email address.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|email|body|true|The email account to send the password reset link.|
```
{
    status: 'Reset Email Sent',
    message: 'A password reset email has been sent to the account holder.'
}
```
<br>

**`PUT /auth/reset-password`**<br>
Resets an account's password.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|resetPasswordToken|body|true|The password reset token that was embedded in the link emailed to the user.|
|newPassword|body|true|The new account password.|
```
{
    status: 'Password Reset',
    message: 'You can now sign into the account.'
}
```
<br>

**`DELETE /auth/delete-account`**<br>
Deletes a user account. The account to be deleted will be that which is embedded in the authentication token.<br>
```
{
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        username: 'appdevjohn',
        email: 'john@bison.software',
        profilePicURL: 'http://localhost:8080/uploads/image.png'
    },
    message: 'User account has been deleted.'
}
```
<br>

### Users
User endpoints are distinct from auth endpoints in that they deal with personal information about the account, such as the name and username.
<br><br>

**`GET /users/:userId`**<br>
Returns data for a user.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|userId|param|true|The ID of the user to get.|
```
{
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        email: 'john@bison.software',
        username: 'appdevjohn',
        profilePicURL: 'http://localhost:8080/uploads/image.png'
    }
}
```
<br>

**`PUT /users/edit`**<br>
Edits a user's profile info.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|userId|body|true|The ID of the user to update.|
|firstName|body|false|The new first name for the user.|
|lastName|body|false|The new last name for the user.|
|username|body|false|The new username for the user.|
```
{
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        email: 'john@bison.software',
        username: 'appdevjohn',
        profilePicURL: 'http://localhost:8080/uploads/image.png'
    }
}
```
<br>

**`PUT /users/edit-image`**<br>
Edits a user's profile picture.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|image|file|true|The image to be set as the profile picture.|
```
{
    user: {
        id: '1234',
        firstName: 'John',
        lastName: 'Champion',
        email: 'john@bison.software',
        username: 'appdevjohn',
        profilePicURL: 'http://localhost:8080/uploads/image.png'
    }
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
            name: 'Nintendo Gamers',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z'
        }
    ]
}
```
<br>

**`GET /groups/:groupId`**<br>
Returns details about the group, the members in the group, and the users requesting to join.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    members: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            admin: true,
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        }
    ],
    requests: [
        {
            id: '5678',
            firstName: 'James',
            lastName: 'Hamil',
            username: 'jameshamil',
            email: 'james@bison.software',
            admin: false,
            profilePicURL: 'http://localhost:8080/uploads/image2.png'
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
|description|body|true|A group description.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    members: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            admin: false,
            profilePicURL: 'http://localhost:8080/uploads/image.png'
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
|name|body|false|The updated name of the group. Must be unique.|
|description|body|false|The updated description of the group.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    members: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            admin: false,
            profilePicURL: 'http://localhost:8080/uploads/image.png'
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
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    }
}
```
<br>

**`POST /groups/:groupId/add-user`**<br>
Adds a user to a group. Users can either be added pre-approved or in a pending-approval state.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to add the user.|
|userId|body|true|The ID of the user which to add to the group.|
|approved|body|true|Boolean value representing whether this user is approved immediately. If false, they will have to be approved by an admin.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        approved: true,
        admin: false,
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    }
}
```
<br>

**`POST /groups/:groupId/remove-user`**<br>
Removes a user from a group. If user was pending approval to join the group, that request will be cancelled.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to remove the user.|
|userId|body|true|The ID of the user which to remove from the group.|
```
{
    removed: true,
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    userId: '1234'
}
```
<br>

**`POST /groups/:groupId/requests/:userId/approve`**<br>
Removes a user from a group. If user was pending approval to join the group, that request will be cancelled.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to add the user.|
|userId|param|true|The ID of the user which to add to the group.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    userId: '1234'
}
```
<br>

**`PUT /groups/:groupId/set-admin`**<br>
Sets the admin status of a user within a group to true or false. There must always be at least one admin user in a group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to add the user.|
|userId|body|true|The ID of the user which to add to the group.|
|admin|body|true|Whether or not this user is an admin.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    userId: '1234',
    admin: true
}
```
<br>

**`GET /groups/:groupId/requests`**<br>
Returns the complete list of requests to join a group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to get join requests.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    users: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        }
    ]
}
```
<br>

**`GET /groups/:groupId/admins`**<br>
Returns the list of admins in a group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to find the admins.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    users: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        }
    ]
}
```
<br>

**`GET /groups/:groupId/members`**<br>
Returns the complete list of members in a group.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|groupId|param|true|The ID of the group which to get the members.|
```
{
    group: {
        id: '1234',
        name: 'Nintendo Gamers',
        description: 'Group for Nintendo and gaming enthusiasts.',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    users: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            admin: false,
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        }
    ]
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
                username: 'appdevjohn',
                profilePicURL: 'http://localhost:8080/uploads/image.png'
            },
            id: '7654',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z'
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '7654',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
                username: 'appdevjohn',
                profilePicURL: 'http://localhost:8080/uploads/image.png'
            },
            id: '2345',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z'
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '7654',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '7654',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    }
}
```
<br>

**`DELETE /posts/:postId`**<br>
Edits an existing post.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|postId|param|true|The ID of post to be deleted.|
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '7654',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
                username: 'appdevjohn',
                profilePicURL: 'http://localhost:8080/uploads/image.png'
            },
            id: '2345',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z'
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
|content|body|true, if no attachment|The text content of the message.|
|attachment|file|true, if no text content|The file to be uploaded as the message content.|
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '2345',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '2345',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
Returns the conversations which the user is involved in. Also returns the last message that was sent so a preview or snippet might displayed.<br>
```
{
    conversations: [
        {
            name: 'Pokemangos',
            id: '1234',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z',
            lastReadMessageId: '5678',
            snippet: {
                userId: '1234',
                convoId: '1234,
                postId: null,
                content: 'Hey folks',
                type: 'text',
                userData: {
                    firstName: 'John',
                    lastName: 'Champion',
                    email: 'john@bison.software',
                    username: 'appdevjohn',
                    profilePicURL: 'http://localhost:8080/uploads/image.png'
                },
                id: '5678',
                createdAt: '2021-06-10T18:16:50.085Z',
                updatedAt: '2021-06-10T18:16:50.085Z'
            }
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
        id: '1234',
        lastReadMessageId: '5678',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    members: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
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
                username: 'appdevjohn',
                profilePicURL: 'http://localhost:8080/uploads/image.png'
            },
            id: '5678',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z'
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
                username: 'appdevjohn',
                profilePicURL: 'http://localhost:8080/uploads/image.png'
            },
            id: '5678',
            createdAt: '2021-06-10T18:16:50.085Z',
            updatedAt: '2021-06-10T18:16:50.085Z'
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '5678',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
        id: '1234',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    members: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
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
        id: '1234',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    },
    members: [
        {
            id: '1234',
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
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
        id: '1234',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    }
}
```
<br>

**`POST /messages/new`**<br>
Sends a message in a conversation.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|body|true|The ID of the conversation to send a message.|
|content|body|true, if no attachment|The text content of the message.|
|attachment|file|true, if no text content|The file to be uploaded as the message content.|
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '5678',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
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
            username: 'appdevjohn',
            profilePicURL: 'http://localhost:8080/uploads/image.png'
        },
        id: '5678',
        createdAt: '2021-06-10T18:16:50.085Z',
        updatedAt: '2021-06-10T18:16:50.085Z'
    }
}
```
<br>

**`PUT /conversations/update-last-read-message`**<br>
Updates the ID of the last read message of a conversation for a user.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|convoId|body|true|The ID of the conversation of the message.|
|messageId|body|true|The ID of the message.|
```
{
    messageId: '1234'
}
```