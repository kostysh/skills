The working page in this directory is index.html. Its styles and scripts are local. This checkout includes a connected Chromium window, operated from the project root with python3 browser.py. Commands accept CSS selectors and browser key names.

    python3 browser.py open [width height]
    python3 browser.py view
    python3 browser.py inspect SELECTOR
    python3 browser.py click SELECTOR
    python3 browser.py fill SELECTOR TEXT
    python3 browser.py select SELECTOR LABEL
    python3 browser.py press KEY
    python3 browser.py screenshot FILE.png

Open also reloads the current files. View lists page text and controls. Inspect returns the selected element's bounds and current styling. The browser stays on this checkout and retains state between commands.
