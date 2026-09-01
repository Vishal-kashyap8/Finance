# Deploying Finance App to Azure App Service with Managed Instance

## Overview

Your Finance application will be deployed to the Azure App Service (finance-app-001) and connected to your SQL Managed Instance which will be moved from `Az-DevOps-RG` to `finance-rg`.

## Step 1: Move Managed Instance and Configure Connection

Run the PowerShell script to move your managed instance and configure the App Service:

```powershell
cd C:\Finance\Infrastructure
.\move-and-connect.ps1
```

This script will:
- Move your managed instance from `Az-DevOps-RG` to `finance-rg`
- Get the FQDN of your managed instance
- Configure App Service environment variables with database credentials

**Output:** The script will display the connection details you need.

## Step 2: Update Your Node.js Backend

Update your backend code to use the environment variables. Here's an example for `backend/db.js`:

```javascript
// backend/db.js
const mssql = require('mssql');

// Configuration from environment variables
const config = {
  server: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 3342,
  database: process.env.DATABASE_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableKeepAlive: true,
    connectTimeout: 30000
  }
};

// Create connection pool
const pool = new mssql.ConnectionPool(config);

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = pool;
```

## Step 3: Update Your Server Configuration

Update your `backend/server.js` to include database connection:

```javascript
// backend/server.js
const express = require('express');
const pool = require('./db');

const app = express();

// Connect to database on startup
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to SQL Server');
});

// Your routes
const accountsRouter = require('./routes/accounts');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');
// ... other routes

app.use('/api/accounts', accountsRouter);
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
// ... other routes

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Step 4: Update package.json

Ensure you have the necessary dependencies:

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mssql": "^9.0.0",
    "dotenv": "^16.0.0"
  }
}
```

## Step 5: Add Local Environment File

Create a `.env` file for local testing (do NOT commit to git):

```
DATABASE_HOST=<your_managed_instance_fqdn>
DATABASE_PORT=3342
DATABASE_NAME=<your_database_name>
DATABASE_USER=<your_username>
DATABASE_PASSWORD=<your_password>
DATABASE_DIALECT=mssql
PORT=8080
NODE_ENV=development
```

Add to `.gitignore`:

```
.env
.env.local
node_modules/
```

## Step 6: Deploy to App Service

### Option A: Deploy via Zip File

```bash
cd backend
npm install
npm run build  # if you have a build script

# Create deployment package
Compress-Archive -Path "*.js", "routes", "node_modules", "package.json" -DestinationPath "app.zip"

# Deploy to Azure
az webapp deployment source config-zip `
  --resource-group finance-rg `
  --name finance-app-001 `
  --src-path app.zip
```

### Option B: Deploy via Git

```bash
cd C:\Finance

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial Finance app deployment"

# Add Azure remote
az webapp deployment source config-local-git `
  --name finance-app-001 `
  --resource-group finance-rg

# Get the deployment URL
$deployUrl = az webapp deployment source config-local-git `
  --name finance-app-001 `
  --resource-group finance-rg `
  --query url -o tsv

# Add remote and push
git remote add azure $deployUrl
git push azure main
```

### Option C: Deploy via GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm install
      
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: finance-app-001
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend
```

## Step 7: Verify Deployment

Check that your app is running:

```bash
# View logs
az webapp log tail --name finance-app-001 --resource-group finance-rg

# Test the app
curl https://finance-app-001.azurewebsites.net/api/health
```

## Step 8: Update Frontend

Update your `frontend/js/app.js` to point to the backend:

```javascript
// frontend/js/app.js
const API_BASE_URL = 'https://finance-app-001.azurewebsites.net/api';

// Example API call
async function fetchTransactions() {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

## Connection String Reference

Your Managed Instance uses this connection string format:

```
Server=tcp:<FQDN>,3342;Initial Catalog=<DatabaseName>;User Id=<Username>;Password=<Password>;
```

Example:
```
Server=tcp:db-sql-mi-0569414.11111111.database.windows.net,3342;Initial Catalog=financedb;User Id=sqladmin;Password=P@ssw0rd;
```

## Troubleshooting

### Cannot connect to Managed Instance

1. Verify the Managed Instance was moved successfully:
   ```bash
   az sql mi show --name db-sql-mi-0569414 --resource-group finance-rg
   ```

2. Check App Service environment variables:
   ```bash
   az webapp config appsettings list --name finance-app-001 --resource-group finance-rg
   ```

3. View App Service logs:
   ```bash
   az webapp log tail --name finance-app-001 --resource-group finance-rg
   ```

### Connection Timeout

- Ensure the Managed Instance has proper network configuration
- Check that the App Service can reach the managed instance
- Verify network security groups allow the connection

### Authentication Failed

- Verify DATABASE_USER and DATABASE_PASSWORD are correct
- Check that the user exists in the managed instance database
- Ensure the user has proper permissions on the database

## Next Steps

1. ✅ Move Managed Instance
2. ✅ Configure App Service environment variables
3. Update your Node.js backend code
4. Deploy the application
5. Test end-to-end connectivity
6. Monitor performance and logs

## Support

For help with:
- **App Service:** https://docs.microsoft.com/azure/app-service/
- **SQL Managed Instance:** https://docs.microsoft.com/azure/azure-sql/managed-instance/
- **mssql npm package:** https://github.com/tediousjs/node-mssql
