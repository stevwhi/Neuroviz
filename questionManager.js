import brainInfo from './brainInfo.js';

class QuestionManager {
    constructor(raycasterManager) {
        this.raycasterManager = raycasterManager;
        this.setupQuestionPanel();
    }

    setupQuestionPanel() {
        // Setup for the question panel, including event listeners
        document.getElementById('new-question-btn').addEventListener('click', () => {
            this.generateQuestion();
        });
        document.getElementById('submit-answer-btn').addEventListener('click', () => {
            this.checkAnswer();
        });
    }

    async generateQuestion() {
        // Randomly select a brain part
        const randomBrainPartKey = Object.keys(brainInfo)[Math.floor(Math.random() * Object.keys(brainInfo).length)];
        // Fetch Wikipedia summary
        const wikipediaInfo = await this.raycasterManager.fetchWikipediaSummary(brainInfo[randomBrainPartKey].wikipediaTitle);

        if (wikipediaInfo) {
            // Create a prompt for AI
            const prompt = `Create a multiple-choice question based on this information about the ${randomBrainPartKey}: ${wikipediaInfo.description}. Format the response as: "Question: ..., Option A: ..., Option B: ..., Option C: ..., Option D: ... Correct: X."`;
            const questionData = await this.fetchQuestion(prompt);
            if (questionData) {
                this.parseAndDisplayQuestion(questionData);
            }
        }
    }

    async fetchQuestion(prompt) {
        const offlineMode = document.getElementById('offline-mode-checkbox').checked;
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
    
        // Display question and options
        questionContainer.innerHTML = `
            <p>${question}</p>
            ${options.map((option, index) => 
                `<div><input type="radio" name="option" value="${'ABCD'[index]}"> ${option}</div>`
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
        } else {
            feedbackDiv.textContent = 'Incorrect. The correct answer is: ' + this.correctAnswer;
        }
    }
}

export default QuestionManager;
