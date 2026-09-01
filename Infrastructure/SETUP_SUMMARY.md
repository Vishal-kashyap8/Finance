# Finance App Deployment - Setup Summary

## ✅ Completed

### 1. Azure Infrastructure Created
- **Resource Group:** finance-rg (Central India)
- **App Service Plan:** finance-app-plan (Free tier F1)
- **Linux Web App:** finance-app-001
- **URL:** https://finance-app-001.azurewebsites.net

### 2. Terraform Configuration Files
- `main.tf` - App Service and App Service Plan
- `variables.tf` - Configuration variables
- `terraform.tfvars` - Your subscription and resource settings
- `managed_instance.tf` - Managed Instance reference
- `.gitignore` - Prevents committing sensitive files

### 3. Documentation Created
- `DEPLOYMENT_GUIDE.md` - Complete deployment walkthrough
- `QUICK_SETUP.md` - Quick reference commands

## 📋 Next Steps

### Step 1: Move Your Managed Instance
Run these PowerShell commands in sequence:

```powershell
cd C:\Finance\Infrastructure

# Set variables
$SourceRG = "Az-DevOps-RG"
$TargetRG = "finance-rg"
$MIName = "db-sql-mi-0569414"
$SubscriptionID = "6ae8940e-c219-47f2-94de-f638865862c8"

# Get Managed Instance ID
$MI_ID = az sql mi show --name $MIName --resource-group $SourceRG --subscription $SubscriptionID --query id --output tsv

# Move the resource
az resource move --ids $MI_ID --destination-group $TargetRG --subscription $SubscriptionID

# Get new FQDN
$MI_FQDN = az sql mi show --name $MIName --resource-group $TargetRG --subscription $SubscriptionID --query fullyQualifiedDomainName --output tsv

Write-Host "Your Managed Instance FQDN: $MI_FQDN"
```

### Step 2: Configure App Service Database Settings

Once you have the FQDN, run:

```powershell
az webapp config appsettings set `
  --name finance-app-001 `
  --resource-group finance-rg `
  --subscription $SubscriptionID `
  --settings `
  DATABASE_HOST="<your_MI_FQDN>" `
  DATABASE_PORT="3342" `
  DATABASE_NAME="<your_database_name>" `
  DATABASE_USER="<your_username>" `
  DATABASE_PASSWORD="<your_password>" `
  DATABASE_DIALECT="mssql"
```

### Step 3: Update Your Node.js Backend

Update `backend/db.js`:

```javascript
const mssql = require('mssql');

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

const pool = new mssql.ConnectionPool(config);
pool.on('error', (err) => console.error('DB Error:', err));

module.exports = pool;
```

### Step 4: Deploy Your App

Choose one deployment method:

#### Method A: ZIP File Deployment
```bash
cd C:\Finance\backend
npm install
Compress-Archive -Path "*.js", "routes", "node_modules", "package.json" -DestinationPath "app.zip"
az webapp deployment source config-zip --resource-group finance-rg --name finance-app-001 --src-path app.zip
```

#### Method B: Local Git Deployment
```bash
cd C:\Finance
git init
git add .
git commit -m "Initial deployment"
az webapp deployment source config-local-git --name finance-app-001 --resource-group finance-rg
git remote add azure <deployment-url>
git push azure main
```

#### Method C: Direct File Copy (for quick testing)
```bash
cd C:\Finance\backend
npm install
az webapp up --name finance-app-001 --resource-group finance-rg --runtime node
```

### Step 5: Update Frontend

Update `frontend/js/app.js`:

```javascript
const API_BASE_URL = 'https://finance-app-001.azurewebsites.net/api';

async function fetchTransactions() {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### Step 6: Verify Everything Works

```powershell
# Check app service status
az webapp show --name finance-app-001 --resource-group finance-rg --query state

# View logs
az webapp log tail --name finance-app-001 --resource-group finance-rg

# Test the endpoint
curl https://finance-app-001.azurewebsites.net/
```

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│        Azure Subscription                   │
│  6ae8940e-c219-47f2-94de-f638865862c8      │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  finance-rg (Resource Group)        │   │
│  │                                     │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │ finance-app-001 (Web App)    │  │   │
│  │  │ https://finance-app-001...   │  │   │
│  │  │ Node.js 20-LTS               │  │   │
│  │  │ Free Tier (F1)               │  │   │
│  │  └──────────────────────────────┘  │   │
│  │                │                    │   │
│  │                │                    │   │
│  │                ▼                    │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │ db-sql-mi-0569414            │  │   │
│  │  │ (Moved from Az-DevOps-RG)    │  │   │
│  │  │ Port: 3342                   │  │   │
│  │  └──────────────────────────────┘  │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## 💰 Cost Estimation

| Resource | SKU | Monthly Cost |
|----------|-----|------|
| App Service Plan | Free (F1) | $0.00 |
| Managed Instance | Existing | (Already provisioned) |
| **Total** | - | **~$0 + MI costs** |

**Note:** Free tier has limitations (1 GB storage, shared compute). Upgrade to B1 ($10-15/month) for production.

## 🔒 Security Notes

- Enable HTTPS only (configured by default)
- Store database password in Key Vault (recommended)
- Don't commit `.env` files to git
- Restrict app service firewall access
- Use managed identity for database authentication (advanced)

## 📞 Support Resources

- **Azure App Service:** https://docs.microsoft.com/azure/app-service/
- **SQL Managed Instance:** https://docs.microsoft.com/azure/azure-sql/managed-instance/
- **Node.js mssql package:** https://github.com/tediousjs/node-mssql
- **Azure CLI:** https://docs.microsoft.com/cli/azure/

## ❓ Troubleshooting

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.

---
**Setup completed:** 2026-09-01
**Next action:** Move Managed Instance and configure app settings
