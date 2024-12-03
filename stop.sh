#!/bin/sh

# Apaga y elimina los contenedores del proyecto
docker compose down

# Elimina todos los contenedores detenidos
docker container prune -f

# Elimina imágenes no usadas
docker image prune -f

