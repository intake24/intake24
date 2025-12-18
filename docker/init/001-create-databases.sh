#!/usr/bin/env bin/bash

# DEV environment

DB_DEV_SYSTEM_USERNAME="${DB_DEV_SYSTEM_USERNAME:=intake24}"
DB_DEV_SYSTEM_PASSWORD="${DB_DEV_SYSTEM_PASSWORD:=intake24}"
DB_DEV_SYSTEM_DATABASE="${DB_DEV_SYSTEM_DATABASE:=intake24_system_dev}"
DB_DEV_FOODS_USERNAME="${DB_DEV_FOODS_USERNAME:=intake24}"
DB_DEV_FOODS_PASSWORD="${DB_DEV_FOODS_PASSWORD:=intake24}"
DB_DEV_FOODS_DATABASE="${DB_DEV_FOODS_DATABASE:=intake24_foods_dev}"

# System DB
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_DEV_SYSTEM_USERNAME WITH PASSWORD '$DB_DEV_SYSTEM_PASSWORD' LOGIN;"
createdb -U $POSTGRES_USER --owner=$DB_DEV_SYSTEM_USERNAME $DB_DEV_SYSTEM_DATABASE

# Foods DB
if [ $DB_DEV_FOODS_USERNAME != $DB_DEV_SYSTEM_USERNAME ]; then
    psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_DEV_FOODS_USERNAME WITH PASSWORD '$DB_DEV_FOODS_PASSWORD';"
fi
echo "Creating foods database..."
createdb -U $POSTGRES_USER --owner=$DB_DEV_FOODS_USERNAME $DB_DEV_FOODS_DATABASE
psql -U $POSTGRES_USER -d $DB_DEV_FOODS_DATABASE -c "create extension if not exists \"uuid-ossp\";"
psql -U $POSTGRES_USER -d $DB_DEV_FOODS_DATABASE -c "create extension if not exists \"btree_gist\";"

echo "Downloading foods database snapshot..."
wget -O /tmp/foods_snapshot.pgcustom https://storage.googleapis.com/intake24/assets/foods_snapshot.pgcustom
echo "Restoring foods database from snapshot..."
pg_restore -n public --no-owner --no-acl --role=$DB_DEV_FOODS_USERNAME --dbname $DB_DEV_FOODS_DATABASE /tmp/foods_snapshot.pgcustom

echo "Downloading system database snapshot..."
wget -O /tmp/system_snapshot.pgcustom https://storage.googleapis.com/intake24/assets/system_snapshot.pgcustom
echo "Creating system database schema..."
pg_restore -n public --no-owner --no-acl --role=$DB_DEV_SYSTEM_USERNAME --dbname $DB_DEV_SYSTEM_DATABASE /tmp/system_snapshot.pgcustom

# TEST environment

DB_TEST_SYSTEM_USERNAME="${DB_TEST_SYSTEM_USERNAME:=intake24}"
DB_TEST_SYSTEM_PASSWORD="${DB_TEST_SYSTEM_PASSWORD:=intake24}"
DB_TEST_SYSTEM_DATABASE="${DB_TEST_SYSTEM_DATABASE:=intake24_system_test}"
DB_TEST_FOODS_USERNAME="${DB_TEST_FOODS_USERNAME:=intake24}"
DB_TEST_FOODS_PASSWORD="${DB_TEST_FOODS_PASSWORD:=intake24}"
DB_TEST_FOODS_DATABASE="${DB_TEST_FOODS_DATABASE:=intake24_foods_test}"

# System DB
if [ "$DB_TEST_SYSTEM_USERNAME" ] && [ "$DB_TEST_SYSTEM_DATABASE" ]; then
    if [ $DB_TEST_SYSTEM_USERNAME != $DB_DEV_SYSTEM_USERNAME ]; then
        psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_TEST_SYSTEM_USERNAME WITH PASSWORD '$DB_TEST_SYSTEM_PASSWORD' LOGIN;"
    fi

    echo "Creating test system database..."
    createdb -U $POSTGRES_USER --owner=$DB_TEST_SYSTEM_USERNAME $DB_TEST_SYSTEM_DATABASE;
    echo "Creating test system database schema..."
    # psql -U $POSTGRES_USER -d $DB_TEST_SYSTEM_DATABASE -f tmp/system_snapshot.sql
    pg_restore -n public --no-owner --no-acl --role=$DB_TEST_SYSTEM_USERNAME --dbname $DB_TEST_SYSTEM_DATABASE /tmp/system_snapshot.pgcustom
fi

# Foods DB
if [ "$DB_TEST_FOODS_USERNAME" ] && [ "$DB_TEST_FOODS_DATABASE" ]; then
    if [ $DB_TEST_FOODS_USERNAME != $DB_DEV_SYSTEM_USERNAME ]; then
        psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_TEST_FOODS_USERNAME WITH PASSWORD '$DB_TEST_FOODS_PASSWORD' LOGIN;"
    fi

    echo "Creating test foods database..."
    createdb -U $POSTGRES_USER --owner=$DB_TEST_FOODS_USERNAME $DB_TEST_FOODS_DATABASE;
    psql -U $POSTGRES_USER -d $DB_TEST_FOODS_DATABASE -c "create extension if not exists \"uuid-ossp\";"
    psql -U $POSTGRES_USER -d $DB_TEST_FOODS_DATABASE -c "create extension if not exists \"btree_gist\";"
    echo "Restoring test foods database from snapshot..."
    pg_restore -n public --no-owner --no-acl --role=$DB_TEST_FOODS_USERNAME --dbname $DB_TEST_FOODS_DATABASE /tmp/foods_snapshot.pgcustom
fi
