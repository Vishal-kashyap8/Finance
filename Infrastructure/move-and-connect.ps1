# PowerShell Script to move SQL Managed Instance and configure App Service
# Run this from: C:\Finance\Infrastructure

param(
    [string]$SourceRG = "Az-DevOps-RG",
    [string]$TargetRG = "finance-rg",
    [string]$MIName = "db-sql-mi-0569414",
    [string]$SubscriptionID = "6ae8940e-c219-47f2-94de-f638865862c8",
    [string]$AppServiceName = "finance-app-001"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SQL Managed Instance Move & Connection" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Managed Instance details
Write-Host "Step 1: Retrieving Managed Instance details..." -ForegroundColor Yellow
try {
    $query = "{id:id, fqdn:fullyQualifiedDomainName}"
    $MI = az sql mi show --name $MIName --resource-group $SourceRG --subscription $SubscriptionID --query $query --output json | ConvertFrom-Json
    
    if ($null -eq $MI.id) {
        Write-Host "ERROR: Could not find managed instance: $MIName" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Found Managed Instance: $($MI.id)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to retrieve managed instance details" -ForegroundColor Red
    exit 1
}

# Step 2: Move the Managed Instance
Write-Host "Step 2: Moving Managed Instance to target resource group..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
try {
    az resource move --ids $MI.id --destination-group $TargetRG --subscription $SubscriptionID
    
    Write-Host "✓ Managed Instance moved successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Failed to move Managed Instance" -ForegroundColor Red
    exit 1
}

# Step 3: Get updated connection details
Write-Host "Step 3: Retrieving connection details..." -ForegroundColor Yellow
try {
    $MI_Updated = az sql mi show --name $MIName --resource-group $TargetRG --subscription $SubscriptionID --query "fullyQualifiedDomainName" --output tsv
    
    Write-Host "✓ Managed Instance FQDN: $MI_Updated" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Failed to retrieve updated managed instance details" -ForegroundColor Red
    exit 1
}

# Step 4: Display connection information
Write-Host "Step 4: Connection Configuration" -ForegroundColor Yellow
Write-Host "========================================" 
Write-Host "Add these environment variables to your App Service:" -ForegroundColor Cyan
Write-Host ""
Write-Host "DATABASE_HOST: $MI_Updated" -ForegroundColor Gray
Write-Host "DATABASE_PORT: 3342" -ForegroundColor Gray
Write-Host "DATABASE_NAME: [your_database_name]" -ForegroundColor Gray
Write-Host "DATABASE_USER: [your_username]" -ForegroundColor Gray
Write-Host "DATABASE_PASSWORD: [your_password]" -ForegroundColor Gray
Write-Host ""
Write-Host "Connection String Format (for Node.js/Express):" -ForegroundColor Cyan
Write-Host "Server=tcp:$MI_Updated,3342;Initial Catalog=[database];User Id=[user];Password=[password];" -ForegroundColor Gray
Write-Host ""

# Step 5: Configure App Service Settings
Write-Host "Step 5: Configuring App Service with database settings..." -ForegroundColor Yellow
Write-Host ""

$DBName = Read-Host "Enter your database name"
$DBUser = Read-Host "Enter your database username"
$DBPass = Read-Host "Enter your database password" -AsSecureString
$DBPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($DBPass))

try {
    az webapp config appsettings set --name $AppServiceName --resource-group $TargetRG --subscription $SubscriptionID --settings DATABASE_HOST=$MI_Updated DATABASE_PORT=3342 DATABASE_NAME=$DBName DATABASE_USER=$DBUser DATABASE_PASSWORD=$DBPassPlain DATABASE_DIALECT=mssql
    
    Write-Host "✓ App Service configured successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Failed to configure App Service settings" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Managed Instance has been moved to: $TargetRG" -ForegroundColor Green
Write-Host "Your App Service is now configured with database settings." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your application code to use environment variables" -ForegroundColor Gray
Write-Host "2. Deploy your Finance application to the App Service" -ForegroundColor Gray
Write-Host "3. Test the database connection" -ForegroundColor Gray
Write-Host ""
