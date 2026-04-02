# Blockbench ➜ KubeJS (Palladium) Converter

A lightweight static website that converts Blockbench animation JSON (player or model style) into a KubeJS script skeleton for Palladium mod-addons.

## Run locally

Open `index.html` in your browser.

Or serve with Python:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Notes

- This converter handles common Blockbench animation structures (`animations`, `bones`, `rotation`, `position`, `scale`).
- Palladium/KubeJS APIs can vary by version; generated output is meant as a solid starting point and may need minor API adjustments.
