# Test PostgreSQL Verbindung
$env:PGPASSWORD = 'Xv!%MV39*#a9aRKqJ$zG'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -c "SELECT version();"
