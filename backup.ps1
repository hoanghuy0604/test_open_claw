$env:Path += ";C:\Program Files\Git\cmd"
$workspace = "C:\Openclaw"
Set-Location $workspace

# Add all changed files
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    $dateStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto backup: $dateStr"
    
    # Push to GitHub
    git push origin main
} else {
    Write-Output "No changes to backup."
}
