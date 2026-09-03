# Setup Guide for GitHub Pages

## Prerequisites

1. A GitHub account
2. A repository created from this template or a new repository

## Deployment Steps

### 1. Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/spark-test.git

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Phantasy Star emulator"

# Push to main branch
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click on **Pages**
4. Under **Source**, select **main** branch
5. Click **Save**

### 3. Configure CNAME (Optional)

If you want to use a custom domain:
1. Create a file named `CNAME` in your repository root
2. Add your custom domain (e.g., `emu.example.com`)
3. Update your DNS settings

## How to Use

1. Navigate to `https://YOUR_USERNAME.github.io/spark-test/`
2. Click "Select ROM File" to choose a Sega Master System ROM
3. Press "Start Game" to begin playing
4. Your progress is automatically saved to local storage

## Supported ROM Formats

- Sega Master System: `.sms`, `.bin`
- Genesis/Mega Drive: `.gen`, `.iso`
- NES: `.nes`
- Game Boy Advance: `.gba`
- Super Famicom: `.sfc`, `.smc`

## Keyboard Controls

| Key | Action |
|---|---|
| Arrow Keys / WASD | Move |
| Space / Z | Button A |
| X | Button B |
| C | Button C |
| Enter | Start |
| Shift | Select |
| R | Reset |
| Ctrl+S | Save State |

## Troubleshooting

### Page not loading
- Make sure you've pushed to the `main` branch
- Check GitHub Pages settings in repository settings
- Wait a few minutes for the page to deploy

### ROM not loading
- Ensure the ROM file is in a supported format
- Some ROMs may require specific BIOS files
- Check browser console for error messages

### Audio not working
- Modern browsers require user interaction before audio
- Click "Start Game" after selecting a ROM to initialize audio

## Notes

- Phantasy Star is copyrighted software. This emulator is for educational purposes.
- Please support the game by purchasing it if you don't already own it.
- Save states are stored in your browser's local storage and will be lost if you clear your browser data.
