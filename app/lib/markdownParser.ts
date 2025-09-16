import { marked } from 'marked'

export interface ParsedSection {
  title: string
  content: string
}

export interface ParsedMarkdown {
  sections: ParsedSection[]
  error?: string
}

export async function parseMarkdownProject(markdown: string): Promise<ParsedMarkdown> {
  try {
    // Split by H1 headings (# at the start of a line)
    const h1Pattern = /^#\s+(.+)$/gm
    const sections: ParsedSection[] = []

    // Find all H1 headings and their positions
    const headings: { title: string; index: number }[] = []
    let match

    while ((match = h1Pattern.exec(markdown)) !== null) {
      headings.push({
        title: match[1].trim(),
        index: match.index
      })
    }

    // No H1 headings found
    if (headings.length === 0) {
      return {
        sections: [],
        error: 'No H1 headings found in the markdown file. Please ensure your file has at least one heading starting with a single #'
      }
    }

    // Extract content for each section
    for (let i = 0; i < headings.length; i++) {
      const currentHeading = headings[i]
      const nextHeading = headings[i + 1]

      // Get content between current and next heading (or end of file)
      const startIndex = currentHeading.index + markdown.indexOf('\n', currentHeading.index) + 1
      const endIndex = nextHeading ? nextHeading.index : markdown.length

      const content = markdown.substring(startIndex, endIndex).trim()

      // Convert markdown to HTML
      const htmlContent = await marked(content)

      sections.push({
        title: currentHeading.title,
        content: htmlContent
      })
    }

    return { sections }
  } catch (error) {
    return {
      sections: [],
      error: `Failed to parse markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export function validateProjectStructure(sections: ParsedSection[]): { valid: boolean; error?: string } {
  if (sections.length === 0) {
    return {
      valid: false,
      error: 'No sections found in the markdown file'
    }
  }

  // Check for empty titles
  const emptyTitles = sections.some(section => !section.title || section.title.trim() === '')
  if (emptyTitles) {
    return {
      valid: false,
      error: 'One or more sections have empty titles'
    }
  }

  return { valid: true }
}