# Optimizing HTML Processing for Automated Playwright Test Generation

To ensure your automated Playwright test generation system works seamlessly across diverse web pages with varying HTML complexities, it's essential to implement an effective strategy for **cleaning and filtering HTML**. The goal is to extract only the **necessary HTML elements** relevant to your test scenarios, thereby reducing data volume and improving the accuracy of generated tests. Below, I outline a comprehensive approach to achieve this, including best practices, tools, and code examples.

## Table of Contents

1. [Overview](#overview)
2. [Steps to Clean and Filter HTML](#steps-to-clean-and-filter-html)
   - [1. Navigate and Interact with the Page](#1-navigate-and-interact-with-the-page)
   - [2. Extract Rendered HTML](#2-extract-rendered-html)
   - [3. Sanitize the HTML](#3-sanitize-the-html)
   - [4. Filter Relevant Elements](#4-filter-relevant-elements)
   - [5. Minimize and Structure the HTML](#5-minimize-and-structure-the-html)
3. [Implementing the Process with Playwright and JavaScript](#implementing-the-process-with-playwright-and-javascript)
   - [a. Dependencies and Setup](#a-dependencies-and-setup)
   - [b. HTML Extraction and Cleaning Script](#b-html-extraction-and-cleaning-script)
   - [c. Integrating with LLM for Test Generation](#c-integrating-with-llm-for-test-generation)
4. [Best Practices](#best-practices)
   - [1. Use Data Attributes for Testing](#1-use-data-attributes-for-testing)
   - [2. Modularize HTML Processing](#2-modularize-html-processing)
   - [3. Handle Dynamic Content Transparently](#3-handle-dynamic-content-transparently)
   - [4. Maintain a Feedback Loop](#4-maintain-a-feedback-loop)
5. [Advanced Techniques](#advanced-techniques)
   - [1. Leveraging CSS Selectors and XPath](#1-leveraging-css-selectors-and-xpath)
   - [2. Implementing Heuristics for Element Relevance](#2-implementing-heuristics-for-element-relevance)
   - [3. Using Machine Learning for Contextual Filtering](#3-using-machine-learning-for-contextual-filtering)
6. [Example Workflow](#example-workflow)
7. [Conclusion](#conclusion)

---

## Overview

When dealing with webpages that have extensive and complex HTML structures, it's crucial to **focus only on elements pertinent to your test scenarios**. This not only optimizes the performance and cost associated with LLM processing but also enhances the relevance and accuracy of the generated Playwright tests.

## Steps to Clean and Filter HTML

### 1. Navigate and Interact with the Page

Before extracting HTML, ensure that all necessary dynamic content is loaded. This involves:

- Navigating to the target URL.
- Performing required interactions (e.g., clicking buttons to open modals).

### 2. Extract Rendered HTML

Use Playwright to extract the **rendered HTML** post-interactions.

### 3. Sanitize the HTML

Remove unnecessary elements that do not contribute to the functionality you intend to test, such as:

- Inline styles.
- Scripts and styles.
- Meta tags.
- SVGs and other non-essential elements.

### 4. Filter Relevant Elements

Identify and retain only those HTML elements that are **relevant to your test scenarios**, such as:

- Forms and input fields.
- Buttons and links.
- Modals and dynamic components involved in the test.

### 5. Minimize and Structure the HTML

Ensure the final HTML is **concise and well-structured**, making it easier for the LLM to process and generate accurate test scripts.

---

## Implementing the Process with Playwright and JavaScript

Below is a step-by-step guide, complete with code examples, to implement the HTML cleaning and filtering process.

### a. Dependencies and Setup

Ensure you have the following dependencies installed:

```bash
npm install playwright dotenv
```

Create a `.env` file to store environment variables (e.g., API keys).

### b. HTML Extraction and Cleaning Script

```typescript
// src/htmlProcessor.ts

import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Function to navigate to a URL, perform interactions, and extract sanitized HTML.
 * @param url - The target URL.
 * @param interactionSteps - Array of interaction step descriptions.
 * @param filterCriteria - Criteria to determine which HTML elements to retain.
 * @returns Sanitized HTML string.
 */
async function extractSanitizedHTML(
  url: string,
  interactionSteps: string[],
  filterCriteria: RegExp[] = []
): Promise<string> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    // Perform interaction steps
    for (const step of interactionSteps) {
      await performInteraction(page, step);
    }

    // Wait for dynamic content to load
    await page.waitForTimeout(1000); // Adjust as needed

    // Extract and sanitize HTML
    const rawHTML = await page.content();
    let sanitizedHTML = sanitizeHTML(rawHTML);

    // Filter relevant elements based on criteria
    sanitizedHTML = filterHTML(sanitizedHTML, filterCriteria);

    // Optionally, write sanitized HTML to a file for debugging
    fs.writeFileSync('sanitized.html', sanitizedHTML, 'utf8');
    console.log('Sanitized HTML extracted successfully.');

    return sanitizedHTML;
  } catch (error) {
    console.error('Error during HTML extraction:', error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * Perform a single interaction step.
 * @param page - Playwright Page object.
 * @param step - Description of the interaction step.
 */
async function performInteraction(page: Page, step: string): Promise<void> {
  // Simple parser for interaction steps
  const clickRegex = /Click the ['"](.+)['"] button/i;
  const fillRegex = /Fill the ['"](.+)['"] input with ['"](.+)['"]/i;

  if (clickRegex.test(step)) {
    const match = step.match(clickRegex);
    if (match) {
      const buttonText = match[1];
      await page.click(`button:text("${buttonText}")`);
      console.log(`Clicked button with text: ${buttonText}`);
    }
  } else if (fillRegex.test(step)) {
    const match = step.match(fillRegex);
    if (match) {
      const inputLabel = match[1];
      const inputValue = match[2];
      // Assuming labels are associated with inputs via 'for' attribute
      const inputSelector = `label:text("${inputLabel}") + input`;
      await page.fill(inputSelector, inputValue);
      console.log(`Filled input '${inputLabel}' with value: ${inputValue}`);
    }
  }
  // Add more interaction parsers as needed
}

/**
 * Sanitize HTML by removing unnecessary elements.
 * @param html - Raw HTML string.
 * @returns Sanitized HTML string.
 */
function sanitizeHTML(html: string): string {
  // Remove inline styles, scripts, styles, meta tags, and SVGs
  const sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<meta[^>]*>/gi, '');

  return sanitized;
}

/**
 * Filter HTML to retain only relevant elements based on criteria.
 * @param html - Sanitized HTML string.
 * @param criteria - Array of regular expressions to match element tags or attributes.
 * @returns Filtered HTML string.
 */
function filterHTML(html: string, criteria: RegExp[] = []): string {
  if (criteria.length === 0) {
    // Default: Keep common interactive elements
    criteria = [
      /<(input|button|select|textarea|a|form|div|span|label|h[1-6])\b[^>]*>/gi,
    ];
  }

  const filteredParts: string[] = [];
  const regex = /<(\/?)(\w+)([^>]*)>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const [fullMatch, closingSlash, tagName, attributes] = match;
    const tag = `<${closingSlash}${tagName}${attributes}>`;

    // Check if the tag matches any of the filter criteria
    const isRelevant = criteria.some((criterion) =>
      criterion.test(`<${closingSlash}${tagName}`)
    );

    if (isRelevant) {
      filteredParts.push(tag);
    }
  }

  return filteredParts.join('\n');
}

export { extractSanitizedHTML };
```

### Explanation of the Script

1. **Function `extractSanitizedHTML`**:
   - **Navigates** to the provided URL using Playwright.
   - **Performs interactions** as specified in the `interactionSteps` array.
   - **Extracts the rendered HTML** after interactions.
   - **Sanitizes** the HTML by removing non-essential elements.
   - **Filters** the HTML to retain only relevant elements based on provided criteria.
   - **Returns** the sanitized and filtered HTML for further processing.

2. **Function `performInteraction`**:
   - Parses interaction step descriptions and performs actions like clicking buttons or filling inputs.
   - Can be extended to handle more complex interactions as needed.

3. **Function `sanitizeHTML`**:
   - Removes `<script>`, `<style>`, `<link rel="stylesheet">`, `<svg>`, and `<meta>` tags to declutter the HTML.

4. **Function `filterHTML`**:
   - Uses regular expressions to identify and retain only the relevant HTML tags.
   - By default, retains common interactive elements like `input`, `button`, `select`, etc.
   - Can be customized with more specific criteria as needed.

### c. Integrating with LLM for Test Generation

Once you have the sanitized and filtered HTML, you can pass it to your LLM (e.g., Claude AI) to generate Playwright tests. Here's a conceptual example:

```typescript
// src/testGenerator.ts

import { extractSanitizedHTML } from './htmlProcessor';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDAI_API_KEY,
});

/**
 * Function to generate Playwright code using LLM based on sanitized HTML.
 * @param html - Sanitized HTML string.
 * @param testScenario - Description of the test scenario.
 */
async function generatePlaywrightTest(html: string, testScenario: string) {
  const prompt = `
Generate a Playwright test script based on the following test scenario and sanitized HTML. Adhere strictly to the rules provided.

**Test Scenario**: ${testScenario}

**Sanitized HTML**:
\`\`\`html
${html}
\`\`\`

**Rules**:
1. Return only valid Playwright JavaScript code without any additional text.
2. Ensure the code is free of syntax errors and can run successfully.
3. The code must be encapsulated within an async function named 'test'.
4. Include all necessary imports.
5. Use the 'export' keyword for the test function.
6. Follow best practices for Playwright scripting.
7. Handle asynchronous actions appropriately (e.g., waiting for modals to appear).
8. Include error handling for each interaction step.

**Example Output**:
\`\`\`javascript
import { chromium } from 'playwright';

export const test = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.example.com');

  await page.click('button:text("Open Modal")');
  await page.waitForSelector('#modal');

  await page.fill('#modal-input', 'Test Input');
  await page.click('#modal-submit-button');

  await browser.close();
};
\`\`\`
`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const playwrightCode: string = msg.content[0].text;

    // Validate the generated code
    if (!playwrightCode.includes('async function test')) {
      throw new Error('Generated code is invalid or incomplete.');
    }

    // Save the generated code to a file
    fs.writeFileSync('src/generatedTest.ts', playwrightCode, 'utf8');
    console.log('Playwright test code generated and saved to generatedTest.ts');
  } catch (error) {
    console.error('Error generating Playwright test:', error);
    // Optionally implement retry logic or notifications
  }
}

// Example usage
(async () => {
  const url = 'https://www.example.com';
  const testScenario = 'Test opening a modal and submitting a form within it.';
  const interactionSteps = ['Click the "Open Modal" button.'];
  const filterCriteria = [
    /<(input|button|select|textarea|a|form|div|span|label|h[1-6])\b[^>]*>/gi,
  ];

  const sanitizedHTML = await extractSanitizedHTML(
    url,
    interactionSteps,
    filterCriteria
  );

  await generatePlaywrightTest(sanitizedHTML, testScenario);
})();
```

### Explanation of the Integration

1. **Function `generatePlaywrightTest`**:
   - **Constructs a prompt** that includes the sanitized HTML and the test scenario.
   - **Sends the prompt** to the Anthropic LLM to generate Playwright test code.
   - **Validates** the generated code to ensure it contains the expected function structure.
   - **Saves** the generated code to a designated file for execution.

2. **Example Usage**:
   - Specifies the target URL and test scenario.
   - Defines the interaction steps to perform before HTML extraction.
   - Invokes the `extractSanitizedHTML` function to obtain the clean HTML.
   - Passes the sanitized HTML and test scenario to the `generatePlaywrightTest` function.

## Best Practices

### 1. Use Data Attributes for Testing

**Why?**

- **Stability**: Data attributes like `data-testid` provide stable selectors that are less likely to change with UI updates.
- **Clarity**: They clearly indicate elements' roles in tests, improving maintainability.

**How?**

- **Implement in HTML**: Add `data-testid` attributes to elements you intend to test.

```html
<button data-testid="open-modal-button">Open Modal</button>
<input data-testid="modal-input" placeholder="Enter your name">
<button data-testid="modal-submit-button">Submit</button>
```

- **Adjust Filtering Criteria**: Modify the `filterHTML` function to prioritize elements with `data-testid` attributes.

```typescript
const filterCriteria = [
  /<input\b[^>]*data-testid=["'][^"']+["'][^>]*>/gi,
  /<button\b[^>]*data-testid=["'][^"']+["'][^>]*>/gi,
  // Add other elements as needed
];
```

### 2. Modularize HTML Processing

Break down the HTML processing logic into **reusable modules or functions**. This enhances code readability, maintainability, and scalability.

```typescript
// Example modular functions

function removeScripts(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
}

function removeStyles(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
}
```

### 3. Handle Dynamic Content Transparently

Ensure that your script can **detect and handle dynamic content** such as modals, pop-ups, or asynchronously loaded sections.

- **Implement Wait Strategies**: Use `waitForSelector`, `waitForLoadState`, or other Playwright waiting mechanisms to ensure elements are loaded before interacting.

```typescript
await page.click('button[data-testid="open-modal-button"]');
await page.waitForSelector('#modal', { timeout: 5000 });
```

- **Error Handling**: Implement robust error handling to manage scenarios where dynamic content fails to load.

```typescript
try {
  await page.waitForSelector('#modal', { timeout: 5000 });
} catch (error) {
  throw new Error('Modal did not appear as expected.');
}
```

### 4. Maintain a Feedback Loop

Implement a **feedback mechanism** to capture and analyze the outcomes of generated tests. This allows continuous improvement of your HTML processing and prompt engineering.

- **Log Test Results**: Record whether tests pass or fail, along with relevant error messages.

```typescript
interface TestFeedback {
  testScenario: string;
  status: 'passed' | 'failed';
  details: string;
  timestamp: string;
}

function logTestFeedback(feedback: TestFeedback) {
  const feedbackPath = 'test-feedback.json';
  const existingFeedback = fs.existsSync(feedbackPath)
    ? JSON.parse(fs.readFileSync(feedbackPath, 'utf8'))
    : [];
  existingFeedback.push(feedback);
  fs.writeFileSync(feedbackPath, JSON.stringify(existingFeedback, null, 2), 'utf8');
}
```

- **Refine Prompts Based on Feedback**: Analyze feedback to identify common issues and adjust your prompts accordingly.

## Advanced Techniques

### 1. Leveraging CSS Selectors and XPath

Use advanced CSS selectors or XPath expressions to **precisely target elements** during filtering.

```typescript
// Example: Filtering inputs with placeholders

const placeholderRegex = /<input\b[^>]*placeholder=["']([^"']+)["'][^>]*>/gi;
```

### 2. Implementing Heuristics for Element Relevance

Develop heuristics to determine the **relevance of elements** based on their attributes, hierarchy, or content.

- **Attribute-Based Heuristics**: Prioritize elements with specific attributes like `data-testid`, `name`, or `id`.
- **Content-Based Heuristics**: Retain elements containing certain keywords relevant to the test scenario.

```typescript
function isElementRelevant(tagName: string, attributes: string): boolean {
  const relevanceCriteria = [
    /data-testid=["'][^"']+["']/i,
    /name=["'][^"']+["']/i,
    /id=["'][^"']+["']/i,
    /placeholder=["'][^"']+["']/i,
  ];

  return relevanceCriteria.some((criterion) => criterion.test(attributes));
}
```

### 3. Using Machine Learning for Contextual Filtering

For highly complex scenarios, consider leveraging **machine learning models** to analyze and filter HTML elements based on contextual relevance.

- **Training Models**: Train models to recognize patterns and elements relevant to specific test scenarios.
- **Integration**: Use these models to preprocess HTML before passing it to the LLM.

*Note: Implementing ML-based filtering requires additional resources and expertise.*

## Example Workflow

Here's a complete example demonstrating the end-to-end process of extracting, cleaning, filtering HTML, and generating a Playwright test using the LLM.

### 1. Define Test Parameters

```typescript
// src/main.ts

const url = 'https://www.example.com';
const testScenario = 'Test opening a modal and submitting the form within it.';
const interactionSteps = [
  'Click the "Open Modal" button.',
];
const filterCriteria = [
  /<input\b[^>]*data-testid=["'][^"']+["'][^>]*>/gi,
  /<button\b[^>]*data-testid=["'][^"']+["'][^>]*>/gi,
  /<form\b[^>]*>/gi,
  /<div\b[^>]*id=["']modal["'][^>]*>/gi, // Example for modal
];
```

### 2. Execute HTML Processing and Test Generation

```typescript
(async () => {
  try {
    // Step 1: Extract Sanitized HTML
    const sanitizedHTML = await extractSanitizedHTML(
      url,
      interactionSteps,
      filterCriteria
    );

    // Step 2: Generate Playwright Test
    await generatePlaywrightTest(sanitizedHTML, testScenario);

    // Optional: Execute the generated test
    // Add your test execution logic here
  } catch (error) {
    console.error('Error in test generation workflow:', error);
  }
})();
```

### 3. Example Generated Playwright Test (`src/generatedTest.ts`)

```javascript
import { chromium } from 'playwright';

export const test = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.example.com');

  // Click the 'Open Modal' button
  await page.click('button[data-testid="open-modal-button"]');
  await page.waitForSelector('#modal');

  // Fill in the form within the modal
  await page.fill('input[data-testid="modal-input"]', 'John Doe');
  await page.click('button[data-testid="modal-submit-button"]');

  await browser.close();
};
```

### 4. Execute and Log Test Feedback

```typescript
// Example function to execute the generated test and log feedback

import { exec } from 'child_process';

async function executeAndLogTest() {
  exec('npx playwright test src/generatedTest.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`Test execution failed: ${error.message}`);
      logTestFeedback({
        testScenario,
        status: 'failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    console.log(`Test Output: ${stdout}`);
    logTestFeedback({
      testScenario,
      status: 'passed',
      details: stdout,
      timestamp: new Date().toISOString(),
    });
  });
}

executeAndLogTest();
```

## Conclusion

By implementing a structured approach to **extracting, sanitizing, and filtering HTML**, you can significantly enhance the efficiency and reliability of your automated Playwright test generation system. Focusing on relevant elements reduces overhead, minimizes costs associated with LLM processing, and ensures that generated tests are closely aligned with your testing objectives. Incorporating best practices, such as using data attributes and maintaining a feedback loop, further solidifies your testing workflow, making it scalable and adaptable to diverse web application structures.

Embracing these strategies will empower your system to handle a wide array of HTML complexities, ensuring comprehensive and accurate automated testing across your web projects.