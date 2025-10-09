"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall, createFile, updateFile, getAllFiles } = useFileSystem();

  const [inputState, setInputState] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages);

  // Function to remove code blocks from content for chat display
  const removeCodeBlocks = (content: string): string => {
    // Remove all code blocks but preserve the rest of the text
    return content.replace(/```(?:jsx?|tsx?|javascript|typescript)?\s*\n?([\s\S]*?)```/gi, '').trim();
  };

  // Function to extract and create files from AI response
  const extractAndCreateFiles = (content: string) => {
    // Look for code blocks that contain JSX/React components
    const codeBlockRegex = /```(?:jsx?|tsx?|javascript|typescript)?\s*\n?([\s\S]*?)```/gi;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    matches.forEach((match, index) => {
      const code = match[1].trim();
      
      // Skip if it doesn't look like a React component
      if (!code.includes('export default') && !code.includes('function') && !code.includes('const')) {
        return;
      }
      
      // Try to extract filename from comments like "// App.jsx" or determine from content
      let filename = 'App.jsx';
      const filenameComment = code.match(/^\/\/\s*(.+\.(?:jsx?|tsx?))\s*$/m);
      if (filenameComment) {
        filename = filenameComment[1];
      } else if (code.includes('export default')) {
        // Try to extract component name
        const componentMatch = code.match(/export default function (\w+)/);
        if (componentMatch) {
          filename = `${componentMatch[1]}.jsx`;
        }
      }
      
      // Ensure the filename starts with /
      if (!filename.startsWith('/')) {
        filename = '/' + filename;
      }
      
      // Create or update the file - check if it exists first
      const existingFiles = getAllFiles();
      if (existingFiles.has(filename)) {
        // File exists, update it
        try {
          updateFile(filename, code);
          console.log(`Updated file: ${filename}`);
        } catch (updateError) {
          console.error(`Error updating file ${filename}:`, updateError);
        }
      } else {
        // File doesn't exist, create it
        try {
          createFile(filename, code);
          console.log(`Created file: ${filename}`);
        } catch (error) {
          console.error(`Error creating file ${filename}:`, error);
        }
      }
    });
  };

  const chatHook = useAIChat({
    api: "/proxy/3000/api/chat",
    initialMessages,
    body: {
      files: fileSystem.serialize(),
      projectId,
    },
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall);
    },
  });

  const {
    messages: aiMessages,
    input: aiInput,
    handleInputChange: aiHandleInputChange,
    handleSubmit: aiHandleSubmit,
    status,
  } = chatHook;

  // Use AI messages if available, otherwise use local messages
  const messages = aiMessages.length > 0 ? aiMessages : localMessages;

  // Use local state for input if AI SDK input is not working
  const input = aiInput !== undefined ? aiInput : inputState;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (aiHandleInputChange) {
      aiHandleInputChange(e);
    } else {
      setInputState(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Force manual submit since AI SDK streaming doesn't match our JSON API
    // if (aiHandleSubmit) {
    //   aiHandleSubmit(e);
    // } else {
      // Manual submit if AI SDK submit is not working
      console.log("Manual submit:", input);
      
      if (!input.trim()) return;

      // Add user message to local state immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
      };
      
      setLocalMessages(prev => [...prev, userMessage]);
      setInputState(""); // Clear input immediately
      
      try {
        const response = await fetch("/proxy/3000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            files: fileSystem.serialize(),
            projectId,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("API call successful!");
          
          // Add AI response to local messages
          if (data.message) {
            const fullContent = data.message.content;
            
            // Extract code from the full response and create files
            extractAndCreateFiles(fullContent);
            
            // Create chat message with filtered content (no code blocks)
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: removeCodeBlocks(fullContent),
            };
            setLocalMessages(prev => [...prev, aiMessage]);
          }
        } else {
          console.error("API call failed:", response.status);
          // Add error message
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, I encountered an error generating your component. Please try again.",
          };
          setLocalMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error("Error making API call:", error);
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, there was a network error. Please try again.",
        };
        setLocalMessages(prev => [...prev, errorMessage]);
      }
    // }
  };

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}