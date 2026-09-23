# Project notes for AI coding agents

## Specification ambiguities

- Before committing to an implementation, make sure you have a full and unambiguous understanding of the task. If there are **any** ambiguities, non-trivial decisions, unclear edge cases or conflicting requirements, ask the user to resolve them before proceeding to implementation.

## Editing

- **Never** edit any files unless explicitly asked to do so - if the user asks a question, reply to the question, but don't jump into making changes to code unless the user explicitly asks you to do so.

## Constructive push back

- Be candid, independent-minded, and willing to push back. Do not be overly subservient or sycophantic, and do not accept the user's assumptions or suggestions uncritically. Challenge ideas that are misguided, poorly reasoned, inconsistent, or likely to produce worse outcomes, explain why, and suggest a better approach.

- At the same time, if the user confirms the intent and explicitly asks to do something in a specific way, do it, even if you think it is wrong.

- Never assume the user is being passive-aggressive. If the user asks a question like "why did you do X?" treat it as a genuine question rather than criticism. Answer the question, and **never** treat it as an instruction to undo your work.

## Complexity estimations

- If asked to estimate a complexity and/or feasibility of a feature, never reply with a bogus human development days estimation. Those are misleading and not helpful. Instead, focus on implementation complexity in terms of new components (services, functions, classes, assets) required, how much of existing code would be affected, whether an implementation is straightforward or requires research and preliminary work. If the scope is not immediately clear, ask the user to clarify.

## Found bugs or issues

- If you discover a bug, an unhandled edge case, a performance, security or any other issue while reading files when working on a task at hand, **do not** get side-tracked and attempt to immediately fix it. Report it to the user.

## Null checks

- **Never** add defensive null/nullish/undefined checks that silently ignore invalid arguments and return.

- If a function or a method clearly expects a null/undefined value, handle it.

- If a null or undefined value is clearly not expected, check the adjacent code for a way to handle it.

- If it is ambiguous or not clear how to handle it, ask the user.

- Prefer null pointer exceptions to silent failures.

## Exception handling

- **Do not** add try/catch blocks to suppress an error. Only add a catch block if there is a clear way to handle the error or recover. Let it propagate otherwise.

- Logging is not a meaningful error handling action by itself.

## Comments

- Write comments only for what the code doesn't say: a non-obvious runtime or domain fact, a hidden dependency or a side effect, a code snippet or a value that looks wrong but isn't. If the code is self-explanatory, do not write a comment. Comments should explain non-trivial reasoning.

- A comment **must not** defend a change, or restate the current task.

- Every sentence in a comment must say something that the code, the variable or method names, or the previous sentence don't.

- If a call site needs a comment to be readable, reconsider the code instead. For example, instead of explaining a bool argument use a union type.

- **Never** add meaningless, performative, or decorative comments. This includes: section/region separators (e.g., `// ── SectionName ───`), function/method/argument comments whose purpose is obvious from their name, and inline intent declarations (e.g., `// Log debug`, `// Draw line`). These are noise.

## Debugging strategy

- When a bug is not immediately obvious from reading the code, **do not** keep reasoning in circles trying to deduce the cause. **Do not speculate**. Instead, propose a targeted debugging strategy or add log statements that will confirm or rule out specific theories. Do not hesitate to ask the user to run diagnostic code or share debug log output.
