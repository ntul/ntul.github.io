import API from './api.json' assert { type: 'json' };
import { AskAi } from './openai-client-api.js';

// Создаем медиа-поток для записи звука
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    // Записываем звуковые фрагменты при нажатии кнопки "Запись"
    const startRecording = () => {
      mediaRecorder.start();
      console.log('Запись начата...');
    };

    // Завершаем запись при нажатии кнопки "Остановка записи"
    const stopRecording = () => {
      mediaRecorder.stop();
      console.log('Запись завершена...');
    };

    // Сохраняем звуковые фрагменты в массиве
    mediaRecorder.addEventListener('dataavailable', function(e) {
      audioChunks.push(e.data);
    });

    // Отправляем записанный звук на транскрипцию при нажатии кнопки "Отправить"
    const sendRecording = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

      // Создаем объект FormData и добавляем аудиофайл в него
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');

      // Отправляем POST запрос с помощью fetch
      fetch(`${API['openai-url']}audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API['openai-key']}`
        },
        body: formData,
      })
        .then(response => response.json())
        .then(result => {
          console.log('Транскрипция готова:', result.text);
          AskAi(result.text, false);
        })
        .catch(error => {
          console.error('Произошла ошибка:', error);
        });
    };

    // Привязываем функции к кнопкам
    document.getElementById('start-rec').addEventListener('click', startRecording);
    document.getElementById('stop-rec').addEventListener('click', stopRecording);
    document.getElementById('send-rec').addEventListener('click', sendRecording);
  })
  .catch(function(error) {
    console.error('Произошла ошибка при получении доступа к медиа-устройству:', error);
  });
