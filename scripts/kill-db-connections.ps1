# Kill all connections to electrovault_dev database
$env:PGPASSWORD = 'Xv!%MV39*#a9aRKqJ$zG'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'electrovault_dev' AND pid <> pg_backend_pid();"
Write-Host "All connections terminated"
