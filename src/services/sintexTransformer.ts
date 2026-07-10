import type { StudyGuide, StudyGuideSection, StudyGuideBlock } from './studyGuideService';

let blockCounter = 0;
let sectionCounter = 0;

function makeBlockId(): string {
  blockCounter += 1;
  return `b-${Date.now().toString(36)}-${blockCounter}`;
}

function makeSectionId(): string {
  sectionCounter += 1;
  return `s-${Date.now().toString(36)}-${sectionCounter}`;
}

function cleanMarkdownText(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/(^|\s)_(?!\s)([^_]+?)_(?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTermDefinition(value: string): { term: string; description: string } | null {
  const clean = value.trim();
  const boldWithColonInside = clean.match(/^\*\*(.+?)\s*[:：]\*\*\s*(.*)$/);
  if (boldWithColonInside) {
    return {
      term: cleanMarkdownText(boldWithColonInside[1]),
      description: cleanMarkdownText(boldWithColonInside[2]),
    };
  }

  const boldWithColonOutside = clean.match(/^\*\*(.+?)\*\*\s*[:：]\s*(.*)$/);
  if (boldWithColonOutside) {
    return {
      term: cleanMarkdownText(boldWithColonOutside[1]),
      description: cleanMarkdownText(boldWithColonOutside[2]),
    };
  }

  return null;
}

function parseBullet(line: string, pendingListTitle: string | undefined): StudyGuideBlock[] {
  // * **Concepto:** explicación  =>  list item "Concepto: explicación"
  const clean = line.replace(/^\s*[\*\-]\s+/, '');
  const parsed = parseTermDefinition(clean);
  if (parsed) {
    const { term, description } = parsed;
    const item = description ? `${term}: ${description}` : term;
    return [{ id: makeBlockId(), type: 'list', title: pendingListTitle, items: [item] }];
  }
  return [{ id: makeBlockId(), type: 'list', title: pendingListTitle, items: [cleanMarkdownText(clean)] }];
}

export function markdownToStudyGuide(markdown: string): StudyGuide {
  const lines = markdown.split('\n');
  const sections: StudyGuideSection[] = [];
  let title = 'Documento de estudio';
  let currentSection: StudyGuideSection | null = null;
  let pendingListTitle: string | undefined = undefined;
  let lastBlockWasList = false;

  const ensureSection = (): StudyGuideSection => {
    if (!currentSection) {
      currentSection = { id: makeSectionId(), title: 'Sección', blocks: [] };
      sections.push(currentSection);
    }
    return currentSection;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      continue;
    }

    // H1: # Título
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      title = cleanMarkdownText(line.replace(/^#\s+/, ''));
      continue;
    }

    // H3: ### Subgrupo
    if (line.startsWith('### ')) {
      pendingListTitle = cleanMarkdownText(line.replace(/^###\s+/, ''));
      lastBlockWasList = false;
      continue;
    }

    // H2: ## N. Sección
    if (line.startsWith('## ')) {
      const sectionTitle = cleanMarkdownText(line.replace(/^##\s+/, ''));
      currentSection = { id: makeSectionId(), title: sectionTitle, blocks: [] };
      sections.push(currentSection);
      pendingListTitle = undefined;
      lastBlockWasList = false;
      continue;
    }

    // Viñeta: * texto  o  - texto
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const section = ensureSection();
      const blocks = parseBullet(line, pendingListTitle);

      // Si ya existe como último bloque una lista con el mismo pendingListTitle, fusionar
      const lastBlock = section.blocks[section.blocks.length - 1];
      if (
        lastBlockWasList &&
        lastBlock &&
        lastBlock.type === 'list' &&
        lastBlock.title === pendingListTitle
      ) {
        const mergedList: StudyGuideBlock = {
          ...lastBlock,
          items: [...lastBlock.items, ...(blocks[0] as Extract<StudyGuideBlock, { type: 'list' }>).items],
        };
        section.blocks = [...section.blocks.slice(0, -1), mergedList];
      } else {
        section.blocks = [...section.blocks, ...blocks];
      }
      lastBlockWasList = true;
      continue;
    }

    // Línea independiente con **Término:** descripción (sin viñeta)
    const parsed = parseTermDefinition(line);
    if (parsed) {
      const section = ensureSection();
      const { term, description } = parsed;
      section.blocks = [...section.blocks, { id: makeBlockId(), type: 'paragraph', title: term, text: description || term }];
      lastBlockWasList = false;
      pendingListTitle = undefined;
      continue;
    }

    // Texto plano (intro de sección, etc.)
    {
      const section = ensureSection();
      // Si justo después del H2, tratar como intro
      const wasSectionStart = section.blocks.length === 0;
      section.blocks = [...section.blocks, { id: makeBlockId(), type: 'paragraph', title: wasSectionStart ? 'Introducción' : undefined, text: cleanMarkdownText(line) }];
      lastBlockWasList = false;
      pendingListTitle = undefined;
    }
  }

  if (sections.length === 0) {
    sections.push({ id: makeSectionId(), title: 'Documento', blocks: [{ id: makeBlockId(), type: 'paragraph', title: 'Contenido', text: cleanMarkdownText(markdown) }] });
  }

  return { title, sections };
}
