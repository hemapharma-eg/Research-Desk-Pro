# ReseolabX Comprehensive User Manual

## 🚀 Getting Started

Getting started with Research Desk Pro (ReseolabX) is designed to be completely frictionless. This platform centralizes your scientific workflows.

### 1. The Core Dashboard
When you launch the application, you land on the Dashboard. This acts as the mission control for your entire workspace.
- **Create New Project:** Click the primary "New Project" button in the upper right. Provide a definitive name. This creates an isolated SQLite environment explicitly for your project. All references, graphs, and documents belong securely to this project alone.
- **Project Switcher:** Click on the active project’s name in the top navigation bar to open the Workspace Switcher. Selecting another project swaps out your entire active environment instantly.

### 2. Navigation Overview
The application organizes tools via the left-hand column tabs (or horizontal nav items):
- **Dashboard:** Returns you home.
- **Reference Manager:** Organizes citations and imports bibliographies.
- **Document Editor:** The main word processor.
- **Graphing Studio:** Generates publication-ready figures.
- **Power Analysis:** Computes statistical sample sizes.
- **Systematic Review:** Tracks PRISMA flow diagrams.
- **Table Builder:** Constructs complex data matrices.
- **Integrity Checker:** Ensures compliance prior to submission.

## 📚 Reference Manager

The Reference Manager is your local citation database containing every source necessary for your active project.

### Adding References
There are three methods to ingest citations:
1. **DOI Fetch (Recommended):** Click **+ Add Reference**. Type or paste a valid DOI string (e.g., `10.1038/s41586-020-2649-2`). Press **Fetch metadata**. The system fetches the XML from CrossRef and populates all fields perfectly.
2. **Bulk File Import:** If you use Zotero or EndNote, export your library to `.ris` or `.bib` format. Simply **drag and drop** the exported file into the Reference Manager window. The system parses and ingests the whole library concurrently.
3. **Manual Entry:** Click **+ Add Reference** and fill out the fields manually. Make sure to specify the reference 'Type' correctly (Journal Article vs Book) so the formatting engine can parse it correctly later.

### Formats
ReseolabX supports nearly 10,000 distinct citation formats via robust CSL integration. You select the Active Style from the dropdown on the top toolbar inside the Reference manager. 

## 📝 Document Editor

The Document Editor is entirely synced with your references and figures.

### Text Actions & Shortcuts
- **Bold/Italic/Underline:** Highlight text and use standard `Ctrl+B`, `Ctrl+I`, `Ctrl+U` (or `Cmd` on Mac).
- **Inserting Citations:** Place your text cursor where needed. Press `Ctrl/Cmd + Shift + R` or click the **Reference (📚)** button on the top toolbar. A floating modal will appear. Search your library, select the required text, and inject it. The formatting and bibliography auto-updates.
- **Visuals Handling:**
  - **Graph Insertion:** Click **📈 Insert Figure**. A visual picker connects directly to your Graphing Studio. Select a saved chart, and it anchors precisely into the text flow.
  - **Image Cropping:** Select any image to trigger the floating context menu. Select the **Crop (✂️)** tool to bring inward the crop borders manually, just like Microsoft Word.

## 📊 Graphing Studio

A fully interactive statistical renderer that outputs strict high-DPI scientific diagrams.

### Constructing a Chart
1. **The Grid Space:** First navigate to the **Data Table** tab inside the studio. Pasting standard CSV values into the grid structures your raw inputs natively.
2. **Algorithmic Selection:** Jump to the **Graph Type** tab. Depending on your data, select: Bar, Scatter, Box, Violin, Before-After, Histogram, or Forest.
3. **Typology Options:** 
   - **Error Bars:** Switch between Standard Deviation (SD), Standard Error (SEM), and 95% CI bounds inside the sidebar options.
   - **Palettes:** Switch color spaces into scientific-grade colors natively.

### Export Settings
Navigate to the **Export Tab**. Select your required constraints (e.g., width in mm, exact 300 or 600 DPI output). Exported charts are always trimmed tight, discarding useless white space automatically.

## 🧩 Figure Assembler

Publishers require combined figures labeled properly (e.g. Figure 1A, 1B).
1. Open the Figure Assembler from inside the Graphing Studio modal.
2. Select an overall grid shape on the right (e.g., `2x2` matrix).
3. Click any empty grey box. A layout selection window appears. Pick the individual graphs to dock inside that box.
4. Export the resulting assembled combination as one single TIFF or PNG file. 

## ⚡ Power Analysis

