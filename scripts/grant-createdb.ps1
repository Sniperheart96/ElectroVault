# Grant CREATEDB permission to electrovault_dev_user
$env:PGPASSWORD = 'Xv!%MV39*#a9aRKqJ$zG'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -c "ALTER USER electrovault_dev_user CREATEDB;"
