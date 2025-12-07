/*
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import * as Util from './Util.js';
import * as FirebaseAuth from './FirebaseAuth.js';
import * as Firestore from './Firestore.js';
import * as Locales from './Locales.js';
import { loadCSS } from 'fg-loadcss';
import { BASIC_MODE } from './BasicMode.js';

let firebase;
let firebaseui;
let ui;
const BASIC_MODE_MESSAGE = 'This feature requires Firebase and is disabled in basic mode.';

export async function loadLibraries() {
  if (BASIC_MODE) return;
  if (!firebase) {
    await importFirebaseLibs();
    initializeFirebase(firebase);
    enableOfflinePersistence(firebase);
  }
}

export async function userIsLoggedIn() {
  if (BASIC_MODE) return false;
  return await FirebaseAuth.userIsLoggedIn(firebase.auth());
}

export async function getLoggedInUser() {
  if (BASIC_MODE) return null;
  return await FirebaseAuth.getLoggedInUser(firebase.auth());
}

export async function getUserIdToken() {
  if (BASIC_MODE) return;
  const user = await getLoggedInUser();
  if (user) {
    return await user.getIdToken();
  }
}

export async function getUid() {
  if (BASIC_MODE) return;
  const user = await getLoggedInUser();
  if (user) {
    return user.uid;
  }
}

export async function getAnonymousTokenId() {
  if (BASIC_MODE) return;
  const user = await getLoggedInUser();
  if (user && user.isAnonymous) {
    return await user.getIdToken();
  }
}

export function loadAuthUserInterface(elementName) {
  if (BASIC_MODE) {
    return Promise.reject(new Error(BASIC_MODE_MESSAGE));
  }
  loadCSS('https://cdn.firebase.com/libs/firebaseui/3.5.2/firebaseui.css');
  return new Promise(function(resolve, reject) {
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(firebase.auth());
    }
    ui.start(`#${elementName}`, {
      signInFlow: 'popup',
      credentialHelper: firebaseui.auth.CredentialHelper.NONE,
      signInOptions: [
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: {
            prompt: 'select_account'
          }
        },
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          resolve(authResult.user);
        },
      },
      tosUrl: '/faq/terms',
      privacyPolicyUrl: '/privacy-policy.html'
    });
  })
}
  
export async function logIn(providerName, locale) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  const auth = firebase.auth();
  auth.languageCode = Locales.getLoginLocale(providerName, locale);
  const provider = getProvider(providerName);
  return await FirebaseAuth.logIn(auth, provider);
}

export async function logInAnonymously() {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  const auth = firebase.auth();
  return await FirebaseAuth.logInAnonymously(auth);
}

export async function logInToSheets(locale) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  const auth = firebase.auth();
  auth.languageCode = Locales.getLoginLocale('Google', locale);
  const provider = getProvider('Google');
  return await FirebaseAuth.logInToSheets(auth, provider);
}

export function logOut() {
  if (BASIC_MODE) return;
  try {
    firebase.auth().signOut();
  }
  catch (ex) {
  }
}

export async function logUserActivity() {
  if (BASIC_MODE) return;
  const uid = await getUid();
  if (uid) {
    const serverNow = firebase.firestore.FieldValue.serverTimestamp();
    return Firestore.logUserActivity(firebase.firestore(), serverNow, uid);
  }
}

export async function getWheels() {
  if (BASIC_MODE) return [];
  const uid = await getUid();
  return Firestore.getWheels(firebase.firestore(), uid);
}

export async function setAdminsWheelsToZero(adminsUid) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  return Firestore.setAdminsWheelsToZero(firebase.firestore(), adminsUid);
}

export async function logWheelRead(wheelTitle) {
  if (BASIC_MODE) return;
  const uid = await getUid();
  const serverNow = firebase.firestore.FieldValue.serverTimestamp();
  await Firestore.logWheelRead(firebase.firestore(), serverNow, uid, wheelTitle);
}

export async function deleteSavedWheel(wheelTitle) {
  if (BASIC_MODE) return;
  const uid = await getUid();
  await Firestore.deleteSavedWheel(firebase.firestore(), uid, wheelTitle);
}

export async function saveWheel(config) {
  if (BASIC_MODE) return;
  const uid = await getUid();
  const serverNow = firebase.firestore.FieldValue.serverTimestamp();
  await Firestore.saveWheel(firebase.firestore(), serverNow, uid, config);
}

export async function getDirtyWords() {
  if (BASIC_MODE) return [];
  return await Firestore.getDirtyWords(firebase.firestore());
}

export async function setDirtyWords(words) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  await Firestore.setDirtyWords(firebase.firestore(), words);
}

export async function getAdmins() {
  if (BASIC_MODE) return [];
  return await Firestore.getAdmins(firebase.firestore());
}

export async function getEarningsPerReview() {
  if (BASIC_MODE) return 0;
  return await Firestore.getEarningsPerReview(firebase.firestore());
}

export async function deleteAdmin(uid) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  await Firestore.deleteAdmin(firebase.firestore(), uid);
}

export async function addAdmin(uid, name) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  await Firestore.addAdmin(firebase.firestore(), uid, name);
}

export async function saveCarousel(carousel) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  await Firestore.saveCarousel(firebase.firestore(), carousel);
}

export function getDb() {
  if (BASIC_MODE) return null;
  return firebase.firestore();
}

export async function approveSharedWheel(path) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  const increment = firebase.firestore.FieldValue.increment(1);
  const uid = await getUid();
  await Firestore.approveSharedWheel(firebase.firestore(), increment, path, uid);
}

export async function deleteSharedWheel(path, incReviewCount) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  const uid = await getUid();
  const increment = incReviewCount ? firebase.firestore.FieldValue.increment(1):
                                     firebase.firestore.FieldValue.increment(0);
  await Firestore.deleteSharedWheel(firebase.firestore(), increment, path, uid);
}

export async function resetSessionReviews(uid) {
  if (BASIC_MODE) throw new Error(BASIC_MODE_MESSAGE);
  await Firestore.resetSessionReviews(firebase.firestore(), uid);
}

export async function getSharedWheel(path) {
  if (BASIC_MODE) return null;
  return await Firestore.getSharedWheel(firebase.firestore(), path);
}

export async function getNextSharedWheelForReview() {
  if (BASIC_MODE) return null;
  return await Firestore.getNextSharedWheelForReview(firebase.firestore());
}

async function importFirebaseLibs() {
  firebase = await import(/* webpackChunkName: "firebase" */ 'firebase/app');
  await import(/* webpackChunkName: "firebase" */ 'firebase/auth');
  await import(/* webpackChunkName: "firebase" */ 'firebase/firestore');
  firebaseui = await import(/* webpackChunkName: "firebase" */ 'firebaseui');
}

function initializeFirebase(firebase) {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    timestampsInSnapshots: true
  };
  firebase.initializeApp(firebaseConfig);  
}

function enableOfflinePersistence(firebase) {
  const db = firebase.firestore();
  if (Util.browserCanHandlePersistance(navigator.userAgent)) {
    try {
      db.enablePersistence({synchronizeTabs:true})
    }
    catch (ex) {
    }
  }
}

function getProvider(providerName) {
  const providers = {
    'google':   new firebase.auth.GoogleAuthProvider(),
    'facebook': new firebase.auth.FacebookAuthProvider(),
    'twitter':  new firebase.auth.TwitterAuthProvider(),
  };
  return providers[providerName.toLowerCase()] || providers['google'];
}
