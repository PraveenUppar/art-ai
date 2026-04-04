# Contributing to ART-AI

Thank you for your interest in contributing to ART-AI! This document provides guidelines and instructions for contributing to the project.

## 🎯 Ways to Contribute

- 🐛 **Bug Reports**: Report issues you encounter
- ✨ **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve or add documentation
- 💻 **Code Contributions**: Submit bug fixes or new features
- 🧪 **Testing**: Write or improve tests
- 🌍 **Translations**: Add support for new languages

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/art-ai.git
cd art-ai

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/art-ai.git
```

### 2. Set Up Development Environment

Follow the [Quick Start guide](./README.md#-quick-start) in the main README to set up your development environment.

### 3. Create a Branch

```bash
# Create a new branch for your feature/fix
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 📋 Development Workflow

### Code Style

#### Frontend (TypeScript/React)

- **Formatter**: Prettier
- **Linter**: ESLint
- **Naming Conventions**:
  - Components: PascalCase (`ChatComposer.tsx`)
  - Hooks: camelCase with "use" prefix (`useTaskSocket.ts`)
  - Utilities: camelCase (`formatDate.ts`)

Run before committing:
```bash
cd frontend
bun run lint
bun run format
```

#### Backend & Worker (Python)

- **Formatter**: Black (line length: 100)
- **Import Sorter**: isort
- **Linter**: Flake8
- **Type Checking**: mypy (if configured)

Run before committing:
```bash
cd backend
black .
isort .
flake8

cd worker
black .
isort .
flake8
```

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(worker): add retry logic for failed evidence collection

fix(frontend): resolve socket reconnection issue

docs(readme): update installation instructions

refactor(backend): simplify task status endpoint
```

### Testing

#### Frontend Tests

```bash
cd frontend
bun test
bun test:coverage
```

#### Backend Tests

```bash
cd backend
pytest
pytest --cov=api tests/
```

#### Worker Tests

```bash
cd worker
pytest
pytest --cov=tasks tests/
```

### Pull Request Process

1. **Update Your Branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run Tests**
   - Ensure all tests pass
   - Add new tests for new features
   - Maintain or improve code coverage

3. **Update Documentation**
   - Update README.md if needed
   - Add JSDoc/docstrings to new functions
   - Update API documentation for new endpoints

4. **Submit PR**
   - Push your branch to your fork
   - Create a Pull Request on GitHub
   - Fill out the PR template completely
   - Link related issues

5. **Code Review**
   - Address review comments
   - Keep the PR updated with main branch
   - Be responsive to feedback

## 🐛 Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**:
  - OS and version
  - Browser (if frontend issue)
  - Docker version (if using Docker)
- **Logs**: Relevant error messages or logs
- **Screenshots**: If applicable

**Template:**
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Ubuntu 22.04
- Browser: Chrome 120
- Docker: 24.0.7

## Logs
```
paste logs here
```

## Screenshots
If applicable
```

## ✨ Feature Requests

When requesting features, please include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions you've considered
- **Additional Context**: Any other relevant information

## 💻 Code Guidelines

### Frontend

- Use TypeScript for type safety
- Prefer functional components over class components
- Use custom hooks to extract reusable logic
- Keep components small and focused
- Use async/await over .then() chains
- Handle errors gracefully

**Example:**
```typescript
// ✅ Good
export function ChatComposer({ chatId }: { chatId: string }) {
  const [message, setMessage] = useState('')
  const { sendMessage, isLoading } = useTaskSocket()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await sendMessage(message)
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  )
}

// ❌ Bad
class ChatComposer extends React.Component {
  // Using class components
}
```

### Backend

- Use async/await for async operations
- Use dependency injection for shared resources
- Validate input with Pydantic models
- Use appropriate HTTP status codes
- Add docstrings to all functions

**Example:**
```python
# ✅ Good
@router.post("/chat/{chat_id}/start", response_model=TaskResponse)
async def start_chat_task(
    chat_id: str,
    request: ChatRequest,
    _: bool = Depends(verify_internal_shared_secret),
) -> TaskResponse:
    """
    Start a new fact-checking task for the given chat.
    
    Args:
        chat_id: Unique identifier for the chat
        request: Chat request containing prompt and user info
        
    Returns:
        TaskResponse with task ID and status
    """
    task = celery_app.send_task(
        "generate_and_verify_content",
        args=[request.task_id, request.prompt, chat_id, request.user_id],
    )
    return TaskResponse(task_id=str(task.id), status="queued")

# ❌ Bad
@router.post("/chat/{chat_id}/start")
def start_chat_task(chat_id, request):  # Missing type hints
    # Missing validation
    task = celery_app.send_task(
        "generate_and_verify_content", args=[...]
    )
    return {"task_id": task.id}  # Not using response model
```

### Worker

- Break down complex tasks into smaller functions
- Add progress updates for long-running operations
- Handle API rate limits gracefully
- Log important events
- Use structured data models (Pydantic)

**Example:**
```python
# ✅ Good
@celery_app.task(name="generate_and_verify_content")
def generate_and_verify_content(
    task_id: str,
    user_prompt: str,
    chat_id: str,
    user_id: str,
) -> dict:
    """
    Multi-stage fact-checking task.
    
    Steps:
    1. Generate content
    2. Classify domain
    3. Extract claims
    4. Collect evidence
    5. Verify claims
    """
    emit_task_update(task_id, {
        "status": "IN_PROGRESS",
        "step": "Generating content...",
        "progress": 10,
    })
    
    content = _generate_content(user_prompt)
    # ... rest of the task
```

## 📁 Project Structure

When adding new files, follow the existing structure:

```
frontend/
├── app/                    # Next.js pages
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
└── lib/                    # Utilities, auth, database

backend/
├── api/                    # Route handlers
├── core/                   # Configuration, dependencies
└── main.py                 # Entry point

worker/
├── tasks/                  # Celery task definitions
├── ai/                     # AI prompts and logic
├── tools/                  # Utilities (search, evidence)
├── models/                 # Pydantic models
└── core/                   # Configuration
```

## 🔒 Security

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Sanitize user inputs
- Follow OWASP security best practices
- Report security vulnerabilities privately

**To report a security issue:**
Email security@artai.example.com (do NOT create a public issue)

## 📄 License

By contributing to ART-AI, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

All contributors will be recognized in:
- The project's contributors list
- Release notes for significant contributions
- The README.md acknowledgments section

## 💬 Questions?

- **General Questions**: Use [GitHub Discussions](https://github.com/your-repo/art-ai/discussions)
- **Bug Reports**: Use [GitHub Issues](https://github.com/your-repo/art-ai/issues)
- **Direct Contact**: Email contribute@artai.example.com

---

Thank you for contributing to ART-AI! 🎉
