import { chromium, Browser, Page } from 'playwright';
import dotenv from 'dotenv'; // Import dotenv to load environment variables
import Anthropic from "@anthropic-ai/sdk"; // Import the Anthropic SDK

dotenv.config(); // Load environment variables from .env file



const anthropic = new Anthropic({
  apiKey: process.env.CLAUDAI_API_KEY // Pass the API key in headers
}); // Initialize the Anthropic client

async function runTest(url: string, testName: string) {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {

    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    await page.goto(url);

    // Capture the body HTML after loading the page
    const bodyHtml = await page.evaluate(() => {
      // Define the removeAllStyles function inside the evaluate context
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        element.removeAttribute('style');
      });

      const headElements = document.body.querySelectorAll('link, script, style');
      headElements.forEach(el => el.remove());
      return document.body.innerHTML;
    });
    console.log('bodyHtml', bodyHtml);

    // Send the HTML to Claude AI for processing
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.5,
      messages: [
        {
          role: "user",
          content: `Extract the html tags (<p> <input<button>, <div>, <form>, <label>, <textarea>, <select>, <a>, <img>, <span>, <h1>, <h2>, <h3>, <h4>, <h5>, <h6> ...etc) with its identifiers (like ids, test ids, class names, roles, values, placeholders or whatever is needed) for testing purposes with playwright automation testing for the {test-senario} on the following HTML. Strictly follow the {rules}. Make sure the response is valid JSON, nothing else.
          html: ${bodyHtml}. 
          test-senario: ${testName}.
          rules: 1. Only return the HTML tags and their identifiers that is needed for the test. 2. Return in JSON format. 3. Return the tags in the order they appear in the HTML. 3. flag the tags that are required for the test to pass. 4. only return the required tages, nothing else.
          example output:
          {
            "tags": [
              {
                "test_step": "step 1",
                "tag": "input",
                "id": "username",
                "class": "form-control",
                "required": true
                "role": "input" || null,
                "value": "username" || null,
                "placeholder": "Enter your username" || null
              },
              {
                "test_step": "step 2",
                "tag": "button",
                "id": "submit",
                "class": "btn btn-primary",
                "required": true
                "role": "button" || null,
                "value": "Submit" || null,
              }
            ]
          }`
        }
      ]
    });

    // Assuming 'msg' is the response object you received
    const response: any = msg; // Replace with your actual response variable

    // Extract the content.text
    const contentText = response.content[0].text;

    // Parse the JSON string into a JavaScript object
    const parsedData = JSON.parse(contentText);

    // Call the new function after parsing the data
    await generatePlaywrightCode(parsedData, testName); // Call the function with parsedData

  } catch (error) {
    if (error instanceof Error) {
      console.error('Test failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Test failed:', error);
    }
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function generatePlaywrightCode(parsedData: any, testSenario: string) {
  // Construct the request to Anthropic for generating Playwright code
  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1000,
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: `Generate Playwright test code based on the following {testingSenario} and {testingData}. Strictly follow the {rules}.
        testing scenario: ${testSenario}
        testing data: ${JSON.stringify(parsedData)}
        rules: 1. only return the code, nothing else. 2. the code should be valid playwright code. 3. the code should be able to run without errors. 4.  return the playwright code in a function.
        You should generate Playwright test code strictly following these rules:
        - Code should be returned as valid Playwright JavaScript.
        - Do not include any additional text, comments, or explanations before or after the code (for example, do not include "Here's the Playwright test code based on the provided testing scenario and data:" or any other introductory text).
        - The code must be in a function format.
        - Ensure that the code runs without errors.
        example output:
        const test = async () => {
          export const test = async () => {
            const page = await browser.newPage();
            ...more code
          }
        }
        `
      }
    ]
  });

  // Assuming 'msg' is the response object you received
  const response: any = msg; // Replace with your actual response variable

  // Extract the content.text
  const playwrightCode = response.content[0].text;
  console.log('playwrightCode', playwrightCode);

  // Save the generated code to a file
  const fs = require('fs');
  fs.writeFileSync('src/test.ts', playwrightCode, 'utf8');
  console.log('Playwright code saved to test.ts');

  // Execute the generated Playwright code
  // Note: Executing dynamically generated code can be dangerous
  // Consider using a safer method to run the tests
}

runTest('https://www.facebook.com', 'login to facebook');



