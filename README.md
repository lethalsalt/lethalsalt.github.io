# LETHAL_SALT

Player site for **Lethal_Salt** — CS2, no jiggle tech.

This is the live project. Edits here are what we ship.

## Local preview

Open `index.html` or serve the folder:

```
http://127.0.0.1:8765/
```

## Production

Hosted on **GitHub Pages**. Same URL every time we push.

After GitHub login:

```powershell
gh repo create lethalsalt --public --source=. --remote=origin --push
gh api -X POST "repos/{user}/lethalsalt/pages" -f "source[branch]=main" -f "source[path]=/"
```

Live URL:

```
https://<github-username>.github.io/lethalsalt/
```

## Stack

Static HTML / CSS / JS. No build step. Put new art in `assets/` and link it from `index.html`.
