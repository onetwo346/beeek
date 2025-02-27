document.addEventListener("DOMContentLoaded", () => {
  const descriptionPage = document.getElementById("description-page");
  const mainPage = document.getElementById("main-page");
  const pulsatingGetStartedButton = document.getElementById("pulsating-get-started");
  const fileInput = document.getElementById("file-input");
  const convertButton = document.getElementById("convert");
  const textArea = document.getElementById("text-area");
  const readAloudButton = document.getElementById("read-aloud");
  const pauseAloudButton = document.getElementById("pause-aloud");
  const stopAloudButton = document.getElementById("stop-aloud");
  const clearTextButton = document.getElementById("clear-text");
  const rearrangeTextButton = document.getElementById("rearrange-text");
  const voiceSelect = document.getElementById("voice-select");
  const speedControl = document.getElementById("speed-control");
  const speedValue = document.getElementById("speed-value");

  let speech = null;
  let voices = [];
  let isSpeaking = false;
  let isPaused = false;
  let userInteracted = false;
  let words = [];
  let startWordIndex = 0;

  // Ensure user interaction for iOS playback
  const ensureUserInteraction = () => {
    if (!userInteracted) {
      userInteracted = true;
      const unlockSpeech = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockSpeech);
      window.speechSynthesis.cancel();
    }
  };

  // Switch to main page
  pulsatingGetStartedButton.addEventListener("click", () => {
    descriptionPage.classList.add("hidden");
    mainPage.classList.remove("hidden");
    ensureUserInteraction();
  });

  // File Conversion
  convertButton.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please upload a file.");
      return;
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension === "txt") {
      const reader = new FileReader();
      reader.onload = () => (textArea.value = reader.result.trim());
      reader.readAsText(file);
    } else if (fileExtension === "pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result);
        try {
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = "";
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
          }
          textArea.value = fullText.trim() || "PDF converted, but no readable text found.";
        } catch (error) {
          alert("Failed to process PDF.");
          console.error("PDF error:", error);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file type. Use TXT or PDF.");
    }
  });

  // Load Voices
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices().filter((v) => v.lang.includes("en"));
    voiceSelect.innerHTML = "";
    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = voice.name;
      voiceSelect.appendChild(option);
    });
    const preferredVoice = voices.find((v) =>
      /Google|Microsoft|Samantha/i.test(v.name)
    );
    if (preferredVoice) voiceSelect.value = preferredVoice.name;
  };
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // Speak Text Function
  const speakText = (text, startIndex = 0) => {
    if (!text.trim()) {
      alert("No text to read.");
      return;
    }

    ensureUserInteraction();
    window.speechSynthesis.cancel();

    words = text.split(/\s+/);
    const startText = startIndex ? words.slice(startIndex).join(" ") : text;
    const selectedVoice = voices.find((v) => v.name === voiceSelect.value) || voices[0];
    const speed = parseFloat(speedControl.value);

    speech = new SpeechSynthesisUtterance(startText);
    speech.voice = selectedVoice;
    speech.rate = speed;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onstart = () => {
      isSpeaking = true;
      isPaused = false;
      readAloudButton.disabled = true;
      pauseAloudButton.disabled = false;
      stopAloudButton.disabled = false;
      pauseAloudButton.querySelector("span").textContent = "Pause";
    };

    speech.onend = () => {
      isSpeaking = false;
      isPaused = false;
      updateButtons();
    };

    window.speechSynthesis.speak(speech);
    updateButtons();
  };

  // Get Word Index
  const getWordIndex = (charPos, text) => {
    return text.substring(0, charPos).split(/\s+/).length - 1;
  };

  // Tap to Set Cursor Position
  textArea.addEventListener("click", () => {
    const cursorPos = textArea.selectionStart;
    const fullText = textArea.value.trim();
    words = fullText.split(/\s+/);
    startWordIndex = getWordIndex(cursorPos, fullText);
  });

  // Play
  readAloudButton.addEventListener("click", () => {
    const fullText = textArea.value.trim();
    speakText(fullText, startWordIndex);
  });

  // Pause/Resume
  pauseAloudButton.addEventListener("click", () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      isPaused = true;
      pauseAloudButton.querySelector("span").textContent = "Resume";
    } else if (isPaused) {
      window.speechSynthesis.resume();
      isPaused = false;
      pauseAloudButton.querySelector("span").textContent = "Pause";
    }
    updateButtons();
  });

  // Stop
  stopAloudButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    isPaused = false;
    updateButtons();
  });

  // Clear
  clearTextButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    textArea.value = "";
    fileInput.value = "";
    isSpeaking = false;
    isPaused = false;
    startWordIndex = 0;
    updateButtons();
  });

  // AI Enhance
  rearrangeTextButton.addEventListener("click", () => {
    let text = textArea.value.trim();
    if (!text) {
      alert("No text to enhance.");
      return;
    }
    text = text
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^\w|\.\s+\w)/g, (c) => c.toUpperCase())
      .replace(/([a-z])\s+([A-Z])/g, "$1. $2");
    textArea.value = text;
    alert("Text enhanced!");
  });

  // Speed Control
  speedControl.addEventListener("input", () => {
    speedValue.textContent = speedControl.value;
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.cancel();
      speakText(textArea.value.trim(), startWordIndex);
    }
  });

  // Update Button States
  const updateButtons = () => {
    readAloudButton.disabled = false; // Always enable Play
    pauseAloudButton.disabled = !isSpeaking;
    stopAloudButton.disabled = !isSpeaking;
  };

  // iPhone Compatibility
  window.addEventListener("touchstart", ensureUserInteraction, { once: true });
});
