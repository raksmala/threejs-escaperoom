# 3D Door Scene

A ThreeJS-based 3D interactive door scene built with Vite.

## Features

- Interactive 3D door scene
- Camera controls with reset functionality
- Loading overlay
- Room text overlay

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Push your code to GitHub** - Make sure your repository is on GitHub
2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "GitHub Actions"
3. **Update the base path** (if needed):
   - Edit `vite.config.js`
   - Replace `'/door/'` with `'/{your-repo-name}/'` if your repository has a different name
4. **Push to main/master branch** - The GitHub Action will automatically build and deploy your site

### Manual Deployment

If you prefer to deploy manually:

1. Build the project: `npm run build`
2. The built files will be in the `dist/` directory
3. Upload the contents of `dist/` to your web server

## Technologies Used

- Three.js - 3D graphics library
- Vite - Build tool and development server
- JavaScript (ES6+)

## License

MIT
