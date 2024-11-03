# three_vite
Basic THREE.js template using [Vite](https://vitejs.dev).

## Batteries included

Pre-configured to support :

- glTF file loading
- ammo.js wasm physics library
- VSCode launch scripts
- THREE.js type definitions : for IntelliSense in VS Code
- recommended VS Code extensions
- deployment

Have a look at vite.config.js and customize it to your needs (additional libraries, file formats etc.).

## Installation

Install [Node.js](https://nodejs.org)

- Clone or download repo
- run `npm install` : fetches and install all dependencies
- `npm run dev` : launches a server and opens your browser in `https://localhost:5173` by default
  - Edit your code : your changes are reflected instantly!
- `npm run build` : packages all code and resources into the `dist` folder, ready for deployment.

## Deploying the App with GitHub Pages

(original: https://github.com/meta-quest/webxr-first-steps?tab=readme-ov-file#build-and-deploy)

This repository includes a ready-to-use GitHub Actions workflow located at `.github/workflows/deploy.yml`, which automates both the build and deployment to GitHub Pages. Once enabled, every time you push changes to the `main` branch, a new build will automatically be deployed.

#### Steps to Enable GitHub Pages Deployment:

0. **IMPORTANT: Set the `base` variable** in `vite.config.js` (default name `/three_vite`) to the actual name of your repository. Your app will be deployed to https://juliellemeyniette.github.io/crazy_toubib
1. **Fork this repository** to your own GitHub account.
2. Navigate to your forked repository’s **Settings**.
3. Scroll down to the **Pages** section.
4. Under **Build and Deployment**, change the **Source** to **GitHub Actions**.

Once this is set, GitHub Actions will handle the build and deployment process automatically. Any time you push changes to the `main` branch, the app will be built and deployed to GitHub Pages without any additional manual steps.

You can monitor the status of the deployment job or manually re-run it via the **Actions** tab in your GitHub repository.


# Credits

- Test model (red cube) from https://github.com/cx20/gltf-test/tree/master/sampleModels/Box (CC BY License)

- Some very interesting features (such as github pages deployment) have been borrowed from https://github.com/meta-quest/webxr-first-steps (MIT License)

  - Make sure to check this excellent tutorial out!
  - See [Deployment Instructions](https://github.com/meta-quest/webxr-first-steps?tab=readme-ov-file#build-and-deploy)
