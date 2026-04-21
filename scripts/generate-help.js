const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MANUAL_PATH = path.join(__dirname, '..', 'docs', 'USER_MANUAL.md');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'components', 'HelpGuideData.ts');

function generateHelp() {
  console.log('Generating Help Guide Data...');

  // 1. Fetch recent git commits
  let changelog = '';
  try {
    const gitLog = execSync('git log -n 10 --oneline --format="- %h: %s"').toString().trim();
    if (gitLog) {
      changelog = gitLog;
    } else {
      changelog = '- No recent changes found / Initializing repository context.';
    }
  } catch (error) {
    changelog = '- Could not retrieve git history automatically. Ensure git is installed and initialized.';
  }

  // 2. Inject into USER_MANUAL.md
  let manualContent = '';
  try {
    manualContent = fs.readFileSync(MANUAL_PATH, 'utf-8');
  } catch (err) {
    console.error('Failed to read USER_MANUAL.md', err);
    process.exit(1);
  }

  const startTag = '<!-- CHANGELOG_START -->';
  const endTag = '<!-- CHANGELOG_END -->';
  const startIndex = manualContent.indexOf(startTag);
  const endIndex = manualContent.indexOf(endTag);

  if (startIndex !== -1 && endIndex !== -1) {
    const before = manualContent.slice(0, startIndex + startTag.length);
    const after = manualContent.slice(endIndex);
    manualContent = `${before}\n${changelog}\n${after}`;
    fs.writeFileSync(MANUAL_PATH, manualContent, 'utf-8');
    console.log('Injected recent commit history into USER_MANUAL.md');
  }

  // 3. Parse USER_MANUAL.md into the HelpGuide structured object
  const sections = [];
  const lines = manualContent.split('\n');
  
  let currentSection = null;
  let currentContent = [];

  const flushSection = () => {
    if (currentSection) {
      // Basic markdown to HTML-ish conversion for simplicity (or just keep MD and let React render it if it has a parser, but HelpGuide uses dangerouslySetInnerHTML)
      // The current HelpGuide expects HTML content.
      let htmlContent = currentContent.join('\n')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
      
      // Basic list handling (crude but effective for our manual constraints)
      htmlContent = htmlContent.replace(/^- (.*$)/gim, '<li>$1</li>');
      htmlContent = htmlContent.replace(/(<li>.*<\/li>\n)+/gm, '<ul class="help-list">$&</ul>\n');
      htmlContent = htmlContent.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
      // For numbered lists, it's slightly harder to regex wrap in <ol>, so we'll just let <li> render nicely or handle it simply:
      
      // Paragraph wrapping for loose text
      // We'll skip strict paragraph wrapping to avoid breaking lists, but add basic spacing.
      htmlContent = htmlContent.replace(/\n\n/g, '<br/><br/>');

      sections.push({
        ...currentSection,
        content: `<h2>${currentSection.title}</h2>\n${htmlContent}`
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('## ')) {
      // New main section
      flushSection();
      
      const rawTitle = line.replace('##', '').trim();
      // Extract emoji if present
      const emojiMatch = rawTitle.match(/([\p{Emoji}]+)/u);
      let icon = '📖';
      let title = rawTitle;
      
      if (emojiMatch) {
        icon = emojiMatch[0];
        title = rawTitle.replace(icon, '').trim();
      }

      const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-z-]/g, '');

      currentSection = {
        id,
        icon,
        title
      };
      currentContent = [];
    } else if (currentSection && !line.startsWith('# ')) {
      // # is the main document title, skip it
      currentContent.push(line);
    }
  }
  flushSection();

  // 4. Write TypeScript file
  const tsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Update docs/USER_MANUAL.md and run build shell scripts instead.

export interface HelpSection {
  id: string;
  icon: string;
  title: string;
  content: string;
}

export const HELP_SECTIONS: HelpSection[] = ${JSON.stringify(sections, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, tsContent, 'utf-8');
  console.log('Successfully generated src/components/HelpGuideData.ts');
}

generateHelp();
