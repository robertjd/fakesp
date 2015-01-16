### Fake service provider

Use this to imitate a service-provider initiated login flow

### Installation

Point `local.stormpath.com` to `127.0.0.1` by putting an entry into `/etc/hosts`

`git clone` this repo

`npm i` inside the cloned repo

then export the magic to your environment:

```bash
export STORMPATH_API_KEY_ID=YO
export STORMPATH_API_KEY_SECRET=YO
export STORMPATH_APP_HREF=http://10.1.10.37:8080/v1/applications/YO
```
then run the server:

```
node server.js
```

then open up http://local.stormpath.com:8001 in your browser

