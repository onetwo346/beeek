document.addEventListener("DOMContentLoaded", () => {
    // Performance optimizations - cache DOM elements
    const elements = {
        descriptionPage: document.getElementById("description-page"),
        mainPage: document.getElementById("main-page"),
        pulsatingGetStartedButton: document.getElementById("pulsating-get-started"),
        fileInput: document.getElementById("file-input"),
        convertButton: document.getElementById("convert"),
        textArea: document.getElementById("text-area"),
        readAloudButton: document.getElementById("read-aloud"),
        pauseAloudButton: document.getElementById("pause-aloud"),
        stopAloudButton: document.getElementById("stop-aloud"),
        clearTextButton: document.getElementById("clear-text"),
        rearrangeTextButton: document.getElementById("rearrange-text"),
        voiceSelect: document.getElementById("voice-select"),
        speedControl: document.getElementById("speed-control"),
        speedValue: document.getElementById("speed-value"),
        audioVisualizer: document.getElementById("audio-visualizer"),
        typingIndicator: document.querySelector(".typing-indicator"),
        statusText: document.querySelector(".status-text"),
        statusPulse: document.querySelector(".pulse"),
        shortcutsToggle: document.getElementById("shortcuts-toggle"),
        shortcutsContent: document.getElementById("shortcuts-content"),
        wordCountElement: document.getElementById("word-count"),
        processingTimeElement: document.getElementById("processing-time"),
        charCountElement: document.querySelector(".char-count"),
        readTimeElement: document.querySelector(".read-time"),
        vizToggle: document.getElementById("viz-toggle"),
        vizFullscreen: document.getElementById("viz-fullscreen"),
        mainProgress: document.getElementById("main-progress"),
        progressFill: document.querySelector(".progress-fill")
    };

    // State variables
    let speech = null;
    let voices = [];
    let isSpeaking = false;
    let isPaused = false;
    let userInteracted = false;
    let words = [];
    let startWordIndex = 0;
    let visualizerContext = null;
    let animationId = null;
    let isProcessing = false;
    let processingStartTime = 0;
    let isVisualizationVisible = true;
    let shortcutsVisible = false;
    let idleAnimationId = null;
    let notificationContainer = null;

    // Performance optimization - debounce functions
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Optimized particle initialization with reduced complexity
    function initializeParticles() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS("particles-js", {
                particles: {
                    number: { value: 60, density: { enable: true, value_area: 1000 } }, // Reduced from 120
                    color: { value: ["#00b3ff", "#9d00ff"] }, // Reduced colors
                    shape: { type: "circle" }, // Simplified shape
                    opacity: { 
                        value: 0.3, 
                        random: false, // Disabled random for performance
                        anim: { enable: false } // Disabled animation for performance
                    },
                    size: { 
                        value: 2, 
                        random: true, 
                        anim: { enable: false } // Disabled animation for performance
                    },
                    line_linked: { 
                        enable: true, 
                        distance: 120, // Reduced distance
                        color: "#00b3ff", 
                        opacity: 0.15, // Reduced opacity
                        width: 1 
                    },
                    move: { 
                        enable: true, 
                        speed: 0.5, // Reduced speed
                        direction: "none", 
                        random: false, // Disabled random for performance
                        straight: false, 
                        out_mode: "out", // Changed to out for performance
                        bounce: false,
                        attract: { enable: false } // Disabled attract for performance
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: { 
                        onhover: { enable: true, mode: "grab" }, // Simplified interaction
                        onclick: { enable: false }, // Disabled for performance
                        resize: true 
                    },
                    modes: { 
                        grab: { distance: 100, line_linked: { opacity: 0.5 } } // Simplified grab
                    }
                },
                retina_detect: false // Disabled for performance
            });
        }
    }

    // Optimized audio visualizer initialization
    function initializeAudioVisualizer() {
        if (elements.audioVisualizer) {
            visualizerContext = elements.audioVisualizer.getContext('2d');
            
            // Use device pixel ratio for crisp rendering
            const dpr = window.devicePixelRatio || 1;
            const rect = elements.audioVisualizer.getBoundingClientRect();
            
            elements.audioVisualizer.width = rect.width * dpr;
            elements.audioVisualizer.height = rect.height * dpr;
            elements.audioVisualizer.style.width = rect.width + 'px';
            elements.audioVisualizer.style.height = rect.height + 'px';
            
            visualizerContext.scale(dpr, dpr);
            
            startIdleAnimation();
        }
    }

    // Optimized idle visualizer with controlled animation
    function startIdleAnimation() {
        if (!visualizerContext || isSpeaking) return;
        
        const canvas = elements.audioVisualizer;
        const ctx = visualizerContext;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        function drawIdle() {
            if (isSpeaking) return;
            
            ctx.clearRect(0, 0, width, height);
            
            // Simplified gradient
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, 'rgba(0, 179, 255, 0.08)');
            gradient.addColorStop(1, 'rgba(157, 0, 255, 0.08)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Optimized sine wave
            ctx.strokeStyle = 'rgba(0, 179, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            const centerY = height / 2;
            const amplitude = 6;
            const frequency = 0.015;
            const time = Date.now() * 0.0005; // Slower animation
            
            for (let x = 0; x < width; x += 2) { // Skip pixels for performance
                const y = centerY + Math.sin(x * frequency + time) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.stroke();
            
            // Reduce frame rate for idle animation
            setTimeout(() => {
                idleAnimationId = requestAnimationFrame(drawIdle);
            }, 50); // 20 FPS instead of 60
        }
        
        drawIdle();
    }

    function stopIdleAnimation() {
        if (idleAnimationId) {
            cancelAnimationFrame(idleAnimationId);
            idleAnimationId = null;
        }
    }

    // Ensure user interaction for iOS playback
    const ensureUserInteraction = () => {
        if (!userInteracted) {
            userInteracted = true;
            const unlockSpeech = new SpeechSynthesisUtterance("");
            unlockSpeech.volume = 0;
            window.speechSynthesis.speak(unlockSpeech);
            window.speechSynthesis.cancel();
            updateStatus("System Initialized", "success");
        }
    };

    // Optimized status update
    function updateStatus(message, type = "ready") {
        if (elements.statusText) {
            elements.statusText.textContent = message;
            
            if (elements.statusPulse) {
                elements.statusPulse.className = `pulse ${type}`;
                // Use CSS custom properties for better performance
                const colors = {
                    processing: "#ffcc00",
                    error: "#ff5e5e",
                    success: "#00ffa3",
                    ready: "#00ffa3"
                };
                elements.statusPulse.style.setProperty('--pulse-color', colors[type] || colors.ready);
            }
        }
    }

    // Optimized loading state management
    function addLoadingState(element) {
        if (element) {
            element.classList.add("loading");
            element.disabled = true;
        }
    }

    function removeLoadingState(element) {
        if (element) {
            element.classList.remove("loading");
            element.disabled = false;
        }
    }

    // Optimized typing indicator
    function showTypingIndicator() {
        if (elements.typingIndicator) {
            elements.typingIndicator.style.opacity = "1";
        }
    }

    function hideTypingIndicator() {
        if (elements.typingIndicator) {
            elements.typingIndicator.style.opacity = "0";
        }
    }

    // Optimized text statistics with debouncing
    const updateTextStats = debounce(() => {
        const text = elements.textArea.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const readingTime = Math.ceil(wordCount / 200);
        
        // Batch DOM updates
        requestAnimationFrame(() => {
            if (elements.charCountElement) {
                elements.charCountElement.textContent = `${charCount} chars`;
            }
            if (elements.readTimeElement) {
                elements.readTimeElement.textContent = `~${readingTime}m`;
            }
            if (elements.wordCountElement) {
                elements.wordCountElement.textContent = `${wordCount} words`;
            }
        });
    }, 100);

    // Optimized progress management
    function showProgress() {
        if (elements.mainProgress) {
            elements.mainProgress.style.display = "block";
        }
    }

    function hideProgress() {
        if (elements.mainProgress) {
            elements.mainProgress.style.display = "none";
        }
    }

    function updateProgress(percentage) {
        if (elements.progressFill) {
            elements.progressFill.style.width = `${percentage}%`;
        }
    }

    // Optimized processing timer
    function startProcessingTimer() {
        processingStartTime = performance.now();
    }

    function stopProcessingTimer() {
        if (processingStartTime > 0) {
            const processingTime = (performance.now() - processingStartTime) / 1000;
            if (elements.processingTimeElement) {
                elements.processingTimeElement.textContent = `${processingTime.toFixed(1)}s`;
            }
            processingStartTime = 0;
        }
    }

    // Optimized shortcuts toggle
    function toggleShortcuts() {
        shortcutsVisible = !shortcutsVisible;
        if (elements.shortcutsContent) {
            elements.shortcutsContent.style.display = shortcutsVisible ? "block" : "none";
        }
    }

    // Optimized visualization controls
    function toggleVisualization() {
        isVisualizationVisible = !isVisualizationVisible;
        if (elements.audioVisualizer) {
            elements.audioVisualizer.style.display = isVisualizationVisible ? "block" : "none";
        }
        if (elements.vizToggle) {
            elements.vizToggle.innerHTML = isVisualizationVisible ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        }
    }

    // Optimized fullscreen toggle
    function toggleFullscreen() {
        if (elements.audioVisualizer) {
            if (elements.audioVisualizer.requestFullscreen) {
                elements.audioVisualizer.requestFullscreen();
            } else if (elements.audioVisualizer.webkitRequestFullscreen) {
                elements.audioVisualizer.webkitRequestFullscreen();
            } else if (elements.audioVisualizer.msRequestFullscreen) {
                elements.audioVisualizer.msRequestFullscreen();
            }
        }
    }

    // Optimized file processing
    async function processTextFile(file) {
        return new Promise((resolve, reject) => {
            startProcessingTimer();
            showProgress();
            
            const reader = new FileReader();
            reader.onload = () => {
                const content = reader.result.trim();
                if (content) {
                    updateProgress(50);
                    setTimeout(() => {
                        animateTextInsertion(content);
                        updateProgress(100);
                        setTimeout(() => {
                            hideProgress();
                            stopProcessingTimer();
                            resolve();
                        }, 200); // Faster completion
                    }, 100); // Faster processing
                } else {
                    hideProgress();
                    stopProcessingTimer();
                    reject(new Error("Empty file"));
                }
            };
            reader.onerror = () => {
                hideProgress();
                stopProcessingTimer();
                reject(reader.error);
            };
            reader.readAsText(file);
        });
    }

    // Optimized PDF processing
    async function processPDFFile(file) {
        return new Promise((resolve, reject) => {
            startProcessingTimer();
            showProgress();
            
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const typedArray = new Uint8Array(reader.result);
                    updateProgress(25);
                    
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    updateProgress(50);
                    
                    let fullText = "";
                    const totalPages = pdf.numPages;
                    
                    // Process pages in batches for better performance
                    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
                        const page = await pdf.getPage(pageNumber);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(" ");
                        fullText += pageText + "\n";
                        
                        const pageProgress = 50 + (pageNumber / totalPages) * 40;
                        updateProgress(pageProgress);
                    }
                    
                    if (fullText.trim()) {
                        updateProgress(90);
                        setTimeout(() => {
                            animateTextInsertion(fullText.trim());
                            updateProgress(100);
                            setTimeout(() => {
                                hideProgress();
                                stopProcessingTimer();
                                resolve();
                            }, 200);
                        }, 100);
                    } else {
                        hideProgress();
                        stopProcessingTimer();
                        reject(new Error("No readable text found in PDF"));
                    }
                } catch (error) {
                    hideProgress();
                    stopProcessingTimer();
                    reject(error);
                }
            };
            reader.onerror = () => {
                hideProgress();
                stopProcessingTimer();
                reject(reader.error);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // Optimized text insertion with faster animation
    function animateTextInsertion(text) {
        elements.textArea.value = "";
        showTypingIndicator();
        
        let index = 0;
        const chunkSize = 10; // Insert multiple characters at once
        
        const insertText = () => {
            if (index < text.length) {
                const chunk = text.slice(index, index + chunkSize);
                elements.textArea.value += chunk;
                index += chunkSize;
                
                // Update stats less frequently
                if (index % 100 === 0) {
                    updateTextStats();
                }
                
                setTimeout(insertText, 15); // Faster animation
            } else {
                hideTypingIndicator();
                updateTextStats();
            }
        };
        
        insertText();
    }

    // Optimized notification system with reusable container
    function createNotificationContainer() {
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(notificationContainer);
        }
        return notificationContainer;
    }

    function showNotification(message, type = "info") {
        const container = createNotificationContainer();
        
        // Remove old notifications
        const existingNotifications = container.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        notification.style.cssText = `
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius);
            padding: 12px 16px;
            color: var(--light-text);
            box-shadow: var(--shadow-depth);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 280px;
            margin-bottom: 8px;
            pointer-events: auto;
        `;

        container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2500); // Faster removal
    }

    function getNotificationIcon(type) {
        const icons = {
            success: "fa-check-circle",
            error: "fa-exclamation-circle",
            warning: "fa-exclamation-triangle",
            info: "fa-info-circle"
        };
        return icons[type] || icons.info;
    }

    // Optimized voice loading
    const loadVoices = () => {
        voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes("en"));
        
        if (voices.length === 0) {
            updateStatus("Loading Voices...", "processing");
            return;
        }

        // Clear and rebuild options efficiently
        elements.voiceSelect.innerHTML = "";
        
        const fragment = document.createDocumentFragment();
        
        // Add premium options
        const premiumVoices = [
            { name: "Premium Neural Female", value: "premium-female" },
            { name: "Premium Neural Male", value: "premium-male" },
            { name: "Premium Conversational", value: "premium-conversational" }
        ];

        premiumVoices.forEach(voice => {
            const option = document.createElement("option");
            option.value = voice.value;
            option.textContent = voice.name;
            fragment.appendChild(option);
        });

        // Add system voices
        voices.forEach(voice => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            fragment.appendChild(option);
        });

        elements.voiceSelect.appendChild(fragment);

        // Select best voice
        const preferredVoice = voices.find(v => 
            /Google|Microsoft|Samantha|Alex|Siri/i.test(v.name)
        );
        if (preferredVoice) {
            elements.voiceSelect.value = preferredVoice.name;
        }

        updateStatus("Voices Loaded", "success");
    };

    // Optimized speech synthesis
    const speakText = (text, startIndex = 0) => {
        if (!text.trim()) {
            showNotification("No text to read", "warning");
            return;
        }

        ensureUserInteraction();
        window.speechSynthesis.cancel();

        words = text.split(/\s+/);
        const startText = startIndex ? words.slice(startIndex).join(" ") : text;
        
        const selectedVoiceName = elements.voiceSelect.value;
        let selectedVoice = null;
        
        if (selectedVoiceName.startsWith("premium-")) {
            selectedVoice = voices.find(v => 
                /Google|Microsoft|Samantha|Alex/i.test(v.name)
            ) || voices[0];
        } else {
            selectedVoice = voices.find(v => v.name === selectedVoiceName) || voices[0];
        }

        const speed = parseFloat(elements.speedControl.value);

        speech = new SpeechSynthesisUtterance(startText);
        speech.voice = selectedVoice;
        speech.rate = speed;
        speech.pitch = 1.0;
        speech.volume = 1.0;

        speech.onstart = () => {
            isSpeaking = true;
            isPaused = false;
            updateStatus("Playing Audio", "success");
            updateButtons();
            startAudioVisualization();
        };

        speech.onend = () => {
            isSpeaking = false;
            isPaused = false;
            updateStatus("Audio Complete", "success");
            updateButtons();
            stopAudioVisualization();
        };

        speech.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            updateStatus("Audio Error", "error");
            showNotification("Speech synthesis failed", "error");
            updateButtons();
            stopAudioVisualization();
        };

        speech.onpause = () => {
            updateStatus("Audio Paused", "processing");
            stopAudioVisualization();
        };

        speech.onresume = () => {
            updateStatus("Audio Resumed", "success");
            startAudioVisualization();
        };

        window.speechSynthesis.speak(speech);
        updateButtons();
    };

    // Optimized audio visualization
    function startAudioVisualization() {
        if (!visualizerContext) return;
        
        stopIdleAnimation();
        
        const canvas = elements.audioVisualizer;
        const ctx = visualizerContext;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        function drawVisualization() {
            if (!isSpeaking || isPaused) return;
            
            ctx.clearRect(0, 0, width, height);
            
            // Optimized gradient
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, 'rgba(0, 179, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(157, 0, 255, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Optimized bars
            const barCount = 32; // Reduced from 50
            const barWidth = width / barCount;
            
            for (let i = 0; i < barCount; i++) {
                const height_bar = Math.random() * height * 0.6 + height * 0.1;
                const x = i * barWidth;
                const y = (height - height_bar) / 2;
                
                ctx.fillStyle = `rgba(${Math.floor(Math.random() * 50)}, 179, 255, 0.7)`;
                ctx.fillRect(x, y, barWidth - 1, height_bar);
            }
            
            animationId = requestAnimationFrame(drawVisualization);
        }
        
        drawVisualization();
    }

    function stopAudioVisualization() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        startIdleAnimation();
    }

    // Optimized button management
    const updateButtons = () => {
        elements.readAloudButton.disabled = isSpeaking;
        elements.pauseAloudButton.disabled = !isSpeaking;
        elements.stopAloudButton.disabled = !isSpeaking;
        
        if (isPaused) {
            elements.pauseAloudButton.innerHTML = '<i class="fas fa-play"></i> <span>Resume</span>';
        } else {
            elements.pauseAloudButton.innerHTML = '<i class="fas fa-pause"></i> <span>Pause</span>';
        }
        
        elements.readAloudButton.classList.toggle("active", isSpeaking);
    };

    // Optimized word tracking
    const getWordIndex = (charPos, text) => {
        return text.substring(0, charPos).split(/\s+/).length - 1;
    };

    // Enhanced page transition
    elements.pulsatingGetStartedButton.addEventListener("click", () => {
        elements.descriptionPage.style.animation = "fadeOut 0.5s ease-in-out";
        
        setTimeout(() => {
            elements.descriptionPage.classList.add("hidden");
            elements.mainPage.classList.remove("hidden");
            elements.mainPage.style.animation = "pageSlideIn 0.8s ease-out";
            
            ensureUserInteraction();
            updateStatus("Interface Ready");
        }, 500);
    });

    // Optimized file conversion
    elements.convertButton.addEventListener("click", async () => {
        const file = elements.fileInput.files[0];
        if (!file) {
            showNotification("Please select a file to upload", "warning");
            return;
        }

        const fileExtension = file.name.split(".").pop().toLowerCase();
        
        if (!["txt", "pdf"].includes(fileExtension)) {
            showNotification("Please select a TXT or PDF file", "error");
            return;
        }

        addLoadingState(elements.convertButton);
        updateStatus("Processing File...", "processing");
        showTypingIndicator();

        try {
            if (fileExtension === "txt") {
                await processTextFile(file);
            } else if (fileExtension === "pdf") {
                await processPDFFile(file);
            }
            
            updateStatus("File Processed Successfully", "success");
            showNotification("File converted successfully!", "success");
            
        } catch (error) {
            console.error("File processing error:", error);
            updateStatus("File Processing Failed", "error");
            showNotification("Failed to process file. Please try again.", "error");
        } finally {
            removeLoadingState(elements.convertButton);
            hideTypingIndicator();
        }
    });

    // Event listeners
    elements.textArea.addEventListener("click", () => {
        const cursorPos = elements.textArea.selectionStart;
        const fullText = elements.textArea.value.trim();
        words = fullText.split(/\s+/);
        startWordIndex = getWordIndex(cursorPos, fullText);
        showNotification(`Starting from word ${startWordIndex + 1}`, "info");
    });

    elements.readAloudButton.addEventListener("click", () => {
        const fullText = elements.textArea.value.trim();
        if (fullText) {
            speakText(fullText, startWordIndex);
        } else {
            showNotification("Please enter some text first", "warning");
        }
    });

    elements.pauseAloudButton.addEventListener("click", () => {
        if (isSpeaking && !isPaused) {
            window.speechSynthesis.pause();
            isPaused = true;
            updateStatus("Audio Paused", "processing");
        } else if (isPaused) {
            window.speechSynthesis.resume();
            isPaused = false;
            updateStatus("Audio Resumed", "success");
        }
        updateButtons();
    });

    elements.stopAloudButton.addEventListener("click", () => {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        isPaused = false;
        updateStatus("Audio Stopped", "success");
        updateButtons();
        stopAudioVisualization();
    });

    elements.clearTextButton.addEventListener("click", () => {
        if (elements.textArea.value.trim() || elements.fileInput.files.length > 0) {
            if (confirm("Are you sure you want to clear all content?")) {
                window.speechSynthesis.cancel();
                elements.textArea.value = "";
                elements.fileInput.value = "";
                isSpeaking = false;
                isPaused = false;
                startWordIndex = 0;
                updateButtons();
                updateStatus("Content Cleared", "success");
                showNotification("All content cleared", "info");
                updateTextStats();
            }
        }
    });

    // Optimized AI text processing
    elements.rearrangeTextButton.addEventListener("click", () => {
        let text = elements.textArea.value.trim();
        if (!text) {
            showNotification("No text to enhance", "warning");
            return;
        }

        addLoadingState(elements.rearrangeTextButton);
        updateStatus("Enhancing Text...", "processing");
        showTypingIndicator();

        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
            // Optimized text processing
            text = text
                .replace(/\s+/g, " ")
                .trim()
                .replace(/([.!?])\s*([a-z])/g, (match, punctuation, letter) => 
                    punctuation + " " + letter.toUpperCase())
                .replace(/\bi\b/g, "I")
                .replace(/\bi'm\b/g, "I'm")
                .replace(/\bi'll\b/g, "I'll")
                .replace(/\bi've\b/g, "I've")
                .replace(/\bi'd\b/g, "I'd");

            text = text.charAt(0).toUpperCase() + text.slice(1);
            if (!/[.!?]$/.test(text)) {
                text += ".";
            }

            animateTextInsertion(text);
            
            removeLoadingState(elements.rearrangeTextButton);
            updateStatus("Text Enhanced", "success");
            hideTypingIndicator();
            showNotification("Text enhanced successfully!", "success");
        }, 500); // Faster processing
    });

    // Optimized speed control
    elements.speedControl.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        elements.speedValue.textContent = value.toFixed(1);
        
        if (isSpeaking && speech) {
            speech.rate = value;
        }
        
        const percentage = ((value - 0.5) / 1.5) * 100;
        elements.speedControl.style.setProperty('--progress', `${percentage}%`);
    });

    // Event listeners for new features
    if (elements.shortcutsToggle) {
        elements.shortcutsToggle.addEventListener("click", toggleShortcuts);
    }

    if (elements.vizToggle) {
        elements.vizToggle.addEventListener("click", toggleVisualization);
    }

    if (elements.vizFullscreen) {
        elements.vizFullscreen.addEventListener("click", toggleFullscreen);
    }

    elements.textArea.addEventListener("input", updateTextStats);

    // Optimized outside click handler
    document.addEventListener("click", (e) => {
        if (shortcutsVisible && !e.target.closest(".shortcuts-panel")) {
            toggleShortcuts();
        }
    });

    // Optimized keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case "Enter":
                    e.preventDefault();
                    if (!isSpeaking) elements.readAloudButton.click();
                    break;
                case " ":
                    e.preventDefault();
                    if (isSpeaking) elements.pauseAloudButton.click();
                    break;
                case "Escape":
                    e.preventDefault();
                    if (isSpeaking) elements.stopAloudButton.click();
                    break;
                case "h":
                    e.preventDefault();
                    toggleShortcuts();
                    break;
                case "v":
                    e.preventDefault();
                    toggleVisualization();
                    break;
                case "f":
                    e.preventDefault();
                    toggleFullscreen();
                    break;
            }
        }
    });

    // Optimized resize handler
    const resizeHandler = debounce(() => {
        if (elements.audioVisualizer && visualizerContext) {
            const dpr = window.devicePixelRatio || 1;
            const rect = elements.audioVisualizer.getBoundingClientRect();
            
            elements.audioVisualizer.width = rect.width * dpr;
            elements.audioVisualizer.height = rect.height * dpr;
            elements.audioVisualizer.style.width = rect.width + 'px';
            elements.audioVisualizer.style.height = rect.height + 'px';
            
            visualizerContext.scale(dpr, dpr);
            
            if (!isSpeaking) {
                startIdleAnimation();
            }
        }
    }, 100);

    window.addEventListener('resize', resizeHandler);

    // Initialize
    initializeParticles();
    initializeAudioVisualizer();
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    updateStatus("System Ready");

    // Add optimized CSS
    const style = document.createElement('style');
    style.textContent = `
        .pulse {
            background: var(--pulse-color, #00ffa3) !important;
        }
        
        .control-button.active {
            background: rgba(0, 179, 255, 0.2) !important;
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 15px rgba(0, 179, 255, 0.5) !important;
        }
        
        .notification {
            font-family: 'Titillium Web', sans-serif;
            will-change: transform;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .notification.success { border-left: 3px solid var(--success); }
        .notification.error { border-left: 3px solid var(--danger); }
        .notification.warning { border-left: 3px solid var(--warning); }
        .notification.info { border-left: 3px solid var(--primary-color); }
        
        @keyframes fadeOut {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-30px); }
        }
        
        /* Performance optimizations */
        .cyber-container, .glass-card {
            will-change: transform;
            backface-visibility: hidden;
        }
        
        canvas {
            will-change: contents;
        }
        
        .loading {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // Performance monitoring (optional)
    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('app-initialized');
        console.log('🚀 Beeek optimized and ready!');
    }
});