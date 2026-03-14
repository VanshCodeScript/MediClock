# Getting Your 3D Model Working - Step-by-Step

## Complete Workflow (10 minutes)

This guide walks you through the entire process from downloading a model to seeing it in your app.

## 🎯 Goal

By the end, you'll have:
- ✅ A real 3D human model loaded in the visualization
- ✅ Colors that change based on health metrics
- ✅ Animations that respond to real-time data
- ✅ A toggle to switch between your model and the procedural fallback

## ⏱️ Time Estimates

| Step | Task | Time |
|------|------|------|
| 1 | Download model | 5 min |
| 2 | Place in project | 1 min |
| 3 | Start dev server | 1 min |
| 4 | View in browser | 1 min |
| 5 | Verify it works | 2 min |

**Total: 10 minutes** ⏰

---

## Step 1: Download a 3D Model (5 minutes)

### Option A: Quaternius (RECOMMENDED - Best Quality)

1. **Open browser:** https://quaternius.com
2. **Find models section** and look for "Humanoid" or "Human" models
3. **Click download** on the humanoid model
4. **Save** the file (likely already named `human.glb` or similar)
5. **File will be in:** `~/Downloads/`

✅ **File should be:** `human.glb` (around 500 KB)

---

### Option B: Sketchfab (Free but Need to Filter)

1. **Open browser:** https://sketchfab.com
2. **Search:** "low poly human"
3. **Click filter icon**
4. **Select:**
   - Downloadable: ✓
   - Format: glTF/GLB
5. **Sort by:** Downloads (get popular models)
6. **Click on a model** (e.g., "Low Poly Human by quaternius")
7. **Click "Download 3D model"**
8. **Choose format:** GLB
9. **Save** to downloads

✅ **What to expect:**
- File size: 1-3 MB
- Format: `.glb`
- Quality: Good to excellent

---

### Option C: PolyPizza (Simple & Fast)

1. **Open:** https://poly.pizza
2. **Search:** "human"
3. **Look for models** with low polygon count
4. **Click download**
5. **Choose:** glTF Binary (GLB)
6. **Save** to downloads

✅ **What to expect:**
- Very easy interface
- Quick to explore and download
- Good quality models

---

## ✅ Verify Download

**After downloading:**

```bash
# Open Terminal
# Check if file exists
ls -la ~/Downloads/ | grep -i human

# Or:
ls -la ~/Downloads/*.glb

# You should see something like:
# -rw-r--r--  human.glb  (size between 500KB - 5MB)
```

---

## Step 2: Place Model in Project (1 minute)

### Method 1: Using Terminal (Recommended)

```bash
# Open Terminal and run:
cp ~/Downloads/human.glb ~/Desktop/bytecamp/frontend/src/assets/models/

# Verify it worked:
ls -la ~/Desktop/bytecamp/frontend/src/assets/models/human.glb

# Should show: 
# -rw-r--r--  human.glb  (size)
```

### Method 2: Using Finder

1. **Open Finder**
2. **Navigate:** Downloads folder
3. **Find:** `human.glb` (or whatever you downloaded)
4. **Right-click:** Copy
5. **Navigate to:** `Desktop/bytecamp/frontend/src/assets/models/`
6. **Right-click:** Paste
7. **Done!**

---

## Step 3: Start Development Server (1 minute)

### Terminal Commands:

```bash
# Navigate to frontend directory
cd ~/Desktop/bytecamp/frontend

# Start the dev server
npx vite

# You should see:
# VITE v5.4.19 ready in XXX ms
# ➜ Local: http://localhost:5173/
```

### What comes next:

Leave the Terminal running. Your server is now live at `http://localhost:5173/`

---

## Step 4: View in Browser (1 minute)

### Open Health Visualization Page

1. **Open your browser** (Chrome, Firefox, Safari, Edge)
2. **Type URL:** `http://localhost:5173/health-visualization`
3. **Wait** for the page to load (should be instant)

### What you should see:

- A 3D visualization canvas taking up most of the screen
- Below it: 5 metric cards (Stress, Heart Rate, Blood Sugar, Sleep, Med. Risk)
- Two toggle buttons: **"3D Model (GLB)"** and **"Procedural Model"**
- Your GLB model should be displaying!

---

## Step 5: Verify It Works (2 minutes)

### Check 1: Model Appears

