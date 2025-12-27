import type { RichContent } from '@/entities/curriculum';

interface ContentRendererProps {
  content: RichContent | any;
}

/**
 * Content Renderer
 * Renders TipTap/Lexical JSON content to HTML
 * TODO: Implement full TipTap rendering when admin editor is ready
 */
export function ContentRenderer({ content }: ContentRendererProps) {
  // For now, if content is empty or placeholder, show demo
  if (!content || !content.content || content.content.length === 0) {
    return (
      <div className="prose prose-lg max-w-none">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>📝 Content Not Yet Available</strong>
            <br />
            This module's content is being prepared by the admin. Check back
            soon!
          </p>
        </div>

        {/* Demo Content */}
        <h2>Module Overview</h2>
        <p>
          This curriculum module is part of the BDA Body of Competency Knowledge
          (BoCK™), designed to provide comprehensive knowledge in business
          development competencies.
        </p>

        <h3>What You'll Learn</h3>
        <ul>
          <li>Core concepts and frameworks</li>
          <li>Practical applications in real-world scenarios</li>
          <li>Best practices from industry experts</li>
          <li>Tools and techniques for implementation</li>
        </ul>

        <h3>Prerequisites</h3>
        <p>
          To get the most out of this module, you should have completed the
          previous modules in the curriculum sequence.
        </p>

        <blockquote>
          <p>
            "Business development is not just about sales—it's about creating
            sustainable growth through strategic relationships and value
            creation."
          </p>
        </blockquote>

        <h3>Key Takeaways</h3>
        <ol>
          <li>Understanding the fundamental principles</li>
          <li>Applying frameworks to solve problems</li>
          <li>Developing strategic thinking capabilities</li>
          <li>Building long-term professional skills</li>
        </ol>
      </div>
    );
  }

  // Simple renderer for basic TipTap JSON
  const renderNode = (node: any, index: number): React.ReactNode => {
    switch (node.type) {
      case 'heading':
        const HeadingTag = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={index} className="font-bold text-gray-900 mb-4">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </p>
        );

      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside mb-4 space-y-2">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside mb-4 space-y-2">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ol>
        );

      case 'listItem':
        return (
          <li key={index} className="text-gray-700">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </li>
        );

      case 'blockquote':
        return (
          <blockquote
            key={index}
            className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4"
          >
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </blockquote>
        );

      case 'codeBlock':
        return (
          <pre
            key={index}
            className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"
          >
            <code>
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </code>
          </pre>
        );

      case 'text':
        let text = node.text || '';

        // Apply marks (bold, italic, etc.)
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case 'bold':
                text = <strong key={index}>{text}</strong>;
                break;
              case 'italic':
                text = <em key={index}>{text}</em>;
                break;
              case 'code':
                text = (
                  <code
                    key={index}
                    className="bg-gray-100 px-2 py-1 rounded text-sm font-mono"
                  >
                    {text}
                  </code>
                );
                break;
              case 'link':
                text = (
                  <a
                    key={index}
                    href={mark.attrs?.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {text}
                  </a>
                );
                break;
            }
          });
        }

        return text;

      case 'hardBreak':
        return <br key={index} />;

      case 'horizontalRule':
        return <hr key={index} className="my-6 border-gray-300" />;

      case 'image':
        return (
          <img
            key={index}
            src={node.attrs?.src}
            alt={node.attrs?.alt || ''}
            className="max-w-full rounded-lg mb-4"
          />
        );

      default:
        console.warn('Unknown node type:', node.type);
        return null;
    }
  };

  return (
    <div className="prose prose-lg max-w-none">
      {content.content?.map((node: any, index: number) =>
        renderNode(node, index)
      )}
    </div>
  );
}
