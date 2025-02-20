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
 let speechQueue = []; // Queue to manage speech chunks

 // Ensure user interaction for iOS
 let userInteracted = false;
 const ensureUserInteraction = () => {
   if (!userInteracted) {
     userInteracted = true;
     const unlockSpeech = new SpeechSynthesisUtterance("");
     speechSynthesis.speak(unlockSpeech);
     speechSynthesis.cancel(); // Immediately cancel the empty speech
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

   try {
     if (fileExtension === "txt") {
       const text = await readTextFile(file);
       textArea.value = text;
     } else if (fileExtension === "pdf") {
       const text = await readPDFFile(file);
       textArea.value = text;
     } else {
       alert("Unsupported file type. Please upload a TXT or PDF file.");
     }
   } catch (error) {
     alert("Failed to process the file. Please try again.");
     console.error(error);
   }
 });

 // Read text file
 const readTextFile = (file) => {
   return new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.onload = () => resolve(reader.result);
     reader.onerror = () => reject("Failed to read the file.");
     reader.readAsText(file);
   });
 };

 // Read PDF file
 const readPDFFile = (file) => {
   return new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.onload = () => {
       const typedArray = new Uint8Array(reader.result);
       pdfjsLib.getDocument(typedArray).promise
         .then((pdf) => {
           let fullText = "";
           const loadPage = (pageNumber) => {
             pdf.getPage(pageNumber).then((page) => {
               page.getTextContent().then((textContent) => {
                 const pageText = textContent.items.map((item) => item.str).join(" ");
                 fullText += pageText + "\n";

                 if (pageNumber < pdf.numPages) {
                   loadPage(pageNumber + 1);
                 } else {
                   resolve(fullText);
                 }
               });
             });
           };
           loadPage(1);
         })
         .catch(() => reject("Failed to load the PDF."));
     };
     reader.onerror = () => reject("Failed to read the file.");
     reader.readAsArrayBuffer(file);
   });
 };

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

   // Assign event listeners to handle iOS quirks
   speech.onstart = () => {
     isSpeaking = true;
     pauseAloudButton.disabled = false;
     stopAloudButton.disabled = false;
     pauseAloudButton.textContent = "Pause";
   };

   speech.onend = () => {
     isSpeaking = false;
     isPaused = false;
     pauseAloudButton.disabled = true;
     stopAloudButton.disabled = true;
     pauseAloudButton.textContent = "Pause";

     // Process the next chunk in the queue
     if (speechQueue.length > 0) {
       const nextChunk = speechQueue.shift();
       speakText(nextChunk);
     }
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

   // Cancel any existing speech and clear the queue
   speechSynthesis.cancel();
   speechQueue = [];

   // Split the text into chunks and add to the queue
   const chunkSize = 1000; // Chunk size limit to avoid API issues
   const textChunks = text.match(new RegExp(".{1," + chunkSize + "}", "g"));

   if (textChunks && textChunks.length > 0) {
     speechQueue = [...textChunks]; // Add all chunks to the queue
     speakText(speechQueue.shift()); // Start speaking the first chunk
   }
 });

 // Pause or resume text-to-speech
 pauseAloudButton.addEventListener("click", () => {
   if (isSpeaking && !isPaused) {
     speechSynthesis.pause();
     isPaused = true;
     pauseAloudButton.textContent = "Resume";
   } else if (isPaused) {
     speechSynthesis.resume();
     isPaused = false;
     pauseAloudButton.textContent = "Pause";
   }
 });

 // Stop text-to-speech completely
 stopAloudButton.addEventListener("click", () => {
   if (speechSynthesis.speaking || isPaused) {
     speechSynthesis.cancel();
     isSpeaking = false;
     isPaused = false;
     pauseAloudButton.disabled = true;
     stopAloudButton.disabled = true;
     pauseAloudButton.textContent = "Pause";
     speechQueue = []; // Clear the speech queue
   }
 });

 // Clear text area and reset all controls (Ultimate Stop Feature)
 clearTextButton.addEventListener("click", () => {
   textArea.value = ""; // Clear the text area
   fileInput.value = ""; // Clear the file input
   speechSynthesis.cancel(); // Stop any ongoing speech
   speechQueue = []; // Clear the speech queue
   pauseAloudButton.disabled = true; // Disable pause button
   stopAloudButton.disabled = true; // Disable stop button
   pauseAloudButton.textContent = "Pause"; // Reset button text
   isSpeaking = false; // Reset speaking state
   isPaused = false; // Reset paused state
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
