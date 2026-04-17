import { useState, useMemo } from 'react';
import { useLicense } from '../modules/licensing/LicenseContext';
import './HelpGuide.css';

interface HelpSection {
  id: string;
  icon: string;
  title: string;
  content: string;
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    content: `
<h2>Getting Started with Research Desk Pro</h2>
<p>Welcome to Research Desk Pro, the comprehensive scientific research workstation designed for researchers, academics, and scientists. This platform brings together all the vital tools you need — from reference management to sophisticated statistical visualizations.</p>

<h3>1. Project Management</h3>
<h4>Creating a New Project</h4>
<ol>
  <li>Navigate to the <strong>Dashboard</strong> from the core menu.</li>
  <li>Click the clear <strong>"New Project"</strong> button in the top right corner.</li>
  <li>Enter a definitive project name and an optional descriptive summary text.</li>
  <li>Click <strong>Create</strong>. A structured, isolated workspace is now instantly initialized.</li>
</ol>
<h4>Switching Between Projects</h4>
<p>Each project acts as an isolated sandbox. Your citations, databases, documents, and figures belong exclusively to the active project.</p>
<ul>
  <li>Click the current project name in the top navigation bar to open the <strong>Workspace Switcher</strong>.</li>
  <li>Select any previous project to instantly swap contexts.</li>
</ul>

<h3>2. Module Navigation</h3>
<p>The left-hand sidebar is your primary map for switching between major capabilities:</p>
<ul>
  <li><strong>References:</strong> Build and sync your citation library.</li>
  <li><strong>Document Editor:</strong> Draft and format your manuscript with live references and dynamic components.</li>
  <li><strong>Graphing Studio:</strong> Analyze datasets and render stunning, high-DPI scientific charts.</li>
  <li><strong>Power Analysis:</strong> Calculate required sample sizes for specific statistical distributions.</li>
  <li><strong>Systematic Review:</strong> Conduct meticulous PRISMA-compliant literature reviews.</li>
  <li><strong>Tables:</strong> Construct detailed publication-ready tables with built-in styling variables.</li>
  <li><strong>Integrity Checker:</strong> Scan your final document for ethical compliance and formatting mistakes.</li>
</ul>

<div class="help-tip">
  💡 <strong>Pro Tip:</strong> Keyboard enthusiasts can press <kbd>Ctrl/Cmd</kbd> + <kbd>/</kbd> at any point globally to summon this Help Guide instantly, pausing their current task safely.
</div>
    `
  },
  {
    id: 'references',
    icon: '📚',
    title: 'Reference Manager',
    content: `
<h2>Reference Manager</h2>
<p>The Reference Manager is a robust library system supporting thousands of formatting styles and numerous bulk-import workflows.</p>

<h3>1. Importing References</h3>
<h4>Method A: Digital Object Identifier (DOI) Lookup</h4>
<ol>
  <li>Click the <strong>+ Add Reference</strong> button.</li>
  <li>Select the <strong>DOI Fetch</strong> tab.</li>
  <li>Paste the DOI block (e.g., <code>10.1038/s41586-020-2649-2</code>).</li>
  <li>Click <strong>Fetch metadata</strong>. The system will auto-populate the authors, title, journal, and year.</li>
</ol>

<h4>Method B: Bulk File Import</h4>
<p>Migrating from EndNote, Zotero, or Mendeley? Easily bring your library with you.</p>
<ul>
  <li>Export your library from your old software as an <strong>.ris</strong> or <strong>.bib</strong> file.</li>
  <li>Drag and drop the file directly into the Reference Manager's central view.</li>
  <li>All metadata tags will be parsed simultaneously and appended to your active project.</li>
</ul>

<h4>Method C: Manual Entry</h4>
<ol>
  <li>Click the <strong>+ Add Reference</strong> button and choose <strong>Manual</strong>.</li>
  <li>Select the entry type (e.g., Journal Article, Book, Web Page).</li>
  <li>Fill in the specific bibliographical metadata fields presented to you.</li>
</ol>

<h3>2. Formatting Styles</h3>
<h4>Selecting Global Styles</h4>
<ul>
  <li>Navigate to the top formatting bar within the Reference Manager.</li>
  <li>Select from over 7,000 embedded CSL formats, including heavyweights like <strong>APA 7th</strong>, <strong>Vancouver/NLM</strong>, <strong>Harvard</strong>, and specifically tailored journal variants like <strong>Nature</strong> and <strong>Science</strong>.</li>
</ul>

<h3>3. Inserting Citations in the Document</h3>
<h4>The Citation Interface</h4>
<ol>
  <li>Inside the Document Editor, place your cursor where you need the citation.</li>
  <li>Click 📚 <strong>Reference</strong> in the toolbar (or press <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>).</li>
  <li>A floating index window will appear.</li>
  <li>Use the search bar, tick the checkboxes of the sources you wish to cite contemporaneously, and click <strong>Insert</strong>.</li>
  <li>The active styling format will be applied live. Modify the style later, and all tags will cleanly update automatically.</li>
</ol>
    `
  },
  {
    id: 'document-editor',
    icon: '📝',
    title: 'Document Editor',
    content: `
<h2>Document Editor</h2>
<p>The Document workspace acts as an incredibly potent scientific word processor, deeply linking dynamic external objects to standard structural writing paradigms.</p>

<h3>1. Zoom and View Features</h3>
<h4>Adjusting the Canvas</h4>
<p>Customize your zoom magnification for easier reading or full-page layout observation.</p>
<ul>
  <li>Locate the <strong>Zoom Toolbar</strong> in the extreme bottom right of the editing window.</li>
  <li>Use the <strong>➕ (Plus)</strong> and <strong>➖ (Minus)</strong> controls to increment scale up to 200% or down to 50%.</li>
</ul>

<h3>2. Handling Images and Media</h3>
<h4>Import and Resizing</h4>
<ol>
  <li>Click the <strong>🖼️ Image</strong> button in the tertiary toolbar row to spawn a file-picker, or simply drag-and-drop a file snippet dynamically into the canvas.</li>
  <li>Once inserted, tapping the image uncovers <strong>8 distinct resize endpoints</strong>.</li>
  <li>Drag corners to constrain proportions or sides to arbitrarily stretch properties.</li>
</ol>

<h4>Executing Microsoft Word-style Crops</h4>
<ol>
  <li>Select an image, yielding a floating context menu featuring the <strong>✂️ Crop</strong> function.</li>
  <li>Engaging the Crop reveals aggressive black boundary controllers around the image box.</li>
  <li>Drag these controllers inward. The image layers beneath will dim identically to how Microsoft Word behaves, visually highlighting only what will remain.</li>
  <li>Press the solid black <strong>✓ Apply</strong> button to destructively commit the crop matrix.</li>
</ol>

<h3>3. Graphing Studio Integrations</h3>
<h4>Dropping in Dataviz Panels</h4>
<ol>
  <li>To skip manual exports, click <strong>📈 Insert Figure</strong>.</li>
  <li>A visual preview picker will engage, reading globally built charts from the active project.</li>
  <li>Select your chart. It anchors natively, maintaining high-DPI scaling limits internally.</li>
</ol>

<h3>4. Linked Module Tables</h3>
<h4>Constructing and Modifying Flow</h4>
<ul>
  <li>Use the <strong>Table Builder</strong> sidebar panel to inject tables you physically modeled previously.</li>
  <li>Selecting an inserted table spawns a <strong>Floating Formatter Overlay</strong> near the table roof.</li>
  <li>Change font families, point scales, and visibility features via that widget overlay, ensuring no static layout breaking occurs.</li>
</ul>
    `
  },
  {
    id: 'graphing-studio',
    icon: '📊',
    title: 'Graphing Studio',
    content: `
<h2>Graphing Studio</h2>
<p>An elite, statistically-integrated rendering suite for publication-quality scientific visualization.</p>

<h3>1. Initializing and Utilizing Data</h3>
<h4>The Spreadsheet Canvas</h4>
<ol>
  <li>Click the <strong>Data Tab</strong>.</li>
  <li>Paste CSV frames directly into the tabular cells, or meticulously type single entries.</li>
  <li>Ensure that column headers precisely reflect variable properties, as these will directly dictate legend keys and axis terminology.</li>
</ol>

<h4>The Analyze Engine</h4>
<ul>
  <li>Before charting, leap to the <strong>Analyze Tab</strong>.</li>
  <li>Trigger algorithmic scripts to perform automatic t-tests, standard ANOVAs, or broad Chi-squares strictly depending on matrix structures.</li>
</ul>

<h3>2. Generating Visual Plots</h3>
<h4>Selecting the Typology</h4>
<p>Jump to the <strong>Graph Tab</strong>. Click through the chart class structure to generate your visual framework instantly:</p>
<ul>
  <li><strong>Basic Matrices:</strong> Bar Chart, Stacked Bar (or 100%), Line, Scatter.</li>
  <li><strong>Distribution Vectors:</strong> Box Plot, Violin (excellent for heavy variance representation), Histogram, Strip.</li>
  <li><strong>Paired Connectors:</strong> Before–After linking slopes.</li>
  <li><strong>Combined Topologies:</strong> Visual overlays (e.g., Box plot shaded under raw jittered points).</li>
  <li><strong>Meta Forms:</strong> Complex Forest plots requiring stringent error structures.</li>
</ul>

<h3>3. Styling, Orientation, and Typography</h3>
<h4>Core Properties</h4>
<ul>
  <li>Adjust dimensions natively utilizing the <strong>Orientation System</strong>: select <strong>▬ Landscape</strong> (optimal for wide spreads, defaults roughly to 820px) or <strong>▮ Portrait</strong> (optimal for columns, defaults strictly to 520px).</li>
  <li>Dial exactly which Error Bars display: Standard Deviation (SD), Standard Error (SEM), or full 95% Confidence Intervals (CI).</li>
  <li>Change universal internal palettes utilizing the five heavily researched scientific color scales.</li>
</ul>

<h3>4. Rendering and Outward Export</h3>
<h4>Pixel-Perfect Cropping and Export Functions</h4>
<ol>
  <li>Navigate completely to the <strong>Export Tab</strong>.</li>
  <li>Define final required journal parameterizations (e.g., 300 DPI limit, specified millimeter constraint width).</li>
  <li>Click the dedicated <strong>PNG</strong> or <strong>TIFF</strong> generators. Note: White spatial buffers spanning empty canvas borders will automatically auto-trim via internal boundary extraction processing.</li>
</ol>
    `
  },
  {
    id: 'figure-assembler',
    icon: '🧩',
    title: 'Figure Assembler',
    content: `
<h2>Figure Assembler</h2>
<p>Publications rarely accept loose fragments; they require complex integrated groupings labeled explicitly (e.g., 1A, 1B). The Figure Assembler combines decoupled graphical panels precisely for this function.</p>

<h3>1. Finding the Assembler Area</h3>
<ul>
  <li>Reach the Assembler freely via the global <strong>Graphing Studio Dashboard</strong>. Click the distinct <strong>🧩 Figure Assembler</strong> option.</li>
</ul>

<h3>2. Framework Grids</h3>
<h4>Layout Structuring</h4>
<ol>
  <li>Pick a fixed layout grid on the right sidebar.</li>
  <li>Choose between simple linear arrays (<strong>1×2</strong>, <strong>2×1</strong>, or <strong>1×3</strong>) or block composite matrices (<strong>2×2</strong> grid structuring).</li>
  <li>Toggle the orientation of the total outer background canvas between landscape and portrait.</li>
</ol>

<h3>3. Visual Population Tools</h3>
<h4>The Thumbnailed Figure Picker Modal</h4>
<ol>
  <li>You will notice dark blank empty slots named A, B, C...</li>
  <li>Click directly into an empty grey container pane.</li>
  <li>A centralized <strong>Visual Graph Modal Window</strong> will descend onto the screen, showing vivid graphical thumbnails corresponding perfectly to previously saved and indexed figures in your repository.</li>
  <li>Click exactly the thumbnail required. It mounts immediately inside the layout structure.</li>
  <li>Decide whether you want standard sequential ABC tracking labels visible or hidden via the toggle options.</li>
</ol>

<h3>4. Composite Storage</h3>
<ul>
  <li>Use the integrated export engine to extract the full framework externally. Identical capabilities (DPI constraint typing, transparent spatial trimming) port automatically over to unified assembler components.</li>
</ul>
    `
  },
  {
    id: 'power-analysis',
    icon: '⚡',
    title: 'Power Analysis',
    content: `
<h2>Power Analysis Workspace</h2>
<p>Prevent severe research miscalculations by definitively calculating precisely required sample ceilings.</p>

<h3>1. Identifying Primary Tests</h3>
<ul>
  <li>Are you measuring linear distances? Select <strong>Independent t-tests</strong> or <strong>Paired tests</strong> via the dropdown menu algorithm.</li>
  <li>Working significantly across broad categoricals? Target the <strong>Chi-square Test</strong> or standard <strong>ANOVA</strong>.</li>
  <li>Targeting vector alignments? Initiate <strong>Correlation Analysis</strong> systems.</li>
</ul>

<h3>2. Executing Core Calculation</h3>
<h4>Step-by-Step Procedure</h4>
<ol>
  <li>Once the statistical mechanism is defined, insert the predicted <strong>Effect Size</strong>. (An integrated sliding scale will broadly guide "Small", "Medium", and "Large" generic benchmarks for reference purposes).</li>
  <li>Dial in your alpha baseline (<strong>Significance Level</strong>). The standard rule limits firmly to 0.05.</li>
  <li>Establish absolute required certainty bounds (<strong>Desired Power</strong>). Strong clinical research often mandates strict minimums near 0.80 or 0.90 parameters.</li>
  <li>Strike the <strong>Calculate</strong> mechanism to receive an instantaneous breakdown of required minimum populations.</li>
</ol>
    `
  },
  {
    id: 'systematic-review',
    icon: '🔍',
    title: 'Systematic Review',
    content: `
<h2>Systematic Review Engine</h2>
<p>An enterprise-grade protocol tracking machine that forcefully organizes enormous PRISMA-based literature cascades securely and effectively.</p>

<h3>1. Initial Protocol Definition</h3>
<ol>
  <li>Clearly outline and type extensive inclusion restrictions and firm exclusion parameters.</li>
  <li>Record all fundamental database queries internally so validation tracks perfectly.</li>
</ol>

<h3>2. Managing Massive Searches</h3>
<h4>Import Configurations</h4>
<ul>
  <li>The engine accepts universal standard file formats (<strong>.RIS</strong> or heavy <strong>.CSV</strong>) retrieved straight from massive indexes like PubMed or Scopus.</li>
  <li>Immediately, standard algorithms parse DOI overlap fragments to purge absolute duplicate entities.</li>
</ul>

<h3>3. Active Assessment Stages</h3>
<h4>Screening and Flow</h4>
<ul>
  <li><strong>Screening Phase:</strong> Read abstracts isolated clearly on-screen. Swiftly utilize the accept/reject toggle switches.</li>
  <li><strong>Full-Text Action:</strong> Pass successful screening entries perfectly towards strict full-body reads.</li>
  <li><strong>Data Distillation:</strong> Structure rigorous categorical extraction frames.</li>
  <li><strong>Automated Synthesis Execution:</strong> The final stage builds the universal, legally-required PRISMA flow pipeline diagram directly mapped via graphical generation algorithms tracking precise exclusion counts.</li>
</ul>
    `
  },
  {
    id: 'tables',
    icon: '📋',
    title: 'Table Builder Tool',
    content: `
<h2>Table Builder Tool</h2>
<p>Do not fight messy formatting alignments in pure word processors. Use the dedicated robust matrix processor to format structured scientific tables natively.</p>

<h3>1. Core Architectural Layout</h3>
<ol>
  <li>Generate arbitrary numbers of columns. Seamlessly insert, detach, dynamically sort, and manually scale bounding constraints.</li>
  <li>Fuse related cells by utilizing precise horizontal merging functions specifically tailored for hierarchical column nesting capabilities.</li>
  <li>Force distinct alignment mapping profiles (left, center, strict decimal justification formatting) per cell basis easily.</li>
</ol>

<h3>2. Text Operations</h3>
<h4>Titles and Contexts</h4>
<ul>
  <li>Add structured headers, tracking incremental sequences specifically via table numbering syntax.</li>
  <li>Utilize intricate symbolic footprint footnote mapping (e.g., *, †, ‡) that embeds safely directly into cells and anchors corresponding definitions safely to the absolute visual bottom framework.</li>
</ul>

<h3>3. System Export Architecture</h3>
<ul>
  <li>Any table perfectly engineered here seamlessly operates within the Document Editor scope utilizing distinct, non-destructive embedding techniques ensuring live updates flow back heavily to the original document body reliably.</li>
</ul>
    `
  },
  {
    id: 'integrity-checker',
    icon: '✅',
    title: 'Integrity Checker',
    content: `
<h2>Research Integrity & Compliance Checker</h2>
<p>The concluding gatekeeper. The Integrity application rigorously validates document structures identifying potentially serious omission anomalies.</p>

<h3>1. Execution Overview</h3>
<ol>
  <li>Open the system dashboard. Push the massive <strong>"Run Integrity Check"</strong> command.</li>
  <li>The parsing processor isolates individual contextual layers independently.</li>
  <li>Diagnostic returns are clustered strictly by priority: Severe (Critical Warning markers) to Observational (Informational flags).</li>
</ol>

<h3>2. System Capabilities Explored</h3>
<ul>
  <li><strong>Chronological Formatting Syntax:</strong> Forces precise verification matching chosen institutional guidelines.</li>
  <li><strong>Definition Tracing Matrix:</strong> Evaluates exactly if obscure abbreviations appear arbitrarily before formal declaration definition points.</li>
  <li><strong>Mandatory Disclosure Searching:</strong> Aggressively sweeps identifying crucial compliance absences referring to heavy constraints like specific Institutional Review Board permissions or Conflict of Interest financial paragraphs.</li>
  <li><strong>Structural Reference Mapping:</strong> Proves whether embedded physical frames (Graphs / Tables) actually correspond identically to stated textual citations within the primary argument flow.</li>
</ul>
    `
  },
  {
    id: 'shortcuts',
    icon: '⌨️',
    title: 'Keyboard Shortcuts',
    content: `
<h2>Command Line Shortcuts Reference</h2>
<p>Accelerate interface speed globally navigating explicit strict commands.</p>

<h3>1. Broad System Navigation</h3>
<table class="help-shortcut-table">
  <thead>
    <tr><th>Action</th><th>Mac OS</th><th>Windows Interface</th></tr>
  </thead>
  <tbody>
    <tr><td>Initiate Quick Help Interface</td><td><kbd>⌘</kbd>+<kbd>/</kbd></td><td><kbd>Ctrl</kbd>+<kbd>/</kbd></td></tr>
  </tbody>
</table>

<h3>2. Document Control Matrices</h3>
<table class="help-shortcut-table">
  <thead>
    <tr><th>Action Required</th><th>Mac OS System</th><th>Windows Interface</th></tr>
  </thead>
  <tbody>
    <tr><td>Enable Aggressive Bold Scripting</td><td><kbd>⌘</kbd>+<kbd>B</kbd></td><td><kbd>Ctrl</kbd>+<kbd>B</kbd></td></tr>
    <tr><td>Engage Italic Typology</td><td><kbd>⌘</kbd>+<kbd>I</kbd></td><td><kbd>Ctrl</kbd>+<kbd>I</kbd></td></tr>
    <tr><td>Trigger Text Underline Base</td><td><kbd>⌘</kbd>+<kbd>U</kbd></td><td><kbd>Ctrl</kbd>+<kbd>U</kbd></td></tr>
    <tr><td>Force Center Strikethrough Line</td><td><kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd></td><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd></td></tr>
    <tr><td>Initiate Find Syntax Sequence</td><td><kbd>⌘</kbd>+<kbd>F</kbd></td><td><kbd>Ctrl</kbd>+<kbd>F</kbd></td></tr>
    <tr><td>Mount Primary References Box</td><td><kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd></td><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd></td></tr>
    <tr><td>Retract Last Logical Stage</td><td><kbd>⌘</kbd>+<kbd>Z</kbd></td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td></tr>
    <tr><td>Advanced Forward Rewind Stage</td><td><kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></td><td><kbd>Ctrl</kbd>+<kbd>Y</kbd></td></tr>
    <tr><td>Universal Element Selection Process</td><td><kbd>⌘</kbd>+<kbd>A</kbd></td><td><kbd>Ctrl</kbd>+<kbd>A</kbd></td></tr>
  </tbody>
</table>
    `
  },
];

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpGuide({ isOpen, onClose }: HelpGuideProps) {
  const { state } = useLicense();
  const isLicensed = state.mode === 'licensed_active';
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return HELP_SECTIONS;
    const q = searchQuery.toLowerCase();
    return HELP_SECTIONS.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentSection = HELP_SECTIONS.find(s => s.id === activeSection) || HELP_SECTIONS[0];

  // Highlight search matches in content (safely applying to text nodes only)
  const highlightedContent = useMemo(() => {
    if (!searchQuery.trim()) return currentSection.content;
    
    // Convert generic text matches to highlighting (avoiding touching HTML tags)
    const regex = new RegExp(
      '(?<!<[^>]*?)(' + searchQuery.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&') + ')(?![^<]*?>)',
      'gi'
    );
    return currentSection.content.replace(regex, '<mark class="help-highlight">$1</mark>');
  }, [currentSection.content, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="help-guide-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="help-guide-modal">
        {/* Header */}
        <div className="help-guide-header">
          <span style={{ fontSize: '22px' }}>📖</span>
          <h2>Research Desk Pro — Help Guide</h2>
          <input
            className="help-guide-search"
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button className="help-guide-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="help-guide-body">
          {/* Sidebar */}
          <div className="help-guide-sidebar">
            {filteredSections.map(section => (
              <div
                key={section.id}
                className={`help-guide-sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          {isLicensed ? (
            <div
              className="help-guide-content"
              style={{ overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          ) : (
            <div className="help-guide-demo-block">
              <span style={{ fontSize: '64px' }}>🔒</span>
              <h3>Help Guide — Full Version Only</h3>
              <p>
                The comprehensive help guide with detailed instructions, keyboard shortcuts, 
                and workflow guides is available exclusively in the licensed version of Research Desk Pro.
              </p>
              <button
                className="help-guide-demo-btn"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'));
                }}
              >
                Activate License
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
