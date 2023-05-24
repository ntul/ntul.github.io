'use strict';

import API from './api.json' assert { type: 'json' };
import { speechToText } from './openai-client-api.js';

if (API.key == '🤫') alert('Please put your api key inside ./api.json and restart..')

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;


const talkVideo = document.getElementById('talk-video');
talkVideo.setAttribute('playsinline', '');
talkVideo.addEventListener('ended', onPlayEnd, false)

const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');

// Send
const sendButtonRus = document.getElementById('send-button-rus');
const sendButtonKaz = document.getElementById('send-button-kaz');
const sendButtonEng = document.getElementById('send-button-eng');
const inputField = document.getElementById('input-field');


const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  const sessionResponse = await fetch(`${API.url}/talks/streams`, {
    method: 'POST',
    headers: {'Authorization': `Basic ${API.key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      source_url: API.fofo
    }),
  });

  
  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
  streamId = newStreamId;
  sessionId = newSessionId;
  
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${API.url}/talks/streams/${streamId}/sdp`,
    {
      method: 'POST',
      headers: {Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({answer: sessionClientAnswer, session_id: sessionId})
    });

    console.log('streamId: ', streamId);
};

// On start
window.onload = (event) => {
  //speechToText();
  playIdle();
}

function playTalk(source) {
  talkVideo.loop = false;
  talkVideo.muted = false;
  talkVideo.src=source;
  talkVideo.play();
}

function playIdle() {
  talkVideo.src='anim/idle4.mp4';
  var playPromise = talkVideo.play();
  if (playPromise !== undefined) {
      playPromise.then(_ => {
        talkVideo.loop = true;
        // Autoplay started!
        console.log("Autoplay started!");
    }).catch(error => {
      // Autoplay was prevented.
      console.log("Autoplay was prevented! Mute is off and try again.");
      talkVideo.muted = true;
      talkVideo.loop = true;
      talkVideo.play();      
    });
  };
}

function onPlayEnd() {
  //console.log('play end');
  showTime();
  talkVideo.muted = true;
  talkVideo.loop = true;
  talkVideo.src='anim/idle4.mp4';
  talkVideo.play();
}

function showTime() {
  let date = new Date();
  console.log('Timer: ' + date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
}
/*
const talkButton = document.getElementById('talk-button');
talkButton.onclick = async () => {
  talkVideo.muted = false;
  // connectionState not supported in firefox
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    const talkResponse = await fetch(`${API.url}/talks/streams/${streamId}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'script': {
            'provider': {
              'type':'microsoft',
              'voice_id': 'ru-RU-SvetlanaNeural',
            },
            'type': 'text',
              'input': 'Доброе утро, Ержигит! Добро пожаловать на дневную смену! Мы не виделись 25 часов 32 минуты.',
          },
          'driver_url': 'bank://lively/',
          'config': {
            'stitch': true,
          },
          'session_id': sessionId
        })
      });
  }};

const talkButton2 = document.getElementById('talk-button2');
talkButton2.onclick = async () => {
  talkVideo.muted = false;
  // connectionState not supported in firefox
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    const talkResponse = await fetch(`${API.url}/talks/streams/${streamId}`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'script': {
          'provider': {
            'type':'microsoft',
            'voice_id': 'ru-RU-SvetlanaNeural',
          },
          'type': 'text',
                'input': 'Я скучала по твоим самым лучшим выпускам и с содроганием вспоминала твой худший среди всех коэффициент перепуска в этом месяце. '+
                'Еще мне интересно сможешь ли ты удержаться на этих позициях или тебя сменит Бержигит? ',
              },
              'driver_url': 'bank://lively/',
              'config': {
                'stitch': true,
            },
            'session_id': sessionId
          })
      });
  }};
*/
const talkButton3 = document.getElementById('talk-button3');
talkButton3.onclick = async () => {
  talkVideo.muted = false;
  talkVideo.loop = false;
  showTime();
  // connectionState not supported in firefox
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    const talkResponse = await fetch(`${API.url}/talks/streams/${streamId}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'script': {
          'provider': {
            'type':'microsoft',
            'voice_id': 'ru-RU-SvetlanaNeural',
          },
          'type': 'text',
          'input': inputField.value,
        },
        'driver_url': 'bank://lively/',
        'config': {
          'stitch': true,
        },
        'session_id': sessionId
      })
    });
  }
};


const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${API.url}/talks/streams/${streamId}`,
    {
      method: 'DELETE',
      headers: {Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({session_id: sessionId})
    });

  stopAllStreams();
  closePC();
  playIdle();
};

sendButtonRus.onclick = async () => {
  var text = inputField.value;
  if (text != ''){
    sendTextToAvatar(1, text);
  } else {
    alert('Enter some text!');
  }
}
sendButtonKaz.onclick = async () => {
  var text = inputField.value;
  if (text != ''){
    sendTextToAvatar(2, text);
  } else {
    alert('Enter some text!');
  }
}
sendButtonEng.onclick = async () => {
  var text = inputField.value;
  if (text != ''){
    sendTextToAvatar(3, text);
  } else {
    alert('Enter some text!');
  }
}

export async function sendTextToAvatar(lang, text, useCorsProxy = false)
{
  const voiceRus1 = 'ru-RU-SvetlanaNeural';
  const voiceKaz1 = 'kk-KZ-AigulNeural';
  const voiceEng1 = 'en-US-JennyNeural';

  talkVideo.muted = false;

  var currentVoice = '';

  if (lang === 1)  {
    currentVoice = voiceRus1;
  } else if (lang === 2)  {
    currentVoice = voiceKaz1;
  } else if (lang === 3)  {
    currentVoice = voiceEng1;
  } else {
    alert('Language not supported yet!');
    return;
  }
  showTime();
  // Request source creation
  var url = `${API.url}/talks/`;
  if (useCorsProxy){
    url = API['cors-proxy-url'] + url;
  }
  const talkCreateResponse = await fetch(url,
  {
    method: 'POST',
    headers: { Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json','origin': '*' },
    body: JSON.stringify({
      script: {
        type: 'text',
        subtitles: 'false',
        provider: {
          'type':'microsoft',
          'voice_id': currentVoice,
        },
        ssml: 'false',
        input: text
      },
      config: {fluent: 'false', pad_audio: '0.0', stitch: 'true'},
      source_url: API.fofo
    })
  })
  .then(response => response.json())
  //.then(result => {      return result;    })
  .catch(error => console.log('error', error));

  console.log('talk created', talkCreateResponse);
  showTime();
  // Request video itself
  if (talkCreateResponse && talkCreateResponse.status && talkCreateResponse.status == 'created') {
    var talkResult = await getTalk(talkCreateResponse.id);
    if (talkResult.status == 'done') {
      var resultUrl = talkResult.result_url;
      //console.log(resultUrl);        
      playTalk(resultUrl);
      showTime();
    } else {
      console.log("Looks like talk is not ready");
    }
  } else {
    console.log('Error in talk create request!')
  }
};

async function getTalk(talkId, useCorsProxy = false) {
  const maxtry = 50;
  var currentTry = 0;
  const waitMiliSec = 1000;

  var url = `${API.url}/talks/${talkId}`;
  if (useCorsProxy){
    url = API['cors-proxy-url'] + url;
  }
  var talkRequestResponse = null;
  while (currentTry <= maxtry && (talkRequestResponse == null || talkRequestResponse.status != 'done'))
  {
    talkRequestResponse = await fetch(url,
    {
      method: 'GET',
      headers: { Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json', 'origin': '*' },
    })
    .then(response => response.json())
    .then(result => {
      //console.log(result);
      showTime();
      return result;
    })
    .catch(error => console.log('error', error));

    currentTry++;
    sleep(waitMiliSec);
    console.log(currentTry + ' Wait and retry get talk...');
  }
  return talkRequestResponse;
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
    
    fetch(`${API.url}/talks/streams/${streamId}/ice`,
      {
        method: 'POST',
        headers: {Authorization: `Basic ${API.key}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({ candidate, sdpMid, sdpMLineIndex, session_id: sessionId})
      }); 
  }
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}
function onTrack(event) {
  showTime();
  const remoteStream = event.streams[0];
  setVideoElement(remoteStream);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({iceServers});
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function setVideoElement(stream) {
  if (!stream) return;
  showTime();
  talkVideo.srcObject = stream;

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo.play().then(_ => {}).catch(e => {});
  }
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams');
    talkVideo.srcObject.getTracks().forEach(track => track.stop());
    talkVideo.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}
