#!/usr/bin/env bin/bash

# DEV environment

DB_DEV_SYSTEM_USERNAME="${DB_DEV_SYSTEM_USERNAME:=intake24}"
DB_DEV_SYSTEM_PASSWORD="${DB_DEV_SYSTEM_PASSWORD:=intake24}"
DB_DEV_SYSTEM_DATABASE="${DB_DEV_SYSTEM_DATABASE:=intake24_system}"
DB_DEV_FOODS_USERNAME="${DB_DEV_FOODS_USERNAME:=intake24}"
DB_DEV_FOODS_PASSWORD="${DB_DEV_FOODS_PASSWORD:=intake24}"
DB_DEV_FOODS_DATABASE="${DB_DEV_FOODS_DATABASE:=intake24_foods}"

# System DB
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_DEV_SYSTEM_USERNAME WITH PASSWORD '$DB_DEV_SYSTEM_PASSWORD' LOGIN;"
createdb -U $POSTGRES_USER --owner=$DB_DEV_SYSTEM_USERNAME $DB_DEV_SYSTEM_DATABASE
# psql -U $POSTGRES_USER -d $DB_DEV_SYSTEM_DATABASE -c "create extension if not exists \"uuid-ossp\";"
# echo "Restoring system database from snapshot..."
# pg_restore -n public --no-owner --no-acl --role=$DB_DEV_SYSTEM_USERNAME --dbname $DB_DEV_SYSTEM_DATABASE /docker-entrypoint-initdb.d/system_snapshot.pgcustom

# Insert admin user, password is 'intake24'
# psql -U $POSTGRES_USER -d $DB_DEV_SYSTEM_DATABASE <<'SQL'
# insert into users (id, "name", email, phone, simple_name, email_notifications, sms_notifications, multi_factor_authentication, created_at, updated_at, verified_at, disabled_at) 
# values (default, 'Admin', 'admin@admin.admin', '', 'Admin', true, true, false, now(), now(), now(), null) returning id;
# insert into user_passwords (user_id, password_hash, password_salt, password_hasher) 
# values (
#     11969, 
#     '$2a$10$metTHvhIsr/srD4RrubR3e48z9gxLseT.a673nlp9Nti4HUE2A3eG', 
#     '$2a$10$metTHvhIsr/srD4RrubR3e', 
# 'bcrypt'
# );
# insert into role_user (role_id, user_id, created_at, updated_at) values (1, 11969, now(), now());
# SQL

# Foods DB
if [ $DB_DEV_FOODS_USERNAME != $DB_DEV_SYSTEM_USERNAME ]; then
    psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_DEV_FOODS_USERNAME WITH PASSWORD '$DB_DEV_FOODS_PASSWORD';"
fi
createdb -U $POSTGRES_USER --owner=$DB_DEV_FOODS_USERNAME $DB_DEV_FOODS_DATABASE
psql -U $POSTGRES_USER -d $DB_DEV_FOODS_DATABASE -c "create extension if not exists \"uuid-ossp\";"
psql -U $POSTGRES_USER -d $DB_DEV_FOODS_DATABASE -c "create extension if not exists \"btree_gist\";"
echo "Downloading foods database snapshot..."
wget -O /tmp/foods_snapshot.pgcustom https://storage.googleapis.com/intake24-docker/foods_snapshot.pgcustom
echo "Restoring foods database from snapshot..."
pg_restore -n public --no-owner --no-acl --role=$DB_DEV_FOODS_USERNAME --dbname $DB_DEV_FOODS_DATABASE /tmp/foods_snapshot.pgcustom


# TEST environment

# DB_TEST_SYSTEM_USERNAME="${DB_TEST_SYSTEM_USERNAME:=intake24}"
# DB_TEST_SYSTEM_PASSWORD="${DB_TEST_SYSTEM_PASSWORD:=intake24}"
# DB_TEST_SYSTEM_DATABASE="${DB_TEST_SYSTEM_DATABASE:=intake24_system_test}"
# DB_TEST_FOODS_USERNAME="${DB_TEST_FOODS_USERNAME:=intake24}"
# DB_TEST_FOODS_PASSWORD="${DB_TEST_FOODS_PASSWORD:=intake24}"
# DB_TEST_FOODS_DATABASE="${DB_TEST_FOODS_DATABASE:=intake24_foods_test}"

# # System DB
# if [ "$DB_TEST_SYSTEM_USERNAME" ] && [ "$DB_TEST_SYSTEM_DATABASE" ]; then
#     if [ $DB_TEST_SYSTEM_USERNAME != $DB_DEV_SYSTEM_USERNAME ]; then
#         psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_TEST_SYSTEM_USERNAME WITH PASSWORD '$DB_TEST_SYSTEM_PASSWORD' LOGIN;"
#     fi

#     createdb -U $POSTGRES_USER --owner=$DB_TEST_SYSTEM_USERNAME $DB_TEST_SYSTEM_DATABASE;
#     psql -U $POSTGRES_USER -d $DB_TEST_SYSTEM_DATABASE -c "create extension if not exists \"uuid-ossp\";"
#     echo "Restoring test system database from snapshot..."
#     pg_restore -n public --no-owner --no-acl --role=$DB_TEST_SYSTEM_USERNAME --dbname $DB_TEST_SYSTEM_DATABASE /docker-entrypoint-initdb.d/system_test_snapshot.pgcustom
# fi

# # Foods DB
# if [ "$DB_TEST_FOODS_USERNAME" ] && [ "$DB_TEST_FOODS_DATABASE" ]; then
#     if [ $DB_TEST_FOODS_USERNAME != $DB_DEV_SYSTEM_USERNAME ]; then
#         psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE ROLE $DB_TEST_FOODS_USERNAME WITH PASSWORD '$DB_TEST_FOODS_PASSWORD' LOGIN;"
#     fi

#     createdb -U $POSTGRES_USER --owner=$DB_TEST_FOODS_USERNAME $DB_TEST_FOODS_DATABASE;
#     psql -U $POSTGRES_USER -d $DB_TEST_FOODS_DATABASE -c "create extension if not exists \"uuid-ossp\";"
#     psql -U $POSTGRES_USER -d $DB_TEST_FOODS_DATABASE -c "create extension if not exists \"btree_gist\";"
#     echo "Restoring test foods database from snapshot..."
#     pg_restore -n public --no-owner --no-acl --role=$DB_TEST_FOODS_USERNAME --dbname $DB_TEST_FOODS_DATABASE /docker-entrypoint-initdb.d/foods_test_snapshot.pgcustom
# fi
