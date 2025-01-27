document.addEventListener("DOMContentLoaded", () => {
  const getStartedButton = document.getElementById("get-started");
  const uploadSection = document.getElementById("upload-section");
  const fileInput = document.getElementById("file-input");
  const convertButton = document.getElementById("convert");
  const textArea = document.getElementById("text-area");
  const readAloudButton = document.getElementById("read-aloud");
  const pauseAloudButton = document.getElementById("pause-aloud");
  const clearTextButton = document.getElementById("clear-text");
  const rearrangeTextButton = document.getElementById("rearrange-text");

  const voiceSelect = document.getElementById("voice-select");
  const speedControl = document.getElementById("speed-control");
  const speedValue = document.getElementById("speed-value");

  let speech = null;
  let voices = [];
  let userInteracted = false;

  // Unlock Speech API on mobile browsers
  const ensureUserInteraction = () => {
    if (!userInteracted) {
      userInteracted = true;
      const unlockSpeech = new SpeechSynthesisUtterance("");
      speechSynthesis.speak(unlockSpeech);
    }
  };

  // Show upload section when "Get Started" is clicked
  getStartedButton.addEventListener("click", () => {
    uploadSection.classList.remove("hidden");
    getStartedButton.textContent = "Upload Your Book Below";
    ensureUserInteraction();
  });

  // Convert uploaded file to text
  convertButton.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please upload a file.");
      return;
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension === "txt") {
      const reader = new FileReader();
      reader.onload = () => {
        textArea.value = reader.result;
        textArea.dispatchEvent(new Event("input")); // Trigger input event to update speech
      };
      reader.readAsText(file);
    } else if (fileExtension === "pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        const typedArray = new Uint8Array(reader.result);
        pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
          let fullText = "";
          const loadPage = (pageNumber) => {
            pdf.getPage(pageNumber).then((page) => {
              page.getTextContent().then((textContent) => {
                const pageText = textContent.items.map((item) => item.str).join(" ");
                fullText += pageText + "\n";

                if (pageNumber < pdf.numPages) {
                  loadPage(pageNumber + 1);
                } else {
                  textArea.value = fullText;
                  textArea.dispatchEvent(new Event("input")); // Trigger input event to update speech
                  alert("Text converted successfully!");
                }
              });
            });
          };
          loadPage(1);
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file type. Please upload a TXT or PDF file.");
    }
  });

  // Load available voices for text-to-speech
  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";
    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = voice.name;
      voiceSelect.appendChild(option);
    });
  };

  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // Read text aloud
  readAloudButton.addEventListener("click", () => {
    ensureUserInteraction();

    const text = textArea.value.trim();
    if (!text) {
      alert("Please enter or convert text to read aloud.");
      return;
    }

    speechSynthesis.cancel(); // Cancel any ongoing speech

    const selectedVoice = voices.find((voice) => voice.name === voiceSelect.value);
    const speed = parseFloat(speedControl.value);

    speech = new SpeechSynthesisUtterance(text);
    speech.voice = selectedVoice || voices[0];
    speech.rate = speed;

    speech.onstart = () => {
      console.log("Speech started");
    };

    speech.onend = () => {
      console.log("Speech ended");
    };

    speech.onerror = (event) => {
      console.error("Speech error:", event.error);
      alert("An error occurred while trying to read the text aloud.");
    };

    speechSynthesis.speak(speech);
    pauseAloudButton.disabled = false;
  });

  // Pause or resume speech
  pauseAloudButton.addEventListener("click", () => {
    if (speechSynthesis.speaking) {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
        pauseAloudButton.textContent = "Pause";
      } else {
        speechSynthesis.pause();
        pauseAloudButton.textContent = "Resume";
      }
    }
  });

  // Clear text and reset controls
  clearTextButton.addEventListener("click", () => {
    textArea.value = "";
    speechSynthesis.cancel();
    pauseAloudButton.disabled = true;
    pauseAloudButton.textContent = "Pause";
  });

  // Rearrange and clean up text
  rearrangeTextButton.addEventListener("click", () => {
    const text = textArea.value.trim();
    if (!text) {
      alert("Please enter or convert text for rearranging.");
      return;
    }

    const fixText = (input) => {
      return input
        .replace(/\s+/g, " ")
        .replace(/([.?!])([^\s])/g, "$1 $2")
        .replace(/(\w),(\w)/g, "$1, $2")
        .replace(/(\w)([“”‘’])/g, "$1 $2")
        .replace(/([“”‘’])(\w)/g, "$1 $2")
        .replace(/(\.\.\.)(\w)/g, "$1 $2")
        .replace(/([.?!])\s+([a-z])/g, (match, p1, p2) => `${p1} ${p2.toUpperCase()}`)
        .replace(/^\s*[a-z]/, (match) => match.toUpperCase())
        .replace(/\si\s/g, " I ")
        .replace(/\s+([.?!])/g, "$1")
        .trim();
    };

    const fixedText = fixText(text);
    textArea.value = fixedText;
    alert("Text has been perfectly edited.");
  });

  // Display speed value
  speedControl.addEventListener("input", () => {
    speedValue.textContent = speedControl.value;
  });

  // Trigger input event on manual text change
  textArea.addEventListener("input", () => {
    pauseAloudButton.disabled = true;
    pauseAloudButton.textContent = "Pause";
    speechSynthesis.cancel();
  });
});
