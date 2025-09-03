This project uses yarn 1.22.22
Never use npm commands
This project uses a bash terminal, so always use forward slashes in paths.
Use the run_tests tool to run tests.
The model/schema is defined in design/model.md. This is the source of truth that requires a human to approve changes to. It is thus vital that it is precise while also being easy for a human to read. It is vital that it be kept up to date. Everything else should be derived from this model.

### Running commands in terminal

**CRITICAL**: If current terminal is BUSY (running a command), `isBackground: false` commands will NOT execute until that terminal is free. You must spawn a new terminal by running a command with `isBackground: true`.

- `isBackground: false` - Uses current terminal, waits for completion
- `isBackground: true` - Creates NEW terminal, returns immediately

For example, you might `yarn dev` with `isBackground: true` but then you would need yarn e2e with `isBackground: true` in order to give that its own terminal.

Before starting a server, test to see if it is already running. You can do that by doing a CURL for some known path, e.g. http://localhost:5173/demo/pages/new-grid.html. E.g. the dev server is normally at http://localhost:5173. If you run another one without checking, you'll just create a new one at 5174 and then get confused.
