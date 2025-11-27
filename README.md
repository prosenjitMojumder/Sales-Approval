# Rate Tracker

A multi-level sales approval tracking system powered by Gemini for intelligent deal risk assessment and automated workflow management.

## Features

- **Multi-Level Approvals**: Automated workflow from Salesperson -> Regional Manager (L1) -> VP of Sales (L2) -> Global Director (L3).
- **AI Risk Analysis**: Integrates with Google Gemini to analyze deal risk based on weight, destination, price, and territory.
- **Role-Based Access**: Secure login for Admins, Salespeople, and Managers with specific dashboards for each role.
- **HAWB Submission**: Post-approval workflow for submitting House Air Waybill details.
- **Excel Export**: Export full request history to CSV/Excel.
- **Admin Panel**: Manage users and customize role display names.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI**: Google Gemini API (`@google/genai`)
- **Storage**: LocalStorage (Persisted in browser)

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```
    API_KEY=your_google_api_key_here
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## Default Credentials

The app comes seeded with the following default users (password for all is `password123`):

- **Admin**: `admin`
- **Sales**: `john`
- **Manager (L1)**: `sarah`
- **VP (L2)**: `mike`
- **Director (L3)**: `david`

You can manage these users via the Admin Panel.