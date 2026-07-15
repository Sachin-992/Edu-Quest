import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, UserRole } from '../types';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  userRole: UserRole;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userRole }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 mx-2 ${
          isUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div
          className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.text}</div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  code: ({node, inline, className, children, ...props}: any) => {
                     return inline ? (
                        <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                     ) : (
                        <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg my-2 text-xs font-mono overflow-x-auto" {...props}>{children}</code>
                     )
                  },
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-3 italic my-2 text-slate-600" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