```
Expected: 3D human model in the canvas
If you see: Red box → Model failed to load
If you see: Geometric shapes → Fallback model (procedural)
If you see: Realistic model → SUCCESS! ✅
```

### Check 2: Open Browser Console

```bash
# Press F12 (or Cmd+Option+I on Mac)
# Go to "Console" tab
# You should see:

GLB Model Meshes Found: [
  "Head",
  "Chest", 
  "Abdomen",
  "LeftArm",
  "RightArm",
  "LeftLeg",
  "RightLeg"
]
```

✅ **If you see this, mesh names are detected!**

### Check 3: Toggle Button Works

```
1. Click "Procedural Model" button → Geometric shapes appear
2. Click "3D Model (GLB)" button → Your model reappears
3. Smooth switching works! ✅
```

### Check 4: Colors Update

```
Watch the metrics below change every ~2 seconds:
• Stress changes → Head color should change
• Heart Rate changes → Chest should pulse at that rate
• Blood Sugar changes → Abdomen color should change
• Model rotates continuously
All smooth and animated! ✅
```

### Check 5: No Console Errors

```
In F12 Console, look for:
- No red error messages
- No failed network requests
- Only green message: "GLB Model Meshes Found: ..."
Clean console! ✅
```

---

## 🎉 Success Indicators

You'll know it's working when:

- [ ] 3D human model appears (not geometric shapes or red box)
- [ ] Model is colorful (gradient of colors on body)
- [ ] Model rotates continuously
- [ ] Chest pulses regularly with changing heart rate
- [ ] Head color changes as stress updates
- [ ] Browser console shows: "GLB Model Meshes Found: [...]"
- [ ] Toggle buttons work (instantly switch models)
- [ ] No console errors (F12 → red messages)
- [ ] FPS is smooth (60 FPS, check DevTools)

---

## ⚠️ Troubleshooting

### Issue 1: Red Box Instead of Model

**What it means:** GLB failed to load

**Quick fixes:**

```bash
# 1. Verify file exists
ls -la ~/Desktop/bytecamp/frontend/src/assets/models/human.glb

# 2. Check file is named exactly: human.glb
# File size should be 500KB - 5MB

# 3. Reload browser: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)

# 4. Check console for errors: F12 → Console tab
# Look for 404 or "Failed to load"

# 5. Try downloading a different model from Quaternius
```

### Issue 2: Geometric Shapes (Procedural Model)

**What it means:** GLB didn't load, using fallback

**Why it happened:**
- File not in correct location
- File named differently than `human.glb`
- File is corrupted
- Browser can't access it

**How to fix:**
```bash
# 1. Rename your file to exactly: human.glb
mv ~/Desktop/bytecamp/frontend/src/assets/models/[your_name].glb \
   ~/Desktop/bytecamp/frontend/src/assets/models/human.glb

# 2. Or download a model we know works
# Visit: https://quaternius.com
# Download: Humanoid Basic
# Already named: human.glb

# 3. Reload browser
```

### Issue 3: Model Loads But Colors Wrong

**What it means:** Mesh names don't match pattern

**What to do:**

```javascript
// 1. Open F12 → Console
// Look for output like:
// GLB Model Meshes Found: ["body_001", "head_mesh", ...]

// 2. Note the actual mesh names

// 3. We'll help you update the mapping
// Add these names to src/utils/glbModelUtils.ts
```

### Issue 4: Model Too Slow / Low FPS

**What it means:** Model is too complex

**Quick fix:**
```bash
# 1. Download a simpler model
# Try: Quaternius (very optimized)

# 2. Or compress your model
# Visit: https://modelviewer.dev/editor
# Upload your GLB
# Click: Optimize
# Download

# 3. Verify file size < 2MB
```

### Issue 5: Can't Find model/assets Directory

```bash
# The directory should already exist!
# Verify:
ls -la ~/Desktop/bytecamp/frontend/src/assets/models/

# If it doesn't exist, create it:
mkdir -p ~/Desktop/bytecamp/frontend/src/assets/models

# Then copy your GLB there
```

---

## 🔍 Debugging Commands

If something doesn't work, try these in Terminal:

