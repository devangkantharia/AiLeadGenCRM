interface MessageContentProps {
  content: string;
}

export default function MessageContent({ content }: MessageContentProps) {
  // Function to process the content and format links and bold text
  const formatContent = (text: string) => {
    // Regular expressions for markdown-style links and bold text
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    // Split the text into parts (text, links, and bold)
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let workingText = text;
    
    // First process bold text
    const boldParts: (string | JSX.Element)[] = [];
    let boldLastIndex = 0;
    let boldMatch;
    
    while ((boldMatch = boldRegex.exec(workingText)) !== null) {
      // Add text before the bold
      if (boldMatch.index > boldLastIndex) {
        boldParts.push(workingText.slice(boldLastIndex, boldMatch.index));
      }
      
      // Add the bold text
      boldParts.push(
        <strong key={`bold-${boldMatch.index}`} className="font-bold">
          {boldMatch[1]}
        </strong>
      );
      
      boldLastIndex = boldMatch.index + boldMatch[0].length;
    }
    
    // Add remaining text after last bold
    if (boldLastIndex < workingText.length) {
      boldParts.push(workingText.slice(boldLastIndex));
    }
    
    // Now process links within each part
    boldParts.forEach((part, index) => {
      if (typeof part === 'string') {
        const linkParts: (string | JSX.Element)[] = [];
        let linkLastIndex = 0;
        let linkMatch;
        
        while ((linkMatch = linkRegex.exec(part)) !== null) {
          // Add text before the link
          if (linkMatch.index > linkLastIndex) {
            linkParts.push(part.slice(linkLastIndex, linkMatch.index));
          }
          
          // Add the formatted link
          linkParts.push(
            <a
              key={`link-${linkMatch.index}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand-default)] hover:underline"
            >
              {linkMatch[1]}
            </a>
          );
          
          linkLastIndex = linkMatch.index + linkMatch[0].length;
        }
        
        // Add remaining text after last link
        if (linkLastIndex < part.length) {
          linkParts.push(part.slice(linkLastIndex));
        }
        
        parts.push(...linkParts);
      } else {
        parts.push(part);
      }
    });

    return parts;
  };

  return <>{formatContent(content)}</>;
} 