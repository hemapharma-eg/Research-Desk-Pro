// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Update docs/USER_MANUAL.md and run build shell scripts instead.

export interface HelpSection {
  id: string;
  icon: string;
  title: string;
  content: string;
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    "id": "getting-started",
    "icon": "🚀",
    "title": "Getting Started",
    "content": "<h2>Getting Started</h2>\n\nGetting started with Research Desk Pro (ReseolabX) is designed to be completely frictionless. This platform centralizes your scientific workflows.<br/><br/><h3>1. The Core Dashboard</h3>\nWhen you launch the application, you land on the Dashboard. This acts as the mission control for your entire workspace.\n<ul class=\"help-list\"><li><strong>Create New Project:</strong> Click the primary \"New Project\" button in the upper right. Provide a definitive name. This creates an isolated SQLite environment explicitly for your project. All references, graphs, and documents belong securely to this project alone.</li>\n<li><strong>Project Switcher:</strong> Click on the active project’s name in the top navigation bar to open the Workspace Switcher. Selecting another project swaps out your entire active environment instantly.</li>\n</ul><br/><br/><h3>2. Navigation Overview</h3>\nThe application organizes tools via the left-hand column tabs (or horizontal nav items):\n<ul class=\"help-list\"><li><strong>Dashboard:</strong> Returns you home.</li>\n<li><strong>Reference Manager:</strong> Organizes citations and imports bibliographies.</li>\n<li><strong>Document Editor:</strong> The main word processor.</li>\n<li><strong>Graphing Studio:</strong> Generates publication-ready figures.</li>\n<li><strong>Power Analysis:</strong> Computes statistical sample sizes.</li>\n<li><strong>Systematic Review:</strong> Tracks PRISMA flow diagrams.</li>\n<li><strong>Table Builder:</strong> Constructs complex data matrices.</li>\n<li><strong>Integrity Checker:</strong> Ensures compliance prior to submission.</li>\n</ul>\n"
  },
  {
    "id": "reference-manager",
    "icon": "📚",
    "title": "Reference Manager",
    "content": "<h2>Reference Manager</h2>\n\nThe Reference Manager is your local citation database containing every source necessary for your active project.<br/><br/><h3>Adding References</h3>\nThere are three methods to ingest citations:\n<li><strong>DOI Fetch (Recommended):</strong> Click <strong>+ Add Reference</strong>. Type or paste a valid DOI string (e.g., <code>10.1038/s41586-020-2649-2</code>). Press <strong>Fetch metadata</strong>. The system fetches the XML from CrossRef and populates all fields perfectly.</li>\n<li><strong>Bulk File Import:</strong> If you use Zotero or EndNote, export your library to <code>.ris</code> or <code>.bib</code> format. Simply <strong>drag and drop</strong> the exported file into the Reference Manager window. The system parses and ingests the whole library concurrently.</li>\n<li><strong>Manual Entry:</strong> Click <strong>+ Add Reference</strong> and fill out the fields manually. Make sure to specify the reference 'Type' correctly (Journal Article vs Book) so the formatting engine can parse it correctly later.</li><br/><br/><h3>Formats</h3>\nReseolabX supports nearly 10,000 distinct citation formats via robust CSL integration. You select the Active Style from the dropdown on the top toolbar inside the Reference manager. \n"
  },
  {
    "id": "document-editor",
    "icon": "📝",
    "title": "Document Editor",
    "content": "<h2>Document Editor</h2>\n\nThe Document Editor is entirely synced with your references and figures.<br/><br/><h3>Text Actions & Shortcuts</h3>\n<ul class=\"help-list\"><li><strong>Bold/Italic/Underline:</strong> Highlight text and use standard <code>Ctrl+B</code>, <code>Ctrl+I</code>, <code>Ctrl+U</code> (or <code>Cmd</code> on Mac).</li>\n<li><strong>Inserting Citations:</strong> Place your text cursor where needed. Press <code>Ctrl/Cmd + Shift + R</code> or click the <strong>Reference (📚)</strong> button on the top toolbar. A floating modal will appear. Search your library, select the required text, and inject it. The formatting and bibliography auto-updates.</li>\n<li><strong>Visuals Handling:</strong></li>\n</ul>\n  - <strong>Graph Insertion:</strong> Click <strong>📈 Insert Figure</strong>. A visual picker connects directly to your Graphing Studio. Select a saved chart, and it anchors precisely into the text flow.\n  - <strong>Image Cropping:</strong> Select any image to trigger the floating context menu. Select the <strong>Crop (✂️)</strong> tool to bring inward the crop borders manually, just like Microsoft Word.\n"
  },
  {
    "id": "graphing-studio",
    "icon": "📊",
    "title": "Graphing Studio",
    "content": "<h2>Graphing Studio</h2>\n\nA fully interactive statistical renderer that outputs strict high-DPI scientific diagrams.<br/><br/><h3>Constructing a Chart</h3>\n<li><strong>The Grid Space:</strong> First navigate to the <strong>Data Table</strong> tab inside the studio. Pasting standard CSV values into the grid structures your raw inputs natively.</li>\n<li><strong>Algorithmic Selection:</strong> Jump to the <strong>Graph Type</strong> tab. Depending on your data, select: Bar, Scatter, Box, Violin, Before-After, Histogram, or Forest.</li>\n<li><strong>Typology Options:</strong> </li>\n   - <strong>Error Bars:</strong> Switch between Standard Deviation (SD), Standard Error (SEM), and 95% CI bounds inside the sidebar options.\n   - <strong>Palettes:</strong> Switch color spaces into scientific-grade colors natively.<br/><br/><h3>Export Settings</h3>\nNavigate to the <strong>Export Tab</strong>. Select your required constraints (e.g., width in mm, exact 300 or 600 DPI output). Exported charts are always trimmed tight, discarding useless white space automatically.\n"
  },
  {
    "id": "figure-assembler",
    "icon": "🧩",
    "title": "Figure Assembler",
    "content": "<h2>Figure Assembler</h2>\n\nPublishers require combined figures labeled properly (e.g. Figure 1A, 1B).\n<li>Open the Figure Assembler from inside the Graphing Studio modal.</li>\n<li>Select an overall grid shape on the right (e.g., <code>2x2</code> matrix).</li>\n<li>Click any empty grey box. A layout selection window appears. Pick the individual graphs to dock inside that box.</li>\n<li>Export the resulting assembled combination as one single TIFF or PNG file. </li>\n"
  },
  {
    "id": "power-analysis",
    "icon": "⚡",
    "title": "Power Analysis",
    "content": "<h2>Power Analysis</h2>\n\nAvoid critical research failures by calculating necessary sample participants accurately.\n<li>Select the required test type from the prominent dropdown module (e.g. <strong>Independent t-test</strong>, <strong>ANOVA</strong>, <strong>Chi-square Test</strong>).</li>\n<li>Input the anticipated <strong>Effect Size</strong>. If unknown, utilize the guiding bounds representing commonly accepted thresholds for Small, Medium, or Large.</li>\n<li>Define your strict limits: <strong>Significance Level</strong> (normally <code>0.05</code>) and <strong>Power</strong> (normally ><code>0.80</code>).</li>\n<li>Hit <strong>Calculate</strong> to instantaneously establish your required raw N.</li>\n"
  },
  {
    "id": "systematic-review",
    "icon": "🔍",
    "title": "Systematic Review",
    "content": "<h2>Systematic Review</h2>\n\nBuild meticulous PRISMA-compliant literature reviews.\n<ul class=\"help-list\"><li><strong>Import Engine:</strong> Bring in <code>.csv</code> or <code>.ris</code> files downloaded straight from Scopus, Ovid, or PubMed.</li>\n<li><strong>Deduplication:</strong> The engine runs DOI overlap matching strictly to purge duplicate entries early.</li>\n<li><strong>Screening Tools:</strong> Review abstracts directly inside the workspace utilizing strict Accept/Reject hotkeys for extremely rapid processing. </li>\n<li><strong>PRISMA Tracking:</strong> It natively draws a completely functional Flow Diagram tracking exact numerical flow throughout inclusion/exclusion processes automatically.</li>\n</ul>\n"
  },
  {
    "id": "table-builder",
    "icon": "📋",
    "title": "Table Builder",
    "content": "<h2>Table Builder</h2>\n\nCreate heavily customized complex data matrices that port safely into Documents.\n<ul class=\"help-list\"><li><strong>Building Setup:</strong> Define clear arrays of columns via the top menu. Insert and remove lines smoothly.</li>\n<li><strong>Merging Dynamics:</strong> Use the distinct Merge Horizontal functions to group categories structurally under meta-headers.</li>\n<li><strong>Typography Links:</strong> Use the distinct superscript symbol toggles to attach footnotes seamlessly.</li>\n<li><strong>Syncing:</strong> Tables generated here are fully invokable directly inside the main Document Editor.</li>\n</ul>\n"
  },
  {
    "id": "integrity-checker",
    "icon": "✅",
    "title": "Integrity Checker",
    "content": "<h2>Integrity Checker</h2>\n\nThe gatekeeper ensuring you don't submit structurally flawed documentation.\n<ul class=\"help-list\"><li><strong>Activation:</strong> From the Dashboard or inside the top toolbar, initiate the sequence.</li>\n<li><strong>Checks Performed:</strong> Look for citations completely absent in references, chronological layout malfunctions, missing mandatory IRB protocol disclosure statements, and non-aligned Figure referencing arrays.</li>\n<li><strong>Output Matrix:</strong> All faults appear categorized by Severity. Informational problems provide advice, while Severe errors prevent logical rendering flows.</li>\n</ul>\n"
  },
  {
    "id": "-troubleshooting",
    "icon": "🛠",
    "title": "️ Troubleshooting",
    "content": "<h2>️ Troubleshooting</h2>\n\nIf the application malfunctions, reference the immediate solutions below to restore operation swiftly.<br/><br/><h3>Missing Dependencies or Black Screen Errors</h3>\n<strong>Problem:</strong> The window draws completely black or flashes without contents on launch.\n<ul class=\"help-list\"><li><strong>Solution:</strong> You may have a localized hardware acceleration failure or incomplete local database caching issue. Ensure your machine runs up-to-date graphics drivers. Alternatively, clear application caches located deep in your User system files (macOS: <code>~/Library/Application Support/ReseolabX</code>).</li>\n</ul><br/><br/><h3>SQLite Database Locks & Freezing</h3>\n<strong>Problem:</strong> A \"Database Locked\" visual prompt blocks your tasks.\n<ul class=\"help-list\"><li><strong>Solution:</strong> Research Desk Pro writes continuously to SQLite to guarantee your data never abruptly disappears. If a large process (like a 1,000 reference <code>.ris</code> import) is processing, wait strictly for it to complete. Force quitting mid-ingestion may corrupt local states. Use the Backup command to preserve data safely if it hangs endlessly.</li>\n</ul><br/><br/><h3>MacOS Notarization Warning</h3>\n<strong>Problem:</strong> Upon clicking the installed Application inside macOS, Gatekeeper reports \"Apple could not verify the developer...\" and prevents activation.\n<ul class=\"help-list\"><li><strong>Solution:</strong> This occurs if you installed an untrusted development copy. To bypass natively: Open 'System Settings', go to 'Privacy & Security', scroll downwards, and click <strong>Allow Anyway</strong> specifically under the ReseolabX alert item shown there. Proceed to open it normally. (Note: Only applies to builds without production certificates).</li>\n</ul><br/><br/><h3>Activation/Licensing Disconnects</h3>\n<strong>Problem:</strong> \"Network Error\" when attempting to validate premium licenses.\n<ul class=\"help-list\"><li><strong>Solution:</strong> Check aggressive localized proxy restrictions or specialized Firewall bounds routing all your workstation outbound networks. ReseolabX must communicate briefly over standard SSL port 443 with <code>https://research-desk-pro.onrender.com</code> strictly during key registration. Offline usage operates unimpeded afterward.</li>\n</ul>\n"
  },
  {
    "id": "recent-changes",
    "icon": "🔄",
    "title": "Recent Changes",
    "content": "<h2>Recent Changes</h2>\n\n<!-- CHANGELOG_START -->\n<ul class=\"help-list\"><li>d5e6b1c: Fix license persistence, SR PDF rendering, and Send to Extractor workflow</li>\n<li>4bc1faf: chore: upgrade gatekeeper installer license layout from plaintext to professionally styled RTF document</li>\n<li>439c9ee: chore: untrack dist-electron build artifacts and ignore scratch folders to mirror antigravity cleanly</li>\n<li>148f373: fix(systematic-review): migrate ephemeral localStorage saving engine to persistent SQLite metadata endpoint</li>\n<li>35079b8: fix: rename license file to license_en.txt and merge legal agreements for macOS DMG EULA popup</li>\n<li>4fceb64: feat: implement dynamic documentation-as-code generator for user manuals</li>\n<li>3b258ea: fix: remove invalid license property from package.json since electron-builder auto-detects build/license.txt</li>\n<li>b9e8950: chore: add legal documentation and update installer configs for EULA acceptance</li>\n<li>a23eee1: fix(document-editor): dynamic citation sequence numbering</li>\n<li>c22f435: Fix graph assembler preview placeholder issue</li>\n</ul>\n<!-- CHANGELOG_END -->\n"
  }
];
