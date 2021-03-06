# notes-at-firebase

> A note taking app that retrieves and stores location data for each note. This is a fork of 
[github.com/brocktopia/notes-at-vuex](https://github.com/brocktopia/notes-at-vuex) implemented on the 
Firebase platform.

## Dependencies

**Server-side**
* [Firebase](https://firebase.google.com/)
* [Firestore](https://firebase.google.com/docs/firestore/)

**Client-side**
* [VueJS 2.x](https://github.com/vuejs/vue)
* [Vue-router](https://github.com/vuejs/vue-router)
* [Vuex](https://vuex.vuejs.org/)
* [vue-googlemaps](https://github.com/Akryum/vue-googlemaps)
* [Moment.js](https://momentjs.com/)
* [Google API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) (for Maps JavaScript API &amp; Places API for Web)

**Testing**
* [vue-test-utils](https://github.com/vuejs/vue-test-utils)
* [Jest](https://jestjs.io/)
* [vue-jest](https://github.com/vuejs/vue-jest)

**Deployment**
* [firebase-tools](https://github.com/firebase/firebase-tools)

## Configuration

You will need to set your Google API Key in [./src/google-maps-config.js](src/google-maps-config.js).
```js
let config = {
  key: 'your-google-api-key',
  libraries: 'places'
};
```

This project was built to deploy into a Firebase project. You will need to copy Firebase project settings into the 
[./src/firebase-config.js](./src/firebase-config.js) file.
```js
export default {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SEND_ID"
}
```

And copy your project id into the [.firebaserc](./.firebaserc) file.
```js
{
  "projects": {
    "default": "PROJECT_NAME"
  }
}
```

## Build Setup

``` bash
# install dependencies
npm install

# build project (drop -dev for production build)
npm run build-dev

# serve on webpack-dev-server with hot reload at localhost:8080
npm run dev

# serve with Firebase CLI (no hot reload)
firebase serve
```

See [firebase-tools](https://github.com/firebase/firebase-tools) for details on project initialization and deployment.

## Resources

* [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) Documentation on navigator.geolocation from Mozilla.
* [Google Maps API Reference](https://developers.google.com/maps/documentation/javascript/reference/map)
* [Google Places Service API Reference](https://developers.google.com/maps/documentation/javascript/reference/places-service)
* [Firebase Documentation](https://firebase.google.com/docs/)

## Notes on Firebase

I actually started this project with the idea of publishing everything to Firebase but then decided to focus on Vue.js with
Node.js and MongoDB. I'm glad I did because despite the high level of automation the Firebase platform interface offers it 
was much simpler starting off with a basic Node.js service layer on top of a MongoDB/Mongoose data layer. I decided to go
with the Cloud Firestore database rather than the Realtime Database because it had some features around sub-collections that
sounded ideal for what I was looking for. Cloud Firestore is still in beta but seems to be on track to replace the Realtime
Database. Besides, this project isn't pushing any real boundaries data-wise. So far the only thing I've found a little 
cumbersome is deleting data. When deleting an account, every note and notebook document must be individually deleted. 

It was a lot of work figuring out Firestore's authentication and getting it setup in the app, but I'm sure it was
trivial compared to implementing authentication on my own with Nodes.js and MongoDB. It seems a little odd that there
isn't an easier way to synchronise the authentication user into Cloud Firestore but the platform is setup to allow developers
to run several different applications off a single account so I suppose it's a byproduct of that flexibility. I had to make 
a couple of small structural changes to deploy into Firebase hosting, but that part of the process was probably the simplest. 
It's great having the app up online with user accounts. Google's free Spark plan is great for developers that just want to
test the waters. There are still a lot of Firebase features for me to explore.

## Notes on Progressive Web App update

I copied over the PWA features I added to the [notes-at-idb](https://github.com/brocktopia/notes-at-idb) version of this
application. This gives the app the ability to cache the core application source for quicker mobile loading and provides
an app manifest to allow the app to be added to the user's mobile homescreen and be launched without the browser chrome. 
Caching files does present some complexities in doing code updates. You need to push a new version of your service workers
up any time you want to update your code so that it can clear out old caches. 

The next step for me on the path of PWA is to implement client side functionality for offline use. The app will need to 
determine when the user is offline and watch for PUT or POST calls to the API in order to save user data to local storage. 
The app will then need to determine when the user is online again and sync any saved data in local storage with the 
Firestore database.

## To-Do Roadmap

* Add ability to save note data offline using IndexedDB and have it sync when online.

## Live Application
The app is now live on Firebase here: [notes-at.firebaseapp.com](https://notes-at.firebaseapp.com)

## Author
Brock Henderson [@brocktopia](https://github.com/brocktopia/) ||
[brocktopia.com](https://brocktopia.com)
