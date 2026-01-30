# MicroLearn AdBlocker

MicroLearn is a Chrome extension that replaces online advertisements with small learning cards instead of simply hiding ads.

Rather than blocking ads entirely, MicroLearn transforms unused space into meaningful micro-learning moments.

---

## ✨ Features

- 🚫 Replaces ads on webpages with learning placeholders  
- 🎓 Displays educational micro-content instead of empty gaps  
- 🔁 Automatically detects dynamically loaded ads  
- 🔘 Simple enable / disable toggle  
- 💾 Remembers user settings across sessions  
- 🎨 Cleans popup interface  
- 🔤 Uses Google Sans typography throughout the extension  

---

## 🧠 How It Works

1. **Content scripts** run on every webpage.
2. The script scans the page for common ad containers.
3. When an ad is found, it is fully replaced with a MicroLearn placeholder card.
4. A `MutationObserver` watches for ads that load dynamically.
5. The popup toggle controls whether replacement is enabled.
6. User preferences are stored using Chrome sync storage.

---

## 📁 Project File Structure
microlearn-extension/
│── README.md
| → Project documentation
|
├── manifest.json
│ → Chrome extension configuration and permissions
│
├── content.js
│ → Injected into webpages and replaces ads with learning cards
│
├── content.css
│ → Styles for MicroLearn placeholder cards
│
├── popup.html
│ → Extension popup layout
│
├── popup.css
│ → Popup styling and UI design
│
├── popup.js
│ → Popup logic and toggle state handling
│
├── images/
│ └── logo1.png
│ → Extension icons and branding
│
├── fonts/
│ ├── static/
│ │ → Google Sans variable font files
│ │
  ├── GoogleSans-VariableFont_GRAD,opsz,wght.ttf
│ │ → Google Sans variable font
│ │
│ └── GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf
└── → Google Sans italic font

---

## 🧩 Technologies Used

- JavaScript (ES6)
- Chrome Extensions Manifest V3
- HTML5
- CSS3
- Google Sans Variable Font
- Chrome Storage API
- MutationObserver API

---

## 🚀 Installation (Developer Mode)

1. Clone or download this repository.
2. Open **Google Chrome**.
3. Navigate to:
4. Enable **Developer mode** (top right).
5. Click **Load unpacked**.
6. Select the `microlearn-extension` folder.

The extension will now appear in your Chrome toolbar.

---

## 🔘 Popup Controls

- **Status: On**  
  MicroLearn replaces ads with learning cards.

- **Status: Off**  
  Pages reload and original ads return.

---

## 🔐 Permissions Explained

| Permission | Reason |
|------------|--------|
|  `storage` | Saves enabled / disabled state |

No tracking, analytics, or personal data is collected.

---

## 🛠️ Planned Enhancements

- 📚 Rotating micro-learning lessons
- 🔢 Ad replacement counters
- 🌐 Per-site whitelist?
- 🌙 Dark mode?
- ⚡ Learning intensity modes?
- 📊 Usage statistics?

---

## 📄 License

This project is for educational and personal use.

---

## 🔤 Fonts & Licensing

This project includes the **Google Sans** typeface.

Google Sans is a proprietary font developed by Google and is not distributed through Google Fonts.  
The font files included in this project are used solely for **interface design and demonstration purposes**.

### Included font files

- `GoogleSans-VariableFont_GRAD,opsz,wght.ttf`
- `GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf`

### License notice

The Google Sans font files are provided under the license included with the original font distribution.

All rights to Google Sans are reserved by **Google LLC**.

This project does **not claim ownership** of the Google Sans typeface.

If you intend to redistribute this project publicly or commercially, you are responsible for ensuring compliance with Google’s font licensing terms.

---

## ❤️ Philosophy

> “Don’t waste attention — transform it.”

MicroLearn turns advertising space into opportunities to learn something small every day.


