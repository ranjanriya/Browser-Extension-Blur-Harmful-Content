🛡️ YouTube Harmful Content Detection and Blurring Extension

This project uses machine learning and keyword analysis to automatically detect potentially harmful YouTube videos based on their metadata — and blurs them for safer browsing.

📚 This project was developed as part of CSCI-534: Affective Computing taught by Professor Jonathan Gratch at the University of Southern California (USC).

🚀 Key Features
Real-time YouTube Monitoring: Detects and analyzes visible YouTube videos as you browse.

Batch Processing: Groups up to 25 video URLs for efficient backend analysis.

Hybrid Harmfulness Detection:

Keyword Matching: Flags violent, abusive, self-harm, substance-use, adult, and emotionally distressing content based on metadata.

Emotion Classification: Uses a fine-tuned DistilRoBERTa model to detect harmful emotional cues in video titles, descriptions, and tags.

Dynamic Blurring: Applies a blur overlay to videos classified as harmful.

User Customization: Choose which categories (e.g., violence, adult content) to blur through extension settings.

Lightweight and Fast: Operates without needing full video downloads — only metadata is used.

⚙️ Setup Instructions
Clone this repository or download the project files.

Open Google Chrome and go to: chrome://extensions/

Enable Developer mode (top right corner).

Click Load unpacked and select the extension directory (content.js must be included).

The extension icon should appear in your Chrome toolbar.

Click the extension icon to select the mode or adjust settings (e.g., select categories to blur).

Start browsing YouTube and experience safer, filtered content viewing!

🧠 Technology Stack
Backend:

Python 3.x

Flask (REST API server)

yt_dlp for fetching YouTube metadata

Huggingface Transformers (j-hartmann/emotion-english-distilroberta-base model)

Frontend:

Chrome Extension

JavaScript (content.js)

Chrome Storage API

Intersection Observers and Mutation Observers for dynamic page tracking

📄 Important Notes
The Flask backend (video.py) must be running locally on port 4000 for the extension to work.

Make sure you have installed all Python dependencies listed in requirements.txt.

The model uses GPU if available (cuda) for faster performance, otherwise defaults to CPU.

📚 Acknowledgments
This project is part of coursework for CSCI-534: Affective Computing, Fall 2024/Spring 2025, at University of Southern California (USC).

Guided by Professor Jonathan Gratch.

Emotion classification model credit: j-hartmann/emotion-english-distilroberta-base.

🎯 Final Note
By combining affective computing techniques and browser-based real-time interventions, this project demonstrates how emotion recognition models can enhance online safety and user experience on content platforms.

