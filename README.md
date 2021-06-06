# Social Network API
This is an open source API for common social network features. It comes complete with Authentication, Messaging, and Posting, with Stories coming in the future. An SQL file is included in `src/database` to set up a PostgreSQL database to manage all of the data.

## Endpoints

### Auth
Accounts on this social network require a unique email address, unique username, first name, last name, and a password of at least four characters. After signing up, the account must be activated before it is allowed to participate in the network.
<br><br>

**GET /auth/ping**<br>
A token must be present in the Authorization header. This endpoint will return whether or not the token is still valid.
<br><br>

**PUT /auth/login**<br>
Gets an Authorization token for the client.<br>
|Field|Location|Required|Description|
|---|---|---|---|
|email|body|true|The email address for the account.|
|password|body|true|The password the account.|
```
{
  token: eyJhbGciOiJIUzI1NiI...,
  activated: true,
  message: 'You are now logged in.'
}
```
<br>

**POST /auth/signup**<br>
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
  token: eyJhbGciOiJIUzI1NiI...,
  activated: false,
  message: 'Find our activation email to activate your account.'
}
```
<br>

**POST /auth/confirm-email**<br>
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

### Posts

### Messaging