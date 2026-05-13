param(
  [Parameter(Mandatory = $false)]
  [string]$ProdHost = "aws-0-eu-west-1.pooler.supabase.com",

  [Parameter(Mandatory = $false)]
  [int]$ProdPort = 5432,

  [Parameter(Mandatory = $false)]
  [string]$ProdUser = "postgres.hvndxvfexvvovxshyfmg",

  [Parameter(Mandatory = $true)]
  [string]$ProdPassword,

  [Parameter(Mandatory = $false)]
  [string]$DevHost = "aws-1-eu-central-1.pooler.supabase.com",

  [Parameter(Mandatory = $false)]
  [int]$DevPort = 5432,

  [Parameter(Mandatory = $false)]
  [string]$DevUser = "postgres.chdzjukgsrowdexqzkoj",

  [Parameter(Mandatory = $true)]
  [string]$DevPassword,

  [Parameter(Mandatory = $false)]
  [string]$Database = "postgres",

  [Parameter(Mandatory = $false)]
  [string]$DumpFile = "./prod_public_to_dev.dump",

  [Parameter(Mandatory = $false)]
  [switch]$SkipHandleNewUserSync
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$Name'. Ensure PostgreSQL CLI tools are installed and in PATH."
  }
}

Require-Command "pg_dump"
Require-Command "pg_restore"
Require-Command "psql"

Write-Host "[1/4] Dump production public schema..."
$env:PGPASSWORD = $ProdPassword
if (Test-Path $DumpFile) {
  Remove-Item $DumpFile -Force
}

pg_dump "host=$ProdHost port=$ProdPort dbname=$Database user=$ProdUser sslmode=require" `
  --schema=public `
  '--exclude-function=public.handle_new_user()' `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file=$DumpFile

if (-not (Test-Path $DumpFile)) {
  throw "Dump file was not created: $DumpFile"
}

$file = Get-Item $DumpFile
if ($file.Length -le 0) {
  throw "Dump file is empty: $DumpFile"
}

Write-Host "[2/4] Restore into development (public schema only)..."
$env:PGPASSWORD = $DevPassword
pg_restore --dbname="host=$DevHost port=$DevPort dbname=$Database user=$DevUser sslmode=require" `
  --clean `
  --if-exists `
  --schema=public `
  --no-owner `
  --no-privileges `
  --exit-on-error `
  $DumpFile

if (-not $SkipHandleNewUserSync) {
  Write-Host "[3/4] Sync public.handle_new_user() from production to development..."
  $env:PGPASSWORD = $ProdPassword
  $fnSql = psql "host=$ProdHost port=$ProdPort dbname=$Database user=$ProdUser sslmode=require" -At -c "select pg_get_functiondef('public.handle_new_user()'::regprocedure);"

  if (-not $fnSql) {
    throw "Could not read public.handle_new_user() definition from production."
  }

  $tempFnFile = Join-Path $PSScriptRoot "handle_new_user_sync.sql"
  $fnSql | Set-Content -Path $tempFnFile -Encoding ascii

  try {
    $env:PGPASSWORD = $DevPassword
    psql "host=$DevHost port=$DevPort dbname=$Database user=$DevUser sslmode=require" -f $tempFnFile
  }
  finally {
    if (Test-Path $tempFnFile) {
      Remove-Item $tempFnFile -Force
    }
  }
}

Write-Host "[4/4] Validate development data snapshot..."
$env:PGPASSWORD = $DevPassword
psql "host=$DevHost port=$DevPort dbname=$Database user=$DevUser sslmode=require" -c "select schemaname, relname, n_live_tup from pg_stat_user_tables where schemaname='public' order by n_live_tup desc limit 10;"

$env:PGPASSWORD = $null
Write-Host "Sync completed. Dump file: $DumpFile ($($file.Length) bytes)"
