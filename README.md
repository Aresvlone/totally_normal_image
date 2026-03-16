# TotallyNormalImage

A modern, client-side steganography tool that hides secret messages and files inside images using LSB (Least Significant Bit) encoding.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Features

- **LSB Steganography** — Hide data in the least significant bits of image pixels, invisible to the human eye
- **Hide Messages** — Embed secret text messages inside any image
- **Hide Files** — Conceal any file type (PDFs, ZIPs, documents, etc.) within an image
- **AES-256 Encryption** — Optional password protection using industry-standard AES-256-GCM encryption
- **100% Client-Side** — All processing happens in your browser; no data is ever sent to a server
- **Pixel-Perfect Decoding** — Uses `createImageBitmap` with disabled color space conversion for accurate LSB extraction
- **Modern UI** — Glassmorphism design with smooth animations and WebGL background effects

## How It Works

1. **Select a cover image** — PNG recommended for lossless output
2. **Choose what to hide** — A text message or any file
3. **Optional: Add a password** — Encrypts your data with AES-256-GCM before embedding
4. **Encode** — The tool embeds your data into the image's pixel LSBs
5. **Download** — Save the encoded PNG image (visually identical to the original)

To extract hidden data, simply upload the encoded image and provide the password if one was used.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure & Canvas API |
| CSS3 | Glassmorphism UI, animations |
| Vanilla JS | Application logic |
| Web Crypto API | AES-256-GCM encryption |
| Three.js | WebGL neon beam background |
| Anime.js | Scroll animations |
| Vite | Development server & build |

## Getting Started

### Prerequisites

- Node.js 18+ (for Vite dev server)
- A modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/totallynormalimage.git
cd totallynormalimage

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
totallynormalimage/
├── index.html          # Main HTML page
├── styles.css          # All CSS styles
├── app.js              # Main application logic
├── crypto.js           # AES-256-GCM encryption module
├── steganography.js    # LSB encoding/decoding engine
├── package.json        # Project dependencies
├── .gitignore          # Git ignore rules
├── .env                # Environment variables
└── README.md           # This file
```

## Capacity Formula

The maximum data you can hide depends on the image dimensions:

```
Max Bytes = (Width × Height × 3 - 32) / 8
```

For example, a 1920×1080 image can hold approximately **778 KB** of hidden data.

## Security Notes

- All encryption/decryption happens locally in your browser
- No data is transmitted to any server
- Uses PBKDF2 with 100,000 iterations for key derivation
- AES-256-GCM provides authenticated encryption
- Always use PNG format for encoded images (JPEG compression destroys LSB data)

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 80+ | Yes |
| Firefox 75+ | Yes |
| Safari 14+ | Yes |
| Edge 80+ | Yes |

## License

This project is licensed under the ISC License.

## Acknowledgments

- Inspired by classic steganography techniques
- UI design influenced by Apple's Liquid Glass aesthetic
- Built as a CNS (Cryptography & Network Security) academic project

---

**Disclaimer**: This tool is for educational purposes only. Use responsibly and in accordance with applicable laws.
