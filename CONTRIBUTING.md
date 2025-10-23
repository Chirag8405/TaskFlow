# Contributing to Real-Time Task Manager

First off, thank you for considering contributing to Real-Time Task Manager! It's people like you that make this project better for everyone.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How Can I Contribute?](#how-can-i-contribute)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and encourage diversity
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork locally**
   ```bash
   git clone https://github.com/YOUR_USERNAME/realtime-task-manager.git
   cd realtime-task-manager
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/realtime-task-manager.git
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install
   
   # Frontend
   cd ../client
   npm install
   ```

5. **Set up environment variables**
   ```bash
   # Backend
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend
   cd ../client
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include details about your environment** (OS, Node version, browser)

**Bug Report Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node Version: [e.g. 18.17.0]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used
- **Include mockups or wireframes** if applicable

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good-first-issue` - Simple issues for newcomers
- `help-wanted` - Issues that need assistance
- `bug` - Bug fixes
- `enhancement` - Feature requests

## Development Workflow

### Branching Strategy

We use the following branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a New Branch

```bash
# Update your local repository
git checkout develop
git pull upstream develop

# Create a new feature branch
git checkout -b feature/my-new-feature

# Or for bug fixes
git checkout -b bugfix/fix-something
```

### Making Changes

1. **Write your code**
   - Follow the coding standards (see below)
   - Write tests for new functionality
   - Update documentation as needed

2. **Test your changes**
   ```bash
   # Backend tests
   cd server
   npm test
   
   # Frontend tests
   cd client
   npm test
   
   # Manual testing
   # Test the feature thoroughly in the browser
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

## Coding Standards

### JavaScript/React Guidelines

#### General Rules
- Use ES6+ features
- Use functional components with hooks
- Use meaningful variable and function names
- Write comments for complex logic
- Keep functions small and focused

#### Code Style
```javascript
// ✅ Good
const handleSubmit = async (event) => {
  event.preventDefault();
  
  try {
    const response = await api.post('/tasks', formData);
    toast.success('Task created successfully');
  } catch (error) {
    toast.error(error.message);
  }
};

// ❌ Bad
const f = async (e) => {
  e.preventDefault();
  const r = await api.post('/tasks', formData);
};
```

#### Component Structure
```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MyComponent = ({ prop1, prop2 }) => {
  // State declarations
  const [state, setState] = useState(null);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default MyComponent;
```

### CSS/Tailwind Guidelines

- Use Tailwind utility classes
- Follow mobile-first responsive design
- Use consistent spacing (4px grid)
- Extract repeated patterns into components

```jsx
// ✅ Good - Semantic and reusable
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
  Click Me
</button>

// ❌ Bad - Too specific, not reusable
<button style={{ backgroundColor: '#4F46E5', padding: '8px 16px' }}>
  Click Me
</button>
```

### Backend Guidelines

#### API Routes
```javascript
// ✅ Good - RESTful and descriptive
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// ❌ Bad - Non-RESTful
router.get('/get-tasks', getTasks);
router.post('/create-task', createTask);
```

#### Error Handling
```javascript
// ✅ Good - Proper error handling
try {
  const task = await Task.findById(id);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  res.json({ success: true, data: task });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message
  });
}

// ❌ Bad - No error handling
const task = await Task.findById(id);
res.json(task);
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation only changes
- `style` - Code style changes (formatting, missing semi-colons, etc.)
- `refactor` - Code changes that neither fix a bug nor add a feature
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Changes to build process or auxiliary tools

### Examples

```bash
# Feature
git commit -m "feat(auth): add social login with Google"

# Bug fix
git commit -m "fix(tasks): correct drag and drop position calculation"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple changes
git commit -m "feat(board): add task filtering

- Add filter by priority
- Add filter by assignee
- Update UI for filter controls

Closes #123"
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] Tests pass locally (`npm test`)
- [ ] New tests added for new functionality
- [ ] Documentation updated if needed
- [ ] Commit messages follow the guidelines
- [ ] Branch is up-to-date with develop

### Submitting a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/my-new-feature
   ```

2. **Create Pull Request on GitHub**
   - Go to your fork on GitHub
   - Click "Pull Request" button
   - Select base: `develop` and compare: `your-branch`
   - Fill out the PR template

3. **PR Template**
   ```markdown
   ## Description
   Brief description of what this PR does.
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   Describe how you tested this change.
   
   ## Screenshots (if applicable)
   Add screenshots here.
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] Tests added/updated
   - [ ] Tests pass locally
   ```

### Review Process

1. At least one maintainer will review your PR
2. Address any requested changes
3. Push updates to the same branch
4. Once approved, your PR will be merged

### After Merge

1. Delete your feature branch
   ```bash
   git branch -d feature/my-new-feature
   git push origin --delete feature/my-new-feature
   ```

2. Update your local develop branch
   ```bash
   git checkout develop
   git pull upstream develop
   ```

## Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing!

---

**Thank you for contributing to Real-Time Task Manager! 🎉**
