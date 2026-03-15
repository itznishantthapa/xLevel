#!/bin/bash
set -euo pipefail

SERVICE_TYPE="${1:-web}"

# Wait for PostgreSQL
wait_for_database() {
    python - <<'PYEOF'
import os, time, psycopg2
from psycopg2 import OperationalError

for i in range(30):
    try:
        psycopg2.connect(
            host=os.environ.get('POSTGRES_HOST'),
            port=os.environ.get('POSTGRES_PORT', '5432'),
            user=os.environ.get('POSTGRES_USER'),
            password=os.environ.get('POSTGRES_PASSWORD'),
            dbname=os.environ.get('POSTGRES_DB'),
            sslmode=os.environ.get('POSTGRES_SSLMODE', 'disable'),
            connect_timeout=5
        ).close()
        print('Database ready')
        break
    except OperationalError:
        print(f'Wait database ({i+1}/30)') if i % 5 == 0 else None
        time.sleep(2)
else:
    print('Database timeout - continuing')
PYEOF
}

# Wait for Redis
wait_for_redis() {
    for i in {1..30}; do
        nc -z "${VALKEY_HOST:-redis}" "${VALKEY_PORT:-6379}" 2>/dev/null && echo "Redis ready" && return 0
        [ $((i % 5)) -eq 0 ] && echo "Wait redis ($i/30)"
        sleep 1
    done
    echo "Redis timeout - continuing"
}

case "$SERVICE_TYPE" in
    web)
        wait_for_database
        wait_for_redis
        python manage.py migrate --noinput
        python manage.py collectstatic --noinput --clear
        exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120 --access-logfile - --error-logfile -
        ;;
    celery-worker)
        wait_for_database
        wait_for_redis
        sleep 10
        exec celery -A core worker --loglevel=info --concurrency=2 --max-tasks-per-child=1000 --task-events --without-gossip --without-mingle
        ;;
    celery-beat)
        wait_for_database
        wait_for_redis
        sleep 15
        exec celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler --max-interval 60
        ;;
    *)
        echo "Unknown service: $SERVICE_TYPE (web|celery-worker|celery-beat)"
        exec "$@"
        ;;
esac