Avoid critical research failures by calculating necessary sample participants accurately.
1. Select the required test type from the prominent dropdown module (e.g. **Independent t-test**, **ANOVA**, **Chi-square Test**).
2. Input the anticipated **Effect Size**. If unknown, utilize the guiding bounds representing commonly accepted thresholds for Small, Medium, or Large.
3. Define your strict limits: **Significance Level** (normally `0.05`) and **Power** (normally >`0.80`).
4. Hit **Calculate** to instantaneously establish your required raw N.

## 🔍 Systematic Review

Build meticulous PRISMA-compliant literature reviews.
- **Import Engine:** Bring in `.csv` or `.ris` files downloaded straight from Scopus, Ovid, or PubMed.
- **Deduplication:** The engine runs DOI overlap matching strictly to purge duplicate entries early.
- **Screening Tools:** Review abstracts directly inside the workspace utilizing strict Accept/Reject hotkeys for extremely rapid processing. 
- **PRISMA Tracking:** It natively draws a completely functional Flow Diagram tracking exact numerical flow throughout inclusion/exclusion processes automatically.

## 📋 Table Builder

Create heavily customized complex data matrices that port safely into Documents.
- **Building Setup:** Define clear arrays of columns via the top menu. Insert and remove lines smoothly.
- **Merging Dynamics:** Use the distinct Merge Horizontal functions to group categories structurally under meta-headers.
- **Typography Links:** Use the distinct superscript symbol toggles to attach footnotes seamlessly.
- **Syncing:** Tables generated here are fully invokable directly inside the main Document Editor.

## ✅ Integrity Checker

The gatekeeper ensuring you don't submit structurally flawed documentation.
- **Activation:** From the Dashboard or inside the top toolbar, initiate the sequence.
- **Checks Performed:** Look for citations completely absent in references, chronological layout malfunctions, missing mandatory IRB protocol disclosure statements, and non-aligned Figure referencing arrays.
- **Output Matrix:** All faults appear categorized by Severity. Informational problems provide advice, while Severe errors prevent logical rendering flows.

## 🛠️ Troubleshooting

If the application malfunctions, reference the immediate solutions below to restore operation swiftly.

### Missing Dependencies or Black Screen Errors
**Problem:** The window draws completely black or flashes without contents on launch.
- **Solution:** You may have a localized hardware acceleration failure or incomplete local database caching issue. Ensure your machine runs up-to-date graphics drivers. Alternatively, clear application caches located deep in your User system files (macOS: `~/Library/Application Support/ReseolabX`).

### SQLite Database Locks & Freezing
**Problem:** A "Database Locked" visual prompt blocks your tasks.
- **Solution:** Research Desk Pro writes continuously to SQLite to guarantee your data never abruptly disappears. If a large process (like a 1,000 reference `.ris` import) is processing, wait strictly for it to complete. Force quitting mid-ingestion may corrupt local states. Use the Backup command to preserve data safely if it hangs endlessly.

### MacOS Notarization Warning
**Problem:** Upon clicking the installed Application inside macOS, Gatekeeper reports "Apple could not verify the developer..." and prevents activation.
- **Solution:** This occurs if you installed an untrusted development copy. To bypass natively: Open 'System Settings', go to 'Privacy & Security', scroll downwards, and click **Allow Anyway** specifically under the ReseolabX alert item shown there. Proceed to open it normally. (Note: Only applies to builds without production certificates).

### Activation/Licensing Disconnects
**Problem:** "Network Error" when attempting to validate premium licenses.
- **Solution:** Check aggressive localized proxy restrictions or specialized Firewall bounds routing all your workstation outbound networks. ReseolabX must communicate briefly over standard SSL port 443 with `https://research-desk-pro.onrender.com` strictly during key registration. Offline usage operates unimpeded afterward.

## 🔄 Recent Changes

<!-- CHANGELOG_START -->
- 55b66f6: chore: sync state to mirror antigravity project
- cfcfddc: Meta-Analysis engine overhaul & Forest Plot publication-grade upgrade
- d5e6b1c: Fix license persistence, SR PDF rendering, and Send to Extractor workflow
- 4bc1faf: chore: upgrade gatekeeper installer license layout from plaintext to professionally styled RTF document
- 439c9ee: chore: untrack dist-electron build artifacts and ignore scratch folders to mirror antigravity cleanly
- 148f373: fix(systematic-review): migrate ephemeral localStorage saving engine to persistent SQLite metadata endpoint
- 35079b8: fix: rename license file to license_en.txt and merge legal agreements for macOS DMG EULA popup
- 4fceb64: feat: implement dynamic documentation-as-code generator for user manuals
- 3b258ea: fix: remove invalid license property from package.json since electron-builder auto-detects build/license.txt
- b9e8950: chore: add legal documentation and update installer configs for EULA acceptance
<!-- CHANGELOG_END -->
