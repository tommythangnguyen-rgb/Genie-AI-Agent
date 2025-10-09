# UI Generator Workshop

A React-based UI component generator powered by AI. This workshop project demonstrates how to build interactive applications that leverage AI APIs for code generation.

## Features

✨ **AI-Powered Component Generation**: Generate React components using natural language descriptions  
🔄 **Real-time Preview**: See your components render immediately in the browser  
📝 **Code Editor**: View and edit generated component code with syntax highlighting  
🔧 **Dual API Support**: Works with both Anthropic API and AWS Bedrock  
📱 **Responsive Design**: Clean, modern interface built with Tailwind CSS  
🗂️ **Project Management**: Save and manage your component projects with user authentication  

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### Setup Instructions

1. **Extract the project files**
   ```bash
   # Extract uigen.zip to your desired location
   unzip uigen.zip
   cd uigen
   ```

2. **Install dependencies and setup database**
   ```bash
   npm run setup
   ```
   This command will:
   - Install all npm dependencies
   - Generate Prisma client
   - Create and migrate the SQLite database

3. **Configure API access (Optional)**
   
   The app works with mock data by default, but for full functionality, add an API key to the `.env` file:
   
   **Option A: Anthropic API**
   ```env
   ANTHROPIC_API_KEY="your-api-key-here"
   ```
   Get your key at: https://console.anthropic.com/
   
   **Option B: AWS Bedrock (Alternative)**
   ```env
   AWS_BEARER_TOKEN_BEDROCK="your-bearer-token-here"
   AWS_REGION="us-west-2"
   ```
   Get your bearer token from the AWS Bedrock API Keys console.
   
   > **Note**: If both keys are provided, Bedrock will be preferred. If neither is provided, the app will generate static mock components for demonstration purposes.

4. **Start the development server**
   
   **For local development:**
   ```bash
   npm run dev
   ```
   
   **For AWS proxy deployment:**
   ```bash
   PROXY_MODE=true npm run dev
   ```
   
   > **Note**: When deploying behind a proxy (like AWS CloudFormation with Nginx), use the `PROXY_MODE=true` environment variable to ensure static assets and API routes work correctly through the proxy path `/proxy/3000/`.

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Generate Components**: Type a description like "Create a blue button with white text" in the chat interface
2. **View Preview**: See your component render live in the Preview tab
3. **Inspect Code**: Switch to the Code tab to view the generated React code
4. **Create Projects**: Sign up/in to save your work and manage multiple projects
5. **Edit & Refine**: Make additional requests to modify or enhance your components

## Project Structure

```
uigen/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable React components
│   │   ├── chat/           # Chat interface components
│   │   ├── editor/         # Code editor components
│   │   └── preview/        # Component preview system
│   ├── lib/                # Utility libraries
│   │   ├── contexts/       # React contexts for state management
│   │   ├── file-system.ts  # Virtual file system for component management
│   │   └── provider.ts     # AI provider configuration
│   └── styles/             # Global styles
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── package.json           # Project dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Complete project setup (install + database)
- `npm run db:reset` - Reset database (development only)
- `npm test` - Run tests

## Deployment Scripts

- `PROXY_MODE=true npm run dev` - Start server for AWS proxy deployment
- For AWS deployment, use the CloudFormation template with proper Nginx configuration for static assets and API routing

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI Integration**: Anthropic Claude API, AWS Bedrock
- **Database**: SQLite with Prisma ORM
- **Code Editor**: Monaco Editor (VS Code editor)
- **Authentication**: Custom JWT implementation
- **State Management**: React Context + Local Storage

## Architecture Highlights

### Virtual File System
The app includes a sophisticated virtual file system that manages component files in memory, allowing for:
- Real-time code editing
- Live preview updates
- Component import/export simulation

### AI Provider Pattern
Flexible provider system supporting multiple AI APIs:
- Automatic fallback to mock generation
- Configurable model selection
- Consistent interface across providers

### Real-time Preview
Components are rendered in a sandboxed iframe with:
- Hot reloading when code changes
- Proper error handling and display
- Support for component dependencies

## Workshop Learning Objectives

By working with this project, you'll learn:

1. **AI API Integration**: How to integrate AI services into web applications
2. **Real-time Code Generation**: Techniques for dynamic code creation and execution
3. **Virtual File Systems**: Managing code files in browser memory
4. **Component Architecture**: Building scalable React applications
5. **Modern Web Development**: Next.js, TypeScript, and modern tooling

## Troubleshooting

### Common Issues

**Dependencies not installing?**
- Make sure you're using Node.js v18 or higher
- Try deleting `node_modules` and running `npm run setup` again

**Database errors?**
- Run `npm run db:reset` to recreate the database
- Check that no other process is using the database file

**API not working?**
- Verify your API key is correctly set in the `.env` file
- Check the console for error messages
- The app will fall back to mock generation if APIs fail

**Preview not updating?**
- Check the browser console for JavaScript errors
- Try refreshing the page
- Ensure the component code is valid React/JSX

## Support

This project is designed for educational purposes as part of a workshop. If you encounter issues:

1. Check the browser developer console for error messages
2. Verify all setup steps were completed correctly
3. Try the mock mode (no API key) to ensure basic functionality works
4. Review the code structure to understand how components interact

## License

This project is provided for educational purposes. Feel free to use and modify for learning and experimentation.

---

Happy coding! 🚀