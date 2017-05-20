# Node.js Cloud SQL sample on Google App Engine

This sample demonstrates how to use [Google Cloud SQL][sql] (or any other SQL
server) on [Google App Engine Flexible][flexible].

This sample has instructions for both [MySQL][mysql] and [Postgres][postgres].

## Setup

### General steps
Before you can run or deploy the sample, you will need to do the following:

1. In order for some of the commands below to work, you need to enable the
[Cloud SQL Admin API](https://console.cloud.google.com/apis/api/sqladmin-json.googleapis.com/overview).
1. Create a [Second Generation Cloud SQL][gen] instance. You can do this from
the [Cloud Console][console] or via the [Cloud SDK][sdk]. To create it via the
SDK use the following command:

        gcloud sql instances create [YOUR_INSTANCE_NAME] \
            --activation-policy=ALWAYS \
            --tier=db-n1-standard-1

    where `[YOUR_INSTANCE_NAME]` is a name of your choice.

1. Set the root password on your Cloud SQL instance:

        gcloud sql instances set-root-password [YOUR_INSTANCE_NAME] --password [YOUR_INSTANCE_ROOT_PASSWORD]

    where `[YOUR_INSTANCE_NAME]` is the name you chose in step 1 and
    `[YOUR_INSTANCE_ROOT_PASSWORD]` is a password of your choice.

1. Create and download a [Service Account][service] for your project. You will
use this service account to connect to your Cloud SQL instance locally.

1. Download and install the [Cloud SQL Proxy][proxy].

1. [Start the proxy][start] to allow connecting to your instance from your local
machine:

        ./cloud_sql_proxy \
            -instances=[YOUR_INSTANCE_CONNECTION_NAME]=tcp:[PORT] \
            -credential_file=PATH_TO_YOUR_SERVICE_ACCOUNT_JSON_FILE

    where `[YOUR_INSTANCE_CONNECTION_NAME]` is the connection name of your
    instance on its Overview page in the Google Cloud Platform Console, or use
    `[YOUR_PROJECT_ID]:[YOUR_REGION]:[YOUR_INSTANCE_NAME]`. If you're using
    MySQL, `[PORT]` will be `3306`; for Postgres, it will be `5432`.

### MySQL configuration
To configure the sample for MySQL, use the following steps:

1. Use the MySQL command line tools (or a management tool of your choice) to
create a [new user][user] and [database][database] for your application:

        mysql -h 127.0.0.1 -P 3306 -u root -p
        mysql> create database `YOUR_DATABASE`;
        mysql> create user 'YOUR_USER'@'%' identified by 'PASSWORD';
        mysql> grant all on YOUR_DATABASE.* to 'YOUR_USER'@'%';

1. Set the `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` environment
variables to their respective values. This allows your local app to connect to your Cloud SQL
instance through the proxy.

        export MYSQL_USER="..."
        export MYSQL_PASSWORD="..."
        export MYSQL_DATABASE="..."

1. Set the `SQL_CLIENT` environment variable to `mysql`. This is the client
that will be used to connect to your MySQL database.

        export SQL_CLIENT="mysql"

### Postgres configuration
To configure the sample for Postgres, use the following steps:

1. Using the [Cloud SQL console][sql_console], select your Postgres instance.
Then, create a user (using the button in the *Access Control* > *Users* tab) and a
database (using the button in the *Databases* tab).

1. Set the `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DATABASE` environment
variables to their respective values. This allows your local app to connect to your Cloud SQL
instance through the proxy.

        export POSTGRES_USER="..."
        export POSTGRES_PASSWORD="..."
        export POSTGRES_DATABASE="..."

1. Set the `SQL_CLIENT` environment variable to `pg`. This is the client
that will be used to connect to your Postgres database.

        export SQL_CLIENT="pg"

### Final setup steps
1. Update the values in `app.yaml` with your instance configuration.

1. Finally, run `createTables.js` to ensure that the database is properly
configured and to create the tables needed for the sample.

### Running locally

Refer to the [top-level README](../README.md) for instructions on running and deploying.

It's recommended to follow the instructions above to run the Cloud SQL proxy.
You will need to set the appropriate environment variables (as shown above) and
run the following commands via your shell to run the sample:

    npm install
    npm start

[sql]: https://cloud.google.com/sql/
[flexible]: https://cloud.google.com/appengine
[gen]: https://cloud.google.com/sql/docs/create-instance
[console]: https://console.developers.google.com
[sql_console]: https://console.developers.google.com/sql/instances/
[sdk]: https://cloud.google.com/sdk
[service]: https://cloud.google.com/sql/docs/external#createServiceAccount
[proxy]: https://cloud.google.com/sql/docs/external#install
[start]: https://cloud.google.com/sql/docs/external#6_start_the_proxy
[user]: https://cloud.google.com/sql/docs/create-user
[database]: https://cloud.google.com/sql/docs/create-database
[mysql]: https://www.mysql.com/downloads/
[postgres]: https://www.postgresql.org/download/
