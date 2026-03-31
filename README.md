# STA-Test-Website

Frontend project reorganized into a production-style structure for better team scaling, separation of concerns, and maintainability.

## Folder Structure

```text
STA-Test-Website/
	public/
		index.html                # Main landing/entry page
		pages/                    # Feature pages
			admin.html
			login.html
			register.html
			results.html
			student.html
			teacher.html
			test.html
	src/
		data/
			questions.js            # Static question bank
		js/
			core/
				app.js                # Shared app/domain logic
			pages/
				admin.js              # Admin page logic
				login.js              # Login page logic
				register.js           # Register page logic
	LICENSE
	README.md
```

## Why This Structure

- Keeps deployable pages in `public/`.
- Keeps business logic in `src/js/core/`.
- Keeps page-specific scripts in `src/js/pages/`.
- Keeps data isolated in `src/data/`.
- Makes ownership easier for larger teams (feature/page/domain split).

## Run Locally

Use any static server and open `public/index.html` as the entry point.

Example with VS Code Live Server:
- Right-click `public/index.html`
- Select **Open with Live Server**