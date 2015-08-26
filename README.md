### Fake service provider

Use this to imitate a service-provider initiated login flow for the
Stormpath ID Site Feature.  The repo contains a simple HTTP server
that serves a webapp which will redirect you to ID site for authentication.
When you return from ID site, a local cookie-based session will be created
for you.  This is different from the SSO session which ID site retains
for you.

### Installation

`git clone` this repo, then `cd` into the folder

`npm install` inside the folder

### Configuration - Your Dev Machine

Point `stormpath.localhost` to `127.0.0.1` by putting an entry into `/etc/hosts`

Export the configuration for a Stormpath Application, with API keys, to your environment:

    export STORMPATH_API_KEY_ID=XXX
    export STORMPATH_API_KEY_SECRET=XXX
    export STORMPATH_APP_HREF=https://api.stormpath.com/v1/applications/XXX

### Configuration - Your Stormpath Tenant

Login to your Stormpath Tenant and add the following URLs to the list of
"Authorized Redirect URLs" in your ID Site configuration:

    http://stormpath.localhost:8001/
    http://stormpath.localhost:8001/logout


### Start the Server

You can run the server like so:

```
node server.js
```

It should automatically open http://stormpath.localhost:8001 in your browser,
and present you with a Login button!  Click it to start the flow.

