# 🛡️ YouTube Harmful Content Detection and Blurring Extension

This project uses machine learning and keyword analysis to automatically detect potentially harmful YouTube videos based on their metadata — and blurs them for safer browsing.

> 📚 **This project was developed as part of _CSCI-534: Affective Computing_ taught by Professor Jonathan Gratch at the _University of Southern California (USC)._**

---

## ✨ Key Features

- 🎯 **Real-time YouTube Monitoring**: Detects and analyzes visible YouTube videos as you browse.
- 🚀 **Batch Processing**: Groups up to 25 video URLs for efficient backend analysis.
- 🧠 **Hybrid Harmfulness Detection**:
  - 📝 **Keyword Matching**: Flags violent, abusive, self-harm, substance-use, adult, and emotionally distressing content based on metadata.
  - 🤖 **Emotion Classification**: Uses a fine-tuned DistilRoBERTa model to detect harmful emotional cues in video titles, descriptions, and tags.
- 🎨 **Dynamic Blurring**: Applies a blur overlay to videos classified as harmful.
- 🛠️ **User Customization**: Choose which categories (e.g., violence, adult content) to blur through extension settings.
- ⚡ **Lightweight and Fast**: Operates without needing full video downloads — only metadata is used.

---

## ⚙️ Setup Instructions

1. Clone this repository or download the project files.

2. Open **Google Chrome** and navigate to: `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top right corner).

4. Click **Load unpacked** and select the extension directory (where `content.js` is located).

5. The extension icon should now appear in your Chrome toolbar.

6. Click the extension icon to select your mode or adjust blur settings.

7. Make sure the **Flask backend** (`video.py`) is running locally on port `4000`:

   - First, install the required Python dependencies by running:
   
     ```bash
     pip install -r requirements.txt
     ```

8. Start browsing YouTube and experience safer, filtered content viewing!

---

## 🧰 Technology Stack

**Backend**:
- Python 3.x
- Flask (REST API server)
- yt_dlp (fetching YouTube metadata)
- Huggingface Transformers (`j-hartmann/emotion-english-distilroberta-base`)

**Frontend**:
- Chrome Extension (Manifest V3)
- JavaScript (content scripts)
- Chrome Storage API
- Intersection Observers and Mutation Observers for dynamic page tracking

---

## ⚡ Important Notes

- The backend must be running for the extension to classify videos.
- The AI model automatically detects and uses GPU if available (CUDA), otherwise defaults to CPU.
- Only video metadata (not full videos) is processed — ensuring lightweight performance.

---

## 🙏 Acknowledgments

- Developed for **CSCI-534: Affective Computing** at the **University of Southern California (USC)**.
- Guided by **Professor Jonathan Gratch**.
- Emotion classification model credit: [`j-hartmann/emotion-english-distilroberta-base`](https://huggingface.co/j-hartmann/emotion-english-distilroberta-base).

---

## 🧠 Final Note

By combining affective computing techniques with browser-based real-time interventions, this project demonstrates how emotion recognition models can enhance online safety and improve user experiences on major content platforms like YouTube.
