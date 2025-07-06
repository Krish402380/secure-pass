import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// This code initializes a React application by rendering the main App component into the root element of the HTML document.
// It imports necessary dependencies, including React, ReactDOM, the main App component, and a CSS file for styling.
// The `React.StrictMode` wrapper is used to help identify potential problems in  the application during development.
// The `createRoot` method from ReactDOM is used to create a root for the React application, which is then rendered into the DOM.
// This setup is typical for modern React applications, ensuring that the app is ready to be displayed in the browser.
// The `index.css` file is included to apply global styles to the application, allowing for consistent design and layout across all components.
// The `  App` component serves as the entry point for the application, encapsulating the main functionality and UI of the password generator.        
