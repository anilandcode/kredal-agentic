import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownReport({ content }: { content: string }) {
  return (
    <div className="markdown-report">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
