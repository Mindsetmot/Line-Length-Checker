# Line Length Checker & Text Metrics

A lightweight, client-side web utility designed to help manage text line lengths, character limits, and raw formatting tags. 

This tool is particularly useful when handling raw string data, maintaining character-per-line boundaries, or processing subtitle formats (such as VTT and SRT files) where inline HTML tags need to be preserved without breaking the layout.

## Features
- **Real-time Metrics:** Instantly counts characters and lines as you type or paste.
- **Client-Side Only:** No server processing. Your text data never leaves your browser, ensuring complete privacy.
- **Raw Formatting Support:** Designed to handle strings with inline tags seamlessly.

## Project Structure
- `index.html`: The main web interface.
- `js/text-parser.min.js`: Core logic for parsing input strings and managing DOM updates.
- `js/line-metrics.min.js`: Utility functions for calculating line breaks and character constraints.

## Usage
Simply visit the live page hosted via GitHub Pages (or your custom domain) and paste your text into the provided textarea. The metrics will update automatically.

## Local Development
Since this is a static site with vanilla JavaScript, no build tools or package managers are required.
1. Clone the repository.
2. Open `index.html` in any modern web browser.

## License
MIT License. Feel free to use or modify this utility for your own text processing needs.
