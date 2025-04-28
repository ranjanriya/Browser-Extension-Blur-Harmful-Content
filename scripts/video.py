from flask import Flask, request, jsonify
import yt_dlp, torch, json
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
CORS(app)

print("Device set to use", "cuda" if torch.cuda.is_available() else "cpu")

# Load multi-label emotion classifier
model_name = "j-hartmann/emotion-english-distilroberta-base"
device = 0 if torch.cuda.is_available() else -1

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
classifier = pipeline("text-classification", model=model, tokenizer=tokenizer, top_k=None, device=device)

# yt_dlp options
ydl_opts = {
    "quiet": True,
    "extract_flat": False,
    "noplaylist": True,
    "writeautomaticsub": True,
    "skip_download": True,
}

# Category keyword map
keyword_map = {
    "violence": [
        "fight", "kill", "blood", "assault", "murder", "gore", "shooting", "explosion",
        "war", "terrorist", "attack", "beating", "stab", "weapon", "riot", "execution",
        "brawl", "injury", "crime", "violence", "massacre"
    ],
    "self-harm": [
        "suicide", "self-harm", "overdose", "kill myself", "cutting", "burning",
        "end my life", "die", "jump off", "i want to die", "taking my life", "self-injury"
    ],
    "abuse": [
        "harass", "bully", "abuse", "assault", "threat", "hate", "racist", "sexist", 
        "homophobic", "slur", "verbal abuse", "toxic", "stalker", "manipulate", "gaslight",
        "cyberbully", "intimidate", "predator", "molest"
    ],
    "substance-use": [
        "drug", "alcohol", "cocaine", "weed", "marijuana", "addict", "heroin",
        "meth", "narcotics", "intoxicated", "high", "getting drunk", "pills", "overdose",
        "lsd", "substance", "rehab", "vape", "binge drinking", "opioid"
    ],
    "adult": [
        "sex", "nude", "naked", "nsfw", "onlyfans", "porn", "xxx", "fetish", "explicit",
        "erotic", "adult", "strip", "lingerie", "camgirl", "sexual", "provocative", "uncensored"
    ],
    "emotional-distress": [
        "depression", "anxiety", "crying", "alone", "grief", "panic", "sadness",
        "worthless", "hopeless", "empty", "breakup", "lonely", "heartbroken", 
        "struggling", "mental breakdown", "miserable", "i hate myself", "burnout",
        "overwhelmed", "mourning", "lost someone", "feeling down"
    ]
}

# Emotion to category mapping
emotion_to_category = {
    "sadness": "emotional-distress",
    "fear": "emotional-distress",
    "guilt": "emotional-distress",
    "embarrassment": "emotional-distress",
    "anger": "abuse",
    "disgust": "abuse",
    "joy": "other",
    "love": "other",
    "surprise": "other",
    "pride": "other",
    "neutral": "other"
}

# Truncate input for classifier to avoid token overflow
def truncate_text(text, max_chars=1000):
    return text[:max_chars]

# Fetch YouTube video metadata
def get_video_info(video_url):
    try:
        ydl = yt_dlp.YoutubeDL(ydl_opts)
        info = ydl.extract_info(video_url, download=False)
        return {
            "url": video_url,
            "Title": info.get("title", "Age-Restricted Video"),
            "Description": info.get("description", ""),
            "Category": info.get("categories", []),
            "Tags": info.get("tags", []),
            "View Count": info.get("view_count", 0),
            "Like Count": info.get("like_count", 0),
            "Comment Count": info.get("comment_count", 0),
        }
    except yt_dlp.utils.DownloadError:
        return {"url": video_url, "Title": "Age-Restricted Video"}

# Match keywords
def get_category_from_keywords(text):
    for category, keywords in keyword_map.items():
        if any(word in text for word in keywords):
            return category
    return None

# Emotion classifier mapping
def get_category_from_emotion_classifier(text, threshold=0.4):
    try:
        results = classifier(text)[0]
        filtered = [res for res in results if res['score'] >= threshold]
        for res in filtered:
            emotion = res['label'].lower()
            category = emotion_to_category.get(emotion)
            if category and category != "other":
                return category
        return "other"
    except Exception as e:
        print(f"Error in classifier: {e}")
        return "other"

# Main classifier logic
def analyze_harmfulness(video_data):
    title = video_data.get("Title", "")
    
    if title == "Age-Restricted Video":
        return {
            "url": video_data["url"],
            "label": "restricted",
            "confidence": 1.0,
            "classification": "HARMFUL",
            "category": "adult"
        }

    description = video_data.get("Description", "")
    tags = " ".join(video_data.get("Tags", []))
    full_text = truncate_text(f"{title} {description} {tags}".lower())

    keyword_category = get_category_from_keywords(full_text)
    classifier_category = get_category_from_emotion_classifier(full_text)
    final_category = keyword_category if keyword_category else classifier_category
    classification = "HARMFUL" if final_category != "other" else "SAFE"

    return {
        "url": video_data["url"],
        "label": final_category,
        "confidence": 1.0,
        "classification": classification,
        "category": final_category
    }

# Batch endpoint
@app.route('/analyze_batch', methods=['POST'])
def analyze_videos():
    data = request.get_json()
    video_urls = data.get("video_urls", [])

    if not video_urls:
        return jsonify({"error": "No video URLs provided"}), 400

    def process_video(url):
        video_info = get_video_info(url)
        return analyze_harmfulness(video_info)

    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(process_video, video_urls))

    app.logger.info("API Response:\n%s", json.dumps(results, indent=2))
    return jsonify({"results": results})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4000, debug=True)
