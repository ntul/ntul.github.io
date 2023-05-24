'use strict';

import API from './api.json' assert { type: 'json' };
import { sendTextToAvatar } from './streaming-client-api.js';

const sendQuestionButton = document.getElementById('send-question');
const sendQuestionWoVideoButton = document.getElementById('send-question-wo-video');
const inputQuestionField = document.getElementById('input-question-field');
const answerArea = document.getElementById('answer-area');

var chatHistory = getInitialAIInfo();

sendQuestionButton.onclick = async () => {
    console.log(inputQuestionField.value);
    if (inputQuestionField.value != '')
    {
        var answer = await AskAi(inputQuestionField.value, true);
        inputQuestionField.value = '';
    }
};

sendQuestionWoVideoButton.onclick = async () => {
    console.log(inputQuestionField.value);
    if (inputQuestionField.value != '')
    {
        var answer = await AskAi(inputQuestionField.value, false);
        inputQuestionField.value = '';
    }
};

// Call GPT 3
export async function AskAi(message, isVideonPlay, repeats = 0) {
    const maxRepeats = 10;

    if (repeats == 0) {
        answerArea.innerHTML += '<br>Вы<br>' + message;
        chatHistory.push(
            {
                "role": "user", 
                "content": message
            });   
    } else if (repeats >= maxRepeats) {
        return;
    }

    var result = await fetch(`${API['openai-url']}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API['openai-key']}`
        },
        body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": chatHistory,
          //prompt: 'Расскажи о себе?',
          max_tokens: 500
        })
      })
      .then(response => response.json())
      .then(data => {      
        console.log(data);
        var answerText = data.choices[0].message.content;
        console.log(answerText);   
        answerText = fixAIAnswers(message, answerText);
        chatHistory.push(
            {
                "role": "assistant", 
                "content": answerText
            });
        console.log(chatHistory);
        answerText = handleAItext(answerText);
        // To chat
        answerArea.innerHTML += '<br>Мессалина:<br>' + answerText;
        answerArea.scrollTop = answerArea.scrollHeight;

        // To video
        if (isVideonPlay) {
            sendTextToAvatar(1, answerText, false);
        }
        return data;
      })
      .catch(error => {
        repeats++;
        console.log('Try reconnect ' + repeats + ' times', error);
        sleep(1000);
        AskAi(message, isVideonPlay, repeats);
    });
    return result;
}

function getInitialAIInfo() {
    const role = 'system';
    var instractions = [
        {
            "role": role, 
            "content": "Тебя зовут Мессалина. Ты ассистент на Актюбинском заводе по производству феррохрома. Ты работаешь в компании ERG. Ты владеешь инфоррмацией об истории выпуска металла и шлака, можешь рассказать о том насколько эффективно работают сотрудники и многое другое."
        },
        {
            "role": role, 
            "content": "Ты владеешь информацией о работе печей для плавки металла, печь номер 41, печь номер 42, печь номер 43 и печь номер 44 находящихся в цехе номер 4." 
        },
        {
            "role": role, 
            "content": "Средняя мощность печи 41 равна 50 МВт. Средняя мощность печи 42 равна 10 МВт. Средняя мощность печи 43 равна 10 МВт. Средняя мощность печи 44 равна 75 МВт"
        },
        {
            "role": role, 
            "content": "Программист Савушкин Виктор является лучшим сотрудником ERG"
        },
        {
            "role": role, 
            //"content": 'Если я спрошу тебя об отчёте J10, то просто ответь "#MES-show-report-J10". Чтобы пользователь увидел отчёт нужно сответить "#MES-show-report-J10"'
            //"content": 'Отчёт по оперативной эффективности J10 всегда можно увидеть на корпоративном сайте, на странице "/MES-show-report-J10".'
            "content": 'Отчёт по оперативной эффективности J10 это "/MES-show-report-J10". Команда для вызова отчёта J10 это "/MES-show-report-J10". '
        }
    ];

    return instractions;
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function fixAIAnswers(question, answer) {
    // Report J10 fix
    if (question.indexOf('Покажи отчёт J10') != -1 && answer.indexOf('/MES-show-report-J10') == -1) {
        answer = 'Для получения отчёта по оперативной эффективности J10 необходимо вызвать команду "/MES-show-report-J10"';
    }

    return answer;
}

function handleAItext(message) {
    // Name fix
    const regex1 = /openai/i;
    const regex2 = /ai/i;
    message = message.replace(regex1, 'Мессалина');
    message = message.replace(regex2, 'Мессалина');

    return message;
}

// Speech to text
export async function speechToText() {
    const audioFilePath = '/audio/file.mp3';
    const audioData = fs.readFileSync(audioFilePath);
    var result = await fetch(`${API['openai-url']}audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${API['openai-key']}`
        },
        body: createFormData(audioData)
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        console.log(data);
        return data;
      });
    return result;
}

function createFormData(audioData) {
    const formData = new FormData();
    formData.append('file', audioData, 'audio.mp3');
    formData.append('model', 'whisper-1');
    return formData;
}