(function () {
  // 1. Select all turn pairs/containers in the Gemini UI
  const userNodes = document.querySelectorAll('user-query, .query-text, [data-test-id="user-query"]');
  const modelNodes = document.querySelectorAll('model-response, .model-response-text, [data-test-id="model-response"]');

  // Fallback: If turn pairs aren't wrapped in expected web components, grab standard message containers
  let markdownOutput = `# Gemini Chat Export\n*Exported on: ${new Date().toLocaleString()}*\n\n---\n\n`;

  // Extract turns based on available message blocks
  const turns = document.querySelectorAll('message-content, .conversation-container, .user-query-container');

  if (turns.length === 0) {
    // Direct extraction from DOM elements present in current web app layout
    const allUserPrompts = Array.from(document.querySelectorAll('user-query, .query-text-content'));
    const allModelResponses = Array.from(document.querySelectorAll('model-response, .response-container-content'));
    const maxTurns = Math.max(allUserPrompts.length, allModelResponses.length);

    for (let i = 0; i < maxTurns; i++) {
      if (allUserPrompts[i]) {
        markdownOutput += `### User\n${allUserPrompts[i].innerText.trim()}\n\n`;
      }
      if (allModelResponses[i]) {
        // Parse inner text and maintain code block formatting
        let responseText = allModelResponses[i].innerText.trim();
        markdownOutput += `#### Gemini\n${responseText}\n\n---\n\n`;
      }
    }
  } else {
    // Universal DOM Traversal across current custom elements
    turns.forEach((node) => {
      const isUser = node.matches('user-query') || node.closest('user-query') || node.classList.contains('user-query-container');
      const text = node.innerText.trim();
      if (isUser) {
        markdownOutput += `### User\n${text}\n\n`;
      } else {
        markdownOutput += `#### Gemini\n${text}\n\n---\n\n`;
      }
    });
  }

  // 2. Trigger Markdown File Download
  const blob = new Blob([markdownOutput], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gemini-chat-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
})();
