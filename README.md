### Fake service provider

Use this to imitate a service-provider initiated login flow

### Installation

Point `local.stormpath.com` to `127.0.0.1` by putting an entry into `/etc/hosts`

`git clone` this repo

`npm i` inside the cloned repo

then run the server:

```
API_KEY_FILE=~/Downloads/apiKey.properties \
STORMPATH_APP_HREF=https://api.stormpath.com/v1/applications/STyTpcXSTyKkT3PTWW \
node server.js
```

then open up http://local.stormpath.com:8001 in your browser