```bash
# Check if file exists
ls -la ~/Desktop/bytecamp/frontend/src/assets/models/human.glb

# Check file size
du -h ~/Desktop/bytecamp/frontend/src/assets/models/human.glb

# Check directory contents
ls -la ~/Desktop/bytecamp/frontend/src/assets/models/

# Start dev server with verbose output
cd ~/Desktop/bytecamp/frontend && npx vite --host

# Clear browser cache
# In Chrome: DevTools → ⋮ → More tools → Clear browsing data
# Or: Hard refresh = Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
```

---

## 💡 Tips for Best Results

### Model Selection Tips

✅ **Best:** Quaternius models
- Optimized for WebGL
- ~500 KB file size
- Clean mesh names
- Perfect polygon count

✅ **Good:** Sketchfab free models
- Filter by "Download" and "GLB"
- Sort by popular first
- Usually 1-3 MB
- Variable quality

❌ **Avoid:** Very complex models
- File size >5 MB
- >100K polygons
- Many textures
- Multiple animations (we won't use them)

### For Best Performance

1. **File size:** 500 KB - 2 MB (ideal)
2. **Polygons:** under 20,000 triangles
3. **Meshes:** 5-10 separate parts
4. **Textures:** Optional (we use colors, not textures)

### Pro Tip: Test Multiple Models

```bash
# Download a few models and test
# Find the one that looks best

# Rename and save different versions:
# human_quaternius.glb
# human_sketchfab.glb

# Then test each by updating path in code:
# glbModelPath="/src/assets/models/human_quaternius.glb"
```

---

## ✅ Final Checklist

Before calling it done, verify:

- [ ] File `human.glb` exists in `src/assets/models/`
- [ ] File size is reasonable (500 KB - 5 MB)
- [ ] Dev server is running (`http://localhost:5173`)
- [ ] Page loads health visualization
- [ ] 3D model appears (not geometric or red box)
- [ ] Mesh names logged to console (F12)
- [ ] No console errors
- [ ] Toggle button works
- [ ] Colors update with metrics every 2 seconds
- [ ] Chest pulses with heart rate
- [ ] FPS is smooth (60 FPS)

---

## 🎓 What You Learned

You now have:

1. ✅ **Downloaded** a real 3D model from a free source
2. ✅ **Integrated** it into your React app
3. ✅ **Automatically** mapped health metrics to body parts
4. ✅ **Verified** colors and animations work
5. ✅ **Debugged** by checking the console and file system

---

## 🚀 Next Level (Optional)

### Want to customize the model mapping?

See: `GLB_INTEGRATION_SUMMARY.md` → "Custom Mesh Mapping"

### Want to optimize the model?

See: `GLB_MODEL_DOWNLOAD_GUIDE.md` → "Optimize Your Model"

### Want to connect real health data?

See: `DATA_INTEGRATION_GUIDE.md` → "Integration Options"

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| **Download** | Visit https://quaternius.com |
| **Copy** | `cp ~/Downloads/human.glb ~/Desktop/bytecamp/frontend/src/assets/models/` |
| **Verify** | `ls -la ~/Desktop/bytecamp/frontend/src/assets/models/human.glb` |
| **Start Dev** | `cd ~/Desktop/bytecamp/frontend && npx vite` |
| **View** | Open http://localhost:5173/health-visualization |
| **Debug** | Press F12, go to Console tab |

---

## 🎬 Video Walkthrough (Text Version)

```
1. Download from Quaternius.com
   → Click Humanoid Model
   → Click Download
   → Save to Downloads

2. Copy to project
   → Terminal: cp ~/Downloads/human.glb ~/Desktop/bytecamp/frontend/src/assets/models/

3. Start dev server
   → Terminal: cd ~/Desktop/bytecamp/frontend && npx vite

4. Open in browser
   → http://localhost:5173/health-visualization

5. Click "3D Model (GLB)" button
   → Your model appears!

6. Watch metrics
   → Colors change in real-time
   → Head changes with stress
   → Chest pulses with heart
   → Animations smooth and beautiful

7. Check console (F12)
   → Mesh names confirmed
   → No errors
   → Everything working!
```

---

**You're ready! Follow the steps above and you'll have a stunning 3D medical avatar in about 10 minutes. 🎉**

---

## 📚 Full Documentation

For more details, see:
- `GLB_QUICK_START.md` - Quick reference
- `GLB_MODEL_DOWNLOAD_GUIDE.md` - Detailed guide (50+ pages)
- `GLB_INTEGRATION_SUMMARY.md` - Tech deep-dive

**Questions?** Check the Troubleshooting section above! ☝️
