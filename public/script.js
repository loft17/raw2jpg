const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileElem');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');
const resultDiv = document.getElementById('result');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add('hover'), false);
});
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove('hover'), false);
});

dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    handleFiles(fileInput.files);
  }
});
dropArea.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  handleFiles(files);
});

function handleFiles(files) {
  [...files].forEach(uploadFile);
}

function uploadFile(file) {
  const url = '/upload';
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  xhr.open('POST', url, true);

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      progressBar.style.width = percentComplete + '%';
      progressBarContainer.style.display = 'block';
    }
  });

  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState == 4) {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: "image/jpeg" });
        const imageUrl = URL.createObjectURL(blob);

        resultDiv.innerHTML = `
          <p>Imagen subida correctamente:</p>
          <div class="image-wrapper">
            <img src="${imageUrl}" alt="Imagen procesada">
            <a class="download-btn" href="#" title="Descargar" id="download-btn">
              <i class="fa-solid fa-download"></i>
            </a>
          </div>
        `;

        document.getElementById('download-btn').addEventListener('click', (e) => {
          e.preventDefault();
          descargarImagen(blob);
        });

      } else {
        resultDiv.innerHTML = '<p>Error al subir la imagen.</p>';
      }

      progressBar.style.width = '0%';
      progressBarContainer.style.display = 'none';
    }
  });

  xhr.responseType = 'arraybuffer';
  formData.append('image', file);
  xhr.send(formData);
}

function descargarImagen(blob) {
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const nombre = `joseromera_${now.toISOString().slice(0,10)}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.jpg`;

  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
