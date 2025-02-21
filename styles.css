/* Flying Birds Animation */
.flying-birds {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Ensure birds don't interfere with clicks */
  z-index: -1; /* Place birds behind the content */
}

.bird-container {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bird {
  position: absolute;
  width: 30px;
  height: 30px;
  background: url('bird-icon.png') no-repeat center center; /* Add your bird icon here */
  background-size: contain;
  animation: fly 10s linear infinite;
}

.bird:nth-child(1) {
  top: 10%;
  left: -50px;
  animation-delay: 0s;
}

.bird:nth-child(2) {
  top: 30%;
  left: -50px;
  animation-delay: 2s;
}

.bird:nth-child(3) {
  top: 50%;
  left: -50px;
  animation-delay: 4s;
}

.bird:nth-child(4) {
  top: 70%;
  left: -50px;
  animation-delay: 6s;
}

@keyframes fly {
  0% {
    transform: translateX(-100%) translateY(0) rotate(0deg);
  }
  50% {
    transform: translateX(50%) translateY(-20px) rotate(10deg);
  }
  100% {
    transform: translateX(200%) translateY(0) rotate(0deg);
  }
}

/* Rest of the CSS */
body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f4f4f9;
  color: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

#description-page {
  text-align: center;
  max-width: 600px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1; /* Ensure description page is above birds */
}

#description-page h1 {
  font-size: 2.5rem;
  color: #6200ea;
  margin-bottom: 20px;
}

#description-page p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

#pulsating-get-started {
  background-color: #6200ea;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 1.2rem;
  cursor: pointer;
  animation: pulsate 1.5s infinite;
  transition: background-color 0.3s ease;
}

@keyframes pulsate {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

#pulsating-get-started:hover {
  background-color: #3700b3;
}

#main-page {
  width: 100%;
  max-width: 800px;
  margin: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

header {
  background-color: #6200ea;
  color: white;
  padding: 20px;
  text-align: center;
  border-radius: 10px 10px 0 0;
}

header h1 {
  margin: 0;
}

#upload-section {
  padding: 20px;
}

textarea {
  width: calc(100% - 20px); /* Adjust width to prevent overflow */
  height: 200px;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  resize: vertical;
  box-sizing: border-box; /* Ensure padding doesn't affect width */
}

.controls {
  display: flex;
  flex-wrap: wrap; /* Wrap buttons on smaller screens */
  gap: 10px; /* Add spacing between buttons */
  margin-top: 10px;
}

.voice-controls {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  gap: 10px; /* Add spacing between controls */
}

footer {
  padding: 10px;
  background-color: #6200ea;
  color: white;
  text-align: center;
  border-radius: 0 0 10px 10px;
  width: 100%;
}

.hidden {
  display: none;
}
