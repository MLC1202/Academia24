# Roda uma vez, quando o volume do banco e criado.
# Menor privilegio: a aplicacao so le e grava linhas. Mudar tabela
# (CREATE/ALTER/DROP) so com o usuario de migration.
# Obs.: use senhas so com letras e numeros no .env.

docker_process_sql <<-EOSQL
  CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';
  GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';

  CREATE USER IF NOT EXISTS '${DB_MIGRA_USER}'@'%' IDENTIFIED BY '${DB_MIGRA_PASS}';
  GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_MIGRA_USER}'@'%';

  FLUSH PRIVILEGES;
EOSQL
