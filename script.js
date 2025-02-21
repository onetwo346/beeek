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
  let userInteracted = false;

  // Ensure user interaction for iOS
  const ensureUserInteraction = () => {
    if (!userInteracted) {
      userInteracted = true;
      const unlockSpeech = new SpeechSynthesisUtterance("");
      speechSynthesis.speak(unlockSpeech);
    }
  };

  // Switch to main page when "Get Started" is clicked
  pulsatingGetStartedButton.addEventListener("click", () => {
    descriptionPage.classList.add("hidden");
    mainPage.classList.remove("hidden");
    ensureUserInteraction();
  });

  // Convert uploaded file to text
  convertButton.addEventListener("click", async () => {
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
      };
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
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          textArea.value = fullText;
        } catch (error) {
          alert("Failed to process PDF. Please try again.");
          console.error("PDF processing error:", error);
        }
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
      if (voice.lang.includes("en")) { // Filter only English voices
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = voice.name;
        voiceSelect.appendChild(option);
      }
    });

    // Select a more realistic voice by default (if available)
    const realisticVoices = voices.filter((voice) =>
      voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.name.includes("Samantha")
    );
    if (realisticVoices.length > 0) {
      voiceSelect.value = realisticVoices[0].name;
    }
  };

  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // Function to speak the text
  const speakText = (text) => {
    const selectedVoice = voices.find((voice) => voice.name === voiceSelect.value);
    const speed = parseFloat(speedControl.value);

    speech = new SpeechSynthesisUtterance(text);
    speech.voice = selectedVoice || voices[0]; // Fallback to the first available voice
    speech.rate = speed;
    speech.pitch = 1.2; // Adjust pitch for more natural sound
    speech.volume = 1; // Ensure maximum volume

    // Assign event listeners to handle iOS quirks
    speech.onstart = () => {
      isSpeaking = true;
      pauseAloudButton.disabled = false;
      stopAloudButton.disabled = false;
      pauseAloudButton.textContent = "Pause";
    };

    speech.onend = () => {
      isSpeaking = false;
      pauseAloudButton.disabled = true;
      stopAloudButton.disabled = true;
      pauseAloudButton.textContent = "Pause";
    };

    // Speak the text
    speechSynthesis.speak(speech);
  };

  // Read the text aloud with text-to-speech
  readAloudButton.addEventListener("click", () => {
    ensureUserInteraction(); // Ensure iOS speech works
    const text = textArea.value.trim();
    if (!text) {
      alert("Please enter or convert text to read aloud.");
      return;
    }

    // Cancel any existing speech to prevent overlapping
    speechSynthesis.cancel();

    // Speak the text
    speakText(text);
  });

  // Pause or resume text-to-speech
  pauseAloudButton.addEventListener("click", () => {
    if (isSpeaking) {
      speechSynthesis.pause();
      pauseAloudButton.textContent = "Resume";
    } else if (speechSynthesis.paused) {
      speechSynthesis.resume();
      pauseAloudButton.textContent = "Pause";
    }
  });

  // Stop text-to-speech
  stopAloudButton.addEventListener("click", () => {
    speechSynthesis.cancel();
    isSpeaking = false;
    pauseAloudButton.disabled = true;
    stopAloudButton.disabled = true;
    pauseAloudButton.textContent = "Pause";
  });

  // Clear text area and reset all controls
  clearTextButton.addEventListener("click", () => {
    textArea.value = ""; // Clear the text area
    fileInput.value = ""; // Clear the file input
    speechSynthesis.cancel(); // Stop any ongoing speech
    pauseAloudButton.disabled = true;
    stopAloudButton.disabled = true;
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
        .replace(/\s+/g, " ") // Normalize spaces
        .replace(/([.?!])([^\s])/g, "$1 $2") // Add space after punctuation
        .replace(/(\w),(\w)/g, "$1, $2") // Add space after commas
        .replace(/(\w)([“”‘’])/g, "$1 $2") // Ensure space before quotes
        .replace(/([“”‘’])(\w)/g, "$1 $2") // Ensure space after quotes
        .replace(/(\.\.\.)(\w)/g, "$1 $2") // Add space after ellipses
        .replace(/([.?!])\s+([a-z])/g, (match, p1, p2) => `${p1} ${p2.toUpperCase()}`) // Capitalize after punctuation
        .replace(/^\s*[a-z]/, (match) => match.toUpperCase()) // Capitalize first letter
        .replace(/\si\s/g, " I ") // Capitalize standalone "i"
        .replace(/\s+([.?!])/g, "$1") // Remove space before punctuation
        .trim(); // Trim trailing spaces
    };

    const fixedText = fixText(text);
    textArea.value = fixedText;
    alert("Text has been perfectly edited.");
  });

  // Display speed value for text-to-speech
  speedControl.addEventListener("input", () => {
    speedValue.textContent = speedControl.value;
  });
});
