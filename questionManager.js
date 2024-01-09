import brainInfo from './brainInfo.js';

class QuestionManager {
    constructor(raycasterManager) {
        this.raycasterManager = raycasterManager;
        this.setupQuestionPanel();
    }

    setupQuestionPanel() {
        //drowpdown trigger
        document.getElementById('question-dropdown-trigger').addEventListener('click', () => {
            var questionPanel = document.getElementById('question-panel');
            if (questionPanel.classList.contains('visible')) {
                questionPanel.classList.remove('visible');
            } else {
                questionPanel.classList.add('visible');
                this.generateQuestion();
            }
        });

        // Setup for the question panel, including event listeners
        document.getElementById('new-question-btn').addEventListener('click', () => {
            this.generateQuestion();
        });
        document.getElementById('submit-answer-btn').addEventListener('click', () => {
            this.checkAnswer();
        });
    }

    async generateQuestion() {
        const offlineMode = document.getElementById('offline-mode-checkbox').checked;
        const loadingElement = document.getElementById('loading-animation');
        if (!offlineMode) { loadingElement.classList.remove('loading-hidden'); }
    
        document.getElementById('question-container').innerHTML = '';
        document.getElementById('answer-feedback').innerHTML = '';
    
        // Randomly select a brain part
        const randomBrainPartKey = Object.keys(brainInfo)[Math.floor(Math.random() * Object.keys(brainInfo).length)];
        // Fetch Wikipedia summary
        const wikipediaInfo = await this.raycasterManager.fetchWikipediaSummary(brainInfo[randomBrainPartKey].wikipediaTitle);
    
        if (wikipediaInfo) {
            // Create a prompt for AI
            const prompt = `Create a multiple-choice question based on this information about the ${randomBrainPartKey}: ${wikipediaInfo.description}. Format the response as: "Question: ...\n, Option A: ...\n, Option B: ...\n, Option C: ...\n, Option D: ...\n Correct: X."`;
            const questionData = await this.fetchQuestion(prompt, offlineMode);
            if (questionData) {
                // Check if response length exceeds 250 characters
                if (questionData.length > 300) {
                    // Refetch question if response is too long
                    console.log('Question too long. Refetching...');
                    return this.generateQuestion();
                    
                }
                this.parseAndDisplayQuestion(questionData);
            }
        }
    
        if (!offlineMode) { loadingElement.classList.add('loading-hidden'); }
    }

    async fetchQuestion(prompt, offlineMode) {
        
        console.log('Offline mode:', offlineMode);
        // Fetch question from Flask backend
        const response = await fetch('http://localhost:5001/generate-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt, offline_mode: offlineMode })
        });
        const data = await response.json();
        return data.choices ? data.choices[0].message.content : null;
    }

    parseAndDisplayQuestion(questionData) {
        const feedbackDiv = document.getElementById('answer-feedback');
        feedbackDiv.textContent = '';
        console.log(questionData);
        const questionContainer = document.getElementById('question-container');
    
        // Split the response into lines and filter out empty lines
        const lines = questionData.split('\n').map(line => line.trim()).filter(line => line !== "");
    
        if (lines.length < 6) {
            questionContainer.innerHTML = "<p>Error generating question. Please try again.</p>";
            return;
        }
    
        // Extract question and options
        const question = lines[0];
        const options = lines.slice(1, 5); // Assuming options are the next four lines
        let correctAnswerLine = lines.find(line => line.startsWith("Correct:"));
    
        if (!correctAnswerLine) {
            questionContainer.innerHTML = "<p>Error generating question. Please try again.</p>";
            return;
        }
    
        // Extract correct answer letter
        let correctAnswerMatch = correctAnswerLine.match(/Correct:.*Option ([A-D])/) || correctAnswerLine.match(/Correct: ([A-D])/);
        if (!correctAnswerMatch) {
            questionContainer.innerHTML = "<p>Error generating question. Please try again.</p>";
            return;
        }
    
        // Display question and options with labels
        questionContainer.innerHTML = `
            <p id="question">${question}</p>
            ${options.map((option, index) => 
                `<label class="tron-radio-option">
                    <input type="radio" name="option" value="${'ABCD'[index]}">
                    <span class="custom-radio"></span>
                    ${option}
                </label>`
            ).join('')}
        `;
    
        // Set the correct answer
        this.correctAnswer = correctAnswerMatch[1];
    }

    checkAnswer() {
        // Check user's answer and provide feedback
        const selectedOption = document.querySelector('input[name="option"]:checked');
        const userAnswer = selectedOption ? selectedOption.value : null;
        const feedbackDiv = document.getElementById('answer-feedback');
    
        if (userAnswer === this.correctAnswer) {
            feedbackDiv.textContent = 'Correct!';
            feedbackDiv.style.color = 'limegreen'; // Bright green color for correct answer
        } else {
            feedbackDiv.textContent = 'Incorrect. The correct answer is: ' + this.correctAnswer;
            feedbackDiv.style.color = 'red'; // Bright red color for incorrect answer
        }
    }
}

export default QuestionManager;
