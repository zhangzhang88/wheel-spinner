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
import '@babel/polyfill';
import 'whatwg-fetch';
import * as Util from './Util.js';
import { BASIC_MODE } from './BasicMode.js';

function offlineError(feature) {
  throw new Error(`${feature} requires the cloud backend and is disabled in basic mode.`);
}

export async function createSharedWheel(copyable, wheelConfig, idToken) {
  if (BASIC_MODE) offlineError('Sharing wheels');
  const payload = {copyable: copyable, wheelConfig: wheelConfig.getValues()};
  const url = process.env.FUNCTION_PREFIX + '/createSharedWheel3';
  const request = {
    method: 'POST',
    mode: 'cors',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  };
  if (idToken) {
    request.headers['authorization'] = idToken;
  }
  const response = await fetch(url, request);
  const respObj = await response.json();
  if (respObj.hasOwnProperty('error')) throw respObj.error;
  return respObj.path;
}

export async function logSharedWheelRead(path) {
  if (BASIC_MODE) return;
  if (!path) return;
  const payload = {path: path};
  const url = process.env.FUNCTION_PREFIX + '/logSharedWheelRead';
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
}

export async function getSharedWheel(path) {
  if (BASIC_MODE) offlineError('Shared wheels');
  const url = process.env.FUNCTION_PREFIX + `/getSharedWheel2/${path}`;
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors'
  });
  const respObj = await response.json();
  return respObj.wheelConfig;
}

export async function getSharedWheels(idToken) {
  if (BASIC_MODE) offlineError('Shared wheels');
  const url = process.env.FUNCTION_PREFIX + `/getSharedWheels`;
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {'authorization': idToken, 'Content-Type': 'application/json'}
  });
  const respObj = await response.json();
  return respObj.wheels;
}

export async function deleteSharedWheel(idToken, path) {
  if (BASIC_MODE) offlineError('Shared wheels');
  const payload = {path: path};
  const url = process.env.FUNCTION_PREFIX + `/deleteSharedWheel`;
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {'authorization': idToken, 'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  const respObj = await response.json();
  return respObj.wheels;
}

export async function fetchSocialMediaUsers(searchTerm) {
  if (BASIC_MODE) offlineError('Twitter import');
  const url = process.env.FUNCTION_PREFIX +
    `/getTwitterUserNames2/${encodeURIComponent(searchTerm)}`;
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors'
  });
  const respObj = await response.json();
  return respObj;
}

export async function convertAccount(oldIdToken, newIdToken) {
  if (BASIC_MODE) offlineError('Account conversion');
  const payload = {oldIdToken: oldIdToken};
  const url = process.env.FUNCTION_PREFIX + '/convertAccount';
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {'authorization': newIdToken, 'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    await response.json();
  }
  catch(ex) {
    Util.trackException(ex);
  }
}

export async function deleteAccount(idToken) {
  if (BASIC_MODE) offlineError('Account deletion');
  const url = process.env.FUNCTION_PREFIX + '/deleteAccount';
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {'authorization': idToken, 'Content-Type': 'application/json'}
    });
    await response.json();
  }
  catch(ex) {
    Util.trackException(ex);
  }
}

export async function getCarousels() {
  if (BASIC_MODE) return [];
  try {
    const url = process.env.FUNCTION_PREFIX + `/getCarousels`;
    const response = await fetch(url, {
      method: 'GET'
    });
    const respObj = await response.json();
    return respObj;
  }
  catch(ex) {
    Util.trackException(ex);
    return [''];
  }
}

export async function getNumberOfWheelsInReviewQueue(idToken) {
  if (BASIC_MODE) offlineError('Wheel review queue');
  const url = process.env.FUNCTION_PREFIX + '/getNumberOfWheelsInReviewQueue';
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {'authorization': idToken}
  });
  if (response.status == 403) throw 'Please log in as an admin user';
  const respObj = await response.json();
  if (respObj.error) throw respObj.error;
  return respObj.wheelsInReviewQueue;
}

export async function translate(idToken, entries) {
  if (BASIC_MODE) offlineError('Translate');
  const url = process.env.FUNCTION_PREFIX + '/translate';
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: new Headers({
      'Content-Type': 'application/json',
      'authorization': idToken
    }),
    body: JSON.stringify({text: entries})
  });
  if (response.status == 403) throw 'Please log in as an admin user';
  const resp = await response.json();
  return resp.translations;
}

export async function userIsAdmin(idToken) {
  if (BASIC_MODE) return false;
  const url = process.env.FUNCTION_PREFIX + '/userIsAdmin';
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {'authorization': idToken}
  });
  const respObj = await response.json();
  return respObj.userIsAdmin;
}

export async function getSpinStats() {
  if (BASIC_MODE) return {};
  try {
    const url = process.env.FUNCTION_PREFIX + `/getSpinStats`;
    const response = await fetch(url, {
      method: 'GET'
    });
    const respObj = await response.json();
    return respObj;
  }
  catch(ex) {
    Util.trackException(ex);
    return {};
  }
}
