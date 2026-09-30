ARG DB_VERSION=11.4
FROM mariadb:${DB_VERSION}

# 0644 = sem bit de execucao: o entrypoint "sourceia" o script (precisa disso
# pra usar a funcao docker_process_sql) em vez de tentar executa-lo.
COPY --chmod=0644 01-usuarios.sh /docker-entrypoint-initdb.d/01-usuarios.sh
